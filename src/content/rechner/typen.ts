import type { SzenarioBasis } from '@/lib/szenario';
import { BUNDESLAENDER, type BundeslandCode } from '@/config/grunderwerbsteuer';

/**
 * Inhalt einer Rechner-Seite. Eine Datei je Seite unter src/content/rechner/<slug>.ts,
 * eingetragen in src/content/rechner/index.ts.
 *
 * Wo die Seite erscheint:
 * - ort.typ 'blog': im bestehenden Blogbeitrag (/blog/<postSlug>), damit eine schon rankende URL
 *   nicht durch eine zweite Seite zum selben Suchbegriff Konkurrenz bekommt.
 * - ort.typ 'rechner': eigene Seite unter /rechner/<slug> (z. B. für Bundesland-Seiten).
 */

/** Welcher Rechner auf der Seite läuft. Jede Art braucht eine Komponente in RechnerWidget. */
export type RechnerArt = 'cashflow';

export type FaqEintrag = { frage: string; antwort: string };

export type DatenTabelle = {
  titel: string;
  spalten: string[];
  zeilen: string[][];
  /** Quelle bzw. Stand der Daten, wird unter der Tabelle angezeigt */
  quelle?: string;
};

export type RechnerOrt = { typ: 'rechner' } | { typ: 'blog'; postSlug: string };

export interface RechnerInhalt {
  slug: string;
  art: RechnerArt;
  ort: RechnerOrt;
  h1: string;
  /** Vollständiger <title>, kein Template */
  title: string;
  metaDescription: string;
  /** Einleitende Absätze, server-gerendert */
  intro: string[];
  /** Vorbelegte Werte des Rechners, gleichzeitig Grundlage des Rechenbeispiels */
  preset: SzenarioBasis;
  /** Bundesland der Vorbelegung, muss zum Grunderwerbsteuersatz im Preset passen */
  presetBundesland: BundeslandCode;
  faq: FaqEintrag[];
  datenTabelle?: DatenTabelle;
  /** Genau drei verwandte Seiten: Slugs anderer Rechner oder Blogbeiträge */
  relatedSlugs: string[];
  /** Blogbeiträge, die einen Link-Block auf diesen Rechner zeigen */
  verlinktVon?: string[];
  /** Datum der letzten inhaltlichen Änderung (YYYY-MM-DD), für die Sitemap */
  lastModified: string;
}

/**
 * Bundesland-Seite: eigene Sätze, eigene Tabelle und mindestens zwei Absätze landesspezifischer Text.
 * Ohne diese Angaben schlägt der Build fehl (pruefeRechnerInhalte), damit keine Seiten entstehen,
 * die sich nur im Ortsnamen unterscheiden.
 */
export interface BundeslandRechnerInhalt extends RechnerInhalt {
  bundesland: BundeslandCode;
  /** Mindestens zwei Absätze, die nur für dieses Bundesland gelten */
  landesText: string[];
  datenTabelle: DatenTabelle;
}

export type BeliebigerRechnerInhalt = RechnerInhalt | BundeslandRechnerInhalt;

export const istBundeslandInhalt = (c: BeliebigerRechnerInhalt): c is BundeslandRechnerInhalt =>
  'bundesland' in c && (c as BundeslandRechnerInhalt).bundesland !== undefined;

export function rechnerPfad(c: Pick<RechnerInhalt, 'slug' | 'ort'>): string {
  return c.ort.typ === 'blog' ? `/blog/${c.ort.postSlug}` : `/rechner/${c.slug}`;
}

// ---------------------------------------------------------------------------------------------
// Prüfung, läuft beim Import der Registry (also in generateStaticParams, Sitemap und Tests)
// ---------------------------------------------------------------------------------------------

const MIN_LANDES_ABSAETZE = 2;
const MIN_WOERTER_JE_LANDES_ABSATZ = 40;
const MIN_TABELLEN_ZEILEN = 3;

const woerter = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** Ersetzt alle Bundeslandnamen und Kürzel durch einen Platzhalter, um getauschte Ortsnamen zu erkennen */
function ohneOrtsnamen(text: string): string {
  let s = text.toLowerCase();
  const namen = Object.values(BUNDESLAENDER).map(b => b.name.toLowerCase()).sort((a, b) => b.length - a.length);
  for (const n of namen) s = s.split(n).join('§land§');
  return s.replace(/\d+([.,]\d+)?/g, '§zahl§').replace(/\s+/g, ' ').trim();
}

