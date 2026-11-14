/**
 * Prüfung importierter Inserate: Fehlende Angaben bleiben leer und werden benannt.
 * Portale liefern bei "Preis auf Anfrage" oft Platzhalter wie 1 €, die nie als echter Wert gelten dürfen.
 * Unplausible Angaben (z. B. Hausgeld = Kaltmiete) werden als unsicher markiert und müssen bestätigt werden.
 */
import { formatZahl } from './zahlen';

export type ImportFeld = 'kaufpreis' | 'miete' | 'hausgeld' | 'flaeche' | 'adresse' | 'zimmer' | 'baujahr';

export const IMPORT_FELD_LABEL: Record<ImportFeld, string> = {
  kaufpreis: 'Kaufpreis',
  miete: 'Kaltmiete',
  hausgeld: 'Hausgeld',
  flaeche: 'Wohnfläche',
  adresse: 'Adresse',
  zimmer: 'Zimmer',
  baujahr: 'Baujahr',
};

const REIHENFOLGE: ImportFeld[] = ['kaufpreis', 'miete', 'hausgeld', 'flaeche', 'adresse', 'zimmer', 'baujahr'];

/** Kleinster plausibler Wert je Feld. Alles darunter (0, 1, negative Zahlen) ist ein Platzhalter. */
const MINDESTWERT: Record<Exclude<ImportFeld, 'adresse'>, number> = {
  kaufpreis: 1000,
  miete: 10,
  hausgeld: 2,
  flaeche: 5,
  zimmer: 1,
  baujahr: 1500,
};

type Rohdaten = Partial<Record<ImportFeld | 'hausgeld_umlegbar' | 'hausgeld_nicht_umlegbar' | 'objekttyp' | 'anzahl_wohneinheiten', unknown>>;

/** Echter Zahlenwert oder null (fehlend, unlesbar, Platzhalter) */
export function echterWert(feld: Exclude<ImportFeld, 'adresse'>, wert: unknown): number | null {
  const n = typeof wert === 'number' ? wert : typeof wert === 'string' && wert.trim() !== '' ? Number(wert) : NaN;
  return Number.isFinite(n) && n >= MINDESTWERT[feld] ? n : null;
}

export type ImportErgebnis<T> = {
  /** Eingangsdaten, in denen Platzhalter durch null ersetzt sind */
  daten: T;
  /** Fehlende Angaben in fester Reihenfolge */
  fehlend: ImportFeld[];
  /** Vorhandene, aber unplausible Angaben, die der Nutzer bestätigen muss */
  unsicher: ImportFeld[];
};

/** Hausgeld über diesem Anteil der Kaltmiete gilt als unplausibel (meist hat der Import die Miete doppelt gelesen). */
export const HAUSGELD_MAX_ANTEIL_MIETE = 0.6;

/**
 * Hausgeld ist unsicher, wenn es der Kaltmiete entspricht oder mehr als 60 % davon beträgt.
 * Beispiel aus dem Live-Test (Kleinanzeigen): Hausgeld 350 € und Kaltmiete 350 € für dieselbe Wohnung.
 */
export function hausgeldUnsicher(hausgeld: number | null | undefined, miete: number | null | undefined): boolean {
  if (!(typeof hausgeld === 'number' && hausgeld > 0) || !(typeof miete === 'number' && miete > 0)) return false;
  return Math.abs(hausgeld - miete) < 0.005 || hausgeld > miete * HAUSGELD_MAX_ANTEIL_MIETE;
}

/** Hinweis am Hausgeld-Feld, z. B. "Hausgeld (350 €) ist so hoch wie die Kaltmiete (350 €). ..." */
export function hausgeldUnsicherHinweis(hausgeld: number, miete: number): string {
  const hg = `${formatZahl(hausgeld)} €`;
  const km = `${formatZahl(miete)} €`;
  const vergleich = Math.abs(hausgeld - miete) < 0.005
    ? `so hoch wie die Kaltmiete (${km})`
    : `mehr als ${formatZahl(HAUSGELD_MAX_ANTEIL_MIETE * 100)} % der Kaltmiete (${km})`;
  return `Das importierte Hausgeld (${hg}) ist ${vergleich}. Bitte prüfe den Wert im Inserat und bestätige ihn oder korrigiere ihn.`;
}

