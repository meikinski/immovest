'use client';

import React, { useMemo } from 'react';
import {
  AlertTriangle, CalendarDays, Check, FileDown, FlaskConical, Info, Loader2, Minus, MoreHorizontal, Percent, PiggyBank,
  Plus, ShieldCheck, SlidersHorizontal, Table2, TrendingDown, TrendingUp, Wallet, X, type LucideIcon,
} from 'lucide-react';
import {
  berechnePuffer, berechneSzenario, hatAenderung, istGleich, KEINE_DELTAS, STRESSTESTS,
  type Stresstest, type SzenarioBasis, type SzenarioDeltas,
} from '@/lib/szenario';

const fmt = (v: number, d = 0) => v.toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
const eur = (v: number) => `${fmt(Math.round(v))} €`;

const STRESSTEST_ICON: Record<Stresstest['id'], LucideIcon> = {
  zins: TrendingUp, miete: TrendingDown, preis: Percent, ek: PiggyBank, worst: AlertTriangle,
};

type Hebel = {
  key: keyof SzenarioDeltas;
  label: string;
  min: number;
  max: number;
  step: number;
  hint: string;
  wert: (sc: ReturnType<typeof berechneSzenario>) => string;
};

const IMMOBILIE: Hebel[] = [
  { key: 'preisPct', label: 'Kaufpreis', min: -30, max: 30, step: 1, hint: 'Verhandlungsspielraum', wert: sc => eur(sc.scKaufpreis) },
  { key: 'mietePct', label: 'Kaltmiete pro Monat', min: -30, max: 30, step: 1, hint: 'z. B. Mietminderung oder Neuvermietung', wert: sc => eur(sc.scMiete) },
];
const FINANZIERUNG: Hebel[] = [
  { key: 'ekPct', label: 'Eigenkapital', min: -100, max: 100, step: 5, hint: 'Mehr Eigenkapital, kleinerer Kredit', wert: sc => eur(sc.scEk) },
  { key: 'zinsPp', label: 'Zinssatz', min: -3, max: 3, step: 0.1, hint: 'z. B. Anschlussfinanzierung', wert: sc => `${fmt(sc.scZins, 2)} %` },
  { key: 'tilgungPp', label: 'Tilgung', min: -3, max: 3, step: 0.1, hint: 'Höher = schneller schuldenfrei, weniger Überschuss', wert: sc => `${fmt(sc.scTilgung, 2)} %` },
];

function DeltaPill({ delta, unit, higherIsBetter = true, digits = 0 }: { delta: number; unit: string; higherIsBetter?: boolean; digits?: number }) {
  const zero = Math.abs(delta) < Math.pow(10, -digits) / 2;
  if (zero) return <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-400">unverändert</span>;
  const good = higherIsBetter ? delta > 0 : delta < 0;
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${good ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
      {delta > 0 ? '+' : '−'}{fmt(Math.abs(delta), digits)}{unit ? ` ${unit}` : ''}
    </span>
  );
}

function VergleichKachel({
  icon: Icon, label, heute, szenario, unit, higherIsBetter = true, digits = 0,
}: { icon: LucideIcon; label: string; heute: number; szenario: number; unit: string; higherIsBetter?: boolean; digits?: number }) {
  const geaendert = Math.abs(szenario - heute) >= Math.pow(10, -digits) / 2;
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm md:p-5">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
        <Icon size={16} className="shrink-0 text-[#ff6b00]" />{label}
      </div>
      <p className={`mt-3 text-xs tabular-nums text-slate-400 ${geaendert ? 'line-through decoration-slate-300' : ''}`}>
        {geaendert ? `heute ${fmt(heute, digits)} ${unit}` : 'wie heute'}
      </p>
      <p className="mt-0.5 flex items-baseline gap-1">
        <span className="text-2xl font-bold tracking-tight tabular-nums text-[#001d3d] md:text-[26px]">{fmt(szenario, digits)}</span>
        <span className="text-sm font-semibold text-slate-400">{unit}</span>
      </p>
      <div className="mt-2"><DeltaPill delta={szenario - heute} unit={unit} higherIsBetter={higherIsBetter} digits={digits} /></div>
    </div>
  );
}

