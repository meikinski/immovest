'use client';

import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import {
  BarChart3, CalendarDays, Flag, House, Info, Percent, ReceiptText, SlidersHorizontal, Sparkles, TrendingUp, Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { PrognoseJahr } from '@/lib/prognose-calculator';
import {
  baueMeilensteine, baueVerlauf, ETF_RENDITE, SPEKULATIONSFRIST_JAHRE,
  type PrognoseViewJahr,
} from '@/lib/prognose-view';
import { KpiTile, type KpiRating } from '@/components/KpiTile';
import { Tooltip } from '@/components/Tooltip';
import Slider from '@/components/Slider';

type Ziel = 'vermoegen' | 'cashflow' | 'steuern' | 'verkauf';
type DarlehensTyp = 'annuitaet' | 'degressiv';

const FARBEN = {
  wohnung: '#1f63c9',
  konto: '#14946a',
  bank: '#cbd5e1',
  cashflow: '#e8650a',
  negativ: '#dc2626',
  navy: '#001d3d',
  orange: '#ff6b00',
  grau: '#94a3b8',
  raster: '#f1f5f9',
};

const ZIELE: { id: Ziel; label: string; frage: string; icon: LucideIcon }[] = [
  { id: 'vermoegen', label: 'Vermögen aufbauen', frage: 'Wie viel gehört mir nach und nach?', icon: House },
  { id: 'cashflow', label: 'Monatlich Geld übrig', frage: 'Was bleibt mir jeden Monat?', icon: Wallet },
  { id: 'steuern', label: 'Steuern sparen', frage: 'Wie viel Steuern spare ich?', icon: ReceiptText },
  { id: 'verkauf', label: 'Später verkaufen', frage: 'Was bleibt beim Verkauf übrig?', icon: TrendingUp },
];

const BEGRIFFE = {
  restschuld: 'Der Teil des Kredits, den du noch nicht zurückgezahlt hast. Sinkt mit jeder Rate.',
  afa: 'Abschreibung: Das Finanzamt erkennt jedes Jahr einen Teil des Gebäudewerts als Kosten an, obwohl du dafür nichts bezahlst. Das senkt deine Steuern.',
  zinsen: 'Kreditzinsen sind bei vermieteten Wohnungen absetzbar. Die Tilgung nicht, denn damit baust du Vermögen auf.',
  ueberschuss: 'Was nach Miete minus Kreditrate, Hausgeld, Rücklagen und Steuern übrig bleibt.',
  rendite: 'Um wie viel Prozent pro Jahr dein Eigenkapital im Schnitt gewachsen ist. Direkt vergleichbar mit Zinsen oder ETF-Renditen.',
  spekfrist: 'Verkaufst du eine vermietete Immobilie nach mehr als 10 Jahren, ist der Gewinn steuerfrei. Davor wird er mit deinem Steuersatz versteuert.',
  einsatz: 'Dein Eigenkapital beim Kauf: Anzahlung plus Kaufnebenkosten.',
} as const;

const fmt = (v: number) => Math.round(v).toLocaleString('de-DE');
const eur = (v: number) => `${fmt(v)} €`;
const eurVz = (v: number) => `${v < 0 ? '−' : '+'}${eur(Math.abs(v))}`;
const pct = (v: number) => (v * 100).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const kEur = (v: number) =>
  Math.abs(v) >= 1000 ? `${(v / 1000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} T€` : `${fmt(v)} €`;
const pctZahl = (v: number) => `${v.toLocaleString('de-DE', { maximumFractionDigits: 1 })} %`;

function Begriff({ k, children }: { k: keyof typeof BEGRIFFE; children: React.ReactNode }) {
  return (
    <Tooltip text={BEGRIFFE[k]}>
      <span className="cursor-help underline decoration-dotted decoration-slate-400 underline-offset-4">{children}</span>
    </Tooltip>
  );
}

function B({ children }: { children: React.ReactNode }) {
  return <strong className="font-extrabold text-[#001d3d]">{children}</strong>;
}

function Zeile({
  label, value, hint, total = false, schlecht = false,
}: { label: React.ReactNode; value: string; hint?: React.ReactNode; total?: boolean; schlecht?: boolean }) {
  return (
    <div className={`grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0.5 py-2.5 ${total ? 'border-t-2 border-[#001d3d] pt-3' : 'border-t border-slate-100 first:border-t-0 first:pt-0'}`}>
      <dt className={`text-[13px] ${total ? 'font-bold text-[#001d3d]' : 'text-slate-600'}`}>{label}</dt>
      <dd className={`text-right tabular-nums ${total ? `text-xl font-bold ${schlecht ? 'text-red-600' : 'text-emerald-600'}` : 'text-sm font-semibold text-[#001d3d]'}`}>
        {value}
      </dd>
      {hint && <div className="col-span-2 text-[11px] text-slate-400">{hint}</div>}
    </div>
  );
}

const cfRating = (v: number): [KpiRating, string] =>
  v > 10 ? ['good', 'Positiv'] : v >= -10 ? ['ok', 'Ausgeglichen'] : ['bad', 'Negativ'];

export interface PrognoseTabProps {
  jahre: PrognoseJahr[];
  ek: number;
  kaufpreis: number;
  anschaffungskosten: number;
  darlehensSumme: number;
  steuersatzPct: number;
  wertsteigerungPct: number;
  setWertsteigerungPct: (v: number) => void;
  mietInflationPct: number;
  setMietInflationPct: (v: number) => void;
  kostenInflationPct: number;
  setKostenInflationPct: (v: number) => void;
  verkaufsNebenkostenPct: number;
  setVerkaufsNebenkostenPct: (v: number) => void;
  darlehensTyp: DarlehensTyp;
  setDarlehensTyp: (v: DarlehensTyp) => void;
  onWeiter: () => void;
}

export function PrognoseTab(props: PrognoseTabProps) {
  const { jahre, ek, kaufpreis, anschaffungskosten, darlehensSumme, steuersatzPct } = props;
  const [ziel, setZiel] = useState<Ziel>('vermoegen');
  const [jahrIdxRaw, setJahrIdx] = useState(14);
  const [profi, setProfi] = useState(false);
  const [annahmenOffen, setAnnahmenOffen] = useState(false);

  const verlauf = useMemo(
    () => baueVerlauf(jahre, { ek, kaufpreis, anschaffungskosten, steuersatzPct, verkaufsNebenkostenPct: props.verkaufsNebenkostenPct }),
    [jahre, ek, kaufpreis, anschaffungskosten, steuersatzPct, props.verkaufsNebenkostenPct]
  );
  const meilensteine = useMemo(() => baueMeilensteine(verlauf, { ek, darlehensSumme }), [verlauf, ek, darlehensSumme]);

  if (verlauf.length === 0) return null;

  const n = verlauf.length;
  const jahrIdx = Math.max(0, Math.min(jahrIdxRaw, n - 1));
  const sel = verlauf[jahrIdx];
  const erstes = verlauf[0];
  const letztes = verlauf[n - 1];
  const nach10 = verlauf[Math.min(9, n - 1)];
  const startJahr = erstes.jahr;
  const jahrVon = (key: string) => meilensteine.find(m => m.key === key)?.jahr;
  const schuldenfrei = jahrVon('schuldenfrei');
  const steuerfreiAb = verlauf[SPEKULATIONSFRIST_JAHRE]?.jahr;

  // ---------- Antwortsatz + Kacheln je Ziel ----------
  let lead: React.ReactNode;
  let kacheln: React.ReactNode;

  if (ziel === 'vermoegen') {
    const faktor = ek > 0 ? letztes.vermoegen / ek : 0;
    lead = (
      <>
        Aus deinen <B>{eur(ek)}</B> <Begriff k="einsatz">Einsatz</Begriff> werden in {n} Jahren rund <B>{eur(letztes.vermoegen)}</B> Vermögen.
        Die Mieter zahlen deinen Kredit ab{schuldenfrei ? <>, ab <B>{schuldenfrei + 1}</B> gehört dir die Wohnung komplett</> : null}.
      </>
    );
    kacheln = (
      <>
        <KpiTile icon={House} label={`Vermögen ${letztes.jahr}`} value={fmt(letztes.vermoegen)} unit="€" caption="Wohnung + Konto − Kredit"
          rating={letztes.vermoegen > ek ? 'good' : 'bad'} ratingLabel={letztes.vermoegen > ek ? 'Wachsend' : 'Schrumpfend'} colorValue
          help="Wert der Wohnung minus Restschuld, plus alle Überschüsse auf deinem Konto." />
        <KpiTile icon={TrendingUp} label="Vervielfachung" value={`× ${faktor.toLocaleString('de-DE', { maximumFractionDigits: 1 })}`}
          caption={`deines Einsatzes von ${eur(ek)}`} rating={faktor >= 5 ? 'good' : faktor >= 2 ? 'ok' : 'bad'}
          ratingLabel={faktor >= 5 ? 'Stark' : faktor >= 2 ? 'Solide' : 'Schwach'}
          help="Wie oft dein eingesetztes Eigenkapital in deinem Vermögen steckt." />
        <KpiTile icon={CalendarDays} label="Schuldenfrei" value={schuldenfrei ? String(schuldenfrei) : '–'}
          caption={schuldenfrei ? `nach ${schuldenfrei - startJahr + 1} Jahren` : `nicht innerhalb von ${n} Jahren`}
          rating={schuldenfrei ? 'good' : 'ok'} ratingLabel={schuldenfrei ? 'In Sicht' : 'Später'}
          help={BEGRIFFE.restschuld} />
      </>
    );
  } else if (ziel === 'cashflow') {
    const freiIdx = schuldenfrei ? Math.min(schuldenfrei - startJahr + 1, n - 1) : n - 1;
    const ohneKredit = verlauf[freiIdx];
    const r1 = cfRating(erstes.cashflowMonatlich);
    const r10 = cfRating(nach10.cashflowMonatlich);
    const rFrei = cfRating(ohneKredit.cashflowMonatlich);
    lead = erstes.cashflowMonatlich >= 0 ? (
      <>
        Die Wohnung trägt sich ab dem ersten Monat. Dir bleiben anfangs <B>{eur(erstes.cashflowMonatlich)}</B> im Monat,
        nach 10 Jahren <B>{eur(nach10.cashflowMonatlich)}</B>.
        {schuldenfrei && schuldenfrei < letztes.jahr ? <> Ab <B>{schuldenfrei + 1}</B> fällt die Kreditrate weg: dann sind es rund <B>{eur(ohneKredit.cashflowMonatlich)}</B> im Monat.</> : null}
      </>
    ) : (
      <>
        Anfangs zahlst du <B>{eur(-erstes.cashflowMonatlich)}</B> im Monat dazu.
        {jahrVon('ueberschuss') ? <> Durch steigende Mieten und sinkende Zinsen bleibt ab <B>{jahrVon('ueberschuss')}</B> jeden Monat etwas übrig.</> : <> Innerhalb von {n} Jahren wird daraus kein Überschuss.</>}
      </>
    );
    kacheln = (
      <>
        <KpiTile icon={Wallet} label={`Überschuss ${erstes.jahr}`} value={fmt(erstes.cashflowMonatlich)} unit="€" caption="pro Monat, nach Steuern"
          rating={r1[0]} ratingLabel={r1[1]} colorValue help={BEGRIFFE.ueberschuss} />
        <KpiTile icon={Wallet} label={`Überschuss ${nach10.jahr}`} value={fmt(nach10.cashflowMonatlich)} unit="€" caption="pro Monat, nach 10 Jahren"
          rating={r10[0]} ratingLabel={r10[1]} colorValue help={BEGRIFFE.ueberschuss} />
        <KpiTile icon={CalendarDays} label={schuldenfrei && schuldenfrei < letztes.jahr ? 'Ohne Kredit' : `Überschuss ${letztes.jahr}`}
          value={fmt(ohneKredit.cashflowMonatlich)} unit="€"
          caption={schuldenfrei && schuldenfrei < letztes.jahr ? `pro Monat ab ${schuldenfrei + 1}` : 'pro Monat'}
          rating={rFrei[0]} ratingLabel={rFrei[1]} colorValue help={BEGRIFFE.ueberschuss} />
      </>
    );
  } else if (ziel === 'steuern') {
    const ersparnis1 = erstes.ersparnisAfa + erstes.ersparnisZinsen;
    lead = steuersatzPct > 0 ? (
      <>
        Durch <Begriff k="afa">Abschreibung</Begriff> und <Begriff k="zinsen">Kreditzinsen</Begriff> sparst du im ersten Jahr <B>{eur(ersparnis1)}</B> Steuern,
        über {n} Jahre rund <B>{eur(letztes.ersparnisKumuliert)}</B>.{' '}
        {erstes.steuer < 0
          ? <>Am Anfang macht die Wohnung steuerlich sogar Verlust: Du bekommst <B>{eur(-erstes.steuer)}</B> vom Finanzamt zurück.</>
          : <>Auf den verbleibenden Mietgewinn zahlst du im ersten Jahr <B>{eur(erstes.steuer)}</B> Steuern.</>}
      </>
    ) : (
      <>Du hast keinen persönlichen Steuersatz angegeben. Trag ihn in den Eingaben ein, dann siehst du hier, wie viel Steuern du durch Abschreibung und Kreditzinsen sparst.</>
    );
    kacheln = (
      <>
        <KpiTile icon={ReceiptText} label={`Ersparnis ${erstes.jahr}`} value={fmt(ersparnis1)} unit="€" caption={`davon ${eur(erstes.ersparnisAfa)} durch AfA`}
          rating={ersparnis1 > 0 ? 'good' : 'ok'} ratingLabel={ersparnis1 > 0 ? 'Spürbar' : 'Keine'} colorValue
          help="Steuern, die du durch Abschreibung und absetzbare Kreditzinsen weniger zahlst." />
        <KpiTile icon={ReceiptText} label="Ersparnis gesamt" value={fmt(letztes.ersparnisKumuliert)} unit="€" caption={`in ${n} Jahren durch AfA und Zinsen`}
          help="Summe der Steuerersparnis aus Abschreibung und Kreditzinsen über den gesamten Zeitraum." />
        <KpiTile icon={Percent} label={`Steuer ${erstes.jahr}`} value={fmt(Math.abs(erstes.steuer))} unit="€"
          caption={erstes.steuer < 0 ? 'Erstattung vom Finanzamt' : 'zahlst du auf den Mietgewinn'}
          rating={erstes.steuer < 0 ? 'good' : 'ok'} ratingLabel={erstes.steuer < 0 ? 'Erstattung' : 'Zahlung'} colorValue={erstes.steuer < 0}
          help="Mieteinnahmen minus Hausgeld, Zinsen und AfA, multipliziert mit deinem Steuersatz. Negativ heißt: Die Wohnung senkt deine Steuerlast." />
      </>
    );
  } else {
    const diff = sel.gewinn - sel.etfGewinn;
    const rendite = sel.renditePa;
    lead = (
      <>
        Verkaufst du <B>{sel.jahr}</B> (nach {sel.haltedauer} {sel.haltedauer === 1 ? 'Jahr' : 'Jahren'}), bleiben dir nach Abzug von Kredit und Kosten <B>{eur(sel.verkaufErloes)}</B>.
        Das sind <B>{eur(Math.abs(sel.gewinn))}</B> {sel.gewinn >= 0 ? 'Gewinn' : 'Verlust'}
        {rendite !== null ? <>, also <B>{pct(rendite)} % pro Jahr</B> auf deinen <Begriff k="einsatz">Einsatz</Begriff></> : null}.
        {sel.spekulationssteuer > 0 ? <> Vor Ablauf der <Begriff k="spekfrist">10-Jahres-Frist</Begriff> kostet dich der Verkauf <B>{eur(sel.spekulationssteuer)}</B> Steuern.</> : null}
      </>
    );
    kacheln = (
      <>
        <KpiTile icon={TrendingUp} label={`Gewinn ${sel.jahr}`} value={fmt(sel.gewinn)} unit="€" caption="nach Kredit, Kosten und Einsatz"
          rating={sel.gewinn > 0 ? 'good' : 'bad'} ratingLabel={sel.gewinn > 0 ? 'Positiv' : 'Negativ'} colorValue
          help="Verkaufspreis minus Verkaufskosten, Restschuld und Steuern, plus deine Überschüsse, minus dein Eigenkapital." />
        <KpiTile icon={Percent} label="Rendite p.a." value={rendite !== null ? pct(rendite) : '–'} unit={rendite !== null ? '%' : undefined}
          caption="auf dein Eigenkapital"
          rating={rendite === null ? 'bad' : rendite >= 0.08 ? 'good' : rendite >= 0.04 ? 'ok' : 'bad'}
          ratingLabel={rendite === null ? 'Verlust' : rendite >= 0.08 ? 'Stark' : rendite >= 0.04 ? 'Solide' : 'Schwach'}
          help={BEGRIFFE.rendite} />
        <KpiTile icon={BarChart3} label="vs. ETF" value={`${diff >= 0 ? '+' : '−'}${fmt(Math.abs(diff))}`} unit="€"
          caption={`${diff >= 0 ? 'mehr' : 'weniger'} als im ETF mit ${pctZahl(ETF_RENDITE * 100)}`}
          rating={diff >= 0 ? 'good' : 'bad'} ratingLabel={diff >= 0 ? 'Besser' : 'Schlechter'} colorValue
          help={`Gleicher Einsatz in einem breiten Aktien-ETF mit angenommenen ${pctZahl(ETF_RENDITE * 100)} pro Jahr, ohne Steuern.`} />
      </>
    );
  }

  // ---------- Detailkarte ----------
  let detailTitel: string;
  let detailSub = `Stand Ende ${sel.jahr}`;
  let detailZeilen: React.ReactNode;
  let detailExtra: React.ReactNode = null;

  if (ziel === 'verkauf') {
    detailTitel = `Verkauf ${sel.jahr} durchgerechnet`;
    detailZeilen = (
      <>
        <Zeile label="Verkaufspreis" value={eur(sel.immobilienwert)} hint={`bei ${pctZahl(props.wertsteigerungPct)} Wertsteigerung pro Jahr`} />
        <Zeile label="− Verkaufskosten" value={`−${eur(sel.verkaufskosten)}`} hint={`Makler und Notar, ${pctZahl(props.verkaufsNebenkostenPct)}`} />
        <Zeile label="− Kredit ablösen" value={`−${eur(sel.restschuld)}`} hint={<><Begriff k="restschuld">Restschuld</Begriff> an die Bank</>} />
        {sel.spekulationssteuer > 0 && (
          <Zeile label="− Steuer auf Gewinn" value={`−${eur(sel.spekulationssteuer)}`} hint={<>weil vor Ablauf der <Begriff k="spekfrist">10-Jahres-Frist</Begriff></>} />
        )}
        <Zeile label="+ Auf deinem Konto" value={eurVz(sel.konto)} hint={<>alle <Begriff k="ueberschuss">Überschüsse</Begriff> bis dahin</>} />
        <Zeile label="− Dein Einsatz" value={`−${eur(ek)}`} hint={<><Begriff k="einsatz">Eigenkapital</Begriff> beim Kauf</>} />
        <Zeile label={sel.gewinn >= 0 ? 'Gewinn' : 'Verlust'} value={eur(sel.gewinn)} total schlecht={sel.gewinn < 0}
          hint={sel.renditePa !== null ? `${pct(sel.renditePa)} % pro Jahr` : undefined} />
      </>
    );
    detailExtra = (
      <>
        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
          Zum Vergleich: {eur(ek)} im ETF mit {pctZahl(ETF_RENDITE * 100)} pro Jahr ergeben bis {sel.jahr} <span className="font-bold text-[#001d3d]">{eur(sel.etfGewinn)}</span> Gewinn.
        </div>
        {sel.spekulationssteuer > 0 && steuerfreiAb && (
          <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-700">
            <span className="font-bold">Tipp:</span> Ab {steuerfreiAb} ist der Verkauf steuerfrei. Warten spart hier {eur(sel.spekulationssteuer)}.
          </div>
        )}
      </>
    );
  } else if (ziel === 'cashflow') {
    detailTitel = `Dein Monat ${sel.jahr}`;
    detailZeilen = (
      <>
        <Zeile label="Mieteinnahme (warm)" value={`+${eur(sel.mieteMonatlich)}`} />
        <Zeile label="− Kreditrate" value={`−${eur(sel.rateMonatlich)}`} hint={sel.rateMonatlich < 0.5 ? 'Kredit ist abbezahlt' : 'Zins und Tilgung'} />
        <Zeile label="− Hausgeld" value={`−${eur(sel.hausgeldMonatlich)}`} />
        <Zeile label="− Rücklagen & Mietausfall" value={`−${eur(sel.kalkKostenMonatlich)}`} hint="Instandhaltung und Leerstand" />
        <Zeile label={sel.steuerMonatlich >= 0 ? '− Steuer' : '+ Steuererstattung'} value={eurVz(-sel.steuerMonatlich)}
          hint={<>inkl. <Begriff k="afa">AfA</Begriff>-Vorteil</>} />
        <Zeile label="Bleibt dir" value={eur(sel.cashflowMonatlich)} total schlecht={sel.cashflowMonatlich < 0} hint="pro Monat zur freien Verfügung" />
      </>
    );
    detailExtra = (
      <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
        Bis {sel.jahr} auf deinem Konto angesammelt: <span className="font-bold tabular-nums text-[#001d3d]">{eur(sel.konto)}</span>
      </div>
    );
  } else if (ziel === 'steuern') {
    detailTitel = `Deine Steuer ${sel.jahr}`;
    detailSub = 'So rechnet das Finanzamt (Anlage V)';
    detailZeilen = (
      <>
        <Zeile label="Mieteinnahmen" value={`+${eur(sel.mieteinnahmen)}`} />
        <Zeile label="− Hausgeld" value={`−${eur(sel.hausgeld)}`} />
        <Zeile label="− Kreditzinsen" value={`−${eur(sel.zinsen)}`} hint={<><Begriff k="zinsen">absetzbar</Begriff>, die Tilgung nicht</>} />
        <Zeile label="− Abschreibung (AfA)" value={`−${eur(sel.afa)}`} hint={<>jährlicher <Begriff k="afa">Abschreibungsbetrag</Begriff></>} />
        <Zeile label={sel.zuVersteuern >= 0 ? '= Zu versteuern' : '= Steuerlicher Verlust'} value={`${sel.zuVersteuern < 0 ? '−' : ''}${eur(Math.abs(sel.zuVersteuern))}`}
          hint={`× ${pctZahl(steuersatzPct)} Steuersatz`} />
        <Zeile label={sel.steuer >= 0 ? 'Du zahlst' : 'Du bekommst zurück'} value={eur(Math.abs(sel.steuer))} total schlecht={sel.steuer > 0}
          hint={sel.steuer >= 0 ? 'Steuer auf den Mietgewinn' : 'Erstattung vom Finanzamt'} />
      </>
    );
    detailExtra = (
      <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
        Ohne AfA und Zinsen wären es <span className="font-bold text-[#001d3d]">{eur(sel.ersparnisAfa + sel.ersparnisZinsen)}</span> mehr Steuern.
        Die Ersparnis sinkt mit der Zeit, weil du weniger Zinsen zahlst.
      </div>
    );
  } else {
    detailTitel = `Was dir ${sel.jahr} gehört`;
    const anteilPct = sel.immobilienwert > 0 ? Math.round((sel.anteilWohnung / sel.immobilienwert) * 100) : 0;
    detailZeilen = (
      <>
        <Zeile label="Wert der Wohnung" value={eur(sel.immobilienwert)} />
        <Zeile label="− Gehört noch der Bank" value={`−${eur(sel.restschuld)}`} hint={<><Begriff k="restschuld">Restschuld</Begriff> deines Kredits</>} />
        <Zeile label="= In der Wohnung" value={eur(sel.anteilWohnung)} hint={`dein abbezahlter Teil: ${anteilPct} % der Wohnung gehören dir`} />
        <Zeile label="+ Auf deinem Konto" value={eurVz(sel.konto)} hint={<>alle <Begriff k="ueberschuss">Monatsüberschüsse</Begriff> bis {sel.jahr}</>} />
        <Zeile label="Dein Vermögen" value={eur(sel.vermoegen)} total schlecht={sel.vermoegen < 0} hint={`aus ${eur(ek)} Einsatz`} />
      </>
    );
  }

  // ---------- Diagramm ----------
  const chartDaten = verlauf.map(j => ({
    ...j,
    wohnungStack: Math.max(0, j.anteilWohnung),
    kontoStack: Math.max(0, j.konto),
    bankStack: Math.max(0, j.restschuld),
    ersparnisGesamt: j.ersparnisAfa + j.ersparnisZinsen,
  }));
  type Serie = { key: keyof (typeof chartDaten)[number]; name: string; farbe: string; linie?: boolean; gestrichelt?: boolean };

  let chartTitel: string;
  let chartSub: string;
  let serien: Serie[];
  let summe: { key: keyof (typeof chartDaten)[number]; name: string } | null = null;

  if (profi) {
    chartTitel = 'Alle Kurven';
    chartSub = 'Für Fortgeschrittene: alle Werte in einem Diagramm.';
    serien = [
      { key: 'immobilienwert', name: 'Immobilienwert', farbe: FARBEN.grau, linie: true, gestrichelt: true },
      { key: 'restschuld', name: 'Restschuld', farbe: FARBEN.negativ, linie: true },
      { key: 'eigenkapitalGesamt', name: 'Eigenkapital gesamt', farbe: FARBEN.wohnung, linie: true },
      { key: 'konto', name: 'Cashflow kumuliert', farbe: FARBEN.konto, linie: true },
    ];
  } else if (ziel === 'vermoegen') {
    chartTitel = 'Wem gehört die Wohnung?';
    chartSub = 'Dein Vermögen liegt an zwei Orten: in der Wohnung (der abbezahlte Teil) und auf deinem Konto (die Überschüsse, die jeden Monat übrig bleiben).';
    serien = [
      { key: 'anteilWohnung', name: 'In der Wohnung', farbe: FARBEN.wohnung },
      { key: 'konto', name: 'Auf deinem Konto', farbe: FARBEN.konto },
      { key: 'restschuld', name: 'Gehört noch der Bank', farbe: FARBEN.bank },
    ];
    summe = { key: 'vermoegen', name: 'Dein Vermögen' };
  } else if (ziel === 'cashflow') {
    chartTitel = 'Was bleibt dir jeden Monat?';
    chartSub = 'Überschuss pro Monat nach Kreditrate, Kosten und Steuern.';
    serien = [{ key: 'cashflowMonatlich', name: 'Überschuss pro Monat', farbe: FARBEN.cashflow }];
  } else if (ziel === 'steuern') {
    chartTitel = 'Wie viel Steuern sparst du pro Jahr?';
    chartSub = 'Die Abschreibung bleibt gleich, der Zinsanteil sinkt, weil du den Kredit abbezahlst.';
    serien = [
      { key: 'ersparnisAfa', name: 'Ersparnis durch AfA', farbe: FARBEN.wohnung },
      { key: 'ersparnisZinsen', name: 'Ersparnis durch Zinsen', farbe: FARBEN.cashflow },
    ];
    summe = { key: 'ersparnisGesamt', name: 'Zusammen' };
  } else {
    chartTitel = 'Gewinn je nach Verkaufsjahr';
    chartSub = `Was nach Kredit, Verkaufskosten, Steuern und deinem Einsatz bleibt. Gestrichelt: derselbe Einsatz im ETF mit ${pctZahl(ETF_RENDITE * 100)}.`;
    serien = [
      { key: 'gewinn', name: 'Gewinn Immobilie', farbe: FARBEN.konto },
      { key: 'etfGewinn', name: `ETF mit ${pctZahl(ETF_RENDITE * 100)}`, farbe: FARBEN.grau, linie: true, gestrichelt: true },
    ];
  }

  const handleChartClick = (state: { activeTooltipIndex?: number } | null) => {
    if (state && typeof state.activeTooltipIndex === 'number') setJahrIdx(state.activeTooltipIndex);
  };

  const tooltipInhalt = ({ active, payload }: TooltipProps<number, string>) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload as (typeof chartDaten)[number];
    return (
      <div className="min-w-[190px] rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-xl">
        <p className="mb-1.5 font-bold text-[#001d3d]">{d.jahr}</p>
        {serien.map(s => (
          <div key={String(s.key)} className="flex justify-between gap-3">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="inline-block h-2 w-2 rounded-sm" style={{ background: s.farbe }} />{s.name}
            </span>
            <span className="tabular-nums font-semibold text-[#001d3d]">{eur(Number(d[s.key]))}</span>
          </div>
        ))}
        {summe && (
          <div className="mt-1 flex justify-between gap-3 border-t border-slate-100 pt-1 font-bold text-[#001d3d]">
            <span>{summe.name}</span><span className="tabular-nums">{eur(Number(d[summe.key]))}</span>
          </div>
        )}
      </div>
    );
  };

  // Recharts erkennt Achsen & Referenzlinien nur als direkte Kinder, nicht in Fragments
  const achsen = [
    <CartesianGrid key="grid" vertical={false} stroke={FARBEN.raster} />,
    <XAxis key="x" dataKey="jahr" tick={{ fontSize: 10, fill: FARBEN.grau }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} minTickGap={24} />,
    <YAxis key="y" tick={{ fontSize: 10, fill: FARBEN.grau }} tickLine={false} axisLine={false} tickFormatter={kEur} width={56} />,
    <ChartTooltip key="tip" content={tooltipInhalt} cursor={{ fill: 'rgba(0,29,61,0.04)', stroke: FARBEN.navy, strokeOpacity: 0.15 }} />,
    ...meilensteine.map(m => (
      <ReferenceLine key={`m-${m.key}`} x={m.jahr} stroke={FARBEN.orange} strokeDasharray="2 4" strokeOpacity={0.6} />
    )),
    <ReferenceLine key="sel" x={sel.jahr} stroke={FARBEN.navy} strokeWidth={1.5} />,
  ];
  const chartProps = { data: chartDaten, margin: { top: 12, right: 12, left: 0, bottom: 0 }, onClick: handleChartClick };

  let chart: React.ReactElement;
  if (profi) {
    chart = (
      <LineChart {...chartProps}>
        {achsen}
        {serien.map(s => (
          <Line key={String(s.key)} type="monotone" dataKey={String(s.key)} name={s.name} stroke={s.farbe} strokeWidth={2}
            strokeDasharray={s.gestrichelt ? '5 4' : undefined} dot={false} isAnimationActive={false} />
        ))}
      </LineChart>
    );
  } else if (ziel === 'vermoegen') {
    chart = (
      <ComposedChart {...chartProps}>
        {achsen}
        <Area type="monotone" dataKey="wohnungStack" stackId="v" fill={FARBEN.wohnung} fillOpacity={1} stroke="#fff" strokeWidth={1} isAnimationActive={false} />
        <Area type="monotone" dataKey="kontoStack" stackId="v" fill={FARBEN.konto} fillOpacity={1} stroke="#fff" strokeWidth={1} isAnimationActive={false} />
        <Area type="monotone" dataKey="bankStack" stackId="v" fill={FARBEN.bank} fillOpacity={1} stroke="#fff" strokeWidth={1} isAnimationActive={false} />
        <Line type="monotone" dataKey="vermoegen" stroke={FARBEN.navy} strokeWidth={2} dot={false} isAnimationActive={false} />
      </ComposedChart>
    );
  } else if (ziel === 'cashflow') {
    chart = (
      <BarChart {...chartProps}>
        {achsen}
        <ReferenceLine y={0} stroke={FARBEN.grau} />
        <Bar dataKey="cashflowMonatlich" radius={[3, 3, 0, 0]} isAnimationActive={false}>
          {chartDaten.map((d, i) => (
            <Cell key={d.jahr} fill={d.cashflowMonatlich < 0 ? FARBEN.negativ : FARBEN.cashflow} fillOpacity={i === jahrIdx ? 1 : 0.5} />
          ))}
        </Bar>
      </BarChart>
    );
  } else if (ziel === 'steuern') {
    chart = (
      <BarChart {...chartProps}>
        {achsen}
        <Bar dataKey="ersparnisAfa" stackId="s" isAnimationActive={false}>
          {chartDaten.map((d, i) => <Cell key={d.jahr} fill={FARBEN.wohnung} fillOpacity={i === jahrIdx ? 1 : 0.55} />)}
        </Bar>
        <Bar dataKey="ersparnisZinsen" stackId="s" radius={[3, 3, 0, 0]} isAnimationActive={false}>
          {chartDaten.map((d, i) => <Cell key={d.jahr} fill={FARBEN.cashflow} fillOpacity={i === jahrIdx ? 1 : 0.55} />)}
        </Bar>
      </BarChart>
    );
  } else {
    chart = (
      <ComposedChart {...chartProps}>
        {steuerfreiAb && (
          <ReferenceArea x1={startJahr} x2={steuerfreiAb - 1} fill={FARBEN.grau} fillOpacity={0.08}
            label={{ value: 'Gewinn steuerpflichtig', position: 'insideTop', fontSize: 10, fill: FARBEN.grau }} />
        )}
        {achsen}
        <ReferenceLine y={0} stroke={FARBEN.grau} />
        <Area type="monotone" dataKey="gewinn" fill={FARBEN.konto} fillOpacity={0.14} stroke={FARBEN.konto} strokeWidth={2.5} isAnimationActive={false} />
        <Line type="monotone" dataKey="etfGewinn" stroke={FARBEN.grau} strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
      </ComposedChart>
    );
  }

  // ---------- Layout ----------
  const kreditLabel = props.darlehensTyp === 'annuitaet' ? 'Annuität' : 'Degressiv';
  const chip = (label: string, wert: string) => (
    <span key={label} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
      {label} <span className="font-bold text-[#001d3d]">{wert}</span>
    </span>
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
      <div className="contents lg:col-span-8 lg:flex lg:flex-col lg:gap-6">
        {/* Ziel */}
        <section className="order-1 lg:order-none">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#001d3d]">
            <Flag size={16} className="text-[#ff6b00]" /> Was ist dein Ziel mit dieser Immobilie?
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4" role="radiogroup" aria-label="Dein Ziel">
            {ZIELE.map(z => {
              const aktiv = ziel === z.id;
              return (
                <button
                  key={z.id}
                  type="button"
                  role="radio"
                  aria-checked={aktiv}
                  onClick={() => { setZiel(z.id); setProfi(false); }}
                  className={`flex flex-col gap-1.5 rounded-2xl border-[1.5px] p-3 text-left shadow-sm transition-all sm:px-4 sm:py-3.5 ${aktiv ? 'border-[#ff6b00] bg-[#fff7f0]' : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md'}`}
                >
                  <span className="flex items-center gap-2 text-[13px] font-bold text-[#001d3d]">
                    <z.icon size={16} className="shrink-0 text-[#ff6b00]" />{z.label}
                  </span>
                  <span className="hidden text-xs text-slate-500 sm:block">{z.frage}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Antwort */}
        <section className="order-2 flex gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:order-none md:p-7" aria-live="polite">
          <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff6b00] to-[#ff8c00] sm:flex">
            <Sparkles size={20} className="text-white" />
          </div>
          <div className="max-w-[64ch] text-base font-medium leading-relaxed text-slate-600 md:text-lg">{lead}</div>
        </section>

        {/* Kacheln */}
        <section className="order-3 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 lg:order-none">{kacheln}</section>

        {/* Diagramm */}
        <section className="order-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm md:p-6 lg:order-none">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <div className="min-w-0">
              <h4 className="flex items-center gap-2 text-sm font-bold text-[#001d3d]">
                <BarChart3 size={16} className="text-[#ff6b00]" /> {chartTitel}
              </h4>
              <p className="mt-1 max-w-[62ch] text-xs text-slate-500">{chartSub}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={profi}
              onClick={() => setProfi(!profi)}
              className="inline-flex items-center gap-2 whitespace-nowrap text-xs font-semibold text-slate-600"
            >
              <span className={`relative h-[18px] w-8 rounded-full transition-colors ${profi ? 'bg-[#ff6b00]' : 'bg-slate-300'}`}>
                <span className={`absolute top-0.5 left-0.5 h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${profi ? 'translate-x-3.5' : ''}`} />
              </span>
              Alle Kurven (Profi)
            </button>
          </div>

          {serien.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600">
              {serien.map(s => (
                <span key={String(s.key)} className="flex items-center gap-1.5">
                  <span className={s.linie ? 'h-[3px] w-3.5 rounded-full' : 'h-2.5 w-2.5 rounded-[3px]'} style={{ background: s.farbe }} />
                  {s.name}
                </span>
              ))}
              {summe && ziel === 'vermoegen' && !profi && (
                <span className="flex items-center gap-1.5 font-semibold text-[#001d3d]">
                  <span className="h-[3px] w-3.5 rounded-full bg-[#001d3d]" />{summe.name}
                </span>
              )}
            </div>
          )}

          <div className="mt-2 h-[240px] cursor-crosshair md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">{chart}</ResponsiveContainer>
          </div>

          {/* Jahres-Regler */}
          <div className="mt-3 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-3">
              <label htmlFor="prognose-jahr" className="whitespace-nowrap text-xs font-bold text-[#001d3d]">
                {ziel === 'verkauf' && !profi ? 'Verkauf im Jahr' : 'Jahr ansehen'}
              </label>
              <div className="relative h-8 min-w-0 flex-1">
                <div className="pointer-events-none absolute inset-x-[9px] top-1" aria-hidden>
                  {meilensteine.map(m => (
                    <span key={m.key} title={m.titel} className="absolute h-[7px] w-0.5 -translate-x-1/2 rounded-sm bg-[#ff6b00]"
                      style={{ left: `${((m.jahr - startJahr) / Math.max(1, n - 1)) * 100}%` }} />
                  ))}
                </div>
                <input
                  id="prognose-jahr"
                  type="range"
                  className="range-input absolute inset-x-0 top-1/2 -translate-y-1/2"
                  min={0}
                  max={n - 1}
                  step={1}
                  value={jahrIdx}
                  onChange={e => setJahrIdx(Number(e.target.value))}
                />
              </div>
              <span className="min-w-[44px] text-right text-[15px] font-extrabold tabular-nums text-[#001d3d]">{sel.jahr}</span>
            </div>
            <p className="text-[11px] text-slate-400">Ziehen oder ins Diagramm tippen. Orange Striche sind Meilensteine.</p>
          </div>
        </section>

        {/* Annahmen */}
        <section className="order-7 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:order-none md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h4 className="mb-2.5 flex items-center gap-2 text-sm font-bold text-[#001d3d]">
                <SlidersHorizontal size={16} className="text-[#ff6b00]" /> Annahmen dieser Prognose
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {chip('Wertsteigerung', pctZahl(props.wertsteigerungPct))}
                {chip('Miete', pctZahl(props.mietInflationPct))}
                {chip('Kosten', pctZahl(props.kostenInflationPct))}
                {chip('Verkaufskosten', pctZahl(props.verkaufsNebenkostenPct))}
                {chip('Kredit', kreditLabel)}
                {chip('Steuersatz', pctZahl(steuersatzPct))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAnnahmenOffen(!annahmenOffen)}
              aria-expanded={annahmenOffen}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-[#001d3d] transition-colors hover:border-slate-500"
            >
              {annahmenOffen ? 'Fertig' : 'Anpassen'}
            </button>
          </div>
          {annahmenOffen && (
            <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 md:grid-cols-2">
              <Slider label="Wertsteigerung p.a." value={props.wertsteigerungPct} onChange={props.setWertsteigerungPct} min={-5} max={5} step={0.1} suffix="%"
                helpText="Wie viel ist die Wohnung jedes Jahr mehr wert?" showReset={false} />
              <Slider label="Mietsteigerung p.a." value={props.mietInflationPct} onChange={props.setMietInflationPct} min={0} max={5} step={0.1} suffix="%"
                helpText="Um wie viel steigt die Miete pro Jahr?" showReset={false} />
              <Slider label="Kostensteigerung p.a." value={props.kostenInflationPct} onChange={props.setKostenInflationPct} min={0} max={5} step={0.1} suffix="%"
                helpText="Hausgeld, Rücklagen und Reparaturen" showReset={false} />
              <Slider label="Verkaufskosten" value={props.verkaufsNebenkostenPct} onChange={props.setVerkaufsNebenkostenPct} min={0} max={15} step={0.5} suffix="%"
                helpText="Makler und Notar beim Verkauf" showReset={false} />
              <div className="slider-card md:col-span-2">
                <p className="text-xs font-semibold text-[#001d3d]">Kreditart</p>
                <div className="mt-2 flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                  {(['annuitaet', 'degressiv'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={props.darlehensTyp === t}
                      onClick={() => props.setDarlehensTyp(t)}
                      className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${props.darlehensTyp === t ? 'bg-[#001d3d] text-white' : 'text-slate-600 hover:text-[#001d3d]'}`}
                    >
                      {t === 'annuitaet' ? 'Annuität' : 'Degressiv'}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {props.darlehensTyp === 'annuitaet' ? 'Gleiche Rate, der Tilgungsanteil wächst. So funktionieren die meisten Immobilienkredite.' : 'Die Rate sinkt mit der Restschuld.'}
                </p>
              </div>
            </div>
          )}
        </section>

        <div className="order-9 mb-16 lg:order-none">
          <button type="button" onClick={props.onWeiter} className="btn-primary">
            Weiter zu Szenarien &amp; PDF Export →
          </button>
        </div>
      </div>

      <aside className="contents lg:sticky lg:top-20 lg:col-span-4 lg:flex lg:flex-col lg:gap-4 lg:self-start">
        <section className="order-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:order-none md:p-6" aria-live="polite">
          <h4 className="flex items-center gap-2 text-sm font-bold text-[#001d3d]">
            <CalendarDays size={16} className="text-[#ff6b00]" /> {detailTitel}
          </h4>
          <p className="mt-0.5 text-xs text-slate-500">{detailSub}</p>
          <dl className="mt-4">{detailZeilen}</dl>
          {detailExtra}
        </section>

        <section className="order-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:order-none md:p-6">
          <h4 className="flex items-center gap-2 text-sm font-bold text-[#001d3d]">
            <Flag size={16} className="text-[#ff6b00]" /> Deine Meilensteine
          </h4>
          <p className="mt-0.5 text-xs text-slate-500">Antippen springt zum Jahr</p>
          <ul className="relative mt-3 before:absolute before:bottom-2.5 before:left-[6px] before:top-2.5 before:w-0.5 before:bg-slate-100">
            {meilensteine.map(m => {
              const erreicht = m.jahr <= sel.jahr;
              return (
                <li key={m.key}>
                  <button
                    type="button"
                    onClick={() => setJahrIdx(m.jahr - startJahr)}
                    className="group grid w-full grid-cols-[14px_minmax(0,1fr)_auto] gap-3 py-2 text-left"
                  >
                    <span className={`relative z-10 mt-[3px] h-3.5 w-3.5 rounded-full border-[2.5px] ${erreicht ? 'border-[#ff6b00] bg-[#ff6b00]' : 'border-slate-300 bg-white'}`} />
                    <span>
                      <span className="block text-[13px] font-semibold text-[#001d3d] group-hover:text-[#ff6b00]">{m.titel}</span>
                      <span className="block text-[11px] text-slate-400">{m.text}</span>
                    </span>
                    <span className="text-[13px] font-bold tabular-nums text-[#001d3d]">{m.jahr}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="order-8 flex gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 lg:order-none">
          <Info size={16} className="mt-0.5 shrink-0 text-slate-400" />
          <p className="text-xs leading-relaxed text-slate-500">
            Prognose auf Basis deiner Eingaben und der Annahmen. Werte jeweils zum Jahresende, Steuersatz {pctZahl(steuersatzPct)}.
            Steuern auf Verkaufsgewinne sind vereinfacht mit deinem persönlichen Steuersatz gerechnet.
          </p>
        </div>
      </aside>
    </div>
  );
}
