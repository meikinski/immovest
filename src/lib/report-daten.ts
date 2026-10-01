import type { InvestmentReportData, MarktVergleich } from '@/components/pdf/InvestmentReportPDF';
import type { MarketFacts } from './marketFacts';
import type { PrognoseJahr } from './prognose-calculator';
import { baueMeilensteine, baueVerlauf } from './prognose-view';
import {
  berechnePuffer, berechneSzenario, hatAenderung, istGleich, KEINE_DELTAS, STRESSTESTS,
  type SzenarioBasis, type SzenarioDeltas,
} from './szenario';

const fmt = (n: number, d = 0) => n.toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });

/** HTML der KI-Texte in einfachen Text umwandeln */
export function htmlZuText(html: string): string {
  return (html || '')
    .replace(/<\/(p|li|h\d)>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Text auf ganze Sätze kürzen, damit er auf die PDF-Seite passt */
export function kuerzen(text: string, max: number): string {
  if (text.length <= max) return text;
  const schnitt = text.slice(0, max);
  const satzende = Math.max(schnitt.lastIndexOf('. '), schnitt.lastIndexOf('! '), schnitt.lastIndexOf('? '));
  if (satzende > max * 0.5) return schnitt.slice(0, satzende + 1);
  return `${schnitt.replace(/\s+\S*$/, '')} …`;
}

const FRAGE: Record<string, string> = {
  zins: 'Was passiert, wenn die Zinsen steigen?',
  miete: 'Was passiert, wenn die Miete sinkt?',
  preis: 'Was bringt ein verhandelter Preis?',
  ek: 'Was bringt mehr Eigenkapital?',
  worst: 'Was passiert, wenn alles schlecht läuft?',
};

const OBJEKTTYP: Record<string, string> = { wohnung: 'Eigentumswohnung', haus: 'Haus', mfh: 'Mehrfamilienhaus' };

function marktVergleich(
  eigen: number,
  facts: { median_psqm: number | null; range_psqm: { low: number; high: number } | null } | undefined,
  delta: number | null
): MarktVergleich | null {
  if (!(eigen > 0)) return null;
  const median = facts?.median_psqm ?? (delta != null ? eigen / (1 + delta / 100) : null);
  if (median == null) return null;
  return {
    eigen,
    median,
    low: facts?.range_psqm?.low ?? null,
    high: facts?.range_psqm?.high ?? null,
    delta: delta ?? ((eigen - median) / median) * 100,
  };
}

function szenarioBeschreibung(d: SzenarioDeltas): string {
  const teile: string[] = [];
  const pp = (v: number) => `${v > 0 ? '+' : '−'}${fmt(Math.abs(v), 1)}`;
  if (d.zinsPp) teile.push(`Zins ${pp(d.zinsPp)} %-Punkte`);
  if (d.tilgungPp) teile.push(`Tilgung ${pp(d.tilgungPp)} %-Punkte`);
  if (d.mietePct) teile.push(`Kaltmiete ${pp(d.mietePct)} %`);
  if (d.preisPct) teile.push(`Kaufpreis ${pp(d.preisPct)} %`);
  if (d.ekPct) teile.push(`Eigenkapital ${pp(d.ekPct)} %`);
  return teile.join(', ');
}

export interface ReportEingaben {
  adresse: string;
  objekttyp: string;
  flaeche: number;
  zimmer: number;
  baujahr?: number;
  nebenkosten: { grunderwerbsteuer: number; notar: number; makler: number; grunderwerbsteuerPct: number; notarPct: number; maklerPct: number };
  basis: SzenarioBasis;
  deltas: SzenarioDeltas;
  anschaffungskosten: number;
  prognoseJahre: PrognoseJahr[];
  annahmen: { wertsteigerungPct: number; mietInflationPct: number; kostenInflationPct: number; verkaufsNebenkostenPct: number };
  markt: {
    facts: MarketFacts | null;
    mietDelta: number | null;
    kaufDelta: number | null;
    mietHtml: string;
    kaufHtml: string;
    lageHtml: string;
    fazitHtml: string;
  };
}

export function baueReportDaten(e: ReportEingaben): InvestmentReportData {
  const b = e.basis;
  const heute = berechneSzenario(b, KEINE_DELTAS);

  // Ort aus der Adresse: "Straße 1, 04109 Leipzig" → Titel + Ort
  const teile = e.adresse.split(',').map(t => t.trim()).filter(Boolean);
  const titel = teile[0] || 'Immobilie';
  const ort = teile.slice(1).join(', ') || undefined;

  // Markt
  const facts = e.markt.facts;
  const mieteVgl = marktVergleich(e.flaeche > 0 ? b.miete / e.flaeche : 0, facts?.rent, e.markt.mietDelta);
  const kaufVgl = marktVergleich(e.flaeche > 0 ? b.kaufpreis / e.flaeche : 0, facts?.price, e.markt.kaufDelta);
  const lageText = kuerzen(htmlZuText(e.markt.lageHtml), 650);
  const fazit = kuerzen(htmlZuText(e.markt.fazitHtml), 600);
  const marktVorhanden = !!(mieteVgl || kaufVgl || lageText || fazit);
  const quellen = Array.from(new Set((facts?.citations ?? []).map(c => c.domain).filter(Boolean))).slice(0, 4);

  // Prognose
  const verlauf = baueVerlauf(e.prognoseJahre, {
    ek: b.ek,
    kaufpreis: b.kaufpreis,
    anschaffungskosten: e.anschaffungskosten,
    steuersatzPct: b.steuersatzPct,
    verkaufsNebenkostenPct: e.annahmen.verkaufsNebenkostenPct,
  });
  const meilensteine = baueMeilensteine(verlauf, { ek: b.ek, darlehensSumme: heute.scDarlehen })
    .filter(m => m.key !== 'steuerfrei')
    .map(m => ({ jahr: m.jahr, titel: m.titel }));
  const pz = (v: number) => `${fmt(v, 1)} %`;
  const annahmen = [
    `Wertsteigerung ${pz(e.annahmen.wertsteigerungPct)} pro Jahr`,
    e.annahmen.mietInflationPct ? `Miete +${pz(e.annahmen.mietInflationPct)} pro Jahr` : 'Miete konstant',
    e.annahmen.kostenInflationPct ? `Kosten +${pz(e.annahmen.kostenInflationPct)} pro Jahr` : 'Kosten konstant',
    b.darlehensTyp === 'annuitaet' ? 'Annuitätendarlehen mit gleichbleibender Rate' : 'Darlehen mit sinkender Rate',
    `Steuersatz ${pz(b.steuersatzPct)}`,
  ].join(', ') + '.';

  // Stresstest: das Szenario aus dem Tab, sonst "Zinsen steigen"
  const eigenes = hatAenderung(e.deltas);
  const test = eigenes ? STRESSTESTS.find(t => istGleich(t.deltas, e.deltas)) : STRESSTESTS[0];
  const deltas = eigenes ? e.deltas : STRESSTESTS[0].deltas;
  const sc = berechneSzenario(b, deltas);
  const puffer = berechnePuffer(b, KEINE_DELTAS);

  return {
    erstelltAm: new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    objekt: {
      adresse: titel,
      ort,
      objekttyp: OBJEKTTYP[e.objekttyp] ?? 'Immobilie',
      flaeche: e.flaeche,
      zimmer: e.zimmer,
      baujahr: e.baujahr || undefined,
    },
    kauf: {
      kaufpreis: b.kaufpreis,
      grunderwerbsteuer: e.nebenkosten.grunderwerbsteuer,
      grunderwerbsteuerPct: e.nebenkosten.grunderwerbsteuerPct,
      notar: e.nebenkosten.notar,
      notarPct: e.nebenkosten.notarPct,
      makler: e.nebenkosten.makler,
      maklerPct: e.nebenkosten.maklerPct,
      sonstige: b.sonstigeKosten,
      gesamt: heute.scAnschaffung,
    },
    finanzierung: {
      ek: b.ek,
      darlehen: heute.scDarlehen,
      zins: b.zins,
      tilgung: b.tilgung,
      darlehensTyp: b.darlehensTyp,
      rateMonat: heute.scRateMonat,
      zinsMonat: heute.scZinsMonat,
      tilgungMonat: heute.scTilgungMonat,
      abzahlungsjahr: heute.scAbzahlungsjahr || null,
    },
    monat: {
      kaltmiete: b.miete,
      umlage: b.hausgeldUmlegbar,
      hausgeld: b.hausgeld,
      kalkKosten: heute.scKalkKostenMon,
      noi: heute.scNoiMonthly,
      cfVorSteuer: heute.scCashflowVorSt,
      steuer: heute.scSteuerMonat,
      cfNachSteuer: heute.scCashflowAfterTax,
      steuersatz: b.steuersatzPct,
    },
    kpis: {
      brutto: heute.scBruttoRendite,
      netto: heute.scNettoRendite,
      ekRendite: heute.scEkRendite,
      dscr: heute.scDSCR,
      ekQuote: heute.scEkQuote,
    },
    markt: marktVorhanden ? {
      miete: mieteVgl,
      kauf: kaufVgl,
      mietText: kuerzen(htmlZuText(e.markt.mietHtml), 260),
      kaufText: kuerzen(htmlZuText(e.markt.kaufHtml), 260),
      lageText,
      fazit,
      treiber: (facts?.demand?.drivers ?? []).filter(Boolean),
      leerstand: facts?.vacancy?.risk ? { risiko: facts.vacancy.risk, quote: facts.vacancy.rate ?? null } : null,
      quellen,
    } : null,
    prognose: verlauf.length > 1 ? {
      zeilen: verlauf.map(j => ({
        jahr: j.jahr,
        wert: j.immobilienwert,
        restschuld: j.restschuld,
        anteil: j.anteilWohnung,
        konto: j.konto,
        vermoegen: j.vermoegen,
      })),
      meilensteine,
      annahmen,
    } : null,
    stresstest: {
      titel: test ? test.titel : 'Eigenes Szenario',
      frage: test ? FRAGE[test.id] : 'Was passiert in deinem Szenario?',
      beschreibung: szenarioBeschreibung(deltas),
      zeilen: [
        { label: 'Zinssatz', heute: heute.scZins, szenario: sc.scZins, unit: '%', digits: 2, higherIsBetter: false },
        { label: 'Kaltmiete pro Monat', heute: heute.scMiete, szenario: sc.scMiete, unit: '€', digits: 0, higherIsBetter: true },
        { label: 'Kreditrate pro Monat', heute: heute.scRateMonat, szenario: sc.scRateMonat, unit: '€', digits: 0, higherIsBetter: false },
        { label: 'Cashflow nach Steuern', heute: heute.scCashflowAfterTax, szenario: sc.scCashflowAfterTax, unit: '€', digits: 0, higherIsBetter: true, hervorheben: true },
        { label: 'Kapitaldienstdeckung (DSCR)', heute: heute.scDSCR, szenario: sc.scDSCR, unit: '', digits: 2, higherIsBetter: true },
        { label: 'EK-Rendite', heute: heute.scEkRendite, szenario: sc.scEkRendite, unit: '%', digits: 1, higherIsBetter: true },
      ],
      schuldenfrei: { heute: heute.scAbzahlungsjahr || null, szenario: sc.scAbzahlungsjahr || null },
      cfHeute: heute.scCashflowAfterTax,
      cfSzenario: sc.scCashflowAfterTax,
      puffer: { ...puffer, zinsHeute: b.zins, mieteHeute: b.miete },
    },
  };
}
