'use client';

import { useMemo, useRef, useState } from 'react';
import { BUNDESLAENDER, type BundeslandCode } from '@/config/grunderwerbsteuer';
import type { SzenarioBasis } from '@/lib/szenario';
import { parseZahlOder, formatZahl } from '@/lib/zahlen';
import { AnalyticsEvents, trackEvent } from '@/lib/analytics';
import {
  cashflowAufstellung,
  eingabenAusPreset,
  formatEuro,
  formatEuroMitVorzeichen,
  rechneCashflow,
  type CashflowEingaben,
} from '@/lib/cashflowAufstellung';

type FeldKey = Exclude<keyof CashflowEingaben, 'grunderwerbsteuerPct'>;

const FELDER: Array<{ key: FeldKey; label: string; einheit: string; max?: number }> = [
  { key: 'kaufpreis', label: 'Kaufpreis', einheit: '€', max: 0 },
  { key: 'flaeche', label: 'Wohnfläche', einheit: 'm²', max: 1 },
  { key: 'miete', label: 'Kaltmiete pro Monat', einheit: '€' },
  { key: 'hausgeld', label: 'Hausgeld gesamt pro Monat', einheit: '€' },
  { key: 'hausgeldUmlegbar', label: 'davon umlagefähig', einheit: '€' },
  { key: 'ek', label: 'Eigenkapital', einheit: '€', max: 0 },
  { key: 'zins', label: 'Zins', einheit: '% p. a.' },
  { key: 'tilgung', label: 'Anfängliche Tilgung', einheit: '% p. a.' },
  { key: 'steuersatzPct', label: 'Persönlicher Steuersatz', einheit: '%' },
];

const BUNDESLAND_LISTE = (Object.entries(BUNDESLAENDER) as Array<[BundeslandCode, { name: string; satz: number }]>)
  .sort((a, b) => a[1].name.localeCompare(b[1].name, 'de'));

export function CashflowRechner({
  preset,
  presetBundesland,
  seitenId,
}: {
  preset: SzenarioBasis;
  presetBundesland: BundeslandCode;
  /** Slug der Seite, geht als source in kpi_result_viewed */
  seitenId: string;
}) {
  const start = eingabenAusPreset(preset);
  const [texte, setTexte] = useState<Record<FeldKey, string>>(() => {
    const t = {} as Record<FeldKey, string>;
    for (const f of FELDER) t[f.key] = formatZahl(start[f.key], { max: f.max ?? 2 });
    return t;
  });
  const [bundesland, setBundesland] = useState<BundeslandCode>(presetBundesland);
  const gemeldet = useRef(false);

  const eingaben: CashflowEingaben = useMemo(() => {
    const e = { grunderwerbsteuerPct: BUNDESLAENDER[bundesland].satz } as CashflowEingaben;
    for (const f of FELDER) e[f.key] = Math.max(0, parseZahlOder(texte[f.key], 0));
    return e;
  }, [texte, bundesland]);

  const { basis, ergebnis } = useMemo(() => rechneCashflow(preset, eingaben), [preset, eingaben]);
  const zeilen = cashflowAufstellung(basis, ergebnis);

  // Einmal je Seitenaufruf, sobald jemand den Rechner wirklich benutzt
  const meldeNutzung = () => {
    if (gemeldet.current) return;
    gemeldet.current = true;
    trackEvent(AnalyticsEvents.KPI_RESULT_VIEWED, { input_method: 'rechner', source: seitenId, object_type: 'wohnung' });
  };

  const cf = ergebnis.scCashflowAfterTax;

  return (
    <section aria-labelledby="rechner-titel" className="not-prose my-10 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-7">
      <h2 id="rechner-titel" className="text-2xl font-extrabold tracking-tight text-[#001d3d]">Cashflow-Rechner</h2>
      <p className="mt-1 text-sm text-slate-500">Vorbelegt mit der Beispielwohnung. Ändere die Werte, das Ergebnis rechnet sich sofort neu.</p>

      <div className="mt-6 grid gap-6">
        <form className="grid gap-x-4 gap-y-4 sm:grid-cols-2" onSubmit={e => e.preventDefault()}>
          {FELDER.map(f => (
            <label key={f.key} className="block text-sm font-semibold text-[#001d3d]">
              {f.label}
              <span className="mt-1 flex h-11 items-center rounded-xl border border-slate-300 bg-white px-3 focus-within:border-[#ff6b00] focus-within:ring-2 focus-within:ring-[#ff6b00]/20">
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  name={f.key}
                  value={texte[f.key]}
                  onChange={ev => {
                    const wert = ev.target.value;
                    setTexte(t => ({ ...t, [f.key]: wert }));
                    meldeNutzung();
                  }}
                  className="w-full min-w-0 bg-transparent text-base font-medium text-[#001d3d] outline-none"
                />
                <span className="ml-2 shrink-0 text-sm font-normal text-slate-400">{f.einheit}</span>
              </span>
            </label>
          ))}
          <label className="block text-sm font-semibold text-[#001d3d]">
            Bundesland (Grunderwerbsteuer)
            <select
              name="bundesland"
              value={bundesland}
              onChange={ev => {
                setBundesland(ev.target.value as BundeslandCode);
                meldeNutzung();
              }}
              className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base font-medium text-[#001d3d] outline-none focus:border-[#ff6b00] focus:ring-2 focus:ring-[#ff6b00]/20"
            >
              {BUNDESLAND_LISTE.map(([code, b]) => (
                <option key={code} value={code}>
                  {b.name}: {formatZahl(b.satz, { min: 1, max: 2 })} %
                </option>
              ))}
            </select>
          </label>
        </form>

        <div aria-live="polite" className="rounded-2xl bg-[#001d3d] p-5 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#ffb07a]">Cashflow nach Steuern</p>
          <p className={`mt-1 text-4xl font-extrabold tracking-tight ${cf >= 0 ? 'text-emerald-300' : 'text-red-300'}`} data-testid="cashflow-nach-steuern">
            {formatEuro(cf)} <span className="text-base font-semibold text-slate-300">pro Monat</span>
          </p>
          <table className="mt-5 w-full text-sm">
            <caption className="sr-only">Monatliche Aufstellung</caption>
            <tbody>
              {zeilen.map(z => (
                <tr key={z.key} className={z.summe ? 'border-t border-white/20 font-bold' : ''}>
                  <th scope="row" className="py-1.5 pr-3 text-left font-normal text-slate-200">
                    {z.summe ? <strong className="text-white">{z.label}</strong> : z.label}
                  </th>
                  <td className="whitespace-nowrap py-1.5 text-right tabular-nums">{z.summe ? formatEuro(z.betrag) : formatEuroMitVorzeichen(z.betrag)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-white/20 pt-4 text-sm">
            <div>
              <dt className="text-slate-300">Gesamtinvestition</dt>
              <dd className="font-bold tabular-nums">{formatEuro(ergebnis.scAnschaffung)}</dd>
            </div>
            <div>
              <dt className="text-slate-300">Darlehen</dt>
              <dd className="font-bold tabular-nums">{formatEuro(ergebnis.scDarlehen)}</dd>
            </div>
            <div>
              <dt className="text-slate-300">Rate (Zins + Tilgung)</dt>
              <dd className="font-bold tabular-nums">{formatEuro(ergebnis.scRateMonat)}</dd>
            </div>
            <div>
              <dt className="text-slate-300">DSCR</dt>
              <dd className="font-bold tabular-nums">{formatZahl(ergebnis.scDSCR, { min: 2, max: 2 })}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
