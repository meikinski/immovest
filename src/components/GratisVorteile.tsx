'use client';

import { SignUpButton } from '@clerk/nextjs';
import { Check, Gift, Mail } from 'lucide-react';
import { GRATIS_ANALYSEN } from '@/lib/preise';

/** Was in der kostenlosen Analyse steckt (Szenarien & PDF-Report sind ebenfalls enthalten) */
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

/** Schmaler Hinweis über den Tabs der Ergebnis-Seite für Gäste */
export function GastHinweisBanner({ redirectUrl = '/step/tabs', onFreischalten }: { redirectUrl?: string; onFreischalten?: () => void }) {
  const knopf = (
    <button
      onClick={onFreischalten}
      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#ff6b00] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:bg-[#ff6b00]/90"
    >
      <Mail size={16} />
      Kostenlos freischalten
    </button>
  );
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
      {/* Mit onFreischalten sichert die Seite vorher die Eingaben (Rückkehr nach der Anmeldung) */}
      {onFreischalten ? knopf : (
        <SignUpButton mode="modal" forceRedirectUrl={redirectUrl} fallbackRedirectUrl={redirectUrl}>
          {knopf}
        </SignUpButton>
      )}
    </div>
  );
}
