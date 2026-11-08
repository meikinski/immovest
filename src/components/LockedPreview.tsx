'use client';

import { Lock, Mail, Sparkles, MapPin, TrendingUp } from 'lucide-react';
import type { GesperrterBereich } from '@/lib/anmeldeRueckkehr';

/**
 * Gesperrte Vorschau für Gäste auf der Ergebnis-Seite.
 *
 * Wichtig: Der verschwommene Inhalt ist ausschließlich ein statisches Platzhalter-Skelett.
 * Es werden keine echten KI- oder Marktdaten geladen oder gerendert (Kosten, und echte Daten wären im DOM lesbar).
 */

type Props = {
  bereich: GesperrterBereich;
  onFreischalten: (bereich: GesperrterBereich, modus: 'sign_up' | 'sign_in') => void;
  className?: string;
};

const TITEL: Record<GesperrterBereich, { label: string; icon: typeof Sparkles }> = {
  ki: { label: 'KI-Einschätzung', icon: Sparkles },
  markt: { label: 'Marktvergleich & Lage', icon: MapPin },
  prognose: { label: 'Prognose', icon: TrendingUp },
};

export function LockedPreview({ bereich, onFreischalten, className = '' }: Props) {
  const { label, icon: Icon } = TITEL[bereich];
  return (
    <section
      data-locked-preview={bereich}
      aria-label={`${label} (gesperrt)`}
      className={`relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ${className}`}
    >
      {/* Platzhalter: generisch, keine echten Daten */}
      <div aria-hidden className="pointer-events-none select-none blur-[6px] p-5 md:p-8">
        {bereich === 'ki' && <KiSkelett />}
        {bereich === 'markt' && <MarktSkelett />}
        {bereich === 'prognose' && <PrognoseSkelett />}
      </div>

      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/55 p-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-2xl md:p-6">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff6b00] to-[#ff8c00] shadow-lg shadow-orange-500/30">
            <Lock className="h-5 w-5 text-white" />
          </div>
          <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">
            <Icon size={12} /> {label}
          </p>
          <h3 className="text-lg font-black leading-snug text-[#001d3d]">Kostenlos freischalten</h3>
          <p className="mt-1 mb-4 text-sm leading-relaxed text-slate-600">
            KI-Einschätzung, Markt &amp; Prognose für diese Wohnung. Szenarien und PDF-Report inklusive.
          </p>
          <button
            type="button"
            onClick={() => onFreischalten(bereich, 'sign_up')}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] px-5 py-3 text-sm font-bold text-white shadow-lg transition-all hover:from-[#ff6b00]/90 hover:to-[#ff8c00]/90 hover:shadow-xl"
          >
            <Mail size={18} />
            Kostenlos freischalten
          </button>
          <p className="mt-3 text-xs text-slate-500">
            Ohne Kreditkarte, kein Abo.{' '}
            <button
              type="button"
              onClick={() => onFreischalten(bereich, 'sign_in')}
              className="font-semibold text-[#ff6b00] hover:underline"
            >
              Schon registriert? Anmelden
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}

const balken = 'rounded bg-slate-200';

function KiSkelett() {
  return (
    <div className="min-h-[380px] md:min-h-[340px]">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-orange-200" />
        <div className="space-y-2">
          <div className={`${balken} h-3 w-36`} />
          <div className={`${balken} h-2.5 w-48`} />
        </div>
      </div>
      <div className="mt-6 space-y-3">
        <div className={`${balken} h-3 w-11/12`} />
        <div className={`${balken} h-3 w-4/5`} />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2 rounded-xl bg-emerald-50 p-4">
          <div className="h-2.5 w-20 rounded bg-emerald-200" />
          <div className="h-2.5 w-full rounded bg-emerald-100" />
          <div className="h-2.5 w-3/4 rounded bg-emerald-100" />
        </div>
        <div className="space-y-2 rounded-xl bg-amber-50 p-4">
          <div className="h-2.5 w-20 rounded bg-amber-200" />
          <div className="h-2.5 w-full rounded bg-amber-100" />
          <div className="h-2.5 w-2/3 rounded bg-amber-100" />
        </div>
      </div>
    </div>
  );
}

function MarktSkelett() {
  return (
    <div className="min-h-[520px] space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[0, 1].map(i => (
          <div key={i} className="rounded-2xl border border-slate-100 p-5">
            <div className={`${balken} h-3 w-32`} />
            <div className="mt-4 flex items-end gap-3">
              <div className="h-8 w-24 rounded bg-slate-300" />
              <div className="h-5 w-16 rounded-full bg-emerald-100" />
            </div>
            <div className="mt-5 h-3 w-full rounded-full bg-gradient-to-r from-emerald-100 via-amber-100 to-red-100" />
            <div className="mt-4 space-y-2">
              <div className={`${balken} h-2.5 w-full`} />
              <div className={`${balken} h-2.5 w-5/6`} />
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-100 p-5">
        <div className={`${balken} h-3 w-28`} />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-slate-100" />)}
        </div>
        <div className="mt-4 space-y-2">
          <div className={`${balken} h-2.5 w-full`} />
          <div className={`${balken} h-2.5 w-4/5`} />
        </div>
      </div>
    </div>
  );
}

function PrognoseSkelett() {
  // Feste Beispielkurve, unabhängig von den Eingaben
  const hoehen = [18, 24, 30, 35, 42, 48, 55, 61, 68, 74, 80, 88];
  return (
    <div className="min-h-[460px]">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="space-y-2 rounded-xl bg-slate-50 p-3">
            <div className={`${balken} h-2.5 w-16`} />
            <div className="h-5 w-20 rounded bg-slate-300" />
          </div>
        ))}
      </div>
      <div className="mt-6 flex h-56 items-end gap-1.5 rounded-2xl border border-slate-100 p-4 sm:gap-2.5">
        {hoehen.map((h, i) => (
          <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-[#001d3d]/30 to-[#ff6b00]/40" style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="mt-5 space-y-2">
        <div className={`${balken} h-2.5 w-full`} />
        <div className={`${balken} h-2.5 w-3/4`} />
      </div>
    </div>
  );
}
