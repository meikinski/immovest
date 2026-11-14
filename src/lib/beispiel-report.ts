/**
 * Beispielwohnung der Startseite als Report-Daten.
 *
 * Gleiche Eingaben wie die Beispielkarte im Hero (2-Zimmer-Wohnung, Leipzig-Süd, 48 m², 100.000 €, Baujahr 1995).
 * Daraus entstehen mit dem echten Rechenweg der App die Zahlen, die auf der Startseite stehen.
 * Wird von `npm run sample-report` genutzt, um PDF und Vorschaubilder in /public zu erzeugen.
 */

import type { InvestmentReportData } from '@/components/pdf/InvestmentReportPDF';
import type { MarketFacts } from './marketFacts';
import { berechnePrognose } from './prognose-calculator';
import { baueReportDaten, type ReportEingaben } from './report-daten';
import { berechneNebenkosten } from './calculations';
import { berechneSzenario, KEINE_DELTAS, type SzenarioBasis } from './szenario';

export const BEISPIEL_BASIS: SzenarioBasis = {
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
  verwaltungskosten: 0,
  instandhaltungProQmJahr: 10,
  instandKalkProQmJahr: 10,
  mietausfallPct: 2,
  flaeche: 48,
  afaJaehrlich: 1600,
  steuersatzPct: 42,
  darlehensTyp: 'annuitaet',
  grundstueckswert: 20000,
};

const ANNAHMEN = { wertsteigerungPct: 1.5, mietInflationPct: 0, kostenInflationPct: 0, verkaufsNebenkostenPct: 5 };

// Marktwerte wie auf der Startseite: Miete 20,00 €/m² statt 9,50 €, Kaufpreis 2.083 €/m² bei rund 2.900 € Markt
const BEISPIEL_MARKT: MarketFacts = {
  location: { postal_code: null, district: 'Leipzig-Süd', notes: null },
  rent: { median_psqm: 9.5, range_psqm: { low: 8, high: 11.5 } },
  price: { median_psqm: 2900, range_psqm: { low: 2300, high: 3500 } },
  vacancy: { risk: 'niedrig', rate: null },
  demand: { drivers: ['Universität & Kliniken', 'S-Bahn-Anbindung', 'Zuzug junger Haushalte', 'Grünflächen'] },
  citations: [],
};

export function beispielEingaben(): ReportEingaben {
  const b = BEISPIEL_BASIS;
  const heute = berechneSzenario(b, KEINE_DELTAS);
  const nk = berechneNebenkosten(b.kaufpreis, b.grunderwerbsteuerPct, b.notarPct, b.maklerPct);

  // Gleiche Prognose-Rechnung wie im Analyse-Schritt (30 angezeigte Jahre)
  const prognoseJahre = berechnePrognose(
    {
      startJahr: new Date().getFullYear(),
      darlehensSumme: heute.scDarlehen,
      ek: b.ek,
      zins: b.zins,
      tilgung: b.tilgung,
      warmmiete: b.miete + b.hausgeldUmlegbar,
      hausgeld: b.hausgeld,
      verwaltungskosten: b.verwaltungskosten,
      kalkKostenMonthly: heute.scKalkKostenMon,
      afaJaehrlich: b.afaJaehrlich,
      steuersatz: b.steuersatzPct,
      immobilienwert: b.kaufpreis,
      wertsteigerungPct: ANNAHMEN.wertsteigerungPct,
      darlehensTyp: b.darlehensTyp,
      mietInflationPct: ANNAHMEN.mietInflationPct,
      kostenInflationPct: ANNAHMEN.kostenInflationPct,
      verkaufsNebenkostenPct: ANNAHMEN.verkaufsNebenkostenPct,
      kaufpreis: b.kaufpreis,
      grundstueckswert: b.grundstueckswert,
      wohnflaeche: b.flaeche,
    },
    60
  ).jahre.slice(0, 31);

  return {
    adresse: '2-Zimmer-Wohnung, Leipzig-Süd',
    objekttyp: 'wohnung',
    flaeche: b.flaeche,
    zimmer: 2,
    baujahr: 1995,
    nebenkosten: {
      grunderwerbsteuer: nk.grunderwerbsteuer_eur,
      notar: nk.notar_eur,
      makler: nk.makler_eur,
      grunderwerbsteuerPct: b.grunderwerbsteuerPct,
      notarPct: b.notarPct,
      maklerPct: b.maklerPct,
    },
    basis: b,
    deltas: KEINE_DELTAS,
    anschaffungskosten: heute.scAnschaffung,
    prognoseJahre,
    annahmen: ANNAHMEN,
    markt: {
      facts: BEISPIEL_MARKT,
      mietDelta: null,
      kaufDelta: null,
      kaufHtml: '<p>Der Kaufpreis liegt deutlich unter vergleichbaren Wohnungen im Viertel. Das schafft Spielraum, falls die Miete nach einem Mieterwechsel sinkt.</p>',
      mietHtml: '<p>Die aktuelle Kaltmiete liegt weit über dem, was für vergleichbare Wohnungen gezahlt wird. Bei Neuvermietung ist mit einer deutlich niedrigeren Miete zu rechnen.</p>',
      lageHtml: '<p>Ruhige Wohnstraße in Leipzig-Süd mit Altbau- und Nachwendebebauung. Straßenbahn, Einkauf und Grünflächen sind zu Fuß erreichbar, die Innenstadt in rund 15 Minuten. Die Nachfrage nach kleinen Wohnungen ist durch Studierende, Klinikpersonal und junge Berufstätige stabil.</p>',
      fazitHtml: '<p>Günstiger Einstieg in gefragter Lage. Die Rechnung trägt sich heute klar, hängt aber an einer Miete, die über dem Markt liegt. Rechne beim Kauf mit dem Stresstest „Miete sinkt“ und verhandle den Preis mit diesem Argument.</p>',
    },
  };
}

export function baueBeispielReport(): InvestmentReportData {
  return { ...baueReportDaten(beispielEingaben()), beispiel: true };
}