/**
 * Ersetzt Platzhalter durch null und listet fehlende Angaben.
 * Hausgeld zählt nur bei Eigentumswohnungen, Zimmer nicht bei Mehrfamilienhäusern.
 */
export function pruefeImport<T extends Rohdaten>(roh: T): ImportErgebnis<T> {
  const daten: Rohdaten = { ...roh };
  const fehlend: ImportFeld[] = [];
  const objekttyp = roh.objekttyp ?? 'wohnung';

  for (const feld of REIHENFOLGE) {
    if (feld === 'adresse') {
      const a = typeof roh.adresse === 'string' ? roh.adresse.trim() : '';
      daten.adresse = a || null;
      if (!a) fehlend.push(feld);
      continue;
    }
    const wert = echterWert(feld, roh[feld]);
    daten[feld] = wert;
    if (wert !== null) continue;
    if (feld === 'hausgeld' && objekttyp !== 'wohnung') continue;
    if (feld === 'zimmer' && objekttyp === 'mfh') continue;
    fehlend.push(feld);
  }

  // Ohne echtes Hausgeld gibt es auch keine Aufteilung
  if (daten.hausgeld === null) {
    if ('hausgeld_umlegbar' in roh && objekttyp === 'wohnung') daten.hausgeld_umlegbar = null;
    if ('hausgeld_nicht_umlegbar' in roh && objekttyp === 'wohnung') daten.hausgeld_nicht_umlegbar = null;
  }

  const unsicher: ImportFeld[] = [];
  if (objekttyp === 'wohnung' && hausgeldUnsicher(daten.hausgeld as number | null, daten.miete as number | null)) {
    unsicher.push('hausgeld');
  }

  return { daten: daten as T, fehlend, unsicher };
}

/** Ein Import ist brauchbar, wenn mindestens zwei der drei Kernangaben vorhanden sind. */
export function hatGenugDaten(fehlend: ImportFeld[]): boolean {
  return (['kaufpreis', 'flaeche', 'adresse'] as ImportFeld[]).filter(f => fehlend.includes(f)).length <= 1;
}

/** Hinweis für die erste Eingabeseite, z. B. "Diese Angaben fehlen im Inserat: Kaufpreis, Kaltmiete. Bitte ergänze sie." */
export function fehlendHinweis(fehlend: ImportFeld[]): string {
  if (fehlend.length === 0) return '';
  const namen = fehlend.map(f => IMPORT_FELD_LABEL[f]).join(', ');
  return fehlend.length === 1
    ? `Diese Angabe fehlt im Inserat: ${namen}. Bitte ergänze sie.`
    : `Diese Angaben fehlen im Inserat: ${namen}. Bitte ergänze sie.`;
}

/** Import-Warnungen für die Anzeige: ohne Emoji-Präfix, ohne Dopplung mit der Fehlt-Liste */
export function bereinigeHinweise(warnungen: unknown, fehlend: ImportFeld[], unsicher: ImportFeld[] = []): string[] {
  if (!Array.isArray(warnungen)) return [];
  const doppelt: Array<[ImportFeld, RegExp]> = [
    ['hausgeld', /kein Hausgeld angegeben/i],
    ['miete', /keine Kaltmiete|Kaltmiete konnte nicht gefunden/i],
  ];
  // Steht schon als Bestätigung am Hausgeld-Feld
  const doppeltUnsicher: Array<[ImportFeld, RegExp]> = [['hausgeld', /Kaltmiete erscheint ungewöhnlich niedrig im Verhältnis zum Hausgeld/i]];
  const aus = new Set<string>();
  for (const w of warnungen) {
    if (typeof w !== 'string') continue;
    if (doppelt.some(([feld, re]) => fehlend.includes(feld) && re.test(w))) continue;
    if (doppeltUnsicher.some(([feld, re]) => unsicher.includes(feld) && re.test(w))) continue;
    const text = w
      .replace(/^[^A-Za-zÄÖÜäöü0-9]+/, '')
      .replace(/^(ACHTUNG|KRITISCH|AUTOMATISCH KORRIGIERT):\s*/i, m => (/KORRIGIERT/i.test(m) ? 'Automatisch korrigiert: ' : ''))
      .trim();
    if (text) aus.add(text.charAt(0).toUpperCase() + text.slice(1));
  }
  return [...aus];
}
