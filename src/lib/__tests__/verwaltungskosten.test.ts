/**
 * Tests für Verwaltungskosten bei Haus und MFH.
 * Sie zählen wie nicht umlagefähiges Hausgeld: monatlich, nicht umlegbar, steigen mit den Kosten, steuerlich absetzbar.
 * Bei Haus/MFH gibt es kein Hausgeld: umgelegte Nebenkosten zahlt der Mieter durch (Saldo 0).
 *
 * Testobjekt Haus: 400.000 €, GrESt 5 %, Notar 2 %, Makler 3,57 %, 140 m², Kaltmiete 1.600 €,
 * umlagefähige Nebenkosten 250 €, Verwaltungskosten 120 €/Monat, Instandhaltung 12 €/m²,
 * Mietausfall 5 %, EK 80.000 €, Zins 3,5 %, Tilgung 2 %.
 *
 * Ausführen mit `npx tsx src/lib/__tests__/verwaltungskosten.test.ts`
 */

import {
  berechneBewirtschaftungJahr,
  berechneCashflowVorSteuern,
  berechneDarlehen,
  berechneEkRendite,
  berechneGesamtinvestition,
  berechneLaufendeKosten,
  berechneNettomietrendite,
  type KennzahlenEingabe,
} from '../kennzahlen';
import { berechnePrognose, type PrognoseInput } from '../prognose-calculator';
import { baueVerlauf } from '../prognose-view';
import { baueReportDaten } from '../report-daten';
import { berechneSzenario, KEINE_DELTAS, STRESSTESTS, type SzenarioBasis } from '../szenario';
import { useImmoStore } from '../../store/useImmoStore';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAILED: ${message}`);
  console.log(`✓ ${message}`);
}
const near = (a: number, b: number, tol = 0.005) => Math.abs(a - b) <= tol;

const HAUS: KennzahlenEingabe = {
  kaufpreis: 400000, grunderwerbsteuerPct: 5, notarPct: 2, maklerPct: 3.57, sonstigeKosten: 0,
  miete: 1600, hausgeld: 0, hausgeldUmlegbar: 250, instandhaltungProQmJahr: 12, flaeche: 140,
  mietausfallPct: 5, ek: 80000, zins: 3.5, tilgung: 2, objekttyp: 'haus', verwaltungskosten: 120,
};
const OHNE_VERWALTUNG: KennzahlenEingabe = { ...HAUS, verwaltungskosten: 0 };

// --- 1. Laufende Kosten je Objekttyp ---
console.log('\n1. Laufende Kosten je Objekttyp');
{
  const lk = berechneLaufendeKosten(HAUS);
  assert(lk.verwaltungskosten === 120 && lk.nichtUmlagefaehig === 120, 'Haus: nicht umlagefähig sind die 120 € Verwaltungskosten');
  assert(lk.hausgeld === 250 && lk.hausgeldUmlegbar === 250, 'Haus: umgelegte Nebenkosten heben sich auf (250 € rein, 250 € raus)');

  // Import: Hausgeld gesamt 370 € (250 + 120) und Verwaltungskosten 120 € → nicht doppelt zählen
  const importiert = berechneLaufendeKosten({ ...HAUS, hausgeld: 370 });
  assert(importiert.nichtUmlagefaehig === 120, 'Haus mit importiertem Hausgeld: Verwaltungskosten zählen einmal, nicht doppelt');
  assert(berechneLaufendeKosten({ ...HAUS, objekttyp: 'mfh' }).nichtUmlagefaehig === 120, 'MFH wie Haus');
  assert(berechneLaufendeKosten({ ...HAUS, verwaltungskosten: -50 }).verwaltungskosten === 0, 'Negative Verwaltungskosten zählen als 0');

  const wohnung = berechneLaufendeKosten({ objekttyp: 'wohnung', hausgeld: 112.08, hausgeldUmlegbar: 67.25, verwaltungskosten: 120 });
  assert(wohnung.verwaltungskosten === 0 && near(wohnung.nichtUmlagefaehig, 44.83), 'Wohnung: Verwaltung steckt im Hausgeld, Verwaltungskosten aus dem Store zählen nicht');
  const ohneTyp = berechneLaufendeKosten({ hausgeld: 112.08, hausgeldUmlegbar: 67.25, verwaltungskosten: 120 });
  assert(near(ohneTyp.nichtUmlagefaehig, 44.83) && ohneTyp.verwaltungskosten === 0, 'Ohne Objekttyp wie eine Wohnung');
}

// --- 2. Kennzahlen (Karten) ---
console.log('\n2. Kennzahlen');
// Gesamtinvestition: 400.000 + 20.000 + 8.000 + 14.280 = 442.280 €
assert(berechneGesamtinvestition(HAUS) === 442280, 'Gesamtinvestition 442.280 €');
// Bewirtschaftung: 120 × 12 + 12 × 140 = 1.440 + 1.680 = 3.120 €
assert(near(berechneBewirtschaftungJahr(HAUS), 3120), 'Bewirtschaftung: 1.440 € Verwaltung + 1.680 € Instandhaltung = 3.120 €/Jahr');
// Nettorendite: (19.200 − 3.120) ÷ 442.280 = 3,636 %
assert(near(berechneNettomietrendite(HAUS), 3.6357, 0.001), 'Nettorendite 3,64 % (mit Verwaltungskosten)');
assert(near(berechneNettomietrendite(OHNE_VERWALTUNG), 3.9613, 0.001), 'Ohne Verwaltungskosten 3,96 %');
// Umgelegte Nebenkosten sind keine Einnahme: früher ergab Hausgeld 0 − umlagefähig 250 eine negative Kostenposition
assert(near(berechneNettomietrendite(OHNE_VERWALTUNG), berechneNettomietrendite({ ...OHNE_VERWALTUNG, hausgeldUmlegbar: 0 })),
  'Haus: umlagefähige Nebenkosten ändern die Nettorendite nicht');
// EK-Rendite: Darlehen 362.280 €, Zinsen 12.679,80 € → (19.200 − 3.120 − 12.679,80) ÷ 80.000 = 4,25 %
assert(berechneDarlehen(HAUS) === 362280, 'Darlehen 362.280 €');
assert(near(berechneEkRendite(HAUS)!, 4.2503, 0.001), 'EK-Rendite 4,25 % (mit Verwaltungskosten)');
assert(near(berechneEkRendite(OHNE_VERWALTUNG)! - berechneEkRendite(HAUS)!, (1440 / 80000) * 100), 'Verwaltungskosten senken die EK-Rendite um 1.440 € ÷ EK');
// Cashflow: 1.600 + 250 − 250 − 120 − (140 + 80) − 1.056,65 − 603,80 = −400,45 €
assert(near(berechneCashflowVorSteuern(HAUS), -400.45, 0.01), 'Cashflow vor Steuern −400,45 €');
assert(near(berechneCashflowVorSteuern(OHNE_VERWALTUNG) - berechneCashflowVorSteuern(HAUS), 120), 'Verwaltungskosten senken den Cashflow um 120 €/Monat');
assert(near(berechneCashflowVorSteuern(OHNE_VERWALTUNG), berechneCashflowVorSteuern({ ...OHNE_VERWALTUNG, hausgeldUmlegbar: 0 })),
  'Haus: umlagefähige Nebenkosten ändern den Cashflow nicht');
{
  const wohnung: KennzahlenEingabe = { ...HAUS, objekttyp: 'wohnung', hausgeld: 370, hausgeldUmlegbar: 250 };
  assert(near(berechneNettomietrendite(wohnung), berechneNettomietrendite({ ...wohnung, verwaltungskosten: 0 })),
    'Wohnung: gespeicherte Verwaltungskosten ändern die Nettorendite nicht');
}

// --- 3. Store (updateDerived: Speichern, Liste, Chat) ---
console.log('\n3. Store');
{
  const originalLog = console.log;
  const store = useImmoStore.getState();
  store.resetAnalysis();
  useImmoStore.setState({
    objekttyp: 'haus', kaufpreis: 400000, grunderwerbsteuer_pct: 5, notar_pct: 2, makler_pct: 3.57, sonstige_kosten: 0,
    miete: 1600, hausgeld: 0, hausgeld_umlegbar: 250, instandhaltungskosten_pro_qm: 12, flaeche: 140,
    mietausfall_pct: 5, ek: 80000, zins: 3.5, tilgung: 2,
  });
  console.log = () => {};
  store.setVerwaltungskosten(120);
  console.log = originalLog;
  let s = useImmoStore.getState();
  assert(near(s.cashflow_operativ, berechneCashflowVorSteuern(HAUS), 0.001), 'Store-Cashflow = Karte (mit Verwaltungskosten)');
  assert(near(s.nettorendite, berechneNettomietrendite(HAUS), 0.0001), 'Store-Nettorendite = Karte (mit Verwaltungskosten)');

  console.log = () => {};
  store.setVerwaltungskosten(0);
  console.log = originalLog;
  s = useImmoStore.getState();
  assert(near(s.cashflow_operativ, berechneCashflowVorSteuern(HAUS) + 120, 0.001), 'Verwaltungskosten 0 → Store-Cashflow 120 € höher');

  console.log = () => {};
  useImmoStore.setState({ objekttyp: 'wohnung', hausgeld: 370, verwaltungskosten: 120 });
  store.updateDerived();
  const mitVerw = useImmoStore.getState().nettorendite;
  useImmoStore.setState({ verwaltungskosten: 0 });
  store.updateDerived();
  console.log = originalLog;
  assert(near(mitVerw, useImmoStore.getState().nettorendite), 'Store: Wohnung ignoriert übrig gebliebene Verwaltungskosten');
  store.resetAnalysis();
}

// --- 4. Prognose ---
console.log('\n4. Prognose');
const lk = berechneLaufendeKosten(HAUS);
const kalk = (12 * 140) / 12 + 1600 * 0.05;
const prognoseInput = (verwaltungskosten: number, kostenInflationPct = 0): PrognoseInput => ({
  startJahr: 2026, darlehensSumme: berechneDarlehen(HAUS), ek: 80000, zins: 3.5, tilgung: 2,
  warmmiete: 1600 + lk.hausgeldUmlegbar, hausgeld: lk.hausgeld, verwaltungskosten, kalkKostenMonthly: kalk,
  afaJaehrlich: 6400, steuersatz: 42, darlehensTyp: 'annuitaet', kostenInflationPct,
});
{
  const mit = berechnePrognose(prognoseInput(120), 30).jahre;
  const ohne = berechnePrognose(prognoseInput(0), 30).jahre;
  assert(near(mit[0].cashflowVorSteuern, berechneCashflowVorSteuern(HAUS), 0.01), 'Jahr 1 der Prognose = Cashflow-Karte');
  assert(near(mit[0].verwaltungskostenJaehrlich, 1440), 'Prognose weist 1.440 € Verwaltungskosten im Jahr aus');
  assert(near(ohne[0].cashflowVorSteuern - mit[0].cashflowVorSteuern, 120), 'Prognose: Cashflow vor Steuern 120 € niedriger');
  assert(near(ohne[0].steuerJaehrlich - mit[0].steuerJaehrlich, 1440 * 0.42), 'Verwaltungskosten sind absetzbar: 1.440 € × 42 % weniger Steuer');
  assert(near(ohne[0].cashflowMonatlich - mit[0].cashflowMonatlich, 120 * (1 - 0.42)), 'Nach Steuern kosten 120 € Verwaltung 69,60 € im Monat');

  const inflation = berechnePrognose(prognoseInput(120, 2), 30).jahre;
  assert(near(inflation[1].verwaltungskostenJaehrlich, 1440 * 1.02), 'Verwaltungskosten steigen mit der Kostensteigerung (2 %)');
  assert(near(inflation[10].verwaltungskostenJaehrlich, 1440 * Math.pow(1.02, 10)), 'Nach 10 Jahren: 1.440 € × 1,02¹⁰');

  const verlauf = baueVerlauf(mit, { ek: 80000, kaufpreis: 400000, anschaffungskosten: 442280, steuersatzPct: 42, verkaufsNebenkostenPct: 5 });
  assert(near(verlauf[0].verwaltungskostenMonatlich, 120), 'Prognose-Tab: Zeile Verwaltungskosten 120 €/Monat');
  assert(near(verlauf[0].zuVersteuern, mit[0].mieteinnahmenJaehrlich - mit[0].hausgeldJaehrlich - 1440 - mit[0].zinslast - mit[0].afaGesamt),
    'Prognose-Tab Steuer: Verwaltungskosten mindern den zu versteuernden Betrag');
}

// --- 5. Szenarien und PDF ---
console.log('\n5. Szenarien und PDF');
const basis: SzenarioBasis = {
  kaufpreis: 400000, miete: 1600, ek: 80000, zins: 3.5, tilgung: 2, grunderwerbsteuerPct: 5, notarPct: 2, maklerPct: 3.57,
  sonstigeKosten: 0, hausgeld: lk.hausgeld, hausgeldUmlegbar: lk.hausgeldUmlegbar, verwaltungskosten: lk.verwaltungskosten,
  instandhaltungProQmJahr: 12, instandKalkProQmJahr: 12, mietausfallPct: 5, flaeche: 140,
  afaJaehrlich: 6400, steuersatzPct: 42, darlehensTyp: 'annuitaet', grundstueckswert: 80000,
};
{
  const heute = berechneSzenario(basis, KEINE_DELTAS);
  assert(near(heute.scNettoRendite, berechneNettomietrendite(HAUS), 0.0001), 'Szenarien-Tab: Nettorendite = Karte');
  assert(near(heute.scEkRendite, berechneEkRendite(HAUS)!, 0.0001), 'Szenarien-Tab: EK-Rendite = Karte');
  assert(near(heute.scCashflowVorSt, berechneCashflowVorSteuern(HAUS), 0.01), 'Szenarien-Tab: Cashflow vor Steuern = Karte');
  assert(near(heute.scNoiMonthly, 1600 + 250 - 250 - 120 - kalk), 'Überschuss vor Kredit: Verwaltungskosten abgezogen');

  const ohne = berechneSzenario({ ...basis, verwaltungskosten: 0 }, KEINE_DELTAS);
  assert(heute.scDSCR < ohne.scDSCR, 'DSCR sinkt mit Verwaltungskosten');
  const zins = STRESSTESTS.find(t => t.id === 'zins')!;
  assert(near(berechneSzenario({ ...basis, verwaltungskosten: 0 }, zins.deltas).scCashflowVorSt - berechneSzenario(basis, zins.deltas).scCashflowVorSt, 120),
    'Stresstest "Zinsen steigen": Verwaltungskosten zählen weiter');

  const report = baueReportDaten({
    adresse: 'Musterweg 1, 30159 Hannover', objekttyp: 'haus', flaeche: 140, zimmer: 5, baujahr: 1995,
    nebenkosten: { grunderwerbsteuer: 20000, notar: 8000, makler: 14280, grunderwerbsteuerPct: 5, notarPct: 2, maklerPct: 3.57 },
    basis, deltas: KEINE_DELTAS, anschaffungskosten: 442280,
    prognoseJahre: berechnePrognose(prognoseInput(120), 30).jahre,
    annahmen: { wertsteigerungPct: 1.5, mietInflationPct: 0, kostenInflationPct: 0, verkaufsNebenkostenPct: 5 },
    markt: { facts: null, mietDelta: null, kaufDelta: null, mietHtml: '', kaufHtml: '', lageHtml: '', fazitHtml: '' },
  });
  assert(report.monat.verwaltung === 120, 'PDF: Zeile Verwaltungskosten 120 €');
  assert(report.monat.hausgeldLabel === 'Umgelegte Nebenkosten', 'PDF: Haus zeigt "Umgelegte Nebenkosten" statt "Hausgeld gesamt"');
  assert(near(report.monat.kaltmiete + report.monat.umlage - report.monat.hausgeld - report.monat.verwaltung! - report.monat.kalkKosten, report.monat.noi),
    'PDF: Monatsrechnung bis zum Überschuss geht auf');
  assert(near(report.monat.noi - report.finanzierung.rateMonat, report.monat.cfVorSteuer, 0.01), 'PDF: Überschuss − Rate = Cashflow vor Steuern');
  assert(near(report.kpis.netto, berechneNettomietrendite(HAUS), 0.0001), 'PDF: Nettorendite = Karte');
}

console.log('\nAlle Verwaltungskosten-Tests bestanden.');
