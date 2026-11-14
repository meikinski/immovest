/**
 * Bildschirmfotos von /sign-up und /sign-in auf dem Handy (für PRs).
 * Läuft gegen E2E_BASE_URL (Server mit den Clerk-Variablen aus e2e/server.ts) oder startet selbst einen.
 * Ausgabe: docs/pr-screenshots/
 */
import path from 'node:path';
import { chromium, devices } from 'playwright';
import { erzeugeSchluessel, findeClerkPakete, installiereClerkMock } from './clerkMock';
import { starteServer } from './server';

const ZIEL = path.join(__dirname, '..', 'docs', 'pr-screenshots');

async function main() {
  const { publicPem, privateKey } = erzeugeSchluessel();
  const server = await starteServer(publicPem);
  const browser = await chromium.launch(process.env.E2E_CHROMIUM_PATH ? { executablePath: process.env.E2E_CHROMIUM_PATH } : {});
  try {
    const faelle: Array<{ datei: string; pfad: string; wohnung?: boolean }> = [
      { datei: 'auth-sign-up-mobil.png', pfad: '/sign-up?source=header' },
      { datei: 'auth-sign-up-mit-wohnung-mobil.png', pfad: '/sign-up?source=locked_preview&redirect_url=%2Fstep%2Ftabs', wohnung: true },
      { datei: 'auth-sign-in-mobil.png', pfad: '/sign-in' },
    ];
    for (const fall of faelle) {
      const ctx = await browser.newContext({ ...devices['iPhone 13'], locale: 'de-DE' });
      ctx.setDefaultNavigationTimeout(180_000);
      await installiereClerkMock(ctx, findeClerkPakete(), privateKey);
      if (fall.wohnung) {
        await ctx.addInitScript(() => {
          const daten = { kaufpreis: 250000, adresse: 'Teststraße 12, 10115 Berlin', zimmer: 2, objekttyp: 'wohnung' };
          localStorage.setItem('anmelde_rueckkehr_analyse', JSON.stringify({ zeit: Date.now(), bereich: 'markt', adresse: daten.adresse, daten }));
        });
      }
      const page = await ctx.newPage();
      await page.goto(`${server.baseUrl}${fall.pfad}`, { waitUntil: 'domcontentloaded' });
      await page.locator('.cl-formButtonPrimary').first().waitFor({ timeout: 120_000 });
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(ZIEL, fall.datei) });
      console.log(`✓ ${fall.datei}`);
      await ctx.close();
    }
  } finally {
    await browser.close();
    server.stop();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
