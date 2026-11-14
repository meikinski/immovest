/**
 * Tests zum Live-Test vom 14.11.2026 mit dem Testobjekt:
 * Leipzig 04317, 215.000 €, 76,5 m², Kaltmiete 468,33 €, Hausgeld 112,08 €.
 *
 * Ausführen mit `npx tsx src/lib/__tests__/live-test.test.ts`
 */

import { grunderwerbsteuerFuerAdresse, grunderwerbsteuerLabel } from '../grunderwerbsteuer';
import { bundeslandAusPlz } from '../plzBundesland';
import { hausgeldUnsicher, hausgeldUnsicherHinweis, pruefeImport } from '../importPruefung';
import {
  berechneBruttomietrendite,
  berechneEkRendite,
  berechneGesamtinvestition,
  berechneNettomietrendite,
  berechneVervielfachung,
  OHNE_EK_TEXT,
  type KennzahlenEingabe,
} from '../kennzahlen';
import { leereWerteAlsNull, nullAlsLeererWert } from '../leereWerte';
import { formatZahl, parseZahl } from '../zahlen';
import { useImmoStore } from '../../store/useImmoStore';
import { berechnePrognose } from '../prognose-calculator';
import { berechneCashflowVorSteuern, berechneDarlehen } from '../kennzahlen';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAILED: ${message}`);
  console.log(`✓ ${message}`);
}
const near = (a: number, b: number, tol = 0.005) => Math.abs(a - b) <= tol;

// Store-Logs aus updateDerived o. Ä. unterdrücken
const originalLog = console.log;
console.log = (...a: unknown[]) => { if (typeof a[0] === 'string' && a[0].startsWith('updateDerived')) return; originalLog(...a); };

const ADRESSE = 'Prager Straße 123, 04317 Leipzig';

// --- 1. Grunderwerbsteuer nach Bundesland ---
console.log('\n1. Grunderwerbsteuer');
assert(bundeslandAusPlz('04317') === 'SN', 'PLZ 04317 → Sachsen');
const grESt = grunderwerbsteuerFuerAdresse(ADRESSE);
assert(grESt?.satz === 5.5, 'Leipzig 04317: 5,5 % statt pauschal 6,5 %');
assert(grunderwerbsteuerLabel('SN') === 'Sachsen: 5,5 %', 'Anzeige neben dem Feld: "Sachsen: 5,5 %"');
assert(grunderwerbsteuerFuerAdresse('Prager Straße 123, Leipzig') === null, 'Ohne PLZ kein Satz: Feld bleibt leer ("Bundesland wählen")');

{
  const store = useImmoStore.getState();
  store.resetAnalysis();
  store.importData({ adresse: ADRESSE, kaufpreis: 215000 });
  const s = useImmoStore.getState();
  assert(s.bundesland === 'SN' && s.grunderwerbsteuer_pct === 5.5 && !s.grunderwerbsteuerManuell, 'Store: Import mit PLZ setzt Sachsen und 5,5 % vor (bleibt änderbar)');
  store.resetAnalysis();
  store.importData({ adresse: 'Prager Straße 123, Leipzig', kaufpreis: 215000 });
  assert(useImmoStore.getState().grunderwerbsteuer_pct === 0, 'Store: ohne PLZ kein Satz (0 = leer), keine 6,5 %');
  assert(store.exportState().grunderwerbsteuer_pct === null, 'Export: ohne Bundesland null');
}

// --- 2. Fehlende Importwerte ("Preis auf Anfrage") ---
console.log('\n2. Fehlende Importwerte');
{
  const { daten, fehlend } = pruefeImport({
    kaufpreis: 1, miete: 1, hausgeld: 1, flaeche: 76.5, adresse: ADRESSE, zimmer: 2.5, baujahr: 1900, objekttyp: 'wohnung',
  });
  assert(daten.kaufpreis === null && daten.miete === null && daten.hausgeld === null, 'Platzhalter 1 € → null (nicht 1, nicht 0)');
  assert(['kaufpreis', 'miete'].every(f => fehlend.includes(f as 'kaufpreis')), 'Pflichtfelder Kaufpreis und Kaltmiete werden als fehlend gemeldet');
  const ohneFlaeche = pruefeImport({ kaufpreis: 215000, miete: 468.33, flaeche: 0, adresse: ADRESSE, objekttyp: 'wohnung' });
  assert(ohneFlaeche.daten.flaeche === null && ohneFlaeche.fehlend.includes('flaeche'), 'Fläche 0 → null, als fehlend gemeldet');

  // Store: intern 0 (leeres Feld), nach außen null
  const store = useImmoStore.getState();
  store.resetAnalysis();
  store.importData({ ...nullAlsLeererWert(daten as Record<string, unknown>), objekttyp: 'wohnung' } as Parameters<typeof store.importData>[0]);
  const s = useImmoStore.getState();
  assert(s.kaufpreis === 0 && s.miete === 0, 'Store: fehlende Werte als leeres Feld (keine 1 €)');
  assert(Number.isFinite(s.nettorendite) && s.nettorendite === 0, 'Store: Nettorendite 0 statt 720 % (vorher Kaufpreis 1 €)');
  const aus = store.exportState();
  assert(aus.kaufpreis === null && aus.miete === null && aus.hausgeld === null, 'Export/Speichern: null');
  assert(leereWerteAlsNull({ objekttyp: 'haus', hausgeld: 0 }).hausgeld === 0, 'Haus: Hausgeld 0 ist ein echter Wert');
  assert(leereWerteAlsNull({ grunderwerbsteuer_pct: 0, grunderwerbsteuerManuell: true }).grunderwerbsteuer_pct === 0, 'Bewusst eingetragener Satz 0 bleibt 0');
}

// --- 3. Hausgeld-Plausibilität (Kleinanzeigen: Hausgeld 350 = Miete 350) ---
console.log('\n3. Hausgeld-Plausibilität');
assert(hausgeldUnsicher(350, 350), 'Hausgeld = Kaltmiete (350 €) ist unsicher');
assert(hausgeldUnsicher(300, 468.33), 'Hausgeld über 60 % der Kaltmiete ist unsicher');
assert(!hausgeldUnsicher(280, 468.33), 'Hausgeld knapp unter 60 % ist plausibel');
assert(!hausgeldUnsicher(112.08, 468.33), 'Testobjekt: 112,08 € zu 468,33 € ist plausibel');
assert(!hausgeldUnsicher(null, 350) && !hausgeldUnsicher(350, null), 'Ohne beide Werte keine Markierung');
{
  const k = pruefeImport({ kaufpreis: 189000, miete: 350, hausgeld: 350, flaeche: 58, adresse: '04109 Leipzig', zimmer: 2, baujahr: 1995, objekttyp: 'wohnung' });
  assert(k.unsicher.join(',') === 'hausgeld' && k.daten.hausgeld === 350, 'Import: Hausgeld bleibt übernommen, ist aber als unsicher markiert');
  assert(pruefeImport({ kaufpreis: 189000, miete: 350, hausgeld: 350, flaeche: 58, adresse: '04109 Leipzig', objekttyp: 'haus' }).unsicher.length === 0, 'Haus: keine Hausgeld-Prüfung');
  assert(
    hausgeldUnsicherHinweis(350, 350) === 'Das importierte Hausgeld (350 €) ist so hoch wie die Kaltmiete (350 €). Bitte prüfe den Wert im Inserat und bestätige ihn oder korrigiere ihn.',
    'Hinweistext bei Gleichheit'
  );
  assert(hausgeldUnsicherHinweis(300, 468.33).includes('mehr als 60 % der Kaltmiete (468,33 €)'), 'Hinweistext mit deutscher Zahl');

  const store = useImmoStore.getState();
  store.resetAnalysis();
  store.importData({ miete: 350, hausgeld: 350, importUnsicher: ['hausgeld'] });
  store.setHausgeld(350);
  assert(useImmoStore.getState().importUnsicher.includes('hausgeld'), 'Feld verlassen ohne Änderung bestätigt nicht');
  store.bestaetigeImportFeld('hausgeld');
  assert(useImmoStore.getState().importUnsicher.length === 0, '"Hausgeld stimmt so" bestätigt');
  store.importData({ importUnsicher: ['hausgeld'] });
  store.setHausgeld(150);
  assert(useImmoStore.getState().importUnsicher.length === 0, 'Geänderter Wert gilt als geprüft');
}

// --- 4. Bruttorendite und Nettorendite ---
console.log('\n4. Kennzahlen');
const testobjekt: KennzahlenEingabe = {
  kaufpreis: 215000, grunderwerbsteuerPct: 5.5, notarPct: 2, maklerPct: 3.57, sonstigeKosten: 0,
  miete: 468.33, hausgeld: 112.08, hausgeldUmlegbar: 67.25, instandhaltungProQmJahr: 9, flaeche: 76.5,
  mietausfallPct: 5, ek: 0, zins: 3.5, tilgung: 2,
};
const brutto = berechneBruttomietrendite(468.33 * 12, 215000);
assert(formatZahl(brutto, { min: 1, max: 1 }) === '2,6', 'Bruttorendite: 468,33 € × 12 ÷ 215.000 € = 2,6 %');
const gesamt = berechneGesamtinvestition(testobjekt);
assert(gesamt === 215000 + 11825 + 4300 + 7675, 'Gesamtinvestition: Kaufpreis + GrESt 5,5 % + Notar 2 % + Makler 3,57 %');
assert(formatZahl((468.33 * 12 / gesamt) * 100, { min: 1, max: 1 }) === '2,4', 'Gegenprobe: auf die Gesamtinvestition wären es 2,4 % (der falsche Wert)');
const netto = berechneNettomietrendite(testobjekt);
assert(near(netto, ((468.33 * 12 - 44.83 * 12 - 9 * 76.5) / gesamt) * 100, 0.0001), 'Nettorendite: (Jahreskaltmiete − nicht umlagef. Hausgeld − Instandhaltung) ÷ Gesamtinvestition');
assert(formatZahl(netto, { min: 1, max: 1 }) === '1,8', 'Nettorendite Testobjekt: 1,8 %');
{
  const store = useImmoStore.getState();
  store.resetAnalysis();
  store.importData({
    kaufpreis: 215000, grunderwerbsteuer_pct: 5.5, notar_pct: 2, makler_pct: 3.57, sonstige_kosten: 0, miete: 468.33,
    hausgeld: 112.08, hausgeld_umlegbar: 67.25, instandhaltungskosten_pro_qm: 9, flaeche: 76.5, mietausfall_pct: 5,
    ek: 0, zins: 3.5, tilgung: 2, adresse: ADRESSE,
  });
  assert(near(useImmoStore.getState().nettorendite, netto, 1e-9), 'Store (Speichern, Liste, Chat) rechnet dieselbe Nettorendite wie die Karte');
}

{
  // Gespeicherter Cashflow (Liste "Meine Analysen") = Cashflow-Karte (Jahr 1 der Prognose)
  const p = berechnePrognose({
    startJahr: 2026, darlehensSumme: berechneDarlehen(testobjekt), ek: 0, zins: 3.5, tilgung: 2,
    warmmiete: 468.33 + 67.25, hausgeld: 112.08, kalkKostenMonthly: (9 * 76.5) / 12 + 468.33 * 0.05,
    afaJaehrlich: 0, steuersatz: 0, immobilienwert: 215000, wertsteigerungPct: 0, darlehensTyp: 'annuitaet',
    mietInflationPct: 0, kostenInflationPct: 0, verkaufsNebenkostenPct: 5,
  }, 1);
  const cf = berechneCashflowVorSteuern(testobjekt);
  assert(near(cf, p.jahre[0].cashflowVorSteuern, 1e-6), `Cashflow vor Steuern im Store = Karte (${formatZahl(cf, { max: 0 })} €)`);
  assert(near(useImmoStore.getState().cashflow_operativ, cf, 1e-6), 'Store speichert diesen Cashflow');
}

// --- 5. Eigenkapital 0 ---
console.log('\n5. Eigenkapital 0');
assert(berechneEkRendite(testobjekt) === null, 'EK-Rendite bei EK 0: null (Anzeige "–", ohne Bewertung) statt 0,0 %');
assert(berechneVervielfachung(250000, 0) === null, 'Vervielfachung bei EK 0: null statt "× 0, Schwach"');
assert(OHNE_EK_TEXT === 'Ohne Eigenkapital lässt sich keine Vervielfachung berechnen', 'Neutraler Text für die Prognose');
const mitEk = berechneEkRendite({ ...testobjekt, ek: 47000 });
assert(mitEk !== null && Number.isFinite(mitEk), 'Mit Eigenkapital wird die EK-Rendite berechnet');
assert(berechneVervielfachung(235000, 47000) === 5, 'Vervielfachung mit Eigenkapital: 235.000 ÷ 47.000 = × 5');

// --- 6. Zahlenformate ---
console.log('\n6. Zahlenformate');
assert(parseZahl('1.234,56') === 1234.56, '"1.234,56" → 1234,56');
assert(parseZahl('468,33') === 468.33 && parseZahl('215.000') === 215000 && parseZahl('76,5') === 76.5, 'Testobjekt-Eingaben werden deutsch gelesen');
assert(formatZahl(468.33) === '468,33' && formatZahl(215000) === '215.000', 'Anzeige: 468,33 und 215.000');
assert(formatZahl(112.08 * 0.6, { min: 2 }) === '67,25', 'Hausgeld-Aufteilung: "67,25 €" statt "67.25 EUR"');
assert(formatZahl(468.33 / 76.5, { min: 2, max: 2 }) === '6,12', 'Miete pro m²: "6,12"');

console.log('\nAlle Live-Test-Tests bestanden.');
