import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
  Svg,
  Path,
  Line,
  Circle,
} from '@react-pdf/renderer';
import { join } from 'path';

// Inter wie in der App
const fontsDir = join(process.cwd(), 'public', 'fonts');
Font.register({
  family: 'Inter',
  fonts: [
    { src: join(fontsDir, 'Inter-Regular.ttf'), fontWeight: 400 },
    { src: join(fontsDir, 'Inter-SemiBold.ttf'), fontWeight: 600 },
    { src: join(fontsDir, 'Inter-Bold.ttf'), fontWeight: 700 },
    { src: join(fontsDir, 'Inter-ExtraBold.ttf'), fontWeight: 800 },
  ],
});
// Keine Silbentrennung mitten im Wort
Font.registerHyphenationCallback(word => [word]);

const C = {
  navy: '#001d3d',
  navy2: '#0b2b4f',
  orange: '#ff6b00',
  orangeLight: '#ffb07a',
  orangePale: '#fcd9bd',
  orangeSoft: '#fff3e8',
  ink: '#001d3d',
  ink2: '#475569',
  muted: '#94a3b8',
  line: '#e2e8f0',
  grid: '#f1f5f9',
  soft: '#f8fafc',
  good: '#059669',
  goodBg: '#ecfdf5',
  ok: '#b45309',
  okBg: '#fffbeb',
  amber: '#f59e0b',
  bad: '#dc2626',
  badBg: '#fef2f2',
  wohnung: '#1f63c9',
  konto: '#14946a',
  bank: '#cbd5e1',
  white: '#ffffff',
};

const PAGE_X = 42;
const CONTENT_W = 595.28 - PAGE_X * 2;

type Ton = 'good' | 'ok' | 'bad';
const TON: Record<Ton, { bg: string; fg: string }> = {
  good: { bg: C.goodBg, fg: C.good },
  ok: { bg: C.okBg, fg: C.ok },
  bad: { bg: C.badBg, fg: C.bad },
};

const s = StyleSheet.create({
  page: { fontFamily: 'Inter', fontSize: 9, color: C.ink, backgroundColor: C.white, paddingBottom: 56 },
  body: { paddingHorizontal: PAGE_X, paddingTop: 24, gap: 18 },
  // Kopf & Fuß
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: PAGE_X, paddingTop: 28 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  logo: { width: 20, height: 20 },
  brandText: { fontSize: 12, fontWeight: 800, letterSpacing: -0.3 },
  headMeta: { fontSize: 7.5, color: C.muted, textAlign: 'right' },
  headMetaStrong: { color: C.ink2, fontWeight: 600 },
  foot: {
    position: 'absolute', bottom: 22, left: PAGE_X, right: PAGE_X, flexDirection: 'row', justifyContent: 'space-between',
    paddingTop: 9, borderTopWidth: 1, borderTopColor: C.grid, fontSize: 7, color: C.muted,
  },
  // Typo
  eyebrow: { fontSize: 7.5, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', color: C.orange },
  h1: { fontSize: 21, fontWeight: 800, letterSpacing: -0.4, marginTop: 4, lineHeight: 1.15 },
  h2: { fontSize: 11, fontWeight: 800 },
  lead: { fontSize: 11, lineHeight: 1.5, color: C.ink2 },
  b: { fontWeight: 800, color: C.ink },
  small: { fontSize: 7.5, color: C.ink2 },
  hint: { fontSize: 7, color: C.muted },
  num: { fontWeight: 600 },
  // Bausteine
  box: { borderWidth: 1, borderColor: C.line, borderRadius: 9, padding: 14 },
  soft: { backgroundColor: C.soft, borderRadius: 9, padding: 14 },
  row: { flexDirection: 'row' },
  two: { flexDirection: 'row', gap: 16 },
  col: { flex: 1 },
  pill: { borderRadius: 99, paddingHorizontal: 6, paddingVertical: 2, fontSize: 6.8, fontWeight: 700 },
  // Deckblatt
  cover: { backgroundColor: C.navy, paddingHorizontal: PAGE_X, paddingTop: 30, paddingBottom: 30, gap: 26 },
  coverTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  coverTitle: { fontSize: 30, fontWeight: 800, color: C.white, letterSpacing: -0.6, marginTop: 6 },
  coverSub: { fontSize: 10, color: '#b8c4d3', marginTop: 6 },
  facts: { flexDirection: 'row', gap: 8 },
  fact: { flex: 1, backgroundColor: C.navy2, borderRadius: 8, paddingVertical: 9, paddingHorizontal: 10 },
  factLabel: { fontSize: 7, color: '#93a3b8' },
  factValue: { fontSize: 12, fontWeight: 700, color: C.white, marginTop: 2 },
  verdict: { flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: C.line, borderRadius: 9, padding: 14, borderLeftWidth: 4 },
  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kpi: { width: (CONTENT_W - 16) / 3, borderWidth: 1, borderColor: C.line, borderRadius: 9, padding: 11 },
  kpiHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 4 },
  kpiLabel: { fontSize: 7.5, fontWeight: 600, color: C.ink2 },
  kpiValue: { fontSize: 19, fontWeight: 700, letterSpacing: -0.4, marginTop: 8 },
  kpiUnit: { fontSize: 10, color: C.muted, fontWeight: 600 },
  // Listen
  kv: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: C.grid },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3.5, borderBottomWidth: 1, borderBottomColor: C.grid },
  calcSub: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, paddingHorizontal: 6, marginHorizontal: -6, backgroundColor: C.soft, borderRadius: 4 },
  calcTotal: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 7, marginTop: 2, borderTopWidth: 1.5, borderTopColor: C.ink },
  stack: { flexDirection: 'row', height: 12, borderRadius: 4, overflow: 'hidden', gap: 1.5 },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  legendKey: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  swatch: { width: 7, height: 7, borderRadius: 1.5 },
  // Tabellen
  th: { fontSize: 6.5, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  tr: { flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: C.grid },
});

// ---------------------------------------------------------------------------
// Daten
// ---------------------------------------------------------------------------