export interface SzenarienTabProps {
  basis: SzenarioBasis;
  deltas: SzenarioDeltas;
  setDeltas: (d: SzenarioDeltas) => void;
  pdfBusy: boolean;
  onPdfExport: () => void;
  onPdfCancel: () => void;
  /** Speichern-Button der App (SaveAnalysisButton) */
  speichern: React.ReactNode;
}

export function SzenarienTab({ basis, deltas, setDeltas, pdfBusy, onPdfExport, onPdfCancel, speichern }: SzenarienTabProps) {
  const heute = useMemo(() => berechneSzenario(basis, KEINE_DELTAS), [basis]);
  const sc = useMemo(() => berechneSzenario(basis, deltas), [basis, deltas]);
  const puffer = useMemo(() => berechnePuffer(basis, deltas), [basis, deltas]);

  const geaendert = hatAenderung(deltas);
  const aktiverTest = STRESSTESTS.find(t => istGleich(t.deltas, deltas));
  const eigeneWerte = geaendert && !aktiverTest;

  const setDelta = (key: keyof SzenarioDeltas, v: number, h: Hebel) => {
    const gerundet = Math.round(Math.max(h.min, Math.min(h.max, v)) * 100) / 100;
    setDeltas({ ...deltas, [key]: gerundet });
  };

  // ---------- Antwortsatz ----------
  const diff = sc.scCashflowAfterTax - heute.scCashflowAfterTax;
  let ton: 'neutral' | 'good' | 'ok' | 'bad';
  let lead: React.ReactNode;
  const B = ({ children }: { children: React.ReactNode }) => <strong className="font-extrabold text-[#001d3d]">{children}</strong>;
  if (!geaendert) {
    ton = 'neutral';
    lead = heute.scCashflowAfterTax >= 0
      ? <>Heute bleiben dir <B>{eur(heute.scCashflowAfterTax)}</B> im Monat. Wähle oben einen Stresstest und sieh sofort, was sich ändert.</>
      : <>Heute zahlst du <B>{eur(-heute.scCashflowAfterTax)}</B> im Monat dazu. Wähle oben einen Stresstest oder stell die Regler ein, um Verbesserungen durchzuspielen.</>;
  } else if (sc.scCashflowAfterTax >= 50) {
    ton = 'good';
    lead = <>In diesem Szenario bleiben dir <B>{eur(sc.scCashflowAfterTax)}</B> statt {eur(heute.scCashflowAfterTax)} im Monat (<B>{diff >= 0 ? '+' : '−'}{eur(Math.abs(diff))}</B>). Die Wohnung trägt sich weiterhin selbst.</>;
  } else if (sc.scCashflowAfterTax >= 0) {
    ton = 'ok';
    lead = <>Es wird knapp: Dir bleiben nur noch <B>{eur(sc.scCashflowAfterTax)}</B> im Monat statt {eur(heute.scCashflowAfterTax)}. Eine größere Reparatur müsstest du aus Rücklagen bezahlen.</>;
  } else {
    ton = 'bad';
    lead = <>In diesem Szenario zahlst du <B>{eur(-sc.scCashflowAfterTax)}</B> im Monat dazu{heute.scCashflowAfterTax >= 0 ? <>, statt {eur(heute.scCashflowAfterTax)} übrig zu haben</> : null}. Plane diesen Betrag aus deinem Einkommen ein.</>;
  }
  const TON = {
    neutral: { bg: 'bg-slate-100', fg: 'text-slate-400', Icon: MoreHorizontal },
    good: { bg: 'bg-emerald-50', fg: 'text-emerald-600', Icon: Check },
    ok: { bg: 'bg-amber-50', fg: 'text-amber-600', Icon: AlertTriangle },
    bad: { bg: 'bg-red-50', fg: 'text-red-600', Icon: X },
  }[ton];

  // ---------- Tabelle ----------
  type Zeile = { label: string; heute: number; sc: number; unit: string; digits: number; higherIsBetter: boolean | null } | { gruppe: string };
  const zeilen: Zeile[] = [
    { gruppe: 'Kauf' },
    { label: 'Kaufpreis', heute: heute.scKaufpreis, sc: sc.scKaufpreis, unit: '€', digits: 0, higherIsBetter: false },
    { label: 'Gesamtinvestition', heute: heute.scAnschaffung, sc: sc.scAnschaffung, unit: '€', digits: 0, higherIsBetter: false },
    { label: 'Eigenkapital', heute: heute.scEk, sc: sc.scEk, unit: '€', digits: 0, higherIsBetter: true },
    { label: 'Darlehen', heute: heute.scDarlehen, sc: sc.scDarlehen, unit: '€', digits: 0, higherIsBetter: false },
    { gruppe: 'Kredit & Miete' },
    { label: 'Zins', heute: heute.scZins, sc: sc.scZins, unit: '%', digits: 2, higherIsBetter: false },
    { label: 'Tilgung', heute: heute.scTilgung, sc: sc.scTilgung, unit: '%', digits: 2, higherIsBetter: null },
    { label: 'Kreditrate pro Monat', heute: heute.scRateMonat, sc: sc.scRateMonat, unit: '€', digits: 0, higherIsBetter: false },
    { label: 'Kaltmiete pro Monat', heute: heute.scMiete, sc: sc.scMiete, unit: '€', digits: 0, higherIsBetter: true },
    { gruppe: 'Ergebnis' },
    { label: 'Cashflow vor Steuern', heute: heute.scCashflowVorSt, sc: sc.scCashflowVorSt, unit: '€', digits: 0, higherIsBetter: true },
    { label: 'Cashflow nach Steuern', heute: heute.scCashflowAfterTax, sc: sc.scCashflowAfterTax, unit: '€', digits: 0, higherIsBetter: true },
    { label: 'DSCR', heute: heute.scDSCR, sc: sc.scDSCR, unit: '', digits: 2, higherIsBetter: true },
    { label: 'Bruttomietrendite', heute: heute.scBruttoRendite, sc: sc.scBruttoRendite, unit: '%', digits: 1, higherIsBetter: true },
    { label: 'Nettomietrendite', heute: heute.scNettoRendite, sc: sc.scNettoRendite, unit: '%', digits: 1, higherIsBetter: true },
    { label: 'EK-Rendite', heute: heute.scEkRendite, sc: sc.scEkRendite, unit: '%', digits: 1, higherIsBetter: true },
  ];

  const schuldenfreiHeute = heute.scAbzahlungsjahr || null;
  const schuldenfreiSc = sc.scAbzahlungsjahr || null;

  const hebelKarte = (h: Hebel) => {
    const wert = deltas[h.key];
    const veraendert = Math.abs(wert) > 1e-6;
    const id = `szenario-${h.key}`;
    return (
      <div key={h.key} className={`rounded-xl border p-3 transition-colors md:px-4 ${veraendert ? 'border-orange-200 bg-[#fff7f0]' : 'border-slate-200/80 bg-white'}`}>
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor={id} className="text-xs font-bold text-[#001d3d]">{h.label}</label>
          <span className="whitespace-nowrap text-right text-[13px] font-bold tabular-nums text-[#001d3d]">
            {veraendert && <s className="mr-1 font-medium text-slate-400 decoration-slate-300">{h.wert(heute)}</s>}
            {h.wert(sc)}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <button type="button" onClick={() => setDelta(h.key, wert - h.step, h)} disabled={wert <= h.min}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-orange-200 bg-white hover:bg-orange-50 disabled:opacity-40 touch-manipulation"
            aria-label={`${h.label} verringern`}>
            <Minus size={14} />
          </button>
          <input id={id} type="range" className="range-input flex-1" min={h.min} max={h.max} step={h.step} value={wert}
            onChange={e => setDelta(h.key, Number(e.target.value), h)} />
          <button type="button" onClick={() => setDelta(h.key, wert + h.step, h)} disabled={wert >= h.max}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-orange-200 bg-white hover:bg-orange-50 disabled:opacity-40 touch-manipulation"
            aria-label={`${h.label} erhöhen`}>
            <Plus size={14} />
          </button>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">{h.hint}</p>
      </div>
    );
  };

  const pufferBalken = (anteil: number) => {
    const farbe = anteil >= 0.3 ? 'bg-emerald-500' : anteil >= 0.12 ? 'bg-amber-500' : 'bg-red-500';
    return (
      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${farbe}`} style={{ width: `${Math.max(4, Math.min(100, anteil * 100))}%` }} />
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
      <div className="contents lg:col-span-8 lg:flex lg:flex-col lg:gap-6">
        {/* Stresstests */}
        <section className="order-1 lg:order-none">
          <h3 className="flex items-center gap-2 text-sm font-bold text-[#001d3d]">
            <FlaskConical size={16} className="text-[#ff6b00]" /> Was willst du durchspielen?
          </h3>
          <p className="mb-3 mt-0.5 text-xs text-slate-500">Wähle einen Stresstest oder stell die Regler unten selbst ein.</p>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3">
            {STRESSTESTS.map(t => {
              const Icon = STRESSTEST_ICON[t.id];
              const aktiv = aktiverTest?.id === t.id;
              return (
                <button key={t.id} type="button" aria-pressed={aktiv}
                  onClick={() => setDeltas(aktiv ? KEINE_DELTAS : t.deltas)}
                  className={`flex flex-col gap-1 rounded-2xl border-[1.5px] p-3 text-left shadow-sm transition-all sm:px-3.5 ${aktiv ? 'border-[#ff6b00] bg-[#fff7f0]' : 'border-slate-200/80 bg-white hover:border-slate-300'}`}>
                  <span className="flex items-center gap-2 text-[13px] font-bold text-[#001d3d]"><Icon size={16} className="shrink-0 text-[#ff6b00]" />{t.titel}</span>
                  <span className="hidden text-xs text-slate-500 sm:block">{t.text}</span>
                </button>
              );
            })}
            <button type="button" aria-pressed={eigeneWerte}
              onClick={() => document.getElementById('szenario-stellschrauben')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className={`flex flex-col gap-1 rounded-2xl border-[1.5px] p-3 text-left shadow-sm transition-all sm:px-3.5 ${eigeneWerte ? 'border-[#ff6b00] bg-[#fff7f0]' : 'border-slate-200/80 bg-white hover:border-slate-300'}`}>
              <span className="flex items-center gap-2 text-[13px] font-bold text-[#001d3d]"><SlidersHorizontal size={16} className="shrink-0 text-[#ff6b00]" />Eigene Werte</span>
              <span className="hidden text-xs text-slate-500 sm:block">Regler selbst einstellen</span>
            </button>
          </div>
        </section>

        {/* Antwort */}
        <section className="order-2 flex gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:order-none md:p-7" aria-live="polite">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TON.bg}`}>
            <TON.Icon size={20} strokeWidth={2.5} className={TON.fg} />
          </div>
          <div className="max-w-[64ch] text-base font-medium leading-relaxed text-slate-600 md:text-lg">{lead}</div>
        </section>

        {/* Vorher / Nachher */}
        <section className="order-3 grid grid-cols-2 gap-3 lg:order-none xl:grid-cols-4">
          <VergleichKachel icon={Wallet} label="Überschuss pro Monat" heute={heute.scCashflowAfterTax} szenario={sc.scCashflowAfterTax} unit="€" />
          <VergleichKachel icon={Percent} label="EK-Rendite" heute={heute.scEkRendite} szenario={sc.scEkRendite} unit="%" digits={1} />
          <VergleichKachel icon={ShieldCheck} label="Kreditrate pro Monat" heute={heute.scRateMonat} szenario={sc.scRateMonat} unit="€" higherIsBetter={false} />
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm md:p-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <CalendarDays size={16} className="shrink-0 text-[#ff6b00]" />Schuldenfrei
            </div>
            <p className={`mt-3 text-xs tabular-nums text-slate-400 ${schuldenfreiSc !== schuldenfreiHeute ? 'line-through decoration-slate-300' : ''}`}>
              {schuldenfreiSc !== schuldenfreiHeute ? `heute ${schuldenfreiHeute ?? '–'}` : 'wie heute'}
            </p>
            <p className="mt-0.5 text-2xl font-bold tracking-tight tabular-nums text-[#001d3d] md:text-[26px]">{schuldenfreiSc ?? '–'}</p>
            <div className="mt-2">
              {schuldenfreiSc === schuldenfreiHeute ? (
                <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-400">unverändert</span>
              ) : schuldenfreiSc === null ? (
                <span className="inline-block rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700">nicht in Sicht</span>
              ) : schuldenfreiHeute === null || schuldenfreiSc < schuldenfreiHeute ? (
                <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                  {schuldenfreiHeute === null ? 'neu in Sicht' : `${schuldenfreiHeute - schuldenfreiSc} Jahre früher`}
                </span>
              ) : (
                <span className="inline-block rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700">{schuldenfreiSc - schuldenfreiHeute} Jahre später</span>
              )}
            </div>
          </div>
        </section>

        {/* Stellschrauben */}
        <section id="szenario-stellschrauben" className="order-4 scroll-mt-20 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:order-none md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="flex items-center gap-2 text-sm font-bold text-[#001d3d]"><SlidersHorizontal size={16} className="text-[#ff6b00]" /> Deine Stellschrauben</h4>
              <p className="mt-0.5 text-xs text-slate-500">Durchgestrichen: deine Eingabe. Fett: das Szenario.</p>
            </div>
            {geaendert && (
              <button type="button" onClick={() => setDeltas(KEINE_DELTAS)}
                className="rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-bold text-[#ff6b00] hover:bg-orange-100">
                Alles zurücksetzen
              </button>
            )}
          </div>
          <p className="mb-2 mt-5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Immobilie</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{IMMOBILIE.map(hebelKarte)}</div>
          <p className="mb-2 mt-5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Finanzierung</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{FINANZIERUNG.map(hebelKarte)}</div>
        </section>

        {/* Puffer */}
        <section className="order-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:order-none md:p-6">
          <h4 className="flex items-center gap-2 text-sm font-bold text-[#001d3d]"><ShieldCheck size={16} className="text-[#ff6b00]" /> Wie viel hält die Wohnung aus?</h4>
          <p className="mt-0.5 text-xs text-slate-500">Ab diesen Werten zahlst du {geaendert ? 'im Szenario ' : ''}jeden Monat drauf.</p>
          {puffer.zinsBis === null ? (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4">
              <p className="text-sm font-bold text-red-700">Kein Puffer</p>
              <p className="mt-1 text-xs text-red-700/80">{geaendert ? 'Im Szenario' : 'Schon heute'} reicht die Miete nicht für Kredit, Kosten und Steuern.</p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4">
                <p className="text-xs text-slate-600">Zinssatz bis</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-[#001d3d]">{fmt(puffer.zinsBis, 1)} %</p>
                {pufferBalken((puffer.zinsBis - sc.scZins) / 6)}
                <p className="mt-1.5 text-[11px] text-slate-400">heute {fmt(sc.scZins, 1)} %, Luft {fmt(puffer.zinsBis - sc.scZins, 1)} %-Punkte</p>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4">
                <p className="text-xs text-slate-600">Kaltmiete bis</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-[#001d3d]">{eur(puffer.mieteBis ?? 0)}</p>
                {pufferBalken(sc.scMiete > 0 ? (sc.scMiete - (puffer.mieteBis ?? 0)) / sc.scMiete : 0)}
                <p className="mt-1.5 text-[11px] text-slate-400">heute {eur(sc.scMiete)}, Luft {eur(sc.scMiete - (puffer.mieteBis ?? 0))}</p>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4">
                <p className="text-xs text-slate-600">Leerstand bis</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-[#001d3d]">ca. {fmt(puffer.leerstandMonate ?? 0, 1)} Monate</p>
                {pufferBalken((puffer.leerstandMonate ?? 0) / 6)}
                <p className="mt-1.5 text-[11px] text-slate-400">pro Jahr, bevor du draufzahlst</p>
              </div>
            </div>
          )}
        </section>

        {/* Alle Kennzahlen */}
        <details className="group order-6 min-w-0 rounded-2xl border border-slate-200/80 bg-white shadow-sm lg:order-none">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 md:px-6 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2 text-sm font-bold text-[#001d3d]"><Table2 size={16} className="text-[#ff6b00]" /> Alle Kennzahlen im Vergleich</span>
            <span className="text-xs font-bold text-slate-500"><span className="group-open:hidden">Anzeigen ▼</span><span className="hidden group-open:inline">Ausblenden ▲</span></span>
          </summary>
          <div className="overflow-x-auto px-5 pb-5 md:px-6">
            <table className="w-full min-w-[460px] text-[13px] tabular-nums">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="py-2 text-left font-bold">Kennzahl</th>
                  <th className="py-2 pl-3 text-right font-bold">Deine Eingabe</th>
                  <th className="py-2 pl-3 text-right font-bold">Szenario</th>
                  <th className="py-2 pl-3 text-right font-bold">Änderung</th>
                </tr>
              </thead>
              <tbody>
                {zeilen.map((z, i) => {
                  if ('gruppe' in z) {
                    return <tr key={i}><td colSpan={4} className="pb-1 pt-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{z.gruppe}</td></tr>;
                  }
                  const delta = z.sc - z.heute;
                  const zero = Math.abs(delta) < Math.pow(10, -z.digits) / 2;
                  const farbe = zero ? 'text-slate-400' : z.higherIsBetter === null ? 'text-[#001d3d]'
                    : (z.higherIsBetter ? delta > 0 : delta < 0) ? 'font-bold text-emerald-600' : 'font-bold text-red-600';
                  const f = (v: number) => `${fmt(v, z.digits)}${z.unit ? ` ${z.unit}` : ''}`;
                  return (
                    <tr key={i} className="border-b border-slate-100 last:border-0">
                      <td className="py-2.5 text-slate-600">{z.label}</td>
                      <td className="py-2.5 pl-3 text-right text-[#001d3d]">{f(z.heute)}</td>
                      <td className="py-2.5 pl-3 text-right text-[#001d3d]">{f(z.sc)}</td>
                      <td className={`py-2.5 pl-3 text-right ${farbe}`}>{zero ? '±0' : `${delta > 0 ? '+' : '−'}${f(Math.abs(delta))}`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>
      </div>

      <aside className="contents lg:sticky lg:top-20 lg:col-span-4 lg:flex lg:flex-col lg:gap-4 lg:self-start">
        <section className="order-7 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:order-none md:p-6">
          <h4 className="flex items-center gap-2 text-sm font-bold text-[#001d3d]"><FileDown size={16} className="text-[#ff6b00]" /> Analyse sichern</h4>
          <p className="mt-0.5 text-xs text-slate-500">Für die Bank, den Steuerberater oder für dich.</p>
          <div className="mt-4 flex items-start gap-4">
            <div aria-hidden className="flex aspect-[210/297] w-20 shrink-0 flex-col gap-1 rounded-md border border-slate-300 bg-white p-1.5 shadow-md">
              <div className="relative h-4 rounded-sm bg-[#001d3d]"><span className="absolute left-1 top-1 h-1.5 w-1.5 rounded-[2px] bg-[#ff6b00]" /></div>
              <div className="grid grid-cols-3 gap-0.5"><i className="h-2.5 rounded-sm bg-emerald-100" /><i className="h-2.5 rounded-sm bg-slate-100" /><i className="h-2.5 rounded-sm bg-slate-100" /></div>
              <div className="h-0.5 rounded bg-slate-100" /><div className="h-0.5 w-2/3 rounded bg-slate-100" />
              <div className="flex-1 rounded-sm bg-gradient-to-t from-blue-200/70 to-transparent" />
              <div className="h-0.5 rounded bg-slate-100" />
            </div>
            <ul className="flex flex-col gap-1.5 text-xs text-slate-600">
              {['Kennzahlen mit Bewertung', 'Finanzierung & Monatsrechnung', 'Markt & Lage', 'Prognose über 30 Jahre'].map(t => (
                <li key={t} className="flex items-start gap-1.5"><Check size={14} strokeWidth={2.5} className="mt-0.5 shrink-0 text-emerald-600" />{t}</li>
              ))}
              <li className="flex items-start gap-1.5 font-semibold text-[#001d3d]">
                <Check size={14} strokeWidth={2.5} className="mt-0.5 shrink-0 text-emerald-600" />
                {geaendert ? `Dein Szenario: ${aktiverTest ? aktiverTest.titel : 'eigene Werte'}` : 'Stresstest: Zinsen +2 %-Punkte'}
              </li>
            </ul>
          </div>
          {pdfBusy ? (
            <button type="button" onClick={onPdfCancel}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-[#001d3d]">
              <Loader2 size={16} className="animate-spin" /> PDF wird erstellt · Abbrechen
            </button>
          ) : (
            <button type="button" onClick={onPdfExport}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ff6b00] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-colors hover:bg-[#ff6b00]/90">
              <FileDown size={16} /> PDF herunterladen
            </button>
          )}
          <div className="mt-2.5 [&>*]:w-full [&_button]:w-full [&_button]:justify-center">{speichern}</div>
        </section>

        <div className="order-8 flex gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 lg:order-none">
          <Info size={16} className="mt-0.5 shrink-0 text-slate-400" />
          <p className="text-xs leading-relaxed text-slate-500">
            Szenarien verändern nur diese Ansicht, das PDF und die gespeicherte Analyse. Deine Eingaben bleiben gleich. Alle Werte gelten für das erste Jahr nach Kauf.
          </p>
        </div>
      </aside>
    </div>
  );
}
