/**
 * Tests für Rechner-Seiten: Content-Prüfung (inkl. Bundesland-Regeln), Sitemap, robots,
 * eindeutige Titel, JSON-LD und Rechenbeispiel.
 *
 * Ausführen mit `npx tsx src/lib/__tests__/rechner-seiten.test.ts`
 * HTTP-Prüfung gegen den gebauten Server: `npm run test:seiten`
 */

import { alleRechner, rechnerPfad } from '../../content/rechner';
import { pruefeRechnerInhalte, type BundeslandRechnerInhalt, type RechnerInhalt } from '../../content/rechner/typen';
import { getAllPostsSync } from '../blog';
import sitemap from '../../app/sitemap';
import robots from '../../app/robots';
import { berechneSzenario } from '../szenario';
import { cashflowAufstellung, eingabenAusPreset, rechneCashflow } from '../cashflowAufstellung';
import { breadcrumbSchema, faqPageSchema, webApplicationSchema } from '../strukturDaten';
import { BEISPIEL_BASIS } from '../beispiel-report';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAILED: ${message}`);
  }
  console.log(`✓ ${message}`);
}

const posts = getAllPostsSync();
const rechner = alleRechner();

// --- Registry ---------------------------------------------------------------------------------
assert(rechner.length >= 1, 'Mindestens ein Rechner ist registriert');
const cashflow = rechner.find(c => c.slug === 'cashflow-immobilie-berechnen');
assert(!!cashflow, 'Cashflow-Rechner ist registriert');
assert(rechnerPfad(cashflow!) === '/blog/cashflow-immobilie-berechnen', 'Cashflow-Rechner lebt im bestehenden Beitrag (keine zweite URL)');

// --- Sitemap ----------------------------------------------------------------------------------
const eintraege = sitemap();
const urls = eintraege.map(e => e.url);
for (const c of rechner) {
  assert(urls.includes(`https://imvestr.de${rechnerPfad(c)}`), `Sitemap enthält Rechner ${c.slug}`);
}
for (const p of posts) {
  assert(urls.includes(`https://imvestr.de/blog/${p.slug}`), `Sitemap enthält Beitrag ${p.slug}`);
}
for (const pflicht of ['https://imvestr.de', 'https://imvestr.de/pricing']) {
  assert(urls.includes(pflicht), `Sitemap enthält ${pflicht}`);
}
assert(new Set(urls).size === urls.length, 'Sitemap enthält keine doppelten URLs');
assert(eintraege.every(e => e.lastModified instanceof Date && !isNaN(e.lastModified.getTime())), 'Jeder Eintrag hat ein gültiges lastModified');
const heute = new Date().toISOString().slice(0, 10);
const mitUhrzeit = eintraege.filter(e => (e.lastModified as Date).toISOString().slice(11) !== '00:00:00.000Z');
assert(mitUhrzeit.length === 0, 'lastModified ist ein Datum, kein Build-Zeitstempel');
assert(eintraege.every(e => (e.lastModified as Date).toISOString().slice(0, 10) <= heute), 'Kein lastModified liegt in der Zukunft');
const cfEintrag = eintraege.find(e => e.url.endsWith('/blog/cashflow-immobilie-berechnen'))!;
assert((cfEintrag.lastModified as Date).toISOString().slice(0, 10) >= cashflow!.lastModified, 'Beitrag mit Rechner meldet das spätere Datum aus Beitrag und Rechner');

// --- robots -----------------------------------------------------------------------------------
const r = robots();
const regeln = Array.isArray(r.rules) ? r.rules : [r.rules];
const stern = regeln.find(x => x.userAgent === '*')!;
const gesperrt = ([] as string[]).concat(stern.disallow ?? []);
for (const pfad of ['/api/', '/analysen', '/abo', '/profile', '/hilfe', '/dashboard']) {
  assert(gesperrt.includes(pfad), `robots sperrt ${pfad}`);
}
for (const pfad of ['/rechner', '/blog', '/step', '/pricing']) {
  assert(!gesperrt.some(d => pfad.startsWith(d) || d.startsWith(pfad)), `robots sperrt ${pfad} nicht`);
}
assert(regeln.every(x => JSON.stringify(x.disallow) === JSON.stringify(stern.disallow)), 'KI-Crawler haben dieselben Sperren');
assert(r.sitemap === 'https://imvestr.de/sitemap.xml', 'robots verweist auf die Sitemap');

