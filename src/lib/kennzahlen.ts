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
  /** Ohne Angabe wie eine Wohnung */
  objekttyp?: Objekttyp;
  /** Verwaltungskosten pro Monat für das ganze Objekt (nur Haus/MFH, nicht umlagefähig) */
  verwaltungskosten?: number;
};

export type Objekttyp = 'wohnung' | 'haus' | 'mfh';

export type LaufendeKostenEingabe = {
  objekttyp?: Objekttyp;
  hausgeld: number;
  hausgeldUmlegbar: number;
  verwaltungskosten?: number;
};

/** Monatliche laufende Kosten des Eigentümers, aufgeteilt wie in Prognose, Szenarien und PDF */
export type LaufendeKosten = {
  /** Hausgeld gesamt (Wohnung) bzw. umgelegte Nebenkosten (Haus/MFH), die der Eigentümer zahlt */
  hausgeld: number;
  /** davon vom Mieter zurück (Teil der Warmmiete) */
  hausgeldUmlegbar: number;
  /** Verwaltungskosten (nur Haus/MFH) */
  verwaltungskosten: number;
  /** Was beim Eigentümer hängen bleibt: nicht umlagefähiges Hausgeld bzw. Verwaltungskosten */
  nichtUmlagefaehig: number;
};

/**
 * Laufende Kosten je Objekttyp (pro Monat):
 * - Wohnung: Hausgeld gesamt, davon umlagefähig; nicht umlagefähig = Hausgeld − umlagefähig. Verwaltung steckt im Hausgeld.
 * - Haus/MFH: kein Hausgeld. Die umlagefähigen Nebenkosten zahlt der Mieter durch (Saldo 0),
 *   nicht umlagefähig sind die Verwaltungskosten. Ein gespeichertes Hausgeld zählt hier nicht.
 */
export function berechneLaufendeKosten(e: LaufendeKostenEingabe): LaufendeKosten {
  const umlegbar = e.hausgeldUmlegbar || 0;
  if (e.objekttyp === 'haus' || e.objekttyp === 'mfh') {
    const verwaltungskosten = Math.max(0, e.verwaltungskosten || 0);
    return { hausgeld: umlegbar, hausgeldUmlegbar: umlegbar, verwaltungskosten, nichtUmlagefaehig: verwaltungskosten };
  }
  const hausgeld = e.hausgeld || 0;
  return { hausgeld, hausgeldUmlegbar: umlegbar, verwaltungskosten: 0, nichtUmlagefaehig: hausgeld - umlegbar };
}

/** Gesamtinvestition: Kaufpreis + Kaufnebenkosten (Grunderwerbsteuer, Notar, Makler) + sonstige Kosten */
export function berechneGesamtinvestition(e: KennzahlenEingabe): number {
  const { nk } = berechneNebenkosten(e.kaufpreis, e.grunderwerbsteuerPct || 0, e.notarPct || 0, e.maklerPct || 0);
  return e.kaufpreis + nk + (e.sonstigeKosten || 0);
}

/**
 * Laufende, nicht umlagefähige Kosten pro Jahr:
 * nicht umlagefähiges Hausgeld (Wohnung) bzw. Verwaltungskosten (Haus/MFH) + Instandhaltung
 */
export function berechneBewirtschaftungJahr(e: KennzahlenEingabe): number {
  return berechneLaufendeKosten(e).nichtUmlagefaehig * 12 + (e.instandhaltungProQmJahr || 0) * e.flaeche;
}

/**
 * Nettomietrendite in %:
 * (Jahreskaltmiete − nicht umlagefähiges Hausgeld bzw. Verwaltungskosten − Instandhaltung) ÷ Gesamtinvestition × 100.
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
 * EK-Rendite in %: (Jahreskaltmiete − nicht umlagefähiges Hausgeld bzw. Verwaltungskosten − Instandhaltung − Zinsen) ÷ Eigenkapital × 100.
 * Ohne Eigenkapital (0 €) gibt es keine sinnvolle EK-Rendite: null statt 0 %.
 */
export function berechneEkRendite(e: KennzahlenEingabe): number | null {
  if (!(e.ek > 0)) return null;
  const zinsen = berechneDarlehen(e) * (e.zins / 100);
  return ((e.miete * 12 - berechneBewirtschaftungJahr(e) - zinsen) / e.ek) * 100;
}

/**
 * Cashflow vor Steuern im ersten Monat (wie Jahr 1 der Prognose, Annuität):
 * Kaltmiete + umlagefähiges Hausgeld − Hausgeld gesamt − Verwaltungskosten − Instandhaltung − Mietausfall − Zins − Tilgung.
 * Bei Haus/MFH heben sich umgelegte Nebenkosten auf, es bleiben die Verwaltungskosten.
 */
export function berechneCashflowVorSteuern(e: KennzahlenEingabe): number {
  const kalk = ((e.instandhaltungProQmJahr || 0) * e.flaeche) / 12 + e.miete * ((e.mietausfallPct || 0) / 100);
  // Wie die Prognose: mehr Eigenkapital als Gesamtinvestition heißt kein Darlehen
  const darlehen = Math.max(0, berechneDarlehen(e));
  const zins = (darlehen * (e.zins / 100)) / 12;
  const tilgung = Math.min(darlehen, darlehen * (e.tilgung / 100)) / 12;
  const lk = berechneLaufendeKosten(e);
  return e.miete + lk.hausgeldUmlegbar - lk.hausgeld - lk.verwaltungskosten - kalk - zins - tilgung;
}

/**
 * Vervielfachung des Eigenkapitals (Vermögen ÷ Einsatz). Ohne Eigenkapital nicht berechenbar: null.
 */
export function berechneVervielfachung(vermoegen: number, ek: number): number | null {
  return ek > 0 ? vermoegen / ek : null;
}

/** Text für den neutralen Zustand ohne Eigenkapital */
export const OHNE_EK_TEXT = 'Ohne Eigenkapital lässt sich keine Vervielfachung berechnen';
