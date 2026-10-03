'use client';

import React, { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useClerk, useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { GraduationCap, KeyRound, Trash2, User } from 'lucide-react';
import { KontoSeite, KontoKarte } from '@/components/konto/KontoSeite';
import { usePlanStatus } from '@/hooks/usePlanStatus';
import { useOnboarding } from '@/hooks/useOnboarding';

function Zeile({ label, wert }: { label: string; wert: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-0.5 border-t border-slate-100 py-2.5 text-sm sm:grid-cols-[160px_1fr] sm:gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold text-[#001d3d]">{wert}</dd>
    </div>
  );
}

/** Alte Rücksprünge vom Stripe-Checkout (/profile?success=…) auf die Abo-Seite umleiten */
function AlteCheckoutLinks() {
  const params = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    if (params.get('success') || params.get('canceled')) router.replace(`/abo?${params.toString()}`);
  }, [params, router]);
  return null;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const plan = usePlanStatus();
  const { resetOnboarding } = useOnboarding();

  const anmeldung = user
    ? user.externalAccounts.length > 0
      ? user.externalAccounts.map(a => a.provider.charAt(0).toUpperCase() + a.provider.slice(1)).join(', ')
      : user.passwordEnabled ? 'E-Mail und Passwort' : 'E-Mail-Link'
    : '–';

  const tourStarten = () => {
    resetOnboarding();
    router.push('/step/a');
    toast.success('Die Tour startet');
  };

  return (
    <KontoSeite titel="Profil & Einstellungen" untertitel="Dein Konto und deine Daten" schmal>
      <Suspense fallback={null}><AlteCheckoutLinks /></Suspense>
      <div className="flex flex-col gap-4">
        <KontoKarte titel="Konto" icon={User}>
          <dl className="mt-2">
            <Zeile label="Name" wert={user?.fullName || '–'} />
            <Zeile label="E-Mail" wert={user?.primaryEmailAddress?.emailAddress || '–'} />
            <Zeile label="Anmeldung" wert={anmeldung} />
            {user?.createdAt && (
              <Zeile label="Mitglied seit" wert={user.createdAt.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })} />
            )}
          </dl>
          <button
            type="button"
            onClick={() => openUserProfile()}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-[#001d3d] hover:border-slate-500"
          >
            <KeyRound size={16} /> Name, E-Mail oder Passwort ändern
          </button>
        </KontoKarte>

        <KontoKarte titel="Einführung" icon={GraduationCap}>
          <p className="text-sm text-slate-600">Die Tour erklärt Schritt für Schritt, was du wo eingibst.</p>
          <button
            type="button"
            onClick={tourStarten}
            className="mt-3 rounded-xl bg-[#001d3d] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#001d3d]/90"
          >
            Tour neu starten
          </button>
        </KontoKarte>

        <KontoKarte titel="Konto löschen" icon={Trash2} gefahr>
          <p className="text-sm text-slate-600">
            Dein Konto und alle gespeicherten Analysen werden endgültig gelöscht.
            {plan.isPremium && ' Kündige vorher dein Abo unter „Abo & Zahlung“.'}
          </p>
          <button
            type="button"
            onClick={() => openUserProfile()}
            className="mt-3 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50"
          >
            Konto löschen
          </button>
          <p className="mt-2 text-xs text-slate-400">Öffnet die Kontoverwaltung. Dort findest du ganz unten „Konto löschen“.</p>
        </KontoKarte>
      </div>
    </KontoSeite>
  );
}