// --- Eindeutige Titel -------------------------------------------------------------------------
// Gleiche Logik wie generateMetadata der Blogseite: Rechner-Titel ersetzt den Beitragstitel
const titel = [
  ...posts.map(p => rechner.find(c => c.ort.typ === 'blog' && c.ort.postSlug === p.slug)?.title ?? `${p.title} | imvestr Blog`),
  ...rechner.filter(c => c.ort.typ === 'rechner').map(c => c.title),
];
assert(new Set(titel).size === titel.length, `Alle ${titel.length} Seitentitel sind eindeutig`);
assert(!titel.includes('Cashflow Immobilie berechnen — KI-Renditerechner | imvestr'), 'Keine Rechner-Seite trägt den Standardtitel der Startseite');

// --- Rechenbeispiel ---------------------------------------------------------------------------
const { basis, ergebnis } = rechneCashflow(cashflow!.preset, eingabenAusPreset(cashflow!.preset));
const direkt = berechneSzenario(cashflow!.preset);
assert(Math.abs(ergebnis.scCashflowAfterTax - direkt.scCashflowAfterTax) < 1e-9, 'Rechner mit Preset = berechneSzenario (keine eigene Formel)');
assert(cashflow!.preset === BEISPIEL_BASIS, 'Preset ist die Beispielwohnung der Startseite');
const zeilen = cashflowAufstellung(basis, ergebnis);
const summe = (keys: string[]) => zeilen.filter(z => keys.includes(z.key)).reduce((s, z) => s + z.betrag, 0);
const vorSt = zeilen.find(z => z.key === 'vorSteuern')!.betrag;
const nachSt = zeilen.find(z => z.key === 'nachSteuern')!.betrag;
assert(Math.abs(summe(['miete', 'umlage', 'hausgeld', 'kalk', 'zins', 'tilgung']) - vorSt) < 0.01, 'Aufstellung: Posten ergeben den Cashflow vor Steuern');
assert(Math.abs(vorSt + summe(['steuer']) - nachSt) < 0.01, 'Aufstellung: Cashflow vor Steuern + Steuereffekt = nach Steuern');
assert(Math.round(nachSt) === 227, 'Beispiel ergibt 227 € nach Steuern (wie Startseite und Beispielreport)');
const teurer = rechneCashflow(cashflow!.preset, { ...eingabenAusPreset(cashflow!.preset), kaufpreis: 200000 });
assert(Math.abs(teurer.ergebnis.scKaufpreis - 200000) < 1e-6, 'Kaufpreis-Eingabe kommt im Ergebnis an');
assert(teurer.ergebnis.scCashflowAfterTax < nachSt, 'Höherer Kaufpreis senkt den Cashflow');

// --- JSON-LD ----------------------------------------------------------------------------------
const app = webApplicationSchema({ name: cashflow!.h1, beschreibung: cashflow!.metaDescription, pfad: rechnerPfad(cashflow!) });
assert(app['@type'] === 'WebApplication' && app.url === 'https://imvestr.de/blog/cashflow-immobilie-berechnen', 'WebApplication mit absoluter URL');
const faq = faqPageSchema(cashflow!.faq);
assert(Array.isArray(faq.mainEntity) && faq.mainEntity.length === cashflow!.faq.length, 'FAQPage enthält alle Fragen');
const bc = breadcrumbSchema([{ name: 'Startseite', pfad: '/' }, { name: 'Blog', pfad: '/blog' }, { name: 'X', pfad: '/blog/x' }]);
const items = bc.itemListElement as unknown as Array<{ position: number; item: string }>;
assert(items.map(i => i.position).join(',') === '1,2,3' && items[0].item === 'https://imvestr.de', 'BreadcrumbList mit Positionen und absoluten URLs');