export function pruefeRechnerInhalte(
  inhalte: BeliebigerRechnerInhalt[],
  blogSlugs: string[],
): string[] {
  const fehler: string[] = [];
  const slugs = new Set<string>();
  const titel = new Set<string>();
  const pfade = new Set<string>();
  const alleZiele = new Set([...inhalte.map(c => c.slug), ...blogSlugs]);

  for (const c of inhalte) {
    const f = (msg: string) => fehler.push(`[rechner/${c.slug}] ${msg}`);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(c.slug)) f('slug darf nur a-z, 0-9 und Bindestriche enthalten');
    if (slugs.has(c.slug)) f('slug doppelt');
    slugs.add(c.slug);

    const pfad = rechnerPfad(c);
    if (pfade.has(pfad)) f(`Pfad ${pfad} doppelt`);
    pfade.add(pfad);
    if (c.ort.typ === 'blog' && !blogSlugs.includes(c.ort.postSlug)) f(`Blogbeitrag ${c.ort.postSlug} existiert nicht`);

    if (!c.h1.trim()) f('h1 fehlt');
    if (!c.title.trim()) f('title fehlt');
    if (c.title.length > 65) f(`title ist ${c.title.length} Zeichen lang (max. 65)`);
    if (titel.has(c.title)) f('title doppelt');
    titel.add(c.title);
    if (c.metaDescription.length < 70 || c.metaDescription.length > 160) {
      f(`metaDescription ist ${c.metaDescription.length} Zeichen lang (70–160)`);
    }
    if (c.intro.length < 1 || c.intro.some(p => !p.trim())) f('intro braucht mindestens einen Absatz');
    if (c.faq.length < 3) f('faq braucht mindestens drei Fragen');
    if (c.faq.some(e => !e.frage.trim() || !e.antwort.trim())) f('faq enthält leere Fragen oder Antworten');
    if (!(c.preset.kaufpreis > 0)) f('preset.kaufpreis fehlt');
    if (BUNDESLAENDER[c.presetBundesland]?.satz !== c.preset.grunderwerbsteuerPct) {
      f(`preset.grunderwerbsteuerPct (${c.preset.grunderwerbsteuerPct}) passt nicht zu ${c.presetBundesland}`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(c.lastModified)) f('lastModified muss YYYY-MM-DD sein');

    if (c.relatedSlugs.length !== 3) f('relatedSlugs braucht genau drei Einträge');
    if (new Set(c.relatedSlugs).size !== c.relatedSlugs.length) f('relatedSlugs enthält Duplikate');
    for (const r of c.relatedSlugs) {
      if (r === c.slug || (c.ort.typ === 'blog' && r === c.ort.postSlug)) f(`relatedSlugs verweist auf sich selbst (${r})`);
      else if (!alleZiele.has(r)) f(`relatedSlugs: ${r} ist weder Rechner noch Blogbeitrag`);
    }
    for (const b of c.verlinktVon ?? []) {
      if (!blogSlugs.includes(b)) f(`verlinktVon: Blogbeitrag ${b} existiert nicht`);
    }
    if (c.datenTabelle) {
      const t = c.datenTabelle;
      if (t.zeilen.some(z => z.length !== t.spalten.length)) f('datenTabelle: Zeilen passen nicht zu den Spalten');
    }

    if (istBundeslandInhalt(c)) {
      const land = BUNDESLAENDER[c.bundesland];
      if (!land) {
        f(`unbekanntes Bundesland ${c.bundesland}`);
        continue;
      }
      if (c.presetBundesland !== c.bundesland) f('presetBundesland muss dem Bundesland der Seite entsprechen');
      if (c.landesText.length < MIN_LANDES_ABSAETZE) f(`landesText braucht mindestens ${MIN_LANDES_ABSAETZE} Absätze`);
      c.landesText.forEach((p, i) => {
        if (woerter(p) < MIN_WOERTER_JE_LANDES_ABSATZ) f(`landesText[${i}] hat weniger als ${MIN_WOERTER_JE_LANDES_ABSATZ} Wörter`);
      });
      if (!c.landesText.some(p => p.includes(land.name))) f(`landesText nennt ${land.name} nicht`);
      if (!c.datenTabelle || c.datenTabelle.zeilen.length < MIN_TABELLEN_ZEILEN) {
        f(`datenTabelle braucht mindestens ${MIN_TABELLEN_ZEILEN} Zeilen`);
      }
      // Der Satz kommt aus src/config/grunderwerbsteuer.ts, die Tabelle muss ihn zeigen (kein eigener, abweichender Wert)
      const satz = `${land.satz.toLocaleString('de-DE', { minimumFractionDigits: 1 })} %`;
      if (c.datenTabelle && !c.datenTabelle.zeilen.some(z => z.some(zelle => zelle.includes(satz)))) {
        f(`datenTabelle zeigt den Grunderwerbsteuersatz ${satz} aus der Config nicht`);
      }
    }
  }

  // Bundesland-Seiten dürfen keine Absätze teilen, auch nicht mit getauschtem Ortsnamen oder anderen Zahlen
  const gesehen = new Map<string, string>();
  for (const c of inhalte.filter(istBundeslandInhalt)) {
    for (const p of [...c.landesText, ...c.intro]) {
      const key = ohneOrtsnamen(p);
      const anderer = gesehen.get(key);
      if (anderer && anderer !== c.slug) {
        fehler.push(`[rechner/${c.slug}] Absatz ist bis auf Ortsnamen/Zahlen identisch mit rechner/${anderer}: "${p.slice(0, 60)}…"`);
      } else {
        gesehen.set(key, c.slug);
      }
    }
    const tabelle = JSON.stringify(c.datenTabelle?.zeilen ?? []);
    const andereTabelle = inhalte.filter(istBundeslandInhalt).find(o => o.slug !== c.slug && JSON.stringify(o.datenTabelle?.zeilen ?? []) === tabelle);
    if (andereTabelle) fehler.push(`[rechner/${c.slug}] datenTabelle ist identisch mit rechner/${andereTabelle.slug}`);
  }

  return fehler;
}
