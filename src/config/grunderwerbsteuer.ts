/**
 * Grunderwerbsteuersätze je Bundesland (in % des Kaufpreises).
 *
 * Zuletzt geprüft: siehe GRUNDERWERBSTEUER_STAND. Jeder Satz wurde gegen eine amtliche Seite des Landes
 * (Finanzverwaltung, Landesrecht oder Gesetzblatt) abgeglichen:
 *   BW 5,0  finanzamt-bw.fv-bwl.de (FAQ "Wann muss ich Grunderwerbsteuer zahlen und wie hoch ist diese?")
 *   BY 3,5  lfst.bayern.de/steuerinfos/haeufig-gestellte-fragen/grunderwerbsteuer
 *   BE 6,0  berlin.de/sen/finanzen (FAQ Grunderwerbsteuer)
 *   BB 6,5  finanzamt.brandenburg.de/fa/de/steuern/steuerinformationen/grunderwerbsteuer, bravors.brandenburg.de/gesetze/mdf_2015
 *   HB 5,5  gesetzblatt.bremen.de (GBl. 2025 Nr. 9, gilt ab 01.07.2025)
 *   HH 5,5  hamburg.de/service/info/11311613 (Grunderwerbsteuer, Informationen und Zuständigkeit)
 *   HE 6,0  verwaltungsportal.hessen.de (Grunderwerbsteuer festsetzen)
 *   MV 6,0  steuerportal-mv.de (Rund ums Grundstück, Grunderwerbsteuer)
 *   NI 5,0  voris (GrEStFG NI), lstn.niedersachsen.de (FAQ)
 *   NW 6,5  finanzamt.nrw.de (Grunderwerbsteuer: Wissenswertes), recht.nrw.de (Gesetz vom 01.01.2015)
 *   RP 5,0  fm.rlp.de/themen/steuerrecht/fragen-und-antworten
 *   SL 6,5  service.saarland.de (Bescheid über Grunderwerbsteuer erhalten)
 *   SN 5,5  steuern.sachsen.de/grunderwerb-und-grundsteuer-4009.html
 *   ST 5,0  buerger.sachsen-anhalt.de, Statistisches Landesamt Sachsen-Anhalt
 *   SH 6,5  schleswig-holstein.de (Landeshaushalt, Einzelplan 11, Entwurf 2026)
 *   TH 5,0  parldok.thueringer-landtag.de (Drs. 7/8722, ab 01.01.2024), finanzen.thueringen.de (Bilanz der Finanzämter 2025)
 * Letzte bekannte Änderungen: Bremen 5,0 → 5,5 % (01.07.2025), Thüringen 6,5 → 5,0 % (01.01.2024),
 * Hamburg 4,5 → 5,5 % und Sachsen 3,5 → 5,5 % (01.01.2023). Vor einer Änderung bitte erneut amtlich prüfen.
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
