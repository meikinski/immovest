/**
 * Tests für Bruttomietrendite, Eigenkapital-Startwert und deutsche Zahlenformate
 *
 * Ausführen mit `npx tsx src/lib/__tests__/kennzahlen.test.ts`
 */

import { berechneBruttomietrendite, berechneEkStartwert } from '../kennzahlen';
import { berechneSzenario, type SzenarioBasis } from '../szenario';
import { formatZahl, formatZahlOderLeer, parseZahl, parseZahlOder } from '../zahlen';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAILED: ${message}`);
  }
  console.log(`✓ ${message}`);
}
const near = (a: number, b: number, tol = 0.005) => Math.abs(a - b) <= tol;

// --- Bruttomietrendite: Jahreskaltmiete ÷ Kaufpreis ---
assert(near(berechneBruttomietrendite(468.33 * 12, 215000), 2.614, 0.001), 'Live-Test: 468,33 € × 12 ÷ 215.000 € = 2,6 %');
assert(berechneBruttomietrendite(468.33 * 12, 215000).toFixed(1) === '2.6', 'Gerundet 2,6 % (nicht 2,3 % auf die Gesamtinvestition)');
assert(near(berechneBruttomietrendite(12000, 240000), 5), '12.000 € ÷ 240.000 € = 5,0 %');
assert(berechneBruttomietrendite(12000, 0) === 0, 'Ohne Kaufpreis 0 statt Division durch 0');

const basis: SzenarioBasis = {
  kaufpreis: 215000, miete: 468.33, ek: 0, zins: 3.5, tilgung: 2, grunderwerbsteuerPct: 6.5, notarPct: 2, maklerPct: 3.57,
  sonstigeKosten: 0, hausgeld: 180, hausgeldUmlegbar: 108, instandhaltungProQmJahr: 9, instandKalkProQmJahr: 9,
  mietausfallPct: 1, flaeche: 48, afaJaehrlich: 3225, steuersatzPct: 42, darlehensTyp: 'annuitaet', grundstueckswert: 43000,
};
const heute = berechneSzenario(basis);
assert(near(heute.scBruttoRendite, 2.614, 0.001), 'Szenarien-Tab und PDF rechnen die Bruttomietrendite ebenfalls auf den Kaufpreis');
const verhandelt = berechneSzenario(basis, { preisPct: -10, mietePct: 0, ekPct: 0, zinsPp: 0, tilgungPp: 0 });
assert(near(verhandelt.scBruttoRendite, (468.33 * 12) / (215000 * 0.9) * 100, 0.001), 'Im Szenario zählt der verhandelte Kaufpreis');

// --- Eigenkapital-Startwert: Kaufnebenkosten + 10 % des Kaufpreises, auf 1.000 € gerundet ---
// 215.000 €: GrESt 6,5 % = 13.975, Notar 2 % = 4.300, Makler 3,57 % = 7.676 (gerundet) → 25.951 + 21.500 = 47.451
assert(berechneEkStartwert({ kaufpreis: 215000, grunderwerbsteuerPct: 6.5, notarPct: 2, maklerPct: 3.57 }) === 47000, '215.000 € in NRW: 47.000 €');
assert(berechneEkStartwert({ kaufpreis: 215000, grunderwerbsteuerPct: 6.5, notarPct: 2, maklerPct: 3.57, sonstigeKosten: 5000 }) === 52000, 'Sonstige Kosten zählen zu den Nebenkosten');
assert(berechneEkStartwert({ kaufpreis: 300000, grunderwerbsteuerPct: 3.5, notarPct: 2, maklerPct: 0 }) === 47000, '300.000 € in Bayern ohne Makler: 46.500 € → 47.000 €');
assert(berechneEkStartwert({ kaufpreis: 100000, grunderwerbsteuerPct: 5.5, notarPct: 2, maklerPct: 3.57 }) === 21000, '100.000 € in Sachsen: 21.070 € → 21.000 €');
assert(berechneEkStartwert({ kaufpreis: 0, grunderwerbsteuerPct: 6.5, notarPct: 2, maklerPct: 3.57 }) === 0, 'Ohne Kaufpreis kein Startwert');
assert(berechneEkStartwert({ kaufpreis: 215000, grunderwerbsteuerPct: 0, notarPct: 2, maklerPct: 3.57 }) === 33000, 'Ohne Grunderwerbsteuersatz zählen die übrigen Nebenkosten');
assert(berechneEkStartwert({ kaufpreis: 215000, grunderwerbsteuerPct: 6.5, notarPct: 2, maklerPct: 3.57 }) % 1000 === 0, 'Immer auf volle 1.000 € gerundet');

// --- Deutsche Zahlenformate ---
assert(parseZahl('468,33') === 468.33, '"468,33" → 468.33');
assert(parseZahl('1.234,56') === 1234.56, '"1.234,56" → 1234.56');
assert(parseZahl('280.000') === 280000, '"280.000" → 280000 (Tausenderpunkt)');
assert(parseZahl('1.250.000') === 1250000, '"1.250.000" → 1250000');
assert(parseZahl('468.33') === 468.33, '"468.33" (englische Schreibweise) → 468.33');
assert(parseZahl('3.5') === 3.5, '"3.5" → 3.5');
assert(parseZahl('6,12') === 6.12, '"6,12" → 6.12');
assert(parseZahl(' 1.200 € ') === 1200, 'Leerzeichen und € werden ignoriert');
assert(parseZahl('468,') === 468, 'Eingabe mitten im Tippen ("468,") ist lesbar');
assert(parseZahl('') === null && parseZahl('abc') === null && parseZahl(null) === null, 'Leer oder unlesbar → null');
assert(parseZahlOder('', 0) === 0 && parseZahlOder('x', 7) === 7, 'Ersatzwert für leere Eingaben');
assert(formatZahl(468.33) === '468,33', '468.33 → "468,33"');
assert(formatZahl(6.12) === '6,12', '6.12 → "6,12"');
assert(formatZahl(280000) === '280.000', '280000 → "280.000"');
assert(formatZahl(3.5, { min: 2 }) === '3,50', 'Mindest-Nachkommastellen');
assert(formatZahl(10.456, { max: 1 }) === '10,5', 'Maximale Nachkommastellen');
assert(formatZahl(1984, { max: 0 }) === '1.984', 'Ganzzahl mit Tausenderpunkt');
assert(formatZahlOderLeer(0) === '' && formatZahlOderLeer(950) === '950', 'Leeres Feld statt 0');
assert(parseZahl(formatZahl(1234567.89)) === 1234567.89, 'Formatieren und Lesen ergeben denselben Wert');

console.log('\nAlle Kennzahlen-Tests bestanden.');
