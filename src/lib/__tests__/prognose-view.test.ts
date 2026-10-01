/**
 * Manuelle Tests für die Prognose-Ansicht (Jahresend-Werte, Verkauf, Meilensteine)
 *
 * Ausführen mit `npx tsx src/lib/__tests__/prognose-view.test.ts`
 */

import { berechnePrognose } from '../prognose-calculator';
import { baueMeilensteine, baueVerlauf, SPEKULATIONSFRIST_JAHRE } from '../prognose-view';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAILED: ${message}`);
  }
  console.log(`✓ ${message}`);
}

const near = (a: number, b: number, tol = 0.01) => Math.abs(a - b) <= tol;

const input = {
  startJahr: 2026,
  darlehensSumme: 95000,
  ek: 20000,
  zins: 3.5,
  tilgung: 2,
  warmmiete: 1000,
  hausgeld: 250,
  kalkKostenMonthly: 60,
  afaJaehrlich: 1600,
  steuersatz: 35,
  immobilienwert: 100000,
  wertsteigerungPct: 1.5,
  darlehensTyp: 'annuitaet' as const,
  mietInflationPct: 1.5,
  kostenInflationPct: 2,
  verkaufsNebenkostenPct: 6,
};
const jahre = berechnePrognose(input, 30).jahre;
const verlauf = baueVerlauf(jahre, {
  ek: 20000,
  kaufpreis: 100000,
  anschaffungskosten: 112000,
  steuersatzPct: 35,
  verkaufsNebenkostenPct: 6,
});

assert(verlauf.length === 30, '30 Jahresend-Werte aus 31 Prognose-Einträgen');
assert(verlauf[0].jahr === 2026 && verlauf[0].haltedauer === 1, 'Erstes Jahr ist das Kaufjahr mit 1 Jahr Haltedauer');
assert(verlauf[0].restschuld === jahre[1].restschuld, 'Restschuld am Jahresende = Restschuld zu Beginn des Folgejahres');
assert(verlauf[0].restschuld < input.darlehensSumme, 'Restschuld sinkt im ersten Jahr');
assert(verlauf[4].konto === jahre[4].cashflowKumuliert, 'Konto enthält genau die Überschüsse bis Jahresende');

for (const j of verlauf) {
  if (!near(j.vermoegen, j.immobilienwert - j.restschuld + j.konto)) throw new Error(`Vermögen ${j.jahr}`);
  if (!near(j.steuer, j.zuVersteuern * 0.35, 0.5)) throw new Error(`Steuer ${j.jahr}`);
  const monat = j.mieteMonatlich - j.hausgeldMonatlich - j.kalkKostenMonatlich - j.rateMonatlich - j.steuerMonatlich;
  if (!near(monat, j.cashflowMonatlich, 0.01)) throw new Error(`Monatsrechnung ${j.jahr}: ${monat} vs ${j.cashflowMonatlich}`);
  const erloes = j.immobilienwert - j.verkaufskosten - j.restschuld + j.konto - j.spekulationssteuer;
  if (!near(erloes, j.verkaufErloes)) throw new Error(`Verkaufsrechnung ${j.jahr}`);
}
assert(true, 'Vermögen, Steuer, Monats- und Verkaufsrechnung gehen in jedem Jahr auf');

assert(verlauf[SPEKULATIONSFRIST_JAHRE - 1].spekulationssteuer >= 0, 'Steuer auf Verkaufsgewinn innerhalb der Frist möglich');
assert(verlauf[SPEKULATIONSFRIST_JAHRE].spekulationssteuer === 0, 'Nach 10 Jahren ist der Verkauf steuerfrei');
assert(near(verlauf[0].ersparnisAfa, 1600 * 0.35), 'AfA-Ersparnis = AfA × Steuersatz');

const meilensteine = baueMeilensteine(verlauf, { ek: 20000, darlehensSumme: 95000 });
const keys = meilensteine.map(m => m.key);
assert(keys.includes('steuerfrei') && meilensteine.find(m => m.key === 'steuerfrei')!.jahr === 2036, 'Meilenstein "Verkauf steuerfrei" liegt 2036');
assert(meilensteine.every((m, i) => i === 0 || meilensteine[i - 1].jahr <= m.jahr), 'Meilensteine sind nach Jahr sortiert');
const halb = meilensteine.find(m => m.key === 'haelfte');
assert(!!halb && verlauf.find(j => j.jahr === halb.jahr)!.restschuld <= 47500, 'Hälfte abbezahlt stimmt mit Restschuld überein');

const ohneKredit = baueMeilensteine(verlauf, { ek: 20000, darlehensSumme: 0 });
assert(!ohneKredit.some(m => m.key === 'schuldenfrei' || m.key === 'haelfte'), 'Ohne Kredit keine Kredit-Meilensteine');

console.log('\nAlle Prognose-Ansicht-Tests bestanden.');
