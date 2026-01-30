/**
 * Manuelle Tests für den AfA-Calculator
 *
 * Diese Tests können mit `npx ts-node src/lib/__tests__/afaCalculator.test.ts` ausgeführt werden.
 * Oder installieren Sie vitest/jest für automatisierte Tests.
 *
 * Test-Szenarien nach § 7 Abs. 4, § 7 Abs. 5a, § 7b EStG
 */

import {
  berechneAfaVerlauf,
  pruefeAfaBerechtigung,
  berechneAfaSteuerersparnis,
  AfaParams,
  AfaPropertyData,
} from '../afaCalculator';

// Test-Helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAILED: ${message}`);
  }
  console.log(`PASSED: ${message}`);
}

function assertApprox(actual: number, expected: number, tolerance: number, message: string) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`FAILED: ${message} - Expected ~${expected}, got ${actual}`);
  }
  console.log(`PASSED: ${message} (${actual} ~ ${expected})`);
}

// ============================================
// TEST 1: Lineare AfA 2% (Altimmobilie)
// ============================================
console.log('\n=== TEST 1: Lineare AfA 2% (Altimmobilie) ===');

const params1: AfaParams = {
  kaufpreis: 400000,
  grundstueckswert: 80000, // 20% Grundstück
  wohnflaeche: 100,
  modell: 'linear_2',
  nutzeSonderAfa: false,
  startJahr: 2024,
};

const result1 = berechneAfaVerlauf(params1, 30);

// Gebäudewert = 320.000€, AfA = 2% = 6.400€/Jahr
assert(result1.length === 30, 'Sollte 30 Jahre berechnen');
assertApprox(result1[0].gesamtAfA, 6400, 1, 'Jahr 1: AfA = 6.400€');
assertApprox(result1[0].afaSatz, 2, 0.01, 'Jahr 1: AfA-Satz = 2%');
assertApprox(result1[0].sonderAfaBetrag, 0, 0.01, 'Keine Sonder-AfA');

// ============================================
// TEST 2: Lineare AfA 3% (ab 2023)
// ============================================
console.log('\n=== TEST 2: Lineare AfA 3% (ab 2023) ===');

const params2: AfaParams = {
  kaufpreis: 400000,
  grundstueckswert: 80000,
  wohnflaeche: 100,
  modell: 'linear_3',
  nutzeSonderAfa: false,
  startJahr: 2024,
};

const result2 = berechneAfaVerlauf(params2, 30);

// Gebäudewert = 320.000€, AfA = 3% = 9.600€/Jahr
assertApprox(result2[0].gesamtAfA, 9600, 1, 'Jahr 1: AfA = 9.600€');
assertApprox(result2[0].afaSatz, 3, 0.01, 'Jahr 1: AfA-Satz = 3%');

// ============================================
// TEST 3: Degressive AfA 5%
// ============================================
console.log('\n=== TEST 3: Degressive AfA 5% ===');

const params3: AfaParams = {
  kaufpreis: 400000,
  grundstueckswert: 80000,
  wohnflaeche: 100,
  modell: 'degressiv_5',
  nutzeSonderAfa: false,
  startJahr: 2024,
};

const result3 = berechneAfaVerlauf(params3, 30);

// Jahr 1: 5% von 320.000€ = 16.000€
assertApprox(result3[0].gesamtAfA, 16000, 1, 'Jahr 1: AfA = 16.000€ (5%)');
assertApprox(result3[0].afaSatz, 5, 0.01, 'Jahr 1: AfA-Satz = 5%');

// Jahr 2: 5% von (320.000 - 16.000) = 15.200€
assertApprox(result3[1].gesamtAfA, 15200, 1, 'Jahr 2: AfA = 15.200€');

// Prüfe, dass Restbuchwert sinkt
assert(result3[1].restbuchwert < result3[0].restbuchwert, 'Restbuchwert sinkt von Jahr zu Jahr');

// ============================================
// TEST 4: Degressive AfA 5% mit Sonder-AfA 5% (AfA-Turbo)
// ============================================
console.log('\n=== TEST 4: AfA-Turbo (Degressiv 5% + Sonder-AfA 5%) ===');

const params4: AfaParams = {
  kaufpreis: 400000,
  grundstueckswert: 80000,
  wohnflaeche: 100,
  modell: 'degressiv_5',
  nutzeSonderAfa: true,
  startJahr: 2024,
};

const result4 = berechneAfaVerlauf(params4, 30);

// Sonder-AfA Bemessungsgrundlage: min(4000 * 100, 320000) = 320.000€
// Sonder-AfA Jahr 1-4: 5% von 320.000€ = 16.000€
// Degressiv Jahr 1: 5% von 320.000€ = 16.000€
// Gesamt Jahr 1: 32.000€ (10%)
assertApprox(result4[0].linearerBetrag, 16000, 1, 'Jahr 1: Degressiv = 16.000€');
assertApprox(result4[0].sonderAfaBetrag, 16000, 1, 'Jahr 1: Sonder-AfA = 16.000€');
assertApprox(result4[0].gesamtAfA, 32000, 1, 'Jahr 1: Gesamt-AfA = 32.000€');
assertApprox(result4[0].afaSatz, 10, 0.1, 'Jahr 1: AfA-Satz = 10%');

// Sonder-AfA endet nach Jahr 4
assert(result4[3].sonderAfaBetrag > 0, 'Jahr 4: Noch Sonder-AfA');
assert(result4[4].sonderAfaBetrag === 0, 'Jahr 5: Keine Sonder-AfA mehr');

