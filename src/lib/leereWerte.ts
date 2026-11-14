/**
 * Fehlende Pflichtangaben: Im Store steht für "noch nicht eingetragen" 0 (das Feld bleibt leer, die Kennzahlen
 * sind gesperrt). Nach außen, also beim Speichern, Exportieren und im Import-Ergebnis, steht dafür null.
 * Weder 0 noch ein Platzhalter wie 1 darf dort als echter Wert erscheinen.
 */

type Daten = Record<string, unknown>;

/** Felder, die nur als positive Zahl ein echter Wert sind */
const NUR_POSITIV = ['kaufpreis', 'miete', 'flaeche'] as const;

/** Alle Felder, die im Store 0 statt null tragen */
export const LEERE_FELDER = [...NUR_POSITIV, 'hausgeld', 'hausgeld_umlegbar', 'grunderwerbsteuer_pct'] as const;

const positiv = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v > 0;

/** Store-Zustand → Export: fehlende Angaben werden null */
export function leereWerteAlsNull<T extends Daten>(z: T): T {
  const aus: Daten = { ...z };
  for (const f of NUR_POSITIV) if (f in aus && !positiv(aus[f])) aus[f] = null;

  // Hausgeld fehlt nur bei Eigentumswohnungen. Bei Häusern ist 0 ein echter Wert.
  if ((aus.objekttyp ?? 'wohnung') === 'wohnung' && 'hausgeld' in aus && !positiv(aus.hausgeld)) {
    aus.hausgeld = null;
    if ('hausgeld_umlegbar' in aus) aus.hausgeld_umlegbar = null;
  }

  // Grunderwerbsteuer: 0 heißt "Bundesland unbekannt", außer der Satz wurde bewusst eingetragen
  if ('grunderwerbsteuer_pct' in aus && !positiv(aus.grunderwerbsteuer_pct) && aus.grunderwerbsteuerManuell !== true) {
    aus.grunderwerbsteuer_pct = null;
  }
  return aus as T;
}

/** Import/Laden → Store: null wird wieder zum internen Leerwert 0 */
export function nullAlsLeererWert<T extends Daten>(d: T): T {
  const aus: Daten = { ...d };
  for (const f of LEERE_FELDER) if (f in aus && aus[f] === null) aus[f] = 0;
  return aus as T;
}
