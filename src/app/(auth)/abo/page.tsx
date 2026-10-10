'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Check, CreditCard, Loader2, ReceiptText, X } from 'lucide-react';
import { KontoSeite, KontoKarte } from '@/components/konto/KontoSeite';
import { PurchaseTracker } from '@/components/konto/PurchaseTracker';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { usePaywall } from '@/contexts/PaywallContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { usePlanStatus } from '@/hooks/usePlanStatus';
import {
  ERSPARNIS_JAHR_PCT, GRATIS_ANALYSEN, gratisText, PREIS_JAHR, PREIS_JAHR_PRO_MONAT, PREIS_MONAT, preis,
} from '@/lib/preise';

function Merkmal({ ja, children }: { ja: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-start gap-2 text-sm ${ja ? 'text-slate-700' : 'text-slate-400'}`}>
      {ja ? <Check size={16} strokeWidth={2.6} className="mt-0.5 shrink-0 text-emerald-600" /> : <X size={16} className="mt-0.5 shrink-0" />}
      {children}
    </li>
  );
}

function AboInhalt() {
  const { isPremium, premiumUsageCount } = usePaywall();
  const plan = usePlanStatus();
  const { trackUpgradeClick } = useAnalytics();
  const searchParams = useSearchParams();
  const [laedt, setLaedt] = useState<'monthly' | 'yearly' | 'portal' | null>(null);

  useEffect(() => {
    if (searchParams.get('canceled') === 'true') toast.info('Der Kauf wurde abgebrochen. Es wurde nichts berechnet.');
  }, [searchParams]);

  const premium = isPremium || plan.isPremium;
  const uebrig = Math.max(0, GRATIS_ANALYSEN - premiumUsageCount);
  const bis = plan.premiumUntil
    ? new Date(plan.premiumUntil).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null;

  const checkout = async (art: 'monthly' | 'yearly') => {
    const priceId = art === 'yearly' ? process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID : process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID;
    trackUpgradeClick(art, 'abo_page');
    setLaedt(art);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Keine Checkout-URL erhalten');
      window.location.href = data.url;
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('Der Bezahlvorgang konnte nicht gestartet werden. Bitte versuche es erneut.');
      setLaedt(null);
    }
  };

  const verwalten = async () => {
    setLaedt('portal');
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Keine Portal-URL erhalten');
      window.location.href = data.url;
    } catch (err) {
      console.error('Portal error:', err);
      toast.error('Die Abo-Verwaltung konnte nicht geöffnet werden. Bitte versuche es erneut.');
      setLaedt(null);
    }
  };

  if (!plan.loaded) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  if (premium) {
    return (
      <KontoKarte titel="Dein Plan" icon={CreditCard}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-block rounded-full bg-[#fff3e8] px-2.5 py-0.5 text-xs font-bold text-[#ff6b00]">Premium</span>
            <p className="mt-2 text-xl font-extrabold text-[#001d3d]">{bis ? `Aktiv bis ${bis}` : 'Aktiv'}</p>
          </div>
          <button
            type="button"
            onClick={verwalten}
            disabled={laedt !== null}
            className="inline-flex items-center gap-2 rounded-xl bg-[#001d3d] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#001d3d]/90 disabled:opacity-60"
          >
            {laedt === 'portal' ? <Loader2 size={16} className="animate-spin" /> : <ReceiptText size={16} />}
            Abo verwalten
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">Rechnungen, Zahlungsart und Kündigung verwaltest du bei unserem Zahlungsanbieter Stripe.</p>
        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Merkmal ja>Unbegrenzte Analysen</Merkmal>
          <Merkmal ja>Markt- &amp; Lageanalyse</Merkmal>
          <Merkmal ja>Prognose &amp; Stresstests</Merkmal>
          <Merkmal ja>PDF-Report für die Bank</Merkmal>
          <Merkmal ja>Analysen speichern</Merkmal>
        </ul>
      </KontoKarte>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <KontoKarte titel="Dein Plan" icon={CreditCard}>
        <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">Kostenloser Plan</span>
        <p className="mt-2 text-xl font-extrabold text-[#001d3d]">
          {uebrig === 0 ? 'Kostenlose Analyse aufgebraucht' : uebrig === 1 ? 'Noch 1 kostenlose Analyse' : `Noch ${uebrig} kostenlose Analysen`}
        </p>
        <p className="mt-1 max-w-[62ch] text-sm text-slate-600">
          Cashflow und Rendite rechnest du immer kostenlos. Für jede weitere Analyse mit Markt und Prognose brauchst du Premium. Szenarien, PDF-Report und Speichern gibt es nur mit Premium.
        </p>
        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Merkmal ja>Cashflow &amp; Rendite, unbegrenzt</Merkmal>
          <Merkmal ja>{gratisText}</Merkmal>
          <Merkmal ja={false}>Szenarien &amp; PDF-Report für die Bank</Merkmal>
          <Merkmal ja={false}>Analysen speichern</Merkmal>
        </ul>
      </KontoKarte>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section className="relative rounded-2xl border-2 border-[#ff6b00] bg-white p-5 shadow-sm">
          <span className="absolute -top-3 left-5 rounded-full bg-[#ff6b00] px-2.5 py-0.5 text-[11px] font-extrabold text-white">{ERSPARNIS_JAHR_PCT} % günstiger</span>
          <h2 className="font-extrabold text-[#001d3d]">Premium Jahr</h2>
          <p className="mt-2 flex items-baseline gap-1.5"><b className="text-3xl font-black tabular-nums text-[#001d3d]">{preis(PREIS_JAHR)} €</b><span className="text-sm text-slate-500">pro Jahr</span></p>
          <p className="text-xs font-bold text-emerald-600">entspricht {preis(PREIS_JAHR_PRO_MONAT)} € pro Monat</p>
          <button type="button" onClick={() => checkout('yearly')} disabled={laedt !== null}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff6b00] py-3 font-bold text-white hover:bg-[#ff6b00]/90 disabled:opacity-60">
            {laedt === 'yearly' && <Loader2 size={16} className="animate-spin" />} Jahresabo wählen
          </button>
        </section>
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h2 className="font-extrabold text-[#001d3d]">Premium Monat</h2>
          <p className="mt-2 flex items-baseline gap-1.5"><b className="text-3xl font-black tabular-nums text-[#001d3d]">{preis(PREIS_MONAT)} €</b><span className="text-sm text-slate-500">pro Monat</span></p>
          <p className="text-xs font-bold text-emerald-600">monatlich kündbar</p>
          <button type="button" onClick={() => checkout('monthly')} disabled={laedt !== null}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-3 font-bold text-[#001d3d] hover:border-slate-500 disabled:opacity-60">
            {laedt === 'monthly' && <Loader2 size={16} className="animate-spin" />} Monatsabo wählen
          </button>
        </section>
      </div>
      <p className="text-xs text-slate-400">Sichere Zahlung über Stripe.</p>
    </div>
  );
}

export default function AboPage() {
  return (
    <KontoSeite titel="Abo & Zahlung" untertitel="Dein Plan, Rechnungen und Kündigung" schmal>
      <Suspense fallback={null}>
        <PurchaseTracker />
        <AboInhalt />
      </Suspense>
    </KontoSeite>
  );
}
