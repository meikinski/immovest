/**
 * Manuelle Tests für die Aufbereitung der PDF-Daten
 *
 * Ausführen mit `npx tsx src/lib/__tests__/report-daten.test.ts`
 */

import { berechnePrognose } from '../prognose-calculator';
import { baueReportDaten, htmlZuText, kuerzen } from '../report-daten';
import { berechneSzenario, KEINE_DELTAS, STRESSTESTS, type SzenarioBasis } from '../szenario';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAILED: ${message}`);
  }
  console.log(`✓ ${message}`);
}

assert(htmlZuText('<p>Gute&nbsp;Lage.</p><p>Wenig Leerstand.</p>') === 'Gute Lage. Wenig Leerstand.', 'HTML wird zu Text');
assert(kuerzen('Kurz.', 50) === 'Kurz.', 'Kurzer Text bleibt unverändert');
const lang = 'Erster Satz ist hier. Zweiter Satz ist auch da. Dritter Satz ist sehr lang und passt nicht mehr hinein.';
assert(kuerzen(lang, 60) === 'Erster Satz ist hier. Zweiter Satz ist auch da.', 'Kürzen endet an einem Satzende');

const basis: SzenarioBasis = {
  kaufpreis: 100000, miete: 960, ek: 20000, zins: 3.5, tilgung: 2, grunderwerbsteuerPct: 5.5, notarPct: 2, maklerPct: 3.57,
  sonstigeKosten: 1000, hausgeld: 180, hausgeldUmlegbar: 150, instandhaltungProQmJahr: 10, instandKalkProQmJahr: 10,
  mietausfallPct: 2, flaeche: 48, afaJaehrlich: 1600, steuersatzPct: 42, darlehensTyp: 'annuitaet', grundstueckswert: 20000,
};
const heute = berechneSzenario(basis);
const jahre = berechnePrognose({
  startJahr: 2026, darlehensSumme: heute.scDarlehen, ek: 20000, zins: 3.5, tilgung: 2, warmmiete: 1110, hausgeld: 180,
  kalkKostenMonthly: heute.scKalkKostenMon, afaJaehrlich: 1600, steuersatz: 42, immobilienwert: 100000, wertsteigerungPct: 1.5,
}, 30).jahre;
const eingaben = {
  adresse: 'Musterstraße 12, 04109 Leipzig', objekttyp: 'wohnung', flaeche: 48, zimmer: 2, baujahr: 1995,
  nebenkosten: { grunderwerbsteuer: 5500, notar: 2000, makler: 3570, grunderwerbsteuerPct: 5.5, notarPct: 2, maklerPct: 3.57 },
  basis, deltas: KEINE_DELTAS, anschaffungskosten: heute.scAnschaffung, prognoseJahre: jahre,
  annahmen: { wertsteigerungPct: 1.5, mietInflationPct: 0, kostenInflationPct: 0, verkaufsNebenkostenPct: 5 },
  markt: { facts: null, mietDelta: 110, kaufDelta: null, mietHtml: '', kaufHtml: '', lageHtml: '', fazitHtml: '' },
};

const d = baueReportDaten(eingaben);
assert(d.objekt.adresse === 'Musterstraße 12' && d.objekt.ort === '04109 Leipzig', 'Adresse wird in Straße und Ort geteilt');
assert(d.objekt.objekttyp === 'Eigentumswohnung', 'Objekttyp wird lesbar benannt');
assert(Math.abs(d.kauf.gesamt - 112070) < 0.5, 'Gesamtinvestition = Kaufpreis + Nebenkosten');
assert(Math.abs(d.monat.cfNachSteuer - heute.scCashflowAfterTax) < 0.01, 'PDF-Cashflow = Szenarien-Tab ohne Änderung');
assert(Math.abs(d.monat.noi - d.finanzierung.rateMonat - d.monat.cfVorSteuer) < 0.01, 'Monatsrechnung geht auf');
assert(d.markt !== null && d.markt.miete !== null && Math.abs(d.markt.miete.median! - 20 / 2.1) < 0.01, 'Markt-Median wird aus der Abweichung zurückgerechnet');
assert(d.markt!.kauf === null, 'Ohne Kaufpreis-Daten kein Kaufpreis-Vergleich');
assert(d.prognose !== null && d.prognose.zeilen.length === 30, 'Prognose mit 30 Jahresend-Werten');
assert(d.stresstest!.titel === STRESSTESTS[0].titel, 'Ohne eigenes Szenario: Stresstest "Zinsen steigen"');

const eigen = baueReportDaten({ ...eingaben, deltas: { ...KEINE_DELTAS, preisPct: -5 } });
assert(eigen.stresstest!.titel === 'Preis verhandelt', 'Ein gewählter Stresstest wird übernommen');
const frei = baueReportDaten({ ...eingaben, deltas: { ...KEINE_DELTAS, zinsPp: 1, mietePct: -3 } });
assert(frei.stresstest!.titel === 'Eigenes Szenario' && frei.stresstest!.beschreibung.includes('Zins +1,0 %-Punkte'), 'Eigene Werte werden beschrieben');
const ohneMarkt = baueReportDaten({ ...eingaben, markt: { ...eingaben.markt, mietDelta: null } });
assert(ohneMarkt.markt === null, 'Ohne Marktdaten entfällt die Marktseite');

console.log('\nAlle Report-Tests bestanden.');
