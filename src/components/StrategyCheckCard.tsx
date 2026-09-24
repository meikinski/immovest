'use client';

import React from 'react';
import { ArrowRight, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import HtmlContent from '@/components/HtmlContent';
import { parseStrategyCheck, type StrategyTone } from '@/lib/strategyCheck';

const TONE_STYLES: Record<StrategyTone, { badge: string; dot: string }> = {
  positive: { badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  neutral: { badge: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500' },
  negative: { badge: 'bg-red-50 text-red-700 ring-red-200', dot: 'bg-red-500' },
};

/** Rendert **fett** markierte Passagen als <strong>, alles andere als Text (kein HTML). */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="font-semibold text-[#001d3d]">{part.slice(2, -2)}</strong>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

export function StrategyCheckHeader({ verdict, tone }: { verdict?: string; tone?: StrategyTone }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-br from-[#ff6b00] to-[#ff8c00] rounded-xl flex items-center justify-center shadow-md shadow-orange-500/25">
          <Sparkles size={18} className="text-white" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[#001d3d] leading-tight">KI-Strategie-Check</h3>
          <p className="text-xs text-slate-500">Einschätzung auf Basis deiner Kennzahlen</p>
        </div>
      </div>
      {verdict && tone && (
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${TONE_STYLES[tone].badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${TONE_STYLES[tone].dot}`} />
          {verdict}
        </span>
      )}
    </div>
  );
}

export function StrategyCheckBody({ raw }: { raw: string }) {
  const check = parseStrategyCheck(raw);

  // Ältere Analysen: reines HTML
  if (!check) {
    return (
      <>
        <StrategyCheckHeader />
        <HtmlContent className="mt-5 text-[15px] leading-relaxed text-slate-700" html={raw || '<p>–</p>'} />
      </>
    );
  }

  return (
    <>
      <StrategyCheckHeader verdict={check.verdict} tone={check.tone} />

      <p className="mt-5 text-[15px] leading-relaxed text-slate-700">
        <RichText text={check.summary} />
      </p>

      {(check.staerken.length > 0 || check.risiken.length > 0) && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {check.staerken.length > 0 && (
            <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-4">
              <p className="text-xs font-semibold text-emerald-800 mb-3">Was dafür spricht</p>
              <ul className="space-y-2.5">
                {check.staerken.map((s, i) => (
                  <li key={i} className="flex gap-2.5 text-sm leading-snug text-slate-700">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                    <span><RichText text={s} /></span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {check.risiken.length > 0 && (
            <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-4">
              <p className="text-xs font-semibold text-amber-800 mb-3">Worauf du achten solltest</p>
              <ul className="space-y-2.5">
                {check.risiken.map((s, i) => (
                  <li key={i} className="flex gap-2.5 text-sm leading-snug text-slate-700">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                    <span><RichText text={s} /></span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {check.naechsterSchritt && (
        <div className="mt-4 flex gap-3 items-start rounded-xl bg-[#001d3d] text-white p-4">
          <ArrowRight size={16} className="mt-0.5 shrink-0 text-[#ff8c00]" />
          <div className="text-sm leading-snug">
            <span className="font-semibold text-[#ff8c00]">Nächster Schritt: </span>
            <span className="text-white/90">{check.naechsterSchritt.replace(/\*\*/g, '')}</span>
          </div>
        </div>
      )}
    </>
  );
}
