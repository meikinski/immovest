/**
 * Ende-zu-Ende: Gast importiert eine Wohnung → Ergebnis → Anmeldung über die Kopfzeile → Wohnung ist noch da.
 *
 * Ausführen: `npm run e2e:setup` (einmalig, lädt clerk-js und @clerk/ui), dann `npm run e2e`.
 * Clerk, der Import und die KI-Endpunkte sind simuliert (siehe e2e/clerkMock.ts); keine Konten, keine Kosten.
 */
import assert from 'node:assert/strict';
import { chromium, type BrowserContext, type Page } from 'playwright';
import { erzeugeSchluessel, findeClerkPakete, installiereClerkMock, TEST_USER } from './clerkMock';
import { starteServer } from './server';

const WOHNUNG = {
  adresse: 'Teststraße 12, 10115 Berlin',
  kaufpreis: 250000,
  flaeche: 62,
  zimmer: 2,
  baujahr: 1995,
  miete: 950,
  hausgeld: 260,
  objekttyp: 'wohnung',
};

/** Externe Dienste (Inserat-Import, KI, Datenbank) im Browser beantworten */
async function simuliereApis(ctx: BrowserContext) {
  await ctx.route('**/api/scrape-with-agent', (r) => r.fulfill({
    json: { success: true, data: WOHNUNG, fehlend: [], hinweise: [], warnings: [] },
  }));
  await ctx.route('**/api/generateComment', (r) => r.fulfill({ json: { comment: 'Test-Einschätzung' } }));
  await ctx.route('**/api/premium/status', (r) => r.fulfill({ json: { isPremium: false, usageCount: 0, premiumUntil: null } }));
  await ctx.route('**/api/analysis', (r) => r.fulfill({
    json: r.request().method() === 'POST' ? { success: true, analysisId: 'analysis_e2e', dbId: 'db_e2e' } : { analyses: [] },
  }));
  for (const pfad of ['geocode', 'lageProfile', 'locationProfile', 'invest', 'price/rent', 'price/purchase', 'agent/run']) {
    await ctx.route(`**/api/${pfad}**`, (r) => r.fulfill({ status: 503, json: { error: 'im Test nicht verfügbar' } }));
  }
}

async function importiereAlsGast(page: Page, baseUrl: string) {
  await page.goto(`${baseUrl}/input-method`, { waitUntil: 'domcontentloaded' });
  // Vor der Hydrierung getippter Text geht verloren: so lange füllen, bis der Knopf aktiv ist
  const knopf = page.getByRole('button', { name: 'Mit KI analysieren' });
  for (let versuch = 0; versuch < 20 && !(await knopf.isEnabled()); versuch++) {
    await page.getByLabel('Inserat-URL').fill('https://www.immobilienscout24.de/expose/123456789');
    await page.waitForTimeout(500);
  }
  await knopf.click();
  await page.waitForURL('**/step/a');
  for (const ziel of ['a2', 'b', 'c']) {
    await page.getByRole('button', { name: 'Weiter', exact: true }).click();
    await page.waitForURL(`**/step/${ziel}`);
  }
  await page.getByRole('button', { name: 'Investment analysieren' }).click();
  await page.waitForURL('**/step/tabs');
  await pruefeWohnungImErgebnis(page, 'Gast-Ergebnis');
}

async function pruefeWohnungImErgebnis(page: Page, wann: string) {
  assert.match(page.url(), /\/step\/tabs$/, `${wann}: Ergebnis-Seite erwartet, war ${page.url()}`);
  await page.locator('text=Teststraße 12 >> visible=true').first().waitFor({ timeout: 60_000 });
  await page.locator('text=250.000 € >> visible=true').first().waitFor({ timeout: 10_000 });
  console.log(`✓ ${wann}: Wohnung ist da (${page.url()})`);
}