// ============================================
// TEST 5: Berechtigungsprüfung - Altbau vor 2023
// ============================================
console.log('\n=== TEST 5: Berechtigungsprüfung - Altbau vor 2023 ===');

const property1: AfaPropertyData = {
  immobilienTyp: 'bestand',
  kaufdatum: '2020-06-15',
  bauantragsdatum: null,
  kfwStandard: null,
  hatQngSiegel: false,
  kaufpreis: 400000,
  wohnflaeche: 100,
};

const berechtigung1 = pruefeAfaBerechtigung(property1);

assert(berechtigung1.linear_2 === true, 'Linear 2% verfügbar');
assert(berechtigung1.linear_3 === false, 'Linear 3% NICHT verfügbar (vor 2023)');
assert(berechtigung1.degressiv_5 === false, 'Degressiv 5% NICHT verfügbar (kein Neubau)');
assert(berechtigung1.sonderAfa === false, 'Sonder-AfA NICHT verfügbar');

// ============================================
// TEST 6: Berechtigungsprüfung - Neubau 2024 ohne KfW
// ============================================
console.log('\n=== TEST 6: Berechtigungsprüfung - Neubau 2024 ohne KfW ===');

const property2: AfaPropertyData = {
  immobilienTyp: 'neubau',
  kaufdatum: '2024-03-01',
  bauantragsdatum: '2024-01-15',
  kfwStandard: null,
  hatQngSiegel: false,
  kaufpreis: 400000,
  wohnflaeche: 100,
};

const berechtigung2 = pruefeAfaBerechtigung(property2);

assert(berechtigung2.linear_2 === true, 'Linear 2% verfügbar');
assert(berechtigung2.linear_3 === true, 'Linear 3% verfügbar (ab 2023)');
assert(berechtigung2.degressiv_5 === true, 'Degressiv 5% verfügbar (Neubau 2024)');
assert(berechtigung2.sonderAfa === false, 'Sonder-AfA NICHT verfügbar (kein EH40 + QNG)');

// ============================================
// TEST 7: Berechtigungsprüfung - Neubau 2024 EH40 mit QNG
// ============================================
console.log('\n=== TEST 7: Berechtigungsprüfung - Neubau 2024 EH40 mit QNG (Voller Turbo) ===');

const property3: AfaPropertyData = {
  immobilienTyp: 'neubau',
  kaufdatum: '2024-03-01',
  bauantragsdatum: '2024-01-15',
  kfwStandard: 'EH40',
  hatQngSiegel: true,
  kaufpreis: 400000,
  wohnflaeche: 100,
};

const berechtigung3 = pruefeAfaBerechtigung(property3);

assert(berechtigung3.linear_2 === true, 'Linear 2% verfügbar');
assert(berechtigung3.linear_3 === true, 'Linear 3% verfügbar');
assert(berechtigung3.degressiv_5 === true, 'Degressiv 5% verfügbar');
assert(berechtigung3.sonderAfa === true, 'Sonder-AfA verfügbar (EH40 + QNG)!');

// ============================================
// TEST 8: Berechtigungsprüfung - Kaufpreis über 5.200€/m²
// ============================================
console.log('\n=== TEST 8: Berechtigungsprüfung - Kaufpreis über 5.200€/m² ===');

const property4: AfaPropertyData = {
  immobilienTyp: 'neubau',
  kaufdatum: '2024-03-01',
  bauantragsdatum: '2024-01-15',
  kfwStandard: 'EH40',
  hatQngSiegel: true,
  kaufpreis: 600000, // 6.000€/m² > 5.200€/m²
  wohnflaeche: 100,
};

const berechtigung4 = pruefeAfaBerechtigung(property4);

assert(berechtigung4.sonderAfa === false, 'Sonder-AfA NICHT verfügbar (über 5.200€/m²)');
assert(
  berechtigung4.gruende.keineSonderAfa?.includes('5.200') === true,
  'Grund: Obergrenze überschritten'
);

// ============================================
// TEST 9: Steuerersparnis-Berechnung
// ============================================
console.log('\n=== TEST 9: Steuerersparnis-Berechnung ===');

const afaBetrag = 32000; // AfA-Turbo Jahr 1
const steuersatz = 42; // Grenzsteuersatz

const steuerersparnis = berechneAfaSteuerersparnis(afaBetrag, steuersatz);
assertApprox(steuerersparnis, 13440, 1, 'Steuerersparnis bei 42%: 13.440€');

// ============================================
// ZUSAMMENFASSUNG
// ============================================
console.log('\n=== ALLE TESTS BESTANDEN ===');
console.log(`
AfA-Turbo Zusammenfassung:
- Linear 2%: 6.400€/Jahr bei 320.000€ Gebäudewert
- Linear 3%: 9.600€/Jahr bei 320.000€ Gebäudewert
- Degressiv 5%: 16.000€/Jahr 1, dann sinkend
- AfA-Turbo (Deg. 5% + Sonder 5%): 32.000€/Jahr 1-4 = 10% Abschreibung!

Bei 42% Grenzsteuersatz:
- Standard (3%): 4.032€ Steuerersparnis/Jahr
- AfA-Turbo (10%): 13.440€ Steuerersparnis/Jahr in Jahren 1-4!

Das ist ein Unterschied von 9.408€/Jahr für 4 Jahre = 37.632€ Steuervorteil!
`);
