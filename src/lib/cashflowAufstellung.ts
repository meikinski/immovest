import { berechneSzenario, KEINE_DELTAS, type SzenarioBasis, type SzenarioErgebnis } from './szenario';

/**
 * Monatliche Cashflow-Aufstellung für Rechner und Rechenbeispiel.
 * Keine eigene Rechnung: alle Beträge sind Felder aus berechneSzenario() bzw. Eingaben der Basis,
 * damit Rechner-Seite, Analyse, Startseite und PDF dieselben Zahlen zeigen.
 */

export type AufstellungsZeile = {
  key: 'miete' | 'umlage' | 'hausgeld' | 'kalk' | 'zins' | 'tilgung' | 'vorSteuern' | 'steuer' | 'nachSteuern';
  label: string;
  /** Vorzeichenbehafteter Betrag pro Monat (Abzüge negativ) */
  betrag: number;
  summe?: boolean;
};

export function cashflowAufstellung(b: SzenarioBasis, e: SzenarioErgebnis): AufstellungsZeile[] {
  return [
    { key: 'miete', label: 'Kaltmiete', betrag: e.scMiete },
    { key: 'umlage', label: 'Umlagefähiges Hausgeld (zahlt der Mieter)', betrag: b.hausgeldUmlegbar },
    { key: 'hausgeld', label: 'Hausgeld gesamt', betrag: -b.hausgeld },
    { key: 'kalk', label: 'Rücklage Instandhaltung und Mietausfall', betrag: -e.scKalkKostenMon },
    { key: 'zins', label: 'Zinsen', betrag: -e.scZinsMonat },
    { key: 'tilgung', label: 'Tilgung', betrag: -e.scTilgungMonat },
    { key: 'vorSteuern', label: 'Cashflow vor Steuern', betrag: e.scCashflowVorSt, summe: true },
    {
      key: 'steuer',
      label: e.scSteuerMonat >= 0 ? 'Steuer auf das Mietergebnis' : 'Steuererstattung',
      betrag: -e.scSteuerMonat,
    },
    { key: 'nachSteuern', label: 'Cashflow nach Steuern', betrag: e.scCashflowAfterTax, summe: true },
  ];
}

/** Eingaben des Rechners. Der Kaufpreis wirkt als Abweichung vom Preset, damit AfA und Grundstückswert mitwachsen. */
export type CashflowEingaben = {
  kaufpreis: number;
  miete: number;
  hausgeld: number;
  hausgeldUmlegbar: number;
  flaeche: number;
  ek: number;
  zins: number;
  tilgung: number;
  grunderwerbsteuerPct: number;
  steuersatzPct: number;
};

export function eingabenAusPreset(p: SzenarioBasis): CashflowEingaben {
  return {
    kaufpreis: p.kaufpreis,
    miete: p.miete,
    hausgeld: p.hausgeld,
    hausgeldUmlegbar: p.hausgeldUmlegbar,
    flaeche: p.flaeche,
    ek: p.ek,
    zins: p.zins,
    tilgung: p.tilgung,
    grunderwerbsteuerPct: p.grunderwerbsteuerPct,
    steuersatzPct: p.steuersatzPct,
  };
}

/**
 * Rechnet die Eingaben mit berechneSzenario(). Alles, was der Rechner nicht abfragt (Notar, Makler,
 * Instandhaltung, Mietausfall, AfA, Grundstückswert), kommt aus dem Preset. Der Kaufpreis geht als
 * prozentuale Abweichung ein, so skaliert berechneSzenario AfA und Grundstückswert wie im Szenarien-Tab.
 */
export function rechneCashflow(preset: SzenarioBasis, e: CashflowEingaben): { basis: SzenarioBasis; ergebnis: SzenarioErgebnis } {
  const basis: SzenarioBasis = {
    ...preset,
    miete: e.miete,
    hausgeld: e.hausgeld,
    hausgeldUmlegbar: e.hausgeldUmlegbar,
    flaeche: e.flaeche,
    ek: e.ek,
    zins: e.zins,
    tilgung: e.tilgung,
    grunderwerbsteuerPct: e.grunderwerbsteuerPct,
    steuersatzPct: e.steuersatzPct,
  };
  const preisPct = preset.kaufpreis > 0 ? (e.kaufpreis / preset.kaufpreis - 1) * 100 : 0;
  const ergebnis = berechneSzenario(basis, { ...KEINE_DELTAS, preisPct });
  return { basis, ergebnis };
}

/** Euro ohne Nachkommastellen, deutsches Format, echtes Minuszeichen */
export function formatEuro(v: number): string {
  const r = Math.round(v);
  const betrag = Math.abs(r).toLocaleString('de-DE');
  return `${r < 0 ? '−' : ''}${betrag} €`;
}

/** Wie formatEuro, aber mit Vorzeichen (+/−) für Aufstellungen */
export function formatEuroMitVorzeichen(v: number): string {
  const r = Math.round(v);
  if (r === 0) return '0 €';
  return `${r > 0 ? '+' : '−'}${Math.abs(r).toLocaleString('de-DE')} €`;
}

export function formatProzent(v: number, minStellen = 0): string {
  return `${v.toLocaleString('de-DE', { minimumFractionDigits: minStellen, maximumFractionDigits: 2 })} %`;
}
