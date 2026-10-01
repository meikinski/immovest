import { berechneNebenkosten } from './calculations';
import { berechneAbzahlungsjahr, berechnePrognose } from './prognose-calculator';
import type { AfaModell } from '@/store/useImmoStore';

/** Eingaben des Nutzers, auf die ein Szenario angewendet wird */
export interface SzenarioBasis {
  kaufpreis: number;
  miete: number; // Kaltmiete pro Monat
  ek: number;
  zins: number; // % p.a.
  tilgung: number; // anfängliche Tilgung, % p.a.
  grunderwerbsteuerPct: number;
  notarPct: number;
  maklerPct: number;
  sonstigeKosten: number;
  hausgeld: number; // Hausgeld gesamt pro Monat
  hausgeldUmlegbar: number; // davon auf den Mieter umlegbar
  instandhaltungProQmJahr: number; // für die Bewirtschaftungskosten (Rendite-Kennzahlen)
  instandKalkProQmJahr: number; // für die kalkulatorische Rücklage im Cashflow
  mietausfallPct: number;
  flaeche: number;
  afaJaehrlich: number;
  steuersatzPct: number;
  darlehensTyp: 'annuitaet' | 'degressiv';
  afaModell?: AfaModell;
  nutzeSonderAfa?: boolean;
  grundstueckswert: number;
}

/** Abweichungen vom Ausgangswert */
export interface SzenarioDeltas {
  preisPct: number;
  mietePct: number;
  ekPct: number;
  zinsPp: number;
  tilgungPp: number;
}

export const KEINE_DELTAS: SzenarioDeltas = { preisPct: 0, mietePct: 0, ekPct: 0, zinsPp: 0, tilgungPp: 0 };

export interface SzenarioErgebnis {
  scKaufpreis: number;
  scMiete: number;
  scZins: number;
  scTilgung: number;
  scEk: number;
  scNk: number;
  scAnschaffung: number;
  scDarlehen: number;
  scWarmmiete: number;
  scKalkKostenMon: number;
  scNoiMonthly: number;
  scRateMonat: number;
  scZinsMonat: number;
  scTilgungMonat: number;
  scSteuerMonat: number;
  scCashflowVorSt: number;
  scCashflowAfterTax: number;
  scDSCR: number;
  scBruttoRendite: number;
  scNettoRendite: number;
  scEkRendite: number;
  scEkQuote: number;
  /** Kalenderjahr der vollständigen Tilgung, 0 wenn nicht innerhalb von 60 Jahren */
  scAbzahlungsjahr: number;
}

export function berechneSzenario(b: SzenarioBasis, d: SzenarioDeltas = KEINE_DELTAS): SzenarioErgebnis {
  const scMiete = Math.max(0, b.miete * (1 + d.mietePct / 100));
  const scKaufpreis = Math.max(0, b.kaufpreis * (1 + d.preisPct / 100));
  const scZins = Math.max(0, b.zins + d.zinsPp);
  const scTilgung = Math.max(0, b.tilgung + d.tilgungPp);
  const scEk = Math.max(0, b.ek * (1 + d.ekPct / 100));

  const { nk: scNk } = berechneNebenkosten(scKaufpreis, b.grunderwerbsteuerPct, b.notarPct, b.maklerPct);
  const scAnschaffung = scKaufpreis + scNk + b.sonstigeKosten;
  const scDarlehen = Math.max(0, scAnschaffung - scEk);

  const scWarmmiete = scMiete + b.hausgeldUmlegbar;
  const scJahresKalt = scMiete * 12;
  const scBewJ = (b.hausgeld - b.hausgeldUmlegbar) * 12 + b.instandhaltungProQmJahr * b.flaeche;
  const scKalkKostenMon = (b.instandKalkProQmJahr * b.flaeche) / 12 + scMiete * (b.mietausfallPct / 100);
  const scNoiMonthly = scWarmmiete - b.hausgeld - scKalkKostenMon;

  // Cashflow, Rate und Steuer über dieselbe Rechnung wie die Prognose,
  // damit Basis und Szenario ohne Änderung identisch sind
  const kaufpreisFaktor = b.kaufpreis > 0 ? scKaufpreis / b.kaufpreis : 1;
  const prognose = berechnePrognose(
    {
      startJahr: new Date().getFullYear(),
      darlehensSumme: scDarlehen,
      ek: scEk,
      zins: scZins,
      tilgung: scTilgung,
      warmmiete: scWarmmiete,
      hausgeld: b.hausgeld,
      kalkKostenMonthly: scKalkKostenMon,
      afaJaehrlich: b.afaJaehrlich * kaufpreisFaktor,
      steuersatz: b.steuersatzPct,
      darlehensTyp: b.darlehensTyp,
      afaModell: b.afaModell,
      nutzeSonderAfa: b.nutzeSonderAfa,
      kaufpreis: scKaufpreis,
      grundstueckswert: b.grundstueckswert * kaufpreisFaktor,
      wohnflaeche: b.flaeche,
    },
    60
  ).jahre;
  const j0 = prognose[0];
  const scZinsMonat = (j0?.zinslast ?? 0) / 12;
  const scTilgungMonat = (j0?.tilgungJaehrlich ?? 0) / 12;
  const scRateMonat = scZinsMonat + scTilgungMonat;

  return {
    scKaufpreis,
    scMiete,
    scZins,
    scTilgung,
    scEk,
    scNk,
    scAnschaffung,
    scDarlehen,
    scWarmmiete,
    scKalkKostenMon,
    scNoiMonthly,
    scRateMonat,
    scZinsMonat,
    scTilgungMonat,
    scSteuerMonat: (j0?.steuerJaehrlich ?? 0) / 12,
    scCashflowVorSt: j0?.cashflowVorSteuern ?? 0,
    scCashflowAfterTax: j0?.cashflowMonatlich ?? 0,
    scDSCR: scRateMonat > 0 ? scNoiMonthly / scRateMonat : 0,
    scBruttoRendite: scAnschaffung > 0 ? (scJahresKalt / scAnschaffung) * 100 : 0,
    scNettoRendite: scAnschaffung > 0 ? ((scJahresKalt - scBewJ) / scAnschaffung) * 100 : 0,
    scEkRendite: scEk > 0 ? ((scJahresKalt - scBewJ - scDarlehen * (scZins / 100)) / scEk) * 100 : 0,
    scEkQuote: scAnschaffung > 0 ? (scEk / scAnschaffung) * 100 : 0,
    scAbzahlungsjahr: berechneAbzahlungsjahr(prognose) ?? 0,
  };
}

