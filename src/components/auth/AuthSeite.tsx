'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ClerkFailed, ClerkLoaded, ClerkLoading } from '@clerk/nextjs';
import type { ReactNode } from 'react';

/**
 * Gemeinsamer Rahmen für /sign-up und /sign-in, mobil zuerst:
 * schmale Kopfzeile mit dem einzigen Logo, Überschrift, direkt darunter das Clerk-Formular.
 * Überschrift und Rahmen stehen sofort (auch vor Clerk), der Platz des Formulars ist reserviert.
 */

/** Höhe des Formulars, solange Clerk lädt. Entspricht ungefähr der fertigen Karte (Google, Trenner, E-Mail, Weiter). */
const FORM_MIN_HOEHE = 'min-h-[258px]';

/** Clerk-Darstellung: kein Logo in der Karte (das Seitenlogo reicht), kein eigener Titel, Google zuerst, kompakt */
export const clerkAppearance = {
  options: {
    logoPlacement: 'none' as const,
    socialButtonsPlacement: 'top' as const,
    socialButtonsVariant: 'blockButton' as const,
  },
  variables: {
    colorPrimary: '#ff6b00',
    colorText: '#001d3d',
    borderRadius: '0.75rem',
    fontFamily: 'var(--font-inter), system-ui, sans-serif',
  },
  elements: {
    rootBox: 'w-full',
    cardBox: 'w-full max-w-none shadow-none border-0 rounded-none bg-transparent',
    card: 'w-full shadow-none border-0 bg-transparent p-0 gap-4',
    logoBox: 'hidden',
    header: 'hidden',
    socialButtonsBlockButton:
      'h-11 border border-slate-300 bg-white text-[15px] font-semibold text-[#001d3d] hover:bg-slate-50',
    dividerRow: 'my-0',
    formFieldInput: 'h-11 border-slate-300 text-[16px] focus:border-[#ff6b00]',
    formButtonPrimary:
      'h-11 bg-[#ff6b00] text-[15px] font-bold normal-case shadow-none hover:bg-[#ff6b00]/90',
    // Wechsel-Link (Anmelden/Registrieren) setzen wir selbst unter das Formular
    footer: 'hidden',
  },
};

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 transition hover:opacity-80" aria-label="imvestr Startseite">
      <Image src="/logo-192.png" alt="" width={30} height={30} className="rounded-lg" priority />
      <span className="text-xl font-extrabold tracking-tighter text-[#001d3d]">imvestr</span>
    </Link>
  );
}

function FormSkeleton() {
  return (
    <div aria-hidden="true" className="flex animate-pulse flex-col gap-4">
      <div className="h-11 rounded-xl border border-slate-200 bg-white" />
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <div className="h-3 w-8 rounded bg-slate-200" />
        <div className="h-px flex-1 bg-slate-200" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-3.5 w-24 rounded bg-slate-200" />
        <div className="h-11 rounded-xl border border-slate-200 bg-white" />
      </div>
      <div className="h-11 rounded-xl bg-orange-200/70" />
    </div>
  );
}

export function AuthSeite({
  titel,
  untertitel,
  formular,
  wechsel,
  children,
}: {
  titel: ReactNode;
  untertitel?: ReactNode;
  formular: ReactNode;
  /** Link zur jeweils anderen Seite, z. B. „Schon ein Konto? Anmelden" */
  wechsel: ReactNode;
  /** Inhalt unter dem Formular (z. B. Vorteile) */
  children?: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-white text-[#001d3d] md:bg-[radial-gradient(1000px_480px_at_85%_0%,#fff7f0,transparent_60%)]">
      <header className="mx-auto flex h-14 max-w-6xl items-center px-4 md:h-16 md:px-6">
        <Logo />
      </header>

      <main className="flex justify-center px-4 pb-10 pt-1 md:pt-10">
        <div className="w-full max-w-[400px] md:rounded-2xl md:border md:border-slate-200 md:bg-white md:p-8 md:shadow-xl md:shadow-slate-200/60">
          <h1 className="text-center text-[22px] font-extrabold leading-tight tracking-tight md:text-[28px]">{titel}</h1>
          {untertitel && <div className="mt-1.5 text-center text-sm text-slate-600 md:text-[15px]">{untertitel}</div>}

          <div className={`mt-4 md:mt-6 ${FORM_MIN_HOEHE}`}>
            <ClerkLoading>
              <FormSkeleton />
            </ClerkLoading>
            <ClerkLoaded>{formular}</ClerkLoaded>
            <ClerkFailed>
              <p className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm">
                Die Anmeldung konnte nicht geladen werden. Bitte lade die Seite neu oder prüfe deine Verbindung.
              </p>
            </ClerkFailed>
          </div>

          <p className="mt-4 text-center text-sm text-slate-600">{wechsel}</p>

          {children}
        </div>
      </main>
    </div>
  );
}