// --- Content-Prüfung: Bundesland-Seiten -------------------------------------------------------
const slugs = posts.map(p => p.slug);
const basisInhalt: RechnerInhalt = { ...cashflow!, ort: { typ: 'rechner' } } as RechnerInhalt;
const absatz = (land: string, thema: string) =>
  `In ${land} gilt für ${thema} eine eigene Regel, die Käufer kennen sollten, bevor sie den Kaufvertrag unterschreiben. ` +
  `Das betrifft vor allem die Höhe der Nebenkosten, den Zeitpunkt der Zahlung und die Frage, welche Behörde zuständig ist. ` +
  `Wer früh plant, vermeidet Überraschungen bei der Finanzierung.`;

const sachsen: BundeslandRechnerInhalt = {
  ...basisInhalt,
  slug: 'kaufnebenkosten-sachsen',
  title: 'Kaufnebenkosten Sachsen | imvestr',
  bundesland: 'SN',
  presetBundesland: 'SN',
  landesText: [absatz('Sachsen', 'die Grunderwerbsteuer'), absatz('Sachsen', 'das Grundbuchamt in Leipzig')],
  datenTabelle: { titel: 'Sachsen', spalten: ['Posten', 'Satz'], zeilen: [['Grunderwerbsteuer', '5,5 %'], ['Notar', 'a'], ['Grundbuch', 'b']] },
};
assert(pruefeRechnerInhalte([sachsen], slugs).length === 0, 'Vollständige Bundesland-Seite besteht die Prüfung');

const ohneText = { ...sachsen, landesText: [absatz('Sachsen', 'X')] };
assert(pruefeRechnerInhalte([ohneText], slugs).some(f => f.includes('mindestens 2 Absätze')), 'Bundesland-Seite mit nur einem Absatz scheitert');

const ohneTabelle = { ...sachsen, datenTabelle: { titel: 't', spalten: ['a', 'b'], zeilen: [['Grunderwerbsteuer', '5,5 %']] } };
assert(pruefeRechnerInhalte([ohneTabelle], slugs).some(f => f.includes('datenTabelle braucht')), 'Bundesland-Seite ohne eigene Tabelle scheitert');

const falscherSatz = { ...sachsen, datenTabelle: { ...sachsen.datenTabelle, zeilen: [['Grunderwerbsteuer', '3,5 %'], ['a', 'b'], ['c', 'd']] } };
assert(pruefeRechnerInhalte([falscherSatz], slugs).some(f => f.includes('Grunderwerbsteuersatz')), 'Tabelle mit abweichendem Steuersatz scheitert');

const bayernKopie: BundeslandRechnerInhalt = {
  ...sachsen,
  slug: 'kaufnebenkosten-bayern',
  title: 'Kaufnebenkosten Bayern | imvestr',
  bundesland: 'BY',
  presetBundesland: 'BY',
  preset: { ...sachsen.preset, grunderwerbsteuerPct: 3.5 },
  landesText: sachsen.landesText.map(p => p.replaceAll('Sachsen', 'Bayern')),
  datenTabelle: { titel: 'Bayern', spalten: ['Posten', 'Satz'], zeilen: [['Grunderwerbsteuer', '3,5 %'], ['Notar', 'c'], ['Grundbuch', 'd']] },
};
assert(
  pruefeRechnerInhalte([sachsen, bayernKopie], slugs).some(f => f.includes('bis auf Ortsnamen')),
  'Zwei Bundesland-Seiten mit getauschtem Ortsnamen scheitern (Doorway-Schutz)',
);

const doppelterTitel = { ...bayernKopie, title: sachsen.title, landesText: [absatz('Bayern', 'Y').replace('eigene', 'besondere'), absatz('Bayern', 'Z').replace('Regel', 'Vorgabe')] };
assert(pruefeRechnerInhalte([sachsen, doppelterTitel], slugs).some(f => f.includes('title doppelt')), 'Doppelte Titel scheitern');

const kaputterLink = { ...sachsen, relatedSlugs: ['gibt-es-nicht', 'dscr-immobilien', 'afa-immobilien-steuervorteil'] };
assert(pruefeRechnerInhalte([kaputterLink], slugs).some(f => f.includes('weder Rechner noch Blogbeitrag')), 'Verwandter Link ins Leere scheitert');

console.log('\nAlle Rechner-Tests bestanden.');
