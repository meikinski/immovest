/**
 * Prüfung importierter Inserate: Fehlende Angaben bleiben leer und werden benannt.
 * Portale liefern bei "Preis auf Anfrage" oft Platzhalter wie 1 €, die nie als echter Wert gelten dürfen.
 */

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
};

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

  return { daten: daten as T, fehlend };
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
export function bereinigeHinweise(warnungen: unknown, fehlend: ImportFeld[]): string[] {
  if (!Array.isArray(warnungen)) return [];
  const doppelt: Array<[ImportFeld, RegExp]> = [
    ['hausgeld', /kein Hausgeld angegeben/i],
    ['miete', /keine Kaltmiete|Kaltmiete konnte nicht gefunden/i],
  ];
  const aus = new Set<string>();
  for (const w of warnungen) {
    if (typeof w !== 'string') continue;
    if (doppelt.some(([feld, re]) => fehlend.includes(feld) && re.test(w))) continue;
    const text = w
      .replace(/^[^A-Za-zÄÖÜäöü0-9]+/, '')
      .replace(/^(ACHTUNG|KRITISCH|AUTOMATISCH KORRIGIERT):\s*/i, m => (/KORRIGIERT/i.test(m) ? 'Automatisch korrigiert: ' : ''))
      .trim();
    if (text) aus.add(text.charAt(0).toUpperCase() + text.slice(1));
  }
  return [...aus];
}

/** Stichworte, an denen ein Import-Hinweis einem Feld zugeordnet wird */
const HINWEIS_FELD: Array<[ImportFeld, RegExp]> = [
  ['kaufpreis', /kaufpreis|preis auf anfrage/i],
  ['miete', /kaltmiete|miete\b|jahresmiete/i],
  // Hinweise zur 60/40-Aufteilung betreffen die Annahme, nicht den Betrag
  ['hausgeld', /hausgeld(?![- ]?(aufteilung|verteilung))/i],
  // Nicht auf "m²" prüfen: Hinweise zur Miete nennen €/m²
  ['flaeche', /fläche|flaeche/i],
  ['adresse', /adresse|\bplz\b|postleitzahl/i],
  ['zimmer', /zimmer/i],
  ['baujahr', /baujahr/i],
];

/**
 * Felder, deren importierter Wert laut Hinweis unsicher ist (z. B. "Kaltmiete erscheint sehr niedrig").
 * Reihenfolge wie bei den fehlenden Angaben.
 */
export function unsichereFelder(hinweise: unknown): ImportFeld[] {
  if (!Array.isArray(hinweise)) return [];
  const treffer = new Set<ImportFeld>();
  for (const h of hinweise) {
    if (typeof h !== 'string') continue;
    for (const [feld, re] of HINWEIS_FELD) if (re.test(h)) treffer.add(feld);
  }
  return REIHENFOLGE.filter(f => treffer.has(f));
}