export type MarktVergleich = {
  eigen: number; // €/m²
  median: number | null;
  low: number | null;
  high: number | null;
  delta: number | null; // Abweichung vom Median in %
};

export type InvestmentReportData = {
  erstelltAm: string;
  objekt: {
    adresse: string;
    ort?: string;
    objekttyp: string;
    flaeche: number;
    zimmer: number;
    baujahr?: number;
  };
  kauf: {
    kaufpreis: number;
    grunderwerbsteuer: number;
    grunderwerbsteuerPct: number;
    notar: number;
    notarPct: number;
    makler: number;
    maklerPct: number;
    sonstige: number;
    gesamt: number;
  };
  finanzierung: {
    ek: number;
    darlehen: number;
    zins: number;
    tilgung: number;
    darlehensTyp: 'annuitaet' | 'degressiv';
    rateMonat: number;
    zinsMonat: number;
    tilgungMonat: number;
    abzahlungsjahr: number | null;
  };
  monat: {
    kaltmiete: number;
    umlage: number;
    hausgeld: number;
    kalkKosten: number;
    noi: number;
    cfVorSteuer: number;
    steuer: number; // negativ = Erstattung
    cfNachSteuer: number;
    steuersatz: number;
  };
  kpis: {
    brutto: number;
    netto: number;
    ekRendite: number;
    dscr: number;
    ekQuote: number;
  };
  markt: {
    miete: MarktVergleich | null;
    kauf: MarktVergleich | null;
    mietText: string;
    kaufText: string;
    lageText: string;
    fazit: string;
    treiber: string[];
    leerstand: { risiko: string; quote: number | null } | null;
    quellen: string[];
  } | null;
  prognose: {
    zeilen: Array<{ jahr: number; wert: number; restschuld: number; anteil: number; konto: number; vermoegen: number }>;
    meilensteine: Array<{ jahr: number; titel: string }>;
    annahmen: string;
  } | null;
  stresstest: {
    titel: string;
    frage: string;
    beschreibung: string;
    zeilen: Array<{ label: string; heute: number; szenario: number; unit: string; digits: number; higherIsBetter: boolean | null; hervorheben?: boolean }>;
    schuldenfrei: { heute: number | null; szenario: number | null };
    cfHeute: number;
    cfSzenario: number;
    puffer: { zinsBis: number | null; mieteBis: number | null; leerstandMonate: number | null; zinsHeute: number; mieteHeute: number };
  } | null;
};

// ---------------------------------------------------------------------------
// Helfer
// ---------------------------------------------------------------------------

