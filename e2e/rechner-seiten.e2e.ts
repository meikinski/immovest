/**
 * HTTP-Prüfung der öffentlichen Seiten gegen den gebauten Server (ohne JavaScript, wie ein Crawler):
 * - jede URL aus der Sitemap antwortet mit 200, hat eine H1, einen eindeutigen Titel, einen absoluten
 *   Self-Canonical und kein noindex
 * - jede Rechner-Seite hat ihre H1, die Zahlen des Rechenbeispiels und WebApplication/FAQPage/BreadcrumbList im HTML
 * - die Sitemap enthält jeden Rechner
 *
 * Voraussetzung: `npm run build`. Dann `npm run test:seiten` (startet `next start` selbst auf Port 3210,
 * oder nutzt SEITEN_BASIS_URL, falls gesetzt).
 */

import { spawn, type ChildProcess } from 'node:child_process';
import * as cheerio from 'cheerio';
import { alleRechner, rechnerPfad } from '../src/content/rechner';
import { cashflowAufstellung, eingabenAusPreset, formatEuro, rechneCashflow } from '../src/lib/cashflowAufstellung';

const PORT = 3210;
let basis = process.env.SEITEN_BASIS_URL ?? `http://localhost:${PORT}`;
const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAILED: ${message}`);
  console.log(`✓ ${message}`);
}

async function warteAufServer(url: string) {
  for (let i = 0; i < 60; i++) {
    try {
      await fetch(url);
      return;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  throw new Error(`Server unter ${url} antwortet nicht`);
}

async function lade(pfad: string) {
  const res = await fetch(`${basis}${pfad}`, { redirect: 'manual', headers: { 'user-agent': GOOGLEBOT } });
  return { status: res.status, html: await res.text() };
}

async function main() {
  let server: ChildProcess | null = null;
  if (!process.env.SEITEN_BASIS_URL) {
    server = spawn('npx', ['next', 'start', '-p', String(PORT)], { stdio: 'ignore', env: process.env, detached: true });
    basis = `http://localhost:${PORT}`;
  }
  try {
    await warteAufServer(basis);

    // Sitemap
    const sm = await lade('/sitemap.xml');
    assert(sm.status === 200, 'sitemap.xml antwortet mit 200');
    const locs = [...sm.html.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
    const rechner = alleRechner();
    for (const c of rechner) {
      assert(locs.includes(`https://imvestr.de${rechnerPfad(c)}`), `Sitemap enthält ${rechnerPfad(c)}`);
    }
    assert(!/<lastmod>[^<]*T(?!00:00:00\.000Z)/.test(sm.html), 'Sitemap enthält keine Build-Zeitstempel');

    // robots.txt
    const rb = await lade('/robots.txt');
    assert(rb.status === 200 && rb.html.includes('Disallow: /api/') && !rb.html.includes('Disallow: /rechner'), 'robots.txt sperrt /api/, nicht die Rechner');

    // Jede Seite der Sitemap
    const titel = new Map<string, string>();
    for (const loc of locs) {
      const pfad = new URL(loc).pathname;
      const { status, html } = await lade(pfad);
      assert(status === 200, `${pfad} antwortet mit 200`);
      const $ = cheerio.load(html);
      assert($('h1').length === 1 && $('h1').text().trim().length > 0, `${pfad} hat genau eine H1 im HTML`);
      const t = $('title').text();
      assert(!titel.has(t), `${pfad} hat einen eindeutigen Titel ("${t}")`);
      titel.set(t, pfad);
      const canonical = $('link[rel=canonical]').attr('href');
      assert(canonical === loc, `${pfad} hat den Self-Canonical ${loc}`);
      assert(!($('meta[name=robots]').attr('content') ?? '').includes('noindex'), `${pfad} ist nicht noindex`);
    }

    // Rechtstexte: eigener Titel und Self-Canonical (in der Schleife oben über die Sitemap geprüft)
    for (const pfad of ['/impressum', '/datenschutz', '/agb']) {
      assert(locs.includes(`https://imvestr.de${pfad}`), `${pfad} steht in der Sitemap und wurde oben geprüft`);
    }

    // 404: eigener, eindeutiger Titel, kein Canonical (bisher geerbt: Startseite)
    {
      const { status, html } = await lade('/gibt-es-nicht-404-test');
      const $ = cheerio.load(html);
      const t = $('title').text();
      assert(status === 404, '404-Seite antwortet mit 404');
      assert(t === 'Seite nicht gefunden (404) | imvestr' && !titel.has(t), `404 hat einen eigenen, eindeutigen Titel ("${t}")`);
      assert($('link[rel=canonical]').length === 0, '404 hat keinen Canonical mehr (bisher: Startseite)');
      assert(($('meta[name=robots]').attr('content') ?? '').includes('noindex'), '404 ist noindex');
    }

    // /input-method: noindex, follow, nicht in der Sitemap
    {
      const { status, html } = await lade('/input-method');
      const $ = cheerio.load(html);
      assert(status === 200, '/input-method antwortet mit 200');
      assert($('meta[name=robots]').attr('content') === 'noindex, follow', '/input-method ist noindex, follow');
      const gb = $('meta[name=googlebot]').attr('content');
      assert(gb === undefined || gb === 'noindex, follow', '/input-method: googlebot-Meta widerspricht nicht');
      assert(!locs.some(l => l.endsWith('/input-method')), '/input-method steht nicht in der Sitemap');
    }

    // Rechner-Seiten im Detail
    for (const c of rechner) {
      const pfad = rechnerPfad(c);
      const { html } = await lade(pfad);
      const $ = cheerio.load(html);
      assert($('h1').text().trim() === c.h1, `${pfad}: H1 aus der Content-Datei steht im HTML`);
      assert($('title').text() === c.title, `${pfad}: Titel aus der Content-Datei`);
      assert($('meta[name=description]').attr('content') === c.metaDescription, `${pfad}: Description aus der Content-Datei`);
      assert($('meta[property="og:title"]').length === 1 && $('meta[name="twitter:card"]').length === 1, `${pfad}: Open Graph und Twitter gesetzt`);

      const typen = $('script[type="application/ld+json"]')
        .map((_, el) => JSON.parse($(el).text())['@type'] as string)
        .get();
      for (const typ of ['WebApplication', 'FAQPage', 'BreadcrumbList']) {
        assert(typen.includes(typ), `${pfad}: JSON-LD ${typ} vorhanden`);
      }
      assert(typen.filter(x => x === 'FAQPage').length === 1, `${pfad}: genau eine FAQPage`);

      if (c.art === 'cashflow') {
        const { basis: b, ergebnis } = rechneCashflow(c.preset, eingabenAusPreset(c.preset));
        const text = $('body').text();
        const nachSteuern = formatEuro(ergebnis.scCashflowAfterTax);
        assert($('[data-testid=cashflow-nach-steuern]').text().includes(nachSteuern), `${pfad}: Rechner zeigt ${nachSteuern} schon im Server-HTML`);
        const tabelle = $('[data-testid=cashflow-aufstellung]').text();
        for (const z of cashflowAufstellung(b, ergebnis)) {
          assert(tabelle.includes(z.label), `${pfad}: Aufstellung enthält "${z.label}"`);
        }
        assert(text.includes(formatEuro(ergebnis.scAnschaffung)), `${pfad}: Gesamtinvestition ${formatEuro(ergebnis.scAnschaffung)} im HTML`);
        assert($('a[href="/input-method"]').length > 0, `${pfad}: CTA zur vollständigen Analyse`);
      }
      assert($('nav[aria-labelledby=weitere-rechner] a').length === 3, `${pfad}: drei verwandte Links`);
    }

    // Eingebettete Rechner haben keine zweite URL
    for (const c of rechner.filter(r => r.ort.typ === 'blog')) {
      const { status } = await lade(`/rechner/${c.slug}`);
      assert(status === 404, `/rechner/${c.slug} existiert nicht (Rechner lebt unter ${rechnerPfad(c)})`);
    }

    console.log('\nAlle Seiten-Prüfungen bestanden.');
  } finally {
    if (server?.pid) process.kill(-server.pid);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
