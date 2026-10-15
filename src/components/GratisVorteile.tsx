'use client';

import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { Check, Gift, Mail } from 'lucide-react';
import { GRATIS_ANALYSEN } from '@/lib/preise';

/** Überschrift für Gäste: was die Anmeldung mit E-Mail bringt */
export const gratisTitel = GRATIS_ANALYSEN === 1
  ? 'Mit E-Mail anmelden: 1 Wohnung komplett kostenlos analysieren'
  : `Mit E-Mail anmelden: ${GRATIS_ANALYSEN} Wohnungen komplett kostenlos analysieren`;

/** Was in der kostenlosen Analyse steckt (Szenarien & PDF-Report bleiben Premium) */
export const GRATIS_VORTEILE: Array<[titel: string, text: string]> = [
  ['KI-Einschätzung', 'Lohnt sich der Kauf? Die Antwort in klaren Worten.'],
  ['Marktvergleich & Lage', 'Kaufpreis und Miete im Vergleich zum Markt vor Ort, mit Quellen.'],
  ['Prognose & Entwicklung', 'Cashflow, Vermögen und Restschuld über die Jahre.'],
];

export function GratisVorteilListe({ hell = false, kompakt = false }: { hell?: boolean; kompakt?: boolean }) {
  return (
    <ul className={`flex flex-col ${kompakt ? 'gap-2' : 'gap-3'}`}>
      {GRATIS_VORTEILE.map(([titel, text]) => (
        <li key={titel} className="flex gap-2.5 text-left text-sm">
          <Check size={18} strokeWidth={2.6} className="mt-0.5 shrink-0 text-emerald-500" />
          <span className={hell ? 'text-slate-200' : 'text-slate-600'}>
            <strong className={hell ? 'text-white' : 'text-[#001d3d]'}>{titel}</strong>
            {!kompakt && <> · {text}</>}
          </span>
        </li>
      ))}
    </ul>
  );
}

const knopfKlasse = 'w-full px-5 py-3 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] hover:from-[#ff6b00]/90 hover:to-[#ff8c00]/90 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm';

/**
 * Karte für nicht angemeldete Nutzer auf der Ergebnis-Seite: erklärt, dass die Anmeldung mit E-Mail
 * die komplette Analyse dieser Wohnung kostenlos freischaltet, und was man dafür bekommt.
 */
export function GastFreischaltKarte({ redirectUrl = '/step/tabs', kompakt = false }: { redirectUrl?: string; kompakt?: boolean }) {
  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-slate-100">
      <div className="w-12 h-12 bg-gradient-to-br from-[#ff6b00] to-[#ff8c00] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
        <Gift className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg font-bold mb-1 text-[#001d3d] text-center leading-snug">
        {GRATIS_ANALYSEN === 1 ? 'Diese Wohnung kostenlos komplett analysieren' : 'Kostenlos komplett analysieren'}
      </h3>
      <p className="text-slate-600 mb-4 text-sm text-center">
        Melde dich mit deiner E-Mail an und du bekommst gratis:
      </p>
      <div className="mb-5">
        <GratisVorteilListe kompakt={kompakt} />
      </div>
      <SignUpButton mode="modal" forceRedirectUrl={redirectUrl} fallbackRedirectUrl={redirectUrl}>
        <button className={knopfKlasse}>
          <Mail size={18} />
          Mit E-Mail kostenlos freischalten
        </button>
      </SignUpButton>
      <p className="text-xs text-slate-500 mt-3 text-center">
        Ohne Kreditkarte, kein Abo.{' '}
        <SignInButton mode="modal" forceRedirectUrl={redirectUrl} fallbackRedirectUrl={redirectUrl}>
          <button className="font-semibold text-[#ff6b00] hover:underline">Schon registriert? Anmelden</button>
        </SignInButton>
      </p>
    </div>
  );
}

/** Schmaler Hinweis über den Tabs der Ergebnis-Seite für Gäste */
export function GastHinweisBanner({ redirectUrl = '/step/tabs' }: { redirectUrl?: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-white p-4 md:flex-row md:items-center md:justify-between md:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ff6b00] text-white">
          <Gift size={20} />
        </div>
        <div>
          <p className="font-bold text-[#001d3d]">
            {GRATIS_ANALYSEN === 1
              ? 'Gratis: Diese Wohnung einmal komplett durchspielen'
              : `Gratis: ${GRATIS_ANALYSEN} Wohnungen komplett durchspielen`}
          </p>
          <p className="text-sm text-slate-600">
            Mit deiner E-Mail anmelden und KI-Einschätzung, Marktvergleich &amp; Lage sowie die Prognose freischalten. Ohne Kreditkarte, kein Abo.
          </p>
        </div>
      </div>
      <SignUpButton mode="modal" forceRedirectUrl={redirectUrl} fallbackRedirectUrl={redirectUrl}>
        <button className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#ff6b00] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:bg-[#ff6b00]/90">
          <Mail size={16} />
          Kostenlos freischalten
        </button>
      </SignUpButton>
    </div>
  );
}

/** Vorteils-Kasten über dem Clerk-Formular auf /sign-in und /sign-up */
export function GratisVorteilBox({ neu = false }: { neu?: boolean }) {
  return (
    <div className="mb-6 rounded-2xl border border-orange-200 bg-orange-50/70 p-5">
      <p className="mb-3 flex items-center gap-2 text-sm font-bold text-[#001d3d]">
        <Gift size={18} className="shrink-0 text-[#ff6b00]" />
        {neu ? `Neu hier? ${gratisTitel}` : gratisTitel}
      </p>
      <GratisVorteilListe />
      <p className="mt-3 text-xs text-slate-500">Ohne Kreditkarte, kein Abo. Szenarien und PDF-Report gibt es mit Premium.</p>
    </div>
  );
}
