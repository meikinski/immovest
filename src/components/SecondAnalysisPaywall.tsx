'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { ArrowLeft, Home, X } from 'lucide-react';
import { PricingSection } from '@/components/pricing/PricingSection';
import { useGespeicherteAnalysen } from '@/hooks/useGespeicherteAnalysen';
import { useImmoStore } from '@/store/useImmoStore';
import { sichereAnalyseVorCheckout } from '@/lib/checkoutRueckkehr';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** Die gerade eingegebene Wohnung */
  adresse: string;
  kaufpreis: number;
  flaeche?: number;
  zimmer?: number;
  /** Adresse der verbrauchten Gratis-Analyse (kleingeschrieben, aus gratis_freigabe_{userId}) */
  gratisAdresse: string | null;
  /** Sperre, die die Paywall geöffnet hat, z. B. "tab_markt" (für Tracking und den Tab nach der Zahlung) */
  quelle: string | null;
  /** Nach dem Laden der Gratis-Analyse (z. B. KPI-Tab zeigen) */
  onGratisAnalyseGeladen?: () => void;
};

const fmt = (v: number) => v.toLocaleString('de-DE', { maximumFractionDigits: 0 });

/** Welcher Tab nach der Zahlung geöffnet wird */
function zielTabAus(quelle: string | null): string | null {
  if (!quelle) return null;
  if (quelle.includes('markt')) return 'markt';
  if (quelle.includes('prognose')) return 'prognose';
  if (quelle.includes('szenarien') || quelle.includes('pdf')) return 'szenarien';
  return null;
}

/**
 * Paywall, wenn ein Gratis-Nutzer nach seiner Gratis-Analyse eine 2. Wohnung vollständig prüfen will.
 * Mobil als Bottom-Sheet, auf dem Desktop als Modal (native <dialog>: Fokus, Esc, Zurück-Geste).
 */
export function SecondAnalysisPaywall({
  isOpen, onClose, adresse, kaufpreis, flaeche, zimmer, gratisAdresse, quelle, onGratisAnalyseGeladen,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titelRef = useRef<HTMLHeadingElement>(null);
  const router = useRouter();
  const { userId } = useAuth();
  const loadAnalysis = useImmoStore(s => s.loadAnalysis);
  const { analysen } = useGespeicherteAnalysen(isOpen);
  const [laedtGratis, setLaedtGratis] = useState(false);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (isOpen && !d.open) {
      d.showModal();
      // Lesereihenfolge beginnt bei der Überschrift statt am Schließen-Knopf
      titelRef.current?.focus();
    }
    if (!isOpen && d.open) d.close();
  }, [isOpen]);

  // Safari kennt closedby="any" noch nicht: Klick neben das Panel schließt trotzdem
  useEffect(() => {
    const d = dialogRef.current;
    if (!d || 'closedBy' in HTMLDialogElement.prototype) return;
    const ausserhalb = (e: PointerEvent) => {
      const r = d.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    let gedruecktAussen = false;
    const runter = (e: PointerEvent) => { gedruecktAussen = ausserhalb(e); };
    const hoch = (e: PointerEvent) => { if (gedruecktAussen && ausserhalb(e)) d.close(); };
    d.addEventListener('pointerdown', runter);
    d.addEventListener('pointerup', hoch);
    return () => { d.removeEventListener('pointerdown', runter); d.removeEventListener('pointerup', hoch); };
  }, []);

  const zurGratisAnalyse = async () => {
    const ziel = gratisAdresse
      ? analysen.find(a => (a.adresse || '').trim().toLowerCase() === gratisAdresse)
      : undefined;
    if (!ziel) {
      router.push('/analysen');
      return;
    }
    setLaedtGratis(true);
    const ok = await loadAnalysis(ziel.analysisId, userId);
    setLaedtGratis(false);
    if (!ok) {
      toast.error('Die Analyse konnte nicht geladen werden');
      router.push('/analysen');
      return;
    }
    onClose();
    onGratisAnalyseGeladen?.();
    router.push('/step/tabs');
  };

  const details = [
    kaufpreis > 0 ? `${fmt(kaufpreis)} € Kaufpreis` : null,
    flaeche && flaeche > 0 ? `${fmt(flaeche)} m²` : null,
    zimmer && zimmer > 0 ? `${zimmer.toLocaleString('de-DE')} Zimmer` : null,
  ].filter(Boolean).join(' · ');

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="paywall-titel"
      // Klick neben das Panel schließt (closedby fehlt noch in den React-Typen)
      {...{ closedby: 'any' }}
      onClose={onClose}
      className="paywall-dialog m-0 mt-auto w-full max-w-none overflow-y-auto rounded-t-3xl bg-white p-0 text-[#001d3d] shadow-2xl sm:m-auto sm:max-w-lg sm:rounded-3xl"
    >
      <div className="relative px-5 pb-6 pt-6 sm:px-7 sm:pb-7">
        <div aria-hidden className="mx-auto -mt-2 mb-4 h-1.5 w-10 rounded-full bg-slate-200 sm:hidden" />
        <form method="dialog">
          <button
            type="submit"
            aria-label="Schließen"
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-[#001d3d]"
          >
            <X size={20} />
          </button>
        </form>

        <h2 id="paywall-titel" ref={titelRef} tabIndex={-1} className="pr-10 outline-none text-2xl font-black leading-tight tracking-tight sm:text-[26px]">
          Deine Gratis-Analyse ist aufgebraucht
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
          Mit Premium prüfst du jede weitere Wohnung genauso vollständig, inklusive Markt, Prognose, Szenarien und PDF-Report.
        </p>

        {(adresse || kaufpreis > 0) && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#ff6b00] shadow-sm">
              <Home size={20} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Diese Wohnung schaltest du frei</p>
              <p className="mt-0.5 truncate font-extrabold" title={adresse}>{adresse || 'Deine Wohnung'}</p>
              {details && <p className="text-[13px] text-slate-600 tabular-nums">{details}</p>}
            </div>
          </div>
        )}

        <PricingSection
          compact
          ort="paywall_second_analysis"
          returnTo="/step/tabs"
          trackingParams={{ trigger: 'second_analysis', source: quelle ?? 'unknown' }}
          onBeforeCheckout={() => sichereAnalyseVorCheckout(zielTabAus(quelle))}
          className="mt-5"
        />

        <button
          type="button"
          onClick={zurGratisAnalyse}
          disabled={laedtGratis}
          className="mx-auto mt-4 flex items-center gap-1.5 text-sm font-bold text-slate-600 underline-offset-4 transition hover:text-[#001d3d] hover:underline disabled:opacity-60"
        >
          <ArrowLeft size={15} />
          {laedtGratis ? 'Wird geladen …' : 'Zu meiner Gratis-Analyse'}
        </button>
      </div>
    </dialog>
  );
}
