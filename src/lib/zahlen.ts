/**
 * Deutsche Zahlenformate für Eingabefelder: Komma als Dezimaltrennzeichen, Punkt als Tausendertrennzeichen.
 */

/**
 * Liest eine Eingabe als Zahl. "1.234,56" → 1234.56, "280.000" → 280000, "6,12" → 6.12.
 * Ein einzelner Punkt ohne Komma, dem nicht genau drei Ziffern folgen, gilt als Dezimalpunkt ("468.33", "3.5"),
 * damit eingefügte Werte in englischer Schreibweise nicht um den Faktor 100 falsch landen.
 * Leere oder unlesbare Eingaben ergeben null.
 */
export function parseZahl(text: string | number | null | undefined): number | null {
  if (typeof text === 'number') return Number.isFinite(text) ? text : null;
  if (text == null) return null;
  let s = text.replace(/[\s €%]/g, '');
  if (!s) return null;
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    const punkte = (s.match(/\./g) || []).length;
    const tausender = /^-?\d{1,3}(\.\d{3})+$/.test(s);
    if (tausender || punkte > 1) s = s.replace(/\./g, '');
  }
  if (!/^-?\d*\.?\d*$/.test(s) || !/\d/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Wie parseZahl, aber mit Ersatzwert (Standard 0) für leere oder unlesbare Eingaben */
export function parseZahlOder(text: string | number | null | undefined, ersatz = 0): number {
  return parseZahl(text) ?? ersatz;
}

/** Zahl für ein Eingabefeld: 468.33 → "468,33", 280000 → "280.000" */
export function formatZahl(n: number | null | undefined, opt: { min?: number; max?: number } = {}): string {
  if (n == null || !Number.isFinite(n)) return '';
  const max = opt.max ?? 2;
  return n.toLocaleString('de-DE', { minimumFractionDigits: Math.min(opt.min ?? 0, max), maximumFractionDigits: max });
}

/** Wie formatZahl, aber leer bei 0 (für Felder, in denen 0 "noch nichts eingetragen" bedeutet) */
export function formatZahlOderLeer(n: number | null | undefined, opt: { min?: number; max?: number } = {}): string {
  return n ? formatZahl(n, opt) : '';
}
