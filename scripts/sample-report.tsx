/**
 * Erzeugt den Beispielreport für die Startseite neu.
 *
 *   npm run sample-report
 *
 * - public/beispielreport/imvestr-beispielreport.pdf   (vollständiges PDF, mit dem echten Report-Generator)
 * - public/beispielreport/seite-1.webp, seite-2.webp   (Vorschaubilder für die Sektion „Report für das Bankgespräch“)
 *
 * Für die Vorschaubilder wird `pdftoppm` (poppler-utils) gebraucht:
 *   macOS: brew install poppler · Debian/Ubuntu: apt-get install poppler-utils
 */

import React from 'react';
import { execFileSync } from 'child_process';
import { mkdirSync, mkdtempSync, rmSync, statSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import sharp from 'sharp';
import { renderToFile } from '@react-pdf/renderer';
import { InvestmentReportPDF } from '../src/components/pdf/InvestmentReportPDF';
import { baueBeispielReport, BEISPIEL_BASIS } from '../src/lib/beispiel-report';
import { berechneSzenario, STRESSTESTS } from '../src/lib/szenario';

const OUT_DIR = join(process.cwd(), 'public', 'beispielreport');
const PDF_PATH = join(OUT_DIR, 'imvestr-beispielreport.pdf');
const SEITEN = [1, 2];
// Angezeigt werden die Seiten mit ca. 150–190 px Breite, das reicht auch für 2x-Displays
const BILD_BREITE = 400;
const WEBP_QUALITAET = 72;

const fmt = (n: number, d = 0) => n.toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });

async function main() {
  const d = baueBeispielReport();

  // Die Zahlen müssen zu denen auf der Startseite passen (src/app/(static-public)/page.tsx).
  // Ändert sich die Rechnung, schlägt das hier fehl, statt still abweichende Bilder zu erzeugen.
  const st = d.stresstest!;
  // Karte „Stresstests“ zeigt das Szenario „Alles schlecht“
  const worst = berechneSzenario(BEISPIEL_BASIS, STRESSTESTS.find(t => t.id === 'worst')!.deltas);
  const erwartet: Array<[string, string, string]> = [
    ['Cashflow nach Steuern', fmt(d.monat.cfNachSteuer), '227'],
    ['Nettorendite', fmt(d.kpis.netto, 1), '9,5'],
    ['DSCR', fmt(d.kpis.dscr, 2), '2,06'],
    ['Kaufpreis pro m²', fmt(BEISPIEL_BASIS.kaufpreis / BEISPIEL_BASIS.flaeche), '2.083'],
    ['Kaufpreis vs. Markt', fmt(Math.round(d.markt!.kauf!.delta!)), '-28'],
    ['Kaltmiete vs. Markt', fmt(Math.round(d.markt!.miete!.delta!)), '111'],
    ['Cashflow bei Zins +2 %', fmt(st.cfSzenario), '138'],
    ['Zinssatz bis', fmt(st.puffer.zinsBis!, 1), '8,6'],
    ['Kaltmiete bis', fmt(st.puffer.mieteBis!), '555'],
    ['Leerstand bis', fmt(st.puffer.leerstandMonate!, 1), '4,2'],
    ['Cashflow „Alles schlecht“', fmt(worst.scCashflowAfterTax), '84'],
    ['DSCR „Alles schlecht“', fmt(worst.scDSCR, 2), '1,35'],
  ];
  const abweichend = erwartet.filter(([, ist, soll]) => ist !== soll);
  if (abweichend.length > 0) {
    console.error('Beispielreport passt nicht mehr zur Startseite:');
    for (const [k, ist, soll] of abweichend) console.error(`  ${k}: Report ${ist}, Startseite ${soll}`);
    console.error('Bitte die Werte auf der Startseite anpassen oder die Rechnung prüfen.');
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  await renderToFile(React.createElement(InvestmentReportPDF, { data: d }) as never, PDF_PATH);
  console.log(`✓ PDF: ${PDF_PATH} (${Math.round(statSync(PDF_PATH).size / 1024)} KB)`);

  const tmp = mkdtempSync(join(tmpdir(), 'beispielreport-'));
  try {
    for (const seite of SEITEN) {
      const prefix = join(tmp, `seite-${seite}`);
      try {
        // Doppelte Zielbreite rastern, dann mit sharp sauber herunterskalieren
        execFileSync('pdftoppm', ['-f', String(seite), '-l', String(seite), '-png', '-singlefile', '-scale-to-x', String(BILD_BREITE * 2), '-scale-to-y', '-1', PDF_PATH, prefix]);
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
          console.error('pdftoppm nicht gefunden. Bitte poppler installieren (macOS: brew install poppler, Debian/Ubuntu: apt-get install poppler-utils).');
          process.exit(1);
        }
        throw e;
      }
      const ziel = join(OUT_DIR, `seite-${seite}.webp`);
      await sharp(`${prefix}.png`).resize({ width: BILD_BREITE }).webp({ quality: WEBP_QUALITAET, effort: 6 }).toFile(ziel);
      console.log(`✓ Seite ${seite}: ${ziel} (${Math.round(statSync(ziel).size / 1024)} KB)`);
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
