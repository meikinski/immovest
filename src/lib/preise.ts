/**
 * Abo-Preise an einer Stelle. Die tatsächlichen Beträge kommen aus Stripe (Price-IDs in den Env-Variablen);
 * diese Werte müssen dazu passen.
 */
export const PREIS_MONAT = 12.99;
export const PREIS_JAHR = 69;

export const PREIS_JAHR_PRO_MONAT = PREIS_JAHR / 12;
export const PREIS_MONAT_AUF_JAHR = PREIS_MONAT * 12;
export const ERSPARNIS_JAHR = PREIS_MONAT_AUF_JAHR - PREIS_JAHR;
export const ERSPARNIS_JAHR_PCT = Math.round((ERSPARNIS_JAHR / PREIS_MONAT_AUF_JAHR) * 100);

/** Kostenlose vollständige Analysen vor Premium */
export const GRATIS_ANALYSEN = 2;

/** Betrag deutsch formatiert, ganze Euro ohne Nachkommastellen ("69"), sonst mit zwei ("12,99") */
export function preis(v: number): string {
  const ganz = Math.abs(v - Math.round(v)) < 0.005;
  return v.toLocaleString('de-DE', { minimumFractionDigits: ganz ? 0 : 2, maximumFractionDigits: 2 });
}