async function meldeAn(page: Page) {
  await page.waitForURL('**/sign-in**');
  await page.getByLabel('E-Mail-Adresse').fill(TEST_USER.email);
  await page.getByLabel('Passwort', { exact: true }).fill(TEST_USER.password);
  await page.getByRole('button', { name: 'Weiter', exact: true }).click();
}

async function fall(name: string, ablauf: (page: Page, ctx: BrowserContext) => Promise<void>, umgebung: Awaited<ReturnType<typeof bereite>>) {
  const ctx = await umgebung.browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'de-DE' });
  // next dev übersetzt Seiten beim ersten Aufruf, das dauert
  ctx.setDefaultTimeout(60_000);
  ctx.setDefaultNavigationTimeout(180_000);
  const clerk = await installiereClerkMock(ctx, umgebung.pakete, umgebung.privateKey);
  await simuliereApis(ctx);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error(`  [Seitenfehler] ${e.message}`));
  try {
    await ablauf(page, ctx);
    assert.ok(clerk.istAngemeldet(), `${name}: angemeldet`);
    console.log(`✓ ${name}`);
  } catch (e) {
    await page.screenshot({ path: `e2e-fehler-${name.replace(/\W+/g, '-')}.png`, fullPage: true }).catch(() => {});
    throw e;
  } finally {
    await ctx.close();
  }
}

async function bereite() {
  const { publicPem, privateKey } = erzeugeSchluessel();
  const pakete = findeClerkPakete();
  const server = await starteServer(publicPem);
  // Vorinstallierter Browser (z. B. in CI-Containern) über E2E_CHROMIUM_PATH, sonst der von Playwright
  const browser = await chromium.launch(process.env.E2E_CHROMIUM_PATH ? { executablePath: process.env.E2E_CHROMIUM_PATH } : {});
  return { privateKey, pakete, server, browser };
}

async function main() {
  const umgebung = await bereite();
  const { baseUrl } = umgebung.server;
  try {
    // Anmeldung über „Anmelden" in der Kopfzeile der Ergebnis-Seite
    await fall('Kopfzeile auf dem Ergebnis', async (page) => {
      await importiereAlsGast(page, baseUrl);
      await page.locator('header').getByRole('link', { name: 'Anmelden', exact: true }).click();
      await meldeAn(page);
      await page.waitForURL('**/step/tabs', { timeout: 90_000 });
      await page.getByRole('button', { name: /Konto|Menü/ }).first().waitFor({ timeout: 60_000 }).catch(() => {});
      await pruefeWohnungImErgebnis(page, 'Nach Anmeldung über die Kopfzeile');
    }, umgebung);

    // Anmeldung über „Anmelden" auf einer anderen Seite (ohne Rücksprung): trotzdem zurück zur Wohnung
    await fall('Kopfzeile ohne Rücksprung', async (page) => {
      await importiereAlsGast(page, baseUrl);
      await page.goto(`${baseUrl}/pricing`, { waitUntil: 'domcontentloaded' });
      await page.locator('header').getByRole('link', { name: 'Anmelden', exact: true }).click();
      await meldeAn(page);
      await page.waitForURL('**/step/tabs', { timeout: 90_000 });
      await pruefeWohnungImErgebnis(page, 'Nach Anmeldung von /pricing');
    }, umgebung);

    // Clerk leitet auf /input-method (setzt die Eingaben zurück): Wächter holt die Wohnung trotzdem zurück
    await fall('Rücksprung auf /input-method', async (page) => {
      await importiereAlsGast(page, baseUrl);
      await page.goto(`${baseUrl}/sign-in?redirect_url=%2Finput-method`, { waitUntil: 'domcontentloaded' });
      await meldeAn(page);
      await page.waitForURL('**/step/tabs', { timeout: 90_000 });
      await pruefeWohnungImErgebnis(page, 'Nach Anmeldung mit Ziel /input-method');
    }, umgebung);

    console.log('\nAlle Ende-zu-Ende-Fälle bestanden.');
  } finally {
    await umgebung.browser.close();
    umgebung.server.stop();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
