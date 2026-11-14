/**
 * Startwerte für Annahmen, solange der Nutzer nichts eingetragen hat.
 * Gleiche Werte wie in den Eingabeschritten, damit Import-Prüfseite und manuelle Eingabe gleich rechnen.
 */

/** AfA-Satz nach Baujahr: vor 1925 2,5 %, ab 2023 3 %, sonst 2 % */
export function startAfa(baujahr: number): number {
  if (!baujahr) return 2;
  if (baujahr < 1925) return 2.5;
  if (baujahr >= 2023) return 3;
  return 2;
}

/** Gebäudeanteil am Kaufpreis je Objektart */
export function startGebaeudeAnteil(typ: 'wohnung' | 'haus' | 'mfh'): number {
  switch (typ) {
    case 'haus':
      return 80;
    case 'mfh':
      return 85;
    case 'wohnung':
    default:
      return 75;
  }
}

/** Startwerte der Eingabefelder in Schritt 3 (Miete & Kosten) */
export const START_MIETAUSFALL_PCT = 1;
export const START_INSTANDHALTUNG_PRO_QM = 10;
/** Anteil des Hausgelds, der auf Mieter umgelegt werden kann (Standardaufteilung 60/40) */
export const START_HAUSGELD_UMLAGE_PCT = 60;