/** Vorgefertigte Stresstests für den Szenarien-Tab und das PDF */
export interface Stresstest {
  id: 'zins' | 'miete' | 'preis' | 'ek' | 'worst';
  titel: string;
  text: string;
  deltas: SzenarioDeltas;
}

export const STRESSTESTS: Stresstest[] = [
  { id: 'zins', titel: 'Zinsen steigen', text: '+2 %-Punkte bei der Anschlussfinanzierung', deltas: { ...KEINE_DELTAS, zinsPp: 2 } },
  { id: 'miete', titel: 'Miete sinkt', text: '10 % weniger Kaltmiete', deltas: { ...KEINE_DELTAS, mietePct: -10 } },
  { id: 'preis', titel: 'Preis verhandelt', text: '5 % günstiger gekauft', deltas: { ...KEINE_DELTAS, preisPct: -5 } },
  { id: 'ek', titel: 'Mehr Eigenkapital', text: '50 % mehr Eigenkapital einbringen', deltas: { ...KEINE_DELTAS, ekPct: 50 } },
  { id: 'worst', titel: 'Alles schlecht', text: 'Zins +2 %-Punkte und Miete −10 %', deltas: { ...KEINE_DELTAS, zinsPp: 2, mietePct: -10 } },
];

export function istGleich(a: SzenarioDeltas, b: SzenarioDeltas): boolean {
  const k: Array<keyof SzenarioDeltas> = ['preisPct', 'mietePct', 'ekPct', 'zinsPp', 'tilgungPp'];
  return k.every(key => Math.abs(a[key] - b[key]) < 1e-6);
}

export function hatAenderung(d: SzenarioDeltas): boolean {
  return !istGleich(d, KEINE_DELTAS);
}

export interface Puffer {
  /** Zinssatz, bis zu dem der Cashflow nach Steuern nicht negativ wird (null = schon negativ) */
  zinsBis: number | null;
  /** Kaltmiete pro Monat, bis zu der der Cashflow nach Steuern nicht negativ wird */
  mieteBis: number | null;
  /** Monate Leerstand pro Jahr, die der Überschuss ungefähr auffängt */
  leerstandMonate: number | null;
}

/**
 * Grenzwerte, ab denen das Szenario monatlich Geld kostet.
 * Sucht per Bisektion, weil Steuer und AfA den Zusammenhang nicht linear machen.
 */
export function berechnePuffer(b: SzenarioBasis, d: SzenarioDeltas): Puffer {
  const sc = berechneSzenario(b, d);
  if (sc.scCashflowAfterTax < 0) return { zinsBis: null, mieteBis: null, leerstandMonate: null };

  const traegtSich = (over: Partial<SzenarioDeltas>) => berechneSzenario(b, { ...d, ...over }).scCashflowAfterTax >= 0;
  const bisektion = (ok: (v: number) => boolean, lo: number, hi: number) => {
    if (ok(hi)) return hi;
    for (let i = 0; i < 40; i += 1) {
      const mid = (lo + hi) / 2;
      if (ok(mid)) lo = mid;
      else hi = mid;
    }
    return lo;
  };

  const zinsPp = bisektion(v => traegtSich({ zinsPp: v }), d.zinsPp, d.zinsPp + 20);
  const mietePct = -bisektion(v => traegtSich({ mietePct: -v }), -d.mietePct, 100);

  // Ein Monat Leerstand kostet die Warmmiete, mindert aber auch den zu versteuernden Gewinn
  const st = Math.max(0, b.steuersatzPct) / 100;
  const kostenProLeermonat = sc.scWarmmiete * (sc.scSteuerMonat > 0 ? 1 - st : 1);
  const leerstandMonate = kostenProLeermonat > 0 ? Math.min(12, (sc.scCashflowAfterTax * 12) / kostenProLeermonat) : null;

  return {
    zinsBis: b.zins + zinsPp,
    mieteBis: b.miete * (1 + mietePct / 100),
    leerstandMonate,
  };
}
