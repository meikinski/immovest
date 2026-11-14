/**
 * Grunderwerbsteuersätze je Bundesland (in % des Kaufpreises).
 *
 * Zuletzt geprüft: siehe GRUNDERWERBSTEUER_STAND.
 * Quelle der Prüfung: Abgleich mehrerer 2026 aktualisierter Übersichten (u. a. schiffer.immo,
 * kaufodermieten.de, deutschland-rechner.de). Die amtlichen Seiten (Landesfinanzverwaltungen, BMF) konnten bei
 * der letzten Prüfung nicht automatisch abgerufen werden. Vor einer Änderung bitte dort gegenprüfen.
 * Letzte bekannte Änderungen: Bremen 5,0 → 5,5 % (01.07.2025), Thüringen 6,5 → 5,0 % (01.01.2024),
 * Hamburg 4,5 → 5,5 % und Sachsen 3,5 → 5,5 % (01.01.2023).
 */
export const GRUNDERWERBSTEUER_STAND = '2026-11-14';

export const BUNDESLAENDER = {
  BW: { name: 'Baden-Württemberg', satz: 5.0 },
  BY: { name: 'Bayern', satz: 3.5 },
  BE: { name: 'Berlin', satz: 6.0 },
  BB: { name: 'Brandenburg', satz: 6.5 },
  HB: { name: 'Bremen', satz: 5.5 },
  HH: { name: 'Hamburg', satz: 5.5 },
  HE: { name: 'Hessen', satz: 6.0 },
  MV: { name: 'Mecklenburg-Vorpommern', satz: 6.0 },
  NI: { name: 'Niedersachsen', satz: 5.0 },
  NW: { name: 'Nordrhein-Westfalen', satz: 6.5 },
  RP: { name: 'Rheinland-Pfalz', satz: 5.0 },
  SL: { name: 'Saarland', satz: 6.5 },
  SN: { name: 'Sachsen', satz: 5.5 },
  ST: { name: 'Sachsen-Anhalt', satz: 5.0 },
  SH: { name: 'Schleswig-Holstein', satz: 6.5 },
  TH: { name: 'Thüringen', satz: 5.0 },
} as const;

export type BundeslandCode = keyof typeof BUNDESLAENDER;

export const istBundesland = (code: unknown): code is BundeslandCode =>
  typeof code === 'string' && code in BUNDESLAENDER;
