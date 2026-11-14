/**
 * Pflichtfelder der Eingabe: gemeinsame Prüfung für die vier Eingabeschritte und die Prüfseite nach einem Import.
 * Jede Lücke gehört zu einem Schritt, damit die Schrittseiten sie dort anzeigen und verlinken können.
 */

export type PflichtSchritt = 'a' | 'a2' | 'b' | 'c';

export type PflichtFehler = {
  /** Feldschlüssel, z. B. "kaufpreis" */
  key: string;
  schritt: PflichtSchritt;
  label: string;
  text: string;
};

export type PflichtWerte = {
  kaufpreis: number;
  adresse: string;
  /** true, solange kein Grunderwerbsteuersatz bekannt ist (kein Bundesland, nichts eingetragen) */
  grunderwerbsteuerFehlt: boolean;
  objekttyp: 'wohnung' | 'haus' | 'mfh';
  flaeche: number;
  zimmer: number;
  anzahlWohneinheiten: number;
  baujahr: number;
  miete: number;
  ek: number | null | undefined;
  zins: number | null | undefined;
  tilgung: number | null | undefined;
};

/** Alle offenen Pflichtangaben in der Reihenfolge der Eingabeschritte */
export function findePflichtLuecken(w: PflichtWerte, jahr = new Date().getFullYear()): PflichtFehler[] {
  const f: PflichtFehler[] = [];
  const add = (key: string, schritt: PflichtSchritt, label: string, text: string) => f.push({ key, schritt, label, text });

  if (!(w.kaufpreis > 0)) add('kaufpreis', 'a', 'Kaufpreis', 'Bitte trag den Kaufpreis ein.');
  if (!w.adresse || w.adresse.trim() === '') add('adresse', 'a', 'Adresse', 'Bitte trag die Adresse ein, mindestens PLZ und Ort.');
  if (w.grunderwerbsteuerFehlt) add('grunderwerbsteuer', 'a', 'Grunderwerbsteuer', 'Bitte wähle das Bundesland oder trag den Satz ein.');

  if (!(w.flaeche > 0)) add('flaeche', 'a2', 'Wohnfläche', 'Bitte trag die Wohnfläche ein.');
  else if (w.flaeche < 10) add('flaeche', 'a2', 'Wohnfläche', 'Die Wohnfläche muss mindestens 10 m² betragen.');
  if (w.objekttyp === 'mfh') {
    if (!(w.anzahlWohneinheiten > 0)) add('zimmer', 'a2', 'Wohneinheiten', 'Bitte trag die Anzahl der Wohneinheiten ein.');
    else if (w.anzahlWohneinheiten > 50) add('zimmer', 'a2', 'Wohneinheiten', 'Maximal 50 Wohneinheiten.');
  } else {
    if (!(w.zimmer > 0)) add('zimmer', 'a2', 'Zimmer', 'Bitte trag die Anzahl der Zimmer ein.');
    else if (w.zimmer > 20) add('zimmer', 'a2', 'Zimmer', 'Maximal 20 Zimmer.');
  }
  if (!(w.baujahr > 0)) add('baujahr', 'a2', 'Baujahr', 'Bitte trag das Baujahr ein.');
  else if (w.baujahr < 1800) add('baujahr', 'a2', 'Baujahr', 'Das Baujahr muss ab 1800 liegen.');
  else if (w.baujahr > jahr + 2) add('baujahr', 'a2', 'Baujahr', 'Das Baujahr liegt zu weit in der Zukunft.');

  if (!(w.miete > 0)) add('miete', 'b', 'Kaltmiete', 'Bitte trag die Kaltmiete ein.');

  if (w.ek === null || w.ek === undefined || w.ek < 0) add('ek', 'c', 'Eigenkapital', 'Bitte trag dein Eigenkapital ein.');
  if (w.zins === null || w.zins === undefined || w.zins < 0 || w.zins > 20) add('zins', 'c', 'Zinssatz', 'Der Zinssatz muss zwischen 0 und 20 % liegen.');
  if (w.tilgung === null || w.tilgung === undefined || w.tilgung < 0 || w.tilgung > 10) add('tilgung', 'c', 'Tilgung', 'Die Tilgung muss zwischen 0 und 10 % liegen.');

  return f;
}