const fmt = (n: number, d = 0) =>
  new Intl.NumberFormat('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
const eur = (n: number, d = 0) => `${fmt(n, d)} €`;
const pct = (n: number, d = 1) => `${fmt(n, d)} %`;
const vz = (n: number) => (n < 0 ? '−' : '+');

function Pill({ ton, children }: { ton: Ton; children: string }) {
  return <Text style={[s.pill, { backgroundColor: TON[ton].bg, color: TON[ton].fg }]}>{children}</Text>;
}

function SectionTitle({ nr, children }: { nr?: number; children: string }) {
  return (
    <View style={[s.row, { alignItems: 'center', gap: 6, marginBottom: 8 }]}>
      {nr !== undefined && (
        <View style={{ width: 15, height: 15, borderRadius: 4, backgroundColor: C.orangeSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 7.5, fontWeight: 800, color: C.orange }}>{nr}</Text>
        </View>
      )}
      <Text style={s.h2}>{children}</Text>
    </View>
  );
}

function Head({ adresse }: { adresse: string }) {
  const logoPath = join(process.cwd(), 'public', 'logo-192.png');
  return (
    <View style={s.head}>
      <View style={s.brand}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={logoPath} style={s.logo} />
        <Text style={s.brandText}>imvestr</Text>
      </View>
      <View>
        <Text style={[s.headMeta, s.headMetaStrong]}>{adresse}</Text>
        <Text style={s.headMeta}>Investment-Report</Text>
      </View>
    </View>
  );
}

function Foot({ text }: { text: string }) {
  return (
    <View style={s.foot} fixed>
      <Text>{text}</Text>
      <Text render={({ pageNumber, totalPages }) => `Seite ${pageNumber} von ${totalPages}`} />
    </View>
  );
}

function Title({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <View>
      <Text style={s.eyebrow}>{eyebrow}</Text>
      <Text style={s.h1}>{title}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Bewertungen (gleiche Schwellen wie in der App)
// ---------------------------------------------------------------------------

const rateCf = (v: number): [Ton, string] => (v > 10 ? ['good', 'Positiv'] : v >= -10 ? ['ok', 'Ausgeglichen'] : ['bad', 'Negativ']);
const rateDscr = (v: number): [Ton, string] => (v >= 1.2 ? ['good', 'Komfortabel'] : v >= 1 ? ['ok', 'Knapp'] : ['bad', 'Kritisch']);
const rateEkQuote = (v: number): [Ton, string] => (v >= 25 ? ['good', 'Stark'] : v >= 15 ? ['ok', 'Solide'] : ['bad', 'Niedrig']);
const rateBrutto = (v: number): [Ton, string] => (v >= 5 ? ['good', 'Stark'] : v >= 4 ? ['ok', 'Solide'] : ['bad', 'Niedrig']);
const rateNetto = (v: number): [Ton, string] => (v >= 3 ? ['good', v >= 4 ? 'Stark' : 'Solide'] : v >= 2 ? ['ok', 'Moderat'] : ['bad', 'Niedrig']);
const rateEkRendite = (v: number): [Ton, string] => (v >= 6 ? ['good', 'Stark'] : v >= 3 ? ['ok', 'Moderat'] : ['bad', 'Niedrig']);

function marktInfo(kind: 'miete' | 'kauf', delta: number | null): { ton: Ton | 'neutral'; label: string } | null {
  if (delta === null) return null;
  const abs = Math.round(Math.abs(delta));
  if (abs <= 5) return { ton: 'neutral', label: 'Marktüblich' };
  if (kind === 'miete') {
    return delta > 0 ? { ton: delta > 15 ? 'bad' : 'ok', label: `${abs} % über Markt` } : { ton: 'good', label: `${abs} % unter Markt` };
  }
  return delta > 0 ? { ton: delta > 10 ? 'bad' : 'ok', label: `${abs} % über Markt` } : { ton: 'good', label: `${abs} % unter Markt` };
}

// ---------------------------------------------------------------------------
// Seiten
// ---------------------------------------------------------------------------

function KpiCard({ label, value, unit, rating, caption, colorValue }: {
  label: string; value: string; unit?: string; rating: [Ton, string]; caption: string; colorValue?: boolean;
}) {
  return (
    <View style={s.kpi}>
      <View style={s.kpiHead}>
        <Text style={s.kpiLabel}>{label}</Text>
        <Pill ton={rating[0]}>{rating[1]}</Pill>
      </View>
      <Text style={[s.kpiValue, colorValue ? { color: TON[rating[0]].fg } : {}]}>
        {value}{unit ? <Text style={s.kpiUnit}> {unit}</Text> : null}
      </Text>
      <Text style={[s.hint, { marginTop: 3 }]}>{caption}</Text>
    </View>
  );
}

function Deckblatt({ d }: { d: InvestmentReportData }) {
  const logoPath = join(process.cwd(), 'public', 'logo-192.png');
  const cf = d.monat.cfNachSteuer;
  const dscr = d.kpis.dscr;
  const verdictTon: Ton = cf >= 0 && dscr >= 1.2 ? 'good' : cf >= 0 ? 'ok' : 'bad';
  const verdictTitel = verdictTon === 'good'
    ? 'Auf einen Blick: trägt sich ab dem ersten Monat'
    : verdictTon === 'ok'
      ? 'Auf einen Blick: trägt sich, aber knapp'
      : `Auf einen Blick: monatlich ${eur(-cf)} Zuzahlung`;

  // Hauptrisiko aus den vorhandenen Daten ableiten
  const mietDelta = d.markt?.miete?.delta ?? null;
  const kaufDelta = d.markt?.kauf?.delta ?? null;
  let risiko: string | null = null;
  if (mietDelta !== null && mietDelta > 15) {
    risiko = `Hauptrisiko: Die Kaltmiete liegt ${Math.round(mietDelta)} % über dem örtlichen Markt. Bei einem Mieterwechsel kann sie sinken.`;
  } else if (kaufDelta !== null && kaufDelta > 10) {
    risiko = `Hauptrisiko: Der Kaufpreis liegt ${Math.round(kaufDelta)} % über dem örtlichen Markt.`;
  } else if (dscr < 1.2) {
    risiko = 'Hauptrisiko: Die Miete deckt die Kreditrate nur knapp. Steigende Kosten oder Leerstand wirken sich schnell aus.';
  } else if (d.kpis.ekQuote < 10) {
    risiko = 'Hinweis: Die Eigenkapitalquote ist niedrig. Banken verlangen dann oft höhere Zinsen.';
  }

  const vermoegen30 = d.prognose?.zeilen[d.prognose.zeilen.length - 1]?.vermoegen;
  const objektZeile = [d.objekt.ort, `${fmt(d.objekt.flaeche)} m²`, `${fmt(d.objekt.zimmer)} Zimmer`, d.objekt.baujahr ? `Baujahr ${d.objekt.baujahr}` : null]
    .filter(Boolean).join(' · ');

  return (
    <Page size="A4" style={s.page}>
      <View style={s.cover}>
        <View style={s.coverTop}>
          <View style={s.brand}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={logoPath} style={{ width: 24, height: 24 }} />
            <Text style={[s.brandText, { color: C.white, fontSize: 13 }]}>imvestr</Text>
          </View>
          <View>
            <Text style={[s.headMeta, { color: '#93a3b8' }]}>Investment-Report</Text>
            <Text style={[s.headMeta, { color: '#93a3b8' }]}>Erstellt am {d.erstelltAm}</Text>
          </View>
        </View>
        <View>
          <Text style={[s.eyebrow, { color: C.orangeLight }]}>Kapitalanlage · {d.objekt.objekttyp}</Text>
          <Text style={s.coverTitle}>{d.objekt.adresse}</Text>
          <Text style={s.coverSub}>{objektZeile}</Text>
        </View>
        <View style={s.facts}>
          {[
            ['Kaufpreis', eur(d.kauf.kaufpreis)],
            ['Gesamtinvestition', eur(d.kauf.gesamt)],
            ['Eigenkapital', eur(d.finanzierung.ek)],
            ['Darlehen', eur(d.finanzierung.darlehen)],
          ].map(([k, v]) => (
            <View key={k} style={s.fact}>
              <Text style={s.factLabel}>{k}</Text>
              <Text style={s.factValue}>{v}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[s.body, { paddingTop: 26 }]}>
        <View style={[s.verdict, { borderLeftColor: TON[verdictTon].fg }]}>
          <View style={{ width: 26, height: 26, borderRadius: 7, backgroundColor: TON[verdictTon].bg, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: 800, color: TON[verdictTon].fg }}>{verdictTon === 'good' ? '✓' : '!'}</Text>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: 800 }}>{verdictTitel}</Text>
            <Text style={{ fontSize: 9, color: C.ink2, lineHeight: 1.5 }}>
              {cf >= 0 ? 'Nach Kreditrate, Kosten und Steuern bleiben ' : 'Nach Kreditrate, Kosten und Steuern fehlen '}
              <Text style={s.b}>{eur(Math.abs(cf))} pro Monat</Text>
              {cf >= 0 ? '. ' : ', die du aus deinem Einkommen zahlst. '}
              Die Mieteinnahmen decken die Kreditrate <Text style={s.b}>{fmt(dscr, 1)}-fach</Text>, Banken erwarten meist mindestens 1,2.
            </Text>
            {risiko && <Text style={{ fontSize: 9, color: C.ink2, lineHeight: 1.5 }}>{risiko}</Text>}
          </View>
        </View>

        <View>
          <Text style={[s.h2, { marginBottom: 9 }]}>Kennzahlen</Text>
          <View style={s.kpis}>
            <KpiCard label="Cashflow nach Steuern" value={fmt(cf)} unit="€" rating={rateCf(cf)} caption="pro Monat, frei verfügbar" colorValue />
            <KpiCard label="Kapitaldienstdeckung" value={fmt(dscr, 2)} rating={rateDscr(dscr)} caption="Miete ÷ Kreditrate (DSCR)" />
            <KpiCard label="Eigenkapitalquote" value={fmt(d.kpis.ekQuote, 1)} unit="%" rating={rateEkQuote(d.kpis.ekQuote)} caption="am Gesamtinvest" />
            <KpiCard label="Bruttomietrendite" value={fmt(d.kpis.brutto, 1)} unit="%" rating={rateBrutto(d.kpis.brutto)} caption="Jahreskaltmiete ÷ Gesamtinvest" />
            <KpiCard label="Nettomietrendite" value={fmt(d.kpis.netto, 1)} unit="%" rating={rateNetto(d.kpis.netto)} caption="nach laufenden Kosten" />
            <KpiCard label="EK-Rendite" value={fmt(d.kpis.ekRendite, 1)} unit="%" rating={rateEkRendite(d.kpis.ekRendite)} caption="auf dein Eigenkapital, 1. Jahr" />
          </View>
        </View>

        <View style={[s.soft, s.row, { gap: 10 }]}>
          {[
            ['Kreditrate', `${eur(d.finanzierung.rateMonat)}/Monat`],
            ['Zins / Tilgung', `${pct(d.finanzierung.zins, 2)} / ${pct(d.finanzierung.tilgung, 2)}`],
            ['Schuldenfrei', d.finanzierung.abzahlungsjahr ? String(d.finanzierung.abzahlungsjahr) : 'nach 60 Jahren'],
            ...(vermoegen30 !== undefined ? [['Vermögen in 30 Jahren', eur(vermoegen30)]] : []),
          ].map(([k, v]) => (
            <View key={k} style={s.col}>
              <Text style={s.small}>{k}</Text>
              <Text style={{ fontSize: 11.5, fontWeight: 700, marginTop: 2 }}>{v}</Text>
            </View>
          ))}
        </View>
      </View>
      <Foot text="Erstellt mit imvestr.de · Prognosen sind keine Garantie, siehe Hinweise am Ende" />
    </Page>
  );
}

function Finanzierung({ d }: { d: InvestmentReportData }) {
  const k = d.kauf;
  const teile = [
    { label: 'Kaufpreis', wert: k.kaufpreis, farbe: C.navy },
    { label: `Grunderwerbsteuer ${pct(k.grunderwerbsteuerPct, 1)}`, wert: k.grunderwerbsteuer, farbe: C.orange },
    { label: `Makler ${pct(k.maklerPct, 2)}`, wert: k.makler, farbe: C.orangeLight },
    { label: `Notar & Grundbuch ${pct(k.notarPct, 1)}`, wert: k.notar, farbe: C.orangePale },
    { label: 'Sonstiges', wert: k.sonstige, farbe: C.muted },
  ].filter(t => t.wert > 0);
  const f = d.finanzierung;
  const m = d.monat;
  const ekAnteil = k.gesamt > 0 ? Math.max(0, Math.min(1, f.ek / k.gesamt)) : 0;
  const dscrPos = Math.max(0, Math.min(1, d.kpis.dscr / 3));

  const objekt: Array<[string, string]> = [
    ['Adresse', [d.objekt.adresse, d.objekt.ort].filter(Boolean).join(', ')],
    ['Objektart', d.objekt.objekttyp],
    ['Wohnfläche', `${fmt(d.objekt.flaeche)} m²`],
    ['Zimmer', fmt(d.objekt.zimmer)],
    ...(d.objekt.baujahr ? [['Baujahr', String(d.objekt.baujahr)] as [string, string]] : []),
    ['Kaufpreis pro m²', d.objekt.flaeche > 0 ? eur(k.kaufpreis / d.objekt.flaeche) : '–'],
    ['Kaltmiete pro m²', d.objekt.flaeche > 0 ? eur(m.kaltmiete / d.objekt.flaeche, 2) : '–'],
  ];

  const CalcRow = ({ label, value, hint }: { label: string; value: number; hint?: string }) => (
    <View style={s.calcRow}>
      <View>
        <Text>{label}</Text>
        {hint && <Text style={s.hint}>{hint}</Text>}
      </View>
      <Text style={s.num}>{value < 0 ? `−${eur(-value)}` : eur(value)}</Text>
    </View>
  );

  return (
    <Page size="A4" style={s.page}>
      <Head adresse={d.objekt.adresse} />
      <View style={s.body}>
        <Title eyebrow="Objekt & Finanzierung" title="Was kostet die Wohnung?" />
        <View style={s.two}>
          <View style={s.col}>
            <SectionTitle nr={1}>Objektdaten</SectionTitle>
            {objekt.map(([kk, v], i) => (
              <View key={kk} style={[s.kv, i === objekt.length - 1 ? { borderBottomWidth: 0 } : {}]}>
                <Text style={{ color: C.ink2 }}>{kk}</Text>
                <Text style={[s.num, { maxWidth: 150, textAlign: 'right' }]}>{v}</Text>
              </View>
            ))}
          </View>
          <View style={s.col}>
            <SectionTitle nr={2}>Gesamtinvestition</SectionTitle>
            <View style={s.stack}>
              {teile.map(t => <View key={t.label} style={{ width: `${(t.wert / k.gesamt) * 100}%`, backgroundColor: t.farbe }} />)}
            </View>
            <View style={{ marginTop: 6 }}>
              {teile.map(t => (
                <View key={t.label} style={s.legendRow}>
                  <View style={s.legendKey}><View style={[s.swatch, { backgroundColor: t.farbe }]} /><Text style={{ color: C.ink2 }}>{t.label}</Text></View>
                  <Text style={s.num}>{eur(t.wert)}</Text>
                </View>
              ))}
              <View style={[s.legendRow, { marginTop: 7 }]}>
                <Text style={{ fontWeight: 800 }}>Gesamt</Text>
                <Text style={{ fontWeight: 800 }}>{eur(k.gesamt)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={s.box}>
          <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
            <SectionTitle nr={3}>Finanzierungsstruktur</SectionTitle>
            <Text style={[s.small, { marginBottom: 8 }]}>
              {f.darlehensTyp === 'annuitaet' ? 'Annuitätendarlehen' : 'Darlehen mit sinkender Rate'} · {pct(f.zins, 2)} Zins · {pct(f.tilgung, 2)} Tilgung
            </Text>
          </View>
          <View style={[s.stack, { height: 15 }]}>
            <View style={{ width: `${ekAnteil * 100}%`, backgroundColor: C.orange }} />
            <View style={{ width: `${(1 - ekAnteil) * 100}%`, backgroundColor: C.navy }} />
          </View>
          <View style={[s.row, { justifyContent: 'space-between', marginTop: 6 }]}>
            <Text><Text style={{ fontWeight: 700 }}>Eigenkapital</Text> {eur(f.ek)} · {pct(ekAnteil * 100)}</Text>
            <Text><Text style={{ fontWeight: 700 }}>Darlehen</Text> {eur(f.darlehen)} · {pct((1 - ekAnteil) * 100)}</Text>
          </View>
        </View>

        <View style={s.two}>
          <View style={s.col}>
            <SectionTitle nr={4}>Monatliche Rechnung (1. Jahr)</SectionTitle>
            <CalcRow label="Kaltmiete" value={m.kaltmiete} />
            {m.umlage > 0 && <CalcRow label="+ Umlagefähige Nebenkosten" value={m.umlage} />}
            <CalcRow label="− Hausgeld gesamt" value={-m.hausgeld} />
            <CalcRow label="− Rücklage & Mietausfall" value={-m.kalkKosten} />
            <View style={s.calcSub}><Text style={{ fontWeight: 700 }}>= Überschuss vor Kredit</Text><Text style={{ fontWeight: 800 }}>{eur(m.noi)}</Text></View>
            <CalcRow label="− Zinsen" value={-f.zinsMonat} />
            <CalcRow label="− Tilgung" value={-f.tilgungMonat} />
            <View style={s.calcSub}><Text style={{ fontWeight: 700 }}>= Cashflow vor Steuern</Text><Text style={{ fontWeight: 800 }}>{eur(m.cfVorSteuer)}</Text></View>
            <CalcRow
              label={m.steuer >= 0 ? '− Steuer auf Mietgewinn' : '+ Steuererstattung'}
              value={-m.steuer}
              hint={`nach Abzug von Zinsen und AfA, ${pct(m.steuersatz, 0)} Steuersatz`}
            />
            <View style={s.calcTotal}>
              <Text style={{ fontWeight: 800, fontSize: 10 }}>Cashflow nach Steuern</Text>
              <Text style={{ fontWeight: 800, fontSize: 10, color: m.cfNachSteuer >= 0 ? C.good : C.bad }}>{eur(m.cfNachSteuer)}</Text>
            </View>
          </View>
          <View style={[s.col, s.box]}>
            <SectionTitle nr={5}>Kapitaldienstfähigkeit</SectionTitle>
            <View style={[s.row, { gap: 12, alignItems: 'center' }]}>
              <Text style={{ fontSize: 28, fontWeight: 800, color: TON[rateDscr(d.kpis.dscr)[0]].fg, letterSpacing: -0.8 }}>{fmt(d.kpis.dscr, 2)}</Text>
              <Text style={[s.small, { flex: 1, lineHeight: 1.45 }]}>
                Der Überschuss vor Kredit ({eur(m.noi)}) deckt die Kreditrate ({eur(f.rateMonat)}) {fmt(d.kpis.dscr, 1)}-fach. Auf diese Kennzahl schauen Banken bei vermieteten Objekten zuerst.
              </Text>
            </View>
            <View style={{ marginTop: 16, position: 'relative', height: 9 }}>
              <View style={[s.row, { height: 9, borderRadius: 5, overflow: 'hidden' }]}>
                <View style={{ width: '33.3%', backgroundColor: C.bad }} />
                <View style={{ width: '6.7%', backgroundColor: C.amber }} />
                <View style={{ width: '60%', backgroundColor: C.good }} />
              </View>
              <View style={{ position: 'absolute', top: -5, left: `${dscrPos * 100}%`, width: 3, height: 19, marginLeft: -1.5, borderRadius: 2, backgroundColor: C.ink }} />
            </View>
            <View style={{ position: 'relative', height: 14, marginTop: 4 }}>
              <Text style={[s.hint, { position: 'absolute', left: 0 }]}>0</Text>
              <Text style={[s.hint, { position: 'absolute', left: '40%', marginLeft: -6 }]}>1,2</Text>
              <Text style={[s.hint, { position: 'absolute', right: 0 }]}>3,0</Text>
            </View>
            <Text style={s.hint}>Rot: Miete reicht nicht für die Rate · Gelb: knapp · Grün: komfortabel</Text>
          </View>
        </View>
      </View>
      <Foot text={`Erstellt mit imvestr.de am ${d.erstelltAm}`} />
    </Page>
  );
}

function MarktKarte({ kind, v, text }: { kind: 'miete' | 'kauf'; v: MarktVergleich; text: string }) {
  const digits = kind === 'miete' ? 2 : 0;
  const info = marktInfo(kind, v.delta);
  const werte = [v.eigen, v.median, v.low, v.high].filter((x): x is number => typeof x === 'number' && x > 0);
  const min = Math.min(...werte) * 0.85;
  const max = Math.max(...werte) * 1.1;
  const pos = (x: number) => `${((x - min) / (max - min)) * 100}%`;
  const markerFarbe = info && info.ton !== 'neutral' ? TON[info.ton].fg : C.navy;

  return (
    <View style={[s.col, s.box]}>
      <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={s.h2}>{kind === 'miete' ? 'Kaltmiete pro m²' : 'Kaufpreis pro m²'}</Text>
        {info && (info.ton === 'neutral'
          ? <Text style={[s.pill, { backgroundColor: C.grid, color: C.ink2 }]}>{info.label}</Text>
          : <Pill ton={info.ton}>{info.label}</Pill>)}
      </View>
      <View style={[s.row, { justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 }]}>
        <Text style={{ fontSize: 16, fontWeight: 700 }}>{eur(v.eigen, digits)}</Text>
        {v.median !== null && <Text style={s.small}>Markt: {eur(v.median, digits)}</Text>}
      </View>
      {werte.length > 1 && (
        <View style={{ marginTop: 14, height: 8, borderRadius: 4, backgroundColor: C.grid, position: 'relative' }}>
          {v.low !== null && v.high !== null && (
            <View style={{ position: 'absolute', top: 0, bottom: 0, left: pos(v.low), width: `${((v.high - v.low) / (max - min)) * 100}%`, borderRadius: 4, backgroundColor: C.bank }} />
          )}
          {v.median !== null && <View style={{ position: 'absolute', top: -3, left: pos(v.median), width: 2, height: 14, marginLeft: -1, backgroundColor: C.ink2 }} />}
          <View style={{ position: 'absolute', top: -4, left: pos(v.eigen), width: 16, height: 16, marginLeft: -8, borderRadius: 8, borderWidth: 3, borderColor: C.white, backgroundColor: markerFarbe }} />
        </View>
      )}
      <Text style={[s.hint, { marginTop: 8 }]}>
        {v.low !== null && v.high !== null ? `Marktspanne ${fmt(v.low, digits)}–${fmt(v.high, digits)} €/m² · Punkt: diese Wohnung · Strich: Median` : 'Punkt: diese Wohnung · Strich: Median'}
      </Text>
      {!!text && <Text style={[s.small, { marginTop: 8, lineHeight: 1.45 }]}>{text}</Text>}
    </View>
  );
}

function Markt({ d }: { d: InvestmentReportData }) {
  const mk = d.markt!;
  return (
    <Page size="A4" style={s.page}>
      <Head adresse={d.objekt.adresse} />
      <View style={s.body}>
        <Title eyebrow="Markt & Lage" title="Passen Preis und Miete zum Markt?" />
        {(mk.kauf || mk.miete) && (
          <View style={s.two}>
            {mk.kauf && <MarktKarte kind="kauf" v={mk.kauf} text={mk.kaufText} />}
            {mk.miete && <MarktKarte kind="miete" v={mk.miete} text={mk.mietText} />}
          </View>
        )}
        {(!!mk.lageText || mk.treiber.length > 0 || mk.leerstand) && (
          <View>
            <Text style={[s.h2, { marginBottom: 8 }]}>Lage</Text>
            {!!mk.lageText && <Text style={{ fontSize: 9.5, color: C.ink2, lineHeight: 1.55 }}>{mk.lageText}</Text>}
            {(mk.treiber.length > 0 || mk.leerstand) && (
              <View style={[s.row, { gap: 16, marginTop: 10 }]}>
                {mk.treiber.length > 0 && (
                  <View style={{ flex: 1 }}>
                    <Text style={[s.hint, { fontWeight: 700, marginBottom: 4 }]}>Nachfrage-Treiber</Text>
                    <View style={[s.row, { flexWrap: 'wrap', gap: 4 }]}>
                      {mk.treiber.slice(0, 6).map(t => (
                        <Text key={t} style={[s.pill, { backgroundColor: C.grid, color: C.ink2, fontWeight: 600 }]}>{t}</Text>
                      ))}
                    </View>
                  </View>
                )}
                {mk.leerstand && (
                  <View>
                    <Text style={[s.hint, { fontWeight: 700, marginBottom: 4 }]}>Leerstandsrisiko</Text>
                    <Pill ton={mk.leerstand.risiko === 'niedrig' ? 'good' : mk.leerstand.risiko === 'mittel' ? 'ok' : 'bad'}>
                      {`${mk.leerstand.risiko}${mk.leerstand.quote !== null ? ` · ${pct(mk.leerstand.quote)}` : ''}`}
                    </Pill>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
        {!!mk.fazit && (
          <View style={{ backgroundColor: C.navy, borderRadius: 9, padding: 14 }}>
            <Text style={[s.eyebrow, { color: C.orangeLight }]}>Einschätzung</Text>
            <Text style={{ fontSize: 9.5, color: '#dbe3ef', lineHeight: 1.55, marginTop: 5 }}>{mk.fazit}</Text>
          </View>
        )}
        <Text style={s.hint}>
          {mk.quellen.length > 0 ? `Quellen: ${mk.quellen.join(', ')}. ` : ''}Die Einschätzung wurde mit KI-Unterstützung aus öffentlich verfügbaren Daten erstellt und ersetzt kein Wertgutachten.
        </Text>
      </View>
      <Foot text={`Erstellt mit imvestr.de am ${d.erstelltAm}`} />
    </Page>
  );
}

function VermoegenChart({ zeilen }: { zeilen: NonNullable<InvestmentReportData['prognose']>['zeilen'] }) {
  const W = CONTENT_W;
  const H = 175;
  const m = { l: 40, r: 6, t: 8, b: 16 };
  const iw = W - m.l - m.r;
  const ih = H - m.t - m.b;
  const n = zeilen.length;
  const top = Math.max(...zeilen.map(z => Math.max(0, z.anteil) + Math.max(0, z.konto) + Math.max(0, z.restschuld)), 1);
  const stepV = top > 400000 ? 100000 : top > 150000 ? 50000 : top > 60000 ? 20000 : 10000;
  const max = Math.ceil(top / stepV) * stepV;
  const x = (i: number) => m.l + (n > 1 ? (iw * i) / (n - 1) : 0);
  const y = (v: number) => m.t + ih * (1 - v / max);
  const pfad = (pts: Array<[number, number]>) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');

  const schichten: Array<{ key: 'anteil' | 'konto' | 'restschuld'; farbe: string }> = [
    { key: 'anteil', farbe: C.wohnung }, { key: 'konto', farbe: C.konto }, { key: 'restschuld', farbe: C.bank },
  ];
  let basis = zeilen.map(() => 0);
  const flaechen = schichten.map(sch => {
    const oben = zeilen.map((z, i) => basis[i] + Math.max(0, z[sch.key]));
    const d = `${pfad(oben.map((v, i) => [x(i), y(v)]))} L${pfad(basis.map((v, i) => [x(i), y(v)] as [number, number]).reverse()).slice(1)} Z`;
    basis = oben;
    return { d, farbe: sch.farbe };
  });
  const linie = pfad(zeilen.map((z, i) => [x(i), y(Math.max(0, z.anteil) + Math.max(0, z.konto))]));
  const ticks: number[] = [];
  for (let v = 0; v <= max; v += stepV) ticks.push(v);
  const jahrTicks = zeilen.map((z, i) => ({ z, i })).filter(({ i }) => i === 0 || i === n - 1 || (i + 1) % 5 === 0);

  return (
    <View style={{ width: W, height: H, position: 'relative' }}>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {ticks.map(v => <Line key={v} x1={m.l} x2={W - m.r} y1={y(v)} y2={y(v)} stroke={C.grid} strokeWidth={0.8} />)}
        {flaechen.map(f => <Path key={f.farbe} d={f.d} fill={f.farbe} stroke={C.white} strokeWidth={1} />)}
        <Path d={linie} fill="none" stroke={C.navy} strokeWidth={1.6} />
        <Circle cx={x(n - 1)} cy={y(Math.max(0, zeilen[n - 1].anteil) + Math.max(0, zeilen[n - 1].konto))} r={3} fill={C.navy} stroke={C.white} strokeWidth={1} />
      </Svg>
      {ticks.map(v => (
        <Text key={v} style={[s.hint, { position: 'absolute', left: 0, width: m.l - 6, textAlign: 'right', top: y(v) - 4 }]}>
          {v === 0 ? '0 €' : `${fmt(v / 1000)} T€`}
        </Text>
      ))}
      {jahrTicks.map(({ z, i }) => (
        <Text key={z.jahr} style={[s.hint, { position: 'absolute', top: H - 11, left: x(i) - 15, width: 30, textAlign: 'center' }]}>{z.jahr}</Text>
      ))}
    </View>
  );
}

function Prognose({ d }: { d: InvestmentReportData }) {
  const p = d.prognose!;
  const letzte = p.zeilen[p.zeilen.length - 1];
  const auswahl = p.zeilen.filter((_, i) => (i + 1) % 5 === 0 || i === p.zeilen.length - 1).filter((z, i, arr) => arr.findIndex(a => a.jahr === z.jahr) === i).slice(-6);
  const tk = (v: number) => `${fmt(v / 1000)} T€`;
  const spalte = { flex: 1, textAlign: 'right' as const };

  return (
    <Page size="A4" style={s.page}>
      <Head adresse={d.objekt.adresse} />
      <View style={s.body}>
        <Title eyebrow={`Prognose über ${p.zeilen.length} Jahre`} title="Wie wächst dein Vermögen?" />
        <Text style={s.lead}>
          Aus <Text style={s.b}>{eur(d.finanzierung.ek)}</Text> Eigenkapital werden in {p.zeilen.length} Jahren rund <Text style={s.b}>{eur(letzte.vermoegen)}</Text> Vermögen.
          Die Mieter zahlen den Kredit ab, die Überschüsse sammeln sich zusätzlich an.
        </Text>
        <View>
          <View style={[s.row, { gap: 14, marginBottom: 6 }]}>
            {[[C.wohnung, 'In der Wohnung (abbezahlt)'], [C.konto, 'Auf dem Konto (Überschüsse)'], [C.bank, 'Gehört noch der Bank'], [C.navy, 'Dein Vermögen']].map(([farbe, label]) => (
              <View key={label} style={s.legendKey}>
                <View style={[s.swatch, { backgroundColor: farbe }, label === 'Dein Vermögen' ? { height: 2, width: 9 } : {}]} />
                <Text style={s.small}>{label}</Text>
              </View>
            ))}
          </View>
          <VermoegenChart zeilen={p.zeilen} />
        </View>
        <View>
          <View style={[s.tr, { borderBottomColor: C.line }]}>
            <Text style={[s.th, { width: 110 }]}>Ende</Text>
            {auswahl.map(z => <Text key={z.jahr} style={[s.th, spalte]}>{z.jahr}</Text>)}
          </View>
          {([
            ['Wert der Wohnung', 'wert'],
            ['Restschuld', 'restschuld'],
            ['Auf dem Konto', 'konto'],
            ['Vermögen', 'vermoegen'],
          ] as const).map(([label, key], ri) => (
            <View key={key} style={[s.tr, ri === 3 ? { borderBottomWidth: 0 } : {}]}>
              <Text style={{ width: 110, color: ri === 3 ? C.ink : C.ink2, fontWeight: ri === 3 ? 800 : 400 }}>{label}</Text>
              {auswahl.map(z => <Text key={z.jahr} style={[spalte, { fontWeight: ri === 3 ? 800 : 600 }]}>{tk(z[key])}</Text>)}
            </View>
          ))}
        </View>
        {p.meilensteine.length > 0 && (
          <View style={[s.row, { gap: 8 }]}>
            {p.meilensteine.slice(0, 5).map(ms => (
              <View key={ms.titel} style={{ flex: 1, borderTopWidth: 2.5, borderTopColor: C.orange, paddingTop: 5 }}>
                <Text style={{ fontSize: 11, fontWeight: 800 }}>{ms.jahr}</Text>
                <Text style={s.small}>{ms.titel}</Text>
              </View>
            ))}
          </View>
        )}
        <Text style={s.hint}>Annahmen: {p.annahmen} Werte jeweils zum Jahresende.</Text>
      </View>
      <Foot text={`Erstellt mit imvestr.de am ${d.erstelltAm}`} />
    </Page>
  );
}

function Stresstest({ d }: { d: InvestmentReportData }) {
  const t = d.stresstest!;
  const sp = { flex: 1, textAlign: 'right' as const };
  const pu = t.puffer;
  const sf = t.schuldenfrei;
  const sfDelta = sf.heute !== null && sf.szenario !== null ? sf.szenario - sf.heute : null;

  return (
    <Page size="A4" style={s.page}>
      <Head adresse={d.objekt.adresse} />
      <View style={s.body}>
        <Title eyebrow={`Stresstest · ${t.titel}`} title={t.frage} />
        <Text style={s.lead}>
          Szenario: <Text style={s.b}>{t.beschreibung}</Text>.{' '}
          {t.cfSzenario >= 0
            ? <>Der Überschuss {t.cfSzenario < t.cfHeute ? 'sinkt' : 'steigt'} auf <Text style={s.b}>{eur(t.cfSzenario)} pro Monat</Text>, die Wohnung trägt sich {t.cfSzenario >= 50 ? 'weiterhin selbst' : 'nur noch knapp'}.</>
            : <>Du müsstest dann <Text style={s.b}>{eur(-t.cfSzenario)} pro Monat</Text> zuzahlen.</>}
        </Text>
        <View>
          <View style={[s.tr, { borderBottomColor: C.line }]}>
            <Text style={[s.th, { width: 170 }]}>Kennzahl</Text>
            <Text style={[s.th, sp]}>Heute</Text>
            <Text style={[s.th, sp]}>Szenario</Text>
            <Text style={[s.th, sp]}>Änderung</Text>
          </View>
          {t.zeilen.map(z => {
            const delta = z.szenario - z.heute;
            const zero = Math.abs(delta) < Math.pow(10, -z.digits) / 2;
            const farbe = zero ? C.muted : z.higherIsBetter === null ? C.ink : (z.higherIsBetter ? delta > 0 : delta < 0) ? C.good : C.bad;
            const f = (v: number) => `${fmt(v, z.digits)}${z.unit ? ` ${z.unit}` : ''}`;
            const gewicht = z.hervorheben ? 800 : 400;
            return (
              <View key={z.label} style={s.tr}>
                <Text style={{ width: 170, color: z.hervorheben ? C.ink : C.ink2, fontWeight: gewicht }}>{z.label}</Text>
                <Text style={[sp, { fontWeight: z.hervorheben ? 800 : 600 }]}>{f(z.heute)}</Text>
                <Text style={[sp, { fontWeight: z.hervorheben ? 800 : 600 }]}>{f(z.szenario)}</Text>
                <Text style={[sp, { fontWeight: 700, color: farbe }]}>{zero ? '±0' : `${vz(delta)}${f(Math.abs(delta)).replace(' %', ' %-P.')}`}</Text>
              </View>
            );
          })}
          <View style={[s.tr, { borderBottomWidth: 0 }]}>
            <Text style={{ width: 170, color: C.ink2 }}>Schuldenfrei</Text>
            <Text style={[sp, { fontWeight: 600 }]}>{sf.heute ?? '–'}</Text>
            <Text style={[sp, { fontWeight: 600 }]}>{sf.szenario ?? '–'}</Text>
            <Text style={[sp, { fontWeight: 700, color: sfDelta === null || sfDelta === 0 ? C.muted : sfDelta < 0 ? C.good : C.bad }]}>
              {sfDelta === null ? '–' : sfDelta === 0 ? '±0' : sfDelta < 0 ? `${-sfDelta} Jahre früher` : `${sfDelta} Jahre später`}
            </Text>
          </View>
        </View>

        <View>
          <Text style={[s.h2, { marginBottom: 8 }]}>Puffer: Ab hier zahlst du drauf</Text>
          {pu.zinsBis === null ? (
            <View style={[s.soft, { backgroundColor: C.badBg }]}>
              <Text style={{ color: C.bad, fontWeight: 700 }}>Kein Puffer: Schon heute reicht die Miete nicht für Kredit, Kosten und Steuern.</Text>
            </View>
          ) : (
            <View style={[s.row, { gap: 8 }]}>
              {[
                ['Zinssatz bis', pct(pu.zinsBis, 1), `heute ${pct(pu.zinsHeute, 1)}`],
                ['Kaltmiete bis', eur(pu.mieteBis ?? 0), `heute ${eur(pu.mieteHeute)}, ${pct(pu.mieteHeute > 0 ? ((pu.mieteBis ?? 0) / pu.mieteHeute - 1) * 100 : 0, 0)}`],
                ['Leerstand bis', `ca. ${fmt(pu.leerstandMonate ?? 0, 1)} Monate`, 'pro Jahr'],
              ].map(([k, v, h]) => (
                <View key={k} style={[s.soft, { flex: 1, padding: 11 }]}>
                  <Text style={s.small}>{k}</Text>
                  <Text style={{ fontSize: 14, fontWeight: 800, marginTop: 2 }}>{v}</Text>
                  <Text style={[s.hint, { marginTop: 2 }]}>{h}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ borderTopWidth: 1, borderTopColor: C.grid, paddingTop: 12 }}>
          <Text style={[s.hint, { lineHeight: 1.55 }]}>
            <Text style={{ fontWeight: 700, color: C.ink2 }}>Wichtige Hinweise. </Text>
            Dieser Report beruht auf deinen Eingaben und öffentlich verfügbaren Marktdaten. Prognosen sind Modellrechnungen und keine Garantie.
            Steuerliche Werte sind vereinfacht und ersetzen keine Steuerberatung. Der Report ist keine Anlage- oder Finanzierungsberatung und kein Wertgutachten.
          </Text>
        </View>
      </View>
      <Foot text={`Erstellt mit imvestr.de am ${d.erstelltAm}`} />
    </Page>
  );
}

export const InvestmentReportPDF: React.FC<{ data: InvestmentReportData }> = ({ data }) => (
  <Document title={`Investment-Report ${data.objekt.adresse}`} author="imvestr">
    <Deckblatt d={data} />
    <Finanzierung d={data} />
    {data.markt && <Markt d={data} />}
    {data.prognose && data.prognose.zeilen.length > 1 && <Prognose d={data} />}
    {data.stresstest && <Stresstest d={data} />}
  </Document>
);
