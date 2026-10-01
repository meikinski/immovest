/**
 * Manuelle Tests für Szenarien, Stresstests und Puffer
 *
 * Ausführen mit `npx tsx src/lib/__tests__/szenario.test.ts`
 */

import { berechnePrognose } from '../prognose-calculator';
import {
  berechnePuffer, berechneSzenario, hatAenderung, istGleich, KEINE_DELTAS, STRESSTESTS, type SzenarioBasis,
} from '../szenario';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAILED: ${message}`);
  }
  console.log(`✓ ${message}`);
}
const near = (a: number, b: number, tol = 0.01) => Math.abs(a - b) <= tol;

const basis: SzenarioBasis = {
  kaufpreis: 100000,
  miete: 960,
  ek: 20000,
  zins: 3.5,
  tilgung: 2,
  grunderwerbsteuerPct: 5.5,
  notarPct: 2,
  maklerPct: 3.57,
  sonstigeKosten: 1000,
  hausgeld: 180,
  hausgeldUmlegbar: 150,
  instandhaltungProQmJahr: 10,
  instandKalkProQmJahr: 10,
  mietausfallPct: 2,
  flaeche: 48,
  afaJaehrlich: 1600,
  steuersatzPct: 42,
  darlehensTyp: 'annuitaet',
  grundstueckswert: 20000,
};

const heute = berechneSzenario(basis, KEINE_DELTAS);
const j0 = berechnePrognose({
  startJahr: new Date().getFullYear(),
  darlehensSumme: heute.scDarlehen,
  ek: basis.ek,
  zins: basis.zins,
  tilgung: basis.tilgung,
  warmmiete: basis.miete + basis.hausgeldUmlegbar,
  hausgeld: basis.hausgeld,
  kalkKostenMonthly: (basis.instandKalkProQmJahr * basis.flaeche) / 12 + basis.miete * (basis.mietausfallPct / 100),
  afaJaehrlich: basis.afaJaehrlich,
  steuersatz: basis.steuersatzPct,
  darlehensTyp: 'annuitaet',
}, 1).jahre[0];

assert(near(heute.scCashflowAfterTax, j0.cashflowMonatlich), 'Basis ohne Änderung = Prognose im ersten Jahr (Cashflow nach Steuern)');
assert(near(heute.scCashflowVorSt, j0.cashflowVorSteuern), 'Basis ohne Änderung = Prognose (Cashflow vor Steuern)');
assert(near(heute.scRateMonat, heute.scDarlehen * 0.055 / 12), 'Kreditrate = Darlehen × (Zins + Tilgung) / 12');
assert(near(heute.scNoiMonthly - heute.scRateMonat, heute.scCashflowVorSt), 'Überschuss vor Kredit − Rate = Cashflow vor Steuern');
assert(near(heute.scCashflowVorSt - heute.scSteuerMonat, heute.scCashflowAfterTax), 'Cashflow vor Steuern − Steuer = Cashflow nach Steuern');

const zins = berechneSzenario(basis, STRESSTESTS[0].deltas);
assert(zins.scRateMonat > heute.scRateMonat && zins.scCashflowAfterTax < heute.scCashflowAfterTax, 'Zinsen +2 %-Punkte: höhere Rate, weniger Überschuss');
assert(zins.scAbzahlungsjahr < heute.scAbzahlungsjahr, 'Höhere Annuität → früher schuldenfrei');
const miete = berechneSzenario(basis, STRESSTESTS[1].deltas);
assert(near(miete.scMiete, 864) && miete.scCashflowAfterTax < heute.scCashflowAfterTax, 'Miete −10 %: 864 € und weniger Überschuss');
const ek = berechneSzenario(basis, STRESSTESTS[3].deltas);
assert(ek.scDarlehen < heute.scDarlehen && ek.scCashflowAfterTax > heute.scCashflowAfterTax, 'Mehr Eigenkapital: kleinerer Kredit, mehr Überschuss');

assert(!hatAenderung(KEINE_DELTAS) && hatAenderung(STRESSTESTS[0].deltas), 'hatAenderung erkennt Änderungen');
assert(istGleich(STRESSTESTS[4].deltas, { ...KEINE_DELTAS, zinsPp: 2, mietePct: -10 }), 'istGleich vergleicht alle Felder');

const p = berechnePuffer(basis, KEINE_DELTAS);
assert(p.zinsBis !== null && p.zinsBis > basis.zins, `Puffer Zins liegt über dem heutigen Zins (${p.zinsBis?.toFixed(2)} %)`);
const grenzeZins = berechneSzenario(basis, { ...KEINE_DELTAS, zinsPp: p.zinsBis! - basis.zins });
assert(Math.abs(grenzeZins.scCashflowAfterTax) < 1, 'Am Zins-Puffer liegt der Überschuss bei ca. 0 €');
const grenzeMiete = berechneSzenario(basis, { ...KEINE_DELTAS, mietePct: (p.mieteBis! / basis.miete - 1) * 100 });
assert(Math.abs(grenzeMiete.scCashflowAfterTax) < 1, 'Am Miet-Puffer liegt der Überschuss bei ca. 0 €');
assert(p.leerstandMonate !== null && p.leerstandMonate > 0, 'Leerstands-Puffer ist positiv');

const negativ = berechnePuffer({ ...basis, miete: 300 }, KEINE_DELTAS);
assert(negativ.zinsBis === null && negativ.mieteBis === null, 'Bei negativem Überschuss gibt es keinen Puffer');

console.log('\nAlle Szenario-Tests bestanden.');
