import { berechneNebenkosten } from '@/lib/calculations';

/** Bruttomietrendite in %: Jahreskaltmiete ÷ Kaufpreis (ohne Kaufnebenkosten, übliche Definition) */
export function berechneBruttomietrendite(jahreskaltmiete: number, kaufpreis: number): number {
  return kaufpreis > 0 ? (jahreskaltmiete / kaufpreis) * 100 : 0;
}

export type EkStartwertEingabe = {
  kaufpreis: number;
  grunderwerbsteuerPct: number;
  notarPct: number;
  maklerPct: number;
  sonstigeKosten?: number;
};

/**
 * Startwert fürs Eigenkapital: Kaufnebenkosten (Grunderwerbsteuer, Notar, Makler, Sonstige)
 * plus 10 % des Kaufpreises, auf volle 1.000 € gerundet.
 */
export function berechneEkStartwert(e: EkStartwertEingabe): number {
  if (!(e.kaufpreis > 0)) return 0;
  const { nk } = berechneNebenkosten(e.kaufpreis, e.grunderwerbsteuerPct || 0, e.notarPct || 0, e.maklerPct || 0);
  return Math.round((nk + (e.sonstigeKosten || 0) + e.kaufpreis * 0.1) / 1000) * 1000;
}

// ---------------------------------------------------------------------------------------------
// Gemeinsame Kennzahlen für Ergebnis-Karten, Store (Speichern, Liste, Chat) und Tests.
// Eine Definition je Kennzahl, damit Karte, Formel unter "Wie wird das berechnet?" und /hilfe übereinstimmen.
// ---------------------------------------------------------------------------------------------

export type KennzahlenEingabe = {
  kaufpreis: number;
  grunderwerbsteuerPct: number;
  notarPct: number;
  maklerPct: number;
  sonstigeKosten: number;
  /** Kaltmiete pro Monat */
  miete: number;
  /** Hausgeld gesamt pro Monat */
  hausgeld: number;
  /** davon umlagefähig pro Monat */
  hausgeldUmlegbar: number;
  /** Instandhaltung in € pro m² und Jahr */
  instandhaltungProQmJahr: number;
  flaeche: number;
  /** Mietausfall in % der Kaltmiete */
  mietausfallPct: number;
  ek: number;
  zins: number;
  tilgung: number;
};

/** Gesamtinvestition: Kaufpreis + Kaufnebenkosten (Grunderwerbsteuer, Notar, Makler) + sonstige Kosten */
export function berechneGesamtinvestition(e: KennzahlenEingabe): number {
  const { nk } = berechneNebenkosten(e.kaufpreis, e.grunderwerbsteuerPct || 0, e.notarPct || 0, e.maklerPct || 0);
  return e.kaufpreis + nk + (e.sonstigeKosten || 0);
}

/** Laufende, nicht umlagefähige Kosten pro Jahr: nicht umlagefähiges Hausgeld + Instandhaltung */
export function berechneBewirtschaftungJahr(e: KennzahlenEingabe): number {
  return (e.hausgeld - e.hausgeldUmlegbar) * 12 + (e.instandhaltungProQmJahr || 0) * e.flaeche;
}

/**
 * Nettomietrendite in %:
 * (Jahreskaltmiete − nicht umlagefähiges Hausgeld − Instandhaltung) ÷ Gesamtinvestition × 100.
 * Gesamtinvestition = Kaufpreis + Kaufnebenkosten + sonstige Kosten. Ohne Gesamtinvestition 0.
 */
export function berechneNettomietrendite(e: KennzahlenEingabe): number {
  const gesamt = berechneGesamtinvestition(e);
  return gesamt > 0 ? ((e.miete * 12 - berechneBewirtschaftungJahr(e)) / gesamt) * 100 : 0;
}

/** Darlehen: Gesamtinvestition − Eigenkapital (wie in der Prognose) */
export function berechneDarlehen(e: KennzahlenEingabe): number {
  return berechneGesamtinvestition(e) - e.ek;
}

/**
 * EK-Rendite in %: (Jahreskaltmiete − nicht umlagefähiges Hausgeld − Instandhaltung − Zinsen) ÷ Eigenkapital × 100.
 * Ohne Eigenkapital (0 €) gibt es keine sinnvolle EK-Rendite: null statt 0 %.
 */
export function berechneEkRendite(e: KennzahlenEingabe): number | null {
  if (!(e.ek > 0)) return null;
  const zinsen = berechneDarlehen(e) * (e.zins / 100);
  return ((e.miete * 12 - berechneBewirtschaftungJahr(e) - zinsen) / e.ek) * 100;
}

/**
 * Cashflow vor Steuern im ersten Monat (wie Jahr 1 der Prognose, Annuität):
 * Kaltmiete + umlagefähiges Hausgeld − Hausgeld gesamt − Instandhaltung − Mietausfall − Zins − Tilgung.
 */
export function berechneCashflowVorSteuern(e: KennzahlenEingabe): number {
  const kalk = ((e.instandhaltungProQmJahr || 0) * e.flaeche) / 12 + e.miete * ((e.mietausfallPct || 0) / 100);
  // Wie die Prognose: mehr Eigenkapital als Gesamtinvestition heißt kein Darlehen
  const darlehen = Math.max(0, berechneDarlehen(e));
  const zins = (darlehen * (e.zins / 100)) / 12;
  const tilgung = Math.min(darlehen, darlehen * (e.tilgung / 100)) / 12;
  return e.miete + e.hausgeldUmlegbar - e.hausgeld - kalk - zins - tilgung;
}

/**
 * Vervielfachung des Eigenkapitals (Vermögen ÷ Einsatz). Ohne Eigenkapital nicht berechenbar: null.
 */
export function berechneVervielfachung(vermoegen: number, ek: number): number | null {
  return ek > 0 ? vermoegen / ek : null;
}

/** Text für den neutralen Zustand ohne Eigenkapital */
export const OHNE_EK_TEXT = 'Ohne Eigenkapital lässt sich keine Vervielfachung berechnen';
