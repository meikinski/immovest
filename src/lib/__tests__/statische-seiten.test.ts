/**
 * Metadaten der statischen Seiten: Impressum, Datenschutz, AGB und 404 haben eigene, eindeutige Titel
 * und erben nicht mehr Titel und Canonical der Startseite. /input-method ist noindex,follow.
 *
 * Ausführen mit `npx tsx src/lib/__tests__/statische-seiten.test.ts`
 * HTTP-Prüfung gegen den gebauten Server: `npm run test:seiten`
 */

import type { Metadata } from 'next';
import { metadata as impressum } from '../../app/impressum/layout';
import { metadata as datenschutz } from '../../app/datenschutz/layout';
import { metadata as agb } from '../../app/agb/layout';
import { metadata as nichtGefunden } from '../../app/not-found';
import { metadata as inputMethod } from '../../app/(static-public)/input-method/layout';
import sitemap from '../../app/sitemap';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAILED: ${message}`);
  }
  console.log(`✓ ${message}`);
}

const titelVon = (m: Metadata): string => {
  const t = m.title;
  if (typeof t === 'string') return t;
  if (t && typeof t === 'object' && 'absolute' in t) return t.absolute as string;
  return '';
};
const canonicalVon = (m: Metadata) => (m.alternates ? m.alternates.canonical : undefined) as string | null | undefined;

// Root-Layout lädt CSS und next/font und ist außerhalb von Next nicht importierbar:
// die bisher geerbten Werte als Konstanten (die HTTP-Prüfung vergleicht gegen das echte HTML)
const startseitenTitel = 'Cashflow Immobilie berechnen — KI-Renditerechner | imvestr';
const root = { description: 'Cashflow, Nettomietrendite, DSCR und Eigenkapitalrendite automatisch berechnen. imvestr analysiert deine Kapitalanlage-Immobilie in Sekunden — kostenlos & für Einsteiger.' };
const seiten: Array<[string, Metadata, string | null]> = [
  ['/impressum', impressum, 'https://imvestr.de/impressum'],
  ['/datenschutz', datenschutz, 'https://imvestr.de/datenschutz'],
  ['/agb', agb, 'https://imvestr.de/agb'],
  // 404 hat keine eigene Adresse: kein Canonical statt des geerbten "/"
  ['404', nichtGefunden, null],
];

const titel = seiten.map(([, m]) => titelVon(m));
for (const [pfad, m, canonical] of seiten) {
  const t = titelVon(m);
  assert(t.length > 0 && t !== startseitenTitel, `${pfad}: eigener Titel ("${t}")`);
  assert(typeof m.description === 'string' && m.description.length >= 70 && m.description.length <= 160, `${pfad}: eigene Beschreibung (70–160 Zeichen)`);
  assert(m.description !== root.description, `${pfad}: Beschreibung ist nicht die der Startseite`);
  if (canonical) {
    assert(canonicalVon(m) === canonical, `${pfad}: Canonical zeigt auf sich selbst (${canonical})`);
    assert((m.openGraph as { url?: string } | undefined)?.url === canonical, `${pfad}: og:url zeigt auf sich selbst`);
  } else {
    assert(canonicalVon(m) === null, `${pfad}: kein Canonical (nicht mehr auf die Startseite)`);
  }
}
assert(new Set([...titel, startseitenTitel]).size === titel.length + 1, 'Die vier Titel sind untereinander und gegenüber der Startseite eindeutig');

// /input-method: noindex, Links folgen
const r = inputMethod.robots as { index?: boolean; follow?: boolean; googleBot?: { index?: boolean; follow?: boolean } };
assert(r.index === false && r.follow === true, '/input-method: robots noindex, follow');
assert(r.googleBot?.index === false && r.googleBot?.follow === true, '/input-method: googleBot noindex, follow (kein widersprüchliches index)');

// Sitemap: Rechtstexte mit echtem Datum, /input-method nicht enthalten
const eintraege = sitemap();
for (const pfad of ['/impressum', '/datenschutz', '/agb']) {
  const e = eintraege.find(x => x.url === `https://imvestr.de${pfad}`);
  assert(!!e && (e.lastModified as Date).toISOString() === '2026-01-16T00:00:00.000Z', `Sitemap: ${pfad} mit Datum des letzten Commits`);
}
assert(!eintraege.some(x => x.url.endsWith('/input-method')), 'Sitemap enthält /input-method nicht (noindex)');

console.log('\nAlle Tests der statischen Seiten bestanden.');
