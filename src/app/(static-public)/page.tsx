'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import {
  AlertTriangle, ArrowDown, ArrowRight, BookOpen, Calculator, Check, CirclePlay, CreditCard, FileText, FlaskConical, Link as LinkIcon,
  Lock, MapPin, Scale, TrendingDown, TrendingUp,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StickyBottomCTA } from '@/components/StickyBottomCTA';
import { useImmoStore } from '@/store/useImmoStore';
import { useAnalytics } from '@/hooks/useAnalytics';
import { PricingFaq, PricingSection } from '@/components/pricing/PricingSection';
import { MODELL_KURZ, PRICING_FAQ } from '@/config/pricing';

const strukturDaten = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'imvestr',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  url: 'https://imvestr.de',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  description: 'Immobilien-Renditerechner für Kapitalanleger: Cashflow nach Steuern, Rendite, DSCR, Marktvergleich, 30-Jahres-Prognose und PDF-Report für die Bank.',
};

const faqDaten = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: PRICING_FAQ.map(f => ({ '@type': 'Question', name: f.frage, acceptedAnswer: { '@type': 'Answer', text: f.antwort } })),
};

// Beispielreport zur Wohnung aus dem Hero, erzeugt mit `npm run sample-report`
const BEISPIEL_PDF = '/beispielreport/imvestr-beispielreport.pdf';
const BEISPIEL_SEITEN = [
  { src: '/beispielreport/seite-1.webp', alt: 'Beispielreport Seite 1: Deckblatt der 2-Zimmer-Wohnung in Leipzig-Süd mit Cashflow 227 € nach Steuern, DSCR 2,06 und Nettomietrendite 9,5 %' },
  { src: '/beispielreport/seite-2.webp', alt: 'Beispielreport Seite 2: Objektdaten, Gesamtinvestition 112.070 €, Finanzierungsstruktur, Monatsrechnung und Kapitaldienstfähigkeit' },
];

const eur = (v: number) => `${Math.round(v).toLocaleString('de-DE')} €`;

function Eyebrow({ children, hell = false }: { children: React.ReactNode; hell?: boolean }) {
  return <span className={`text-xs font-extrabold uppercase tracking-[0.12em] ${hell ? 'text-[#ffb07a]' : 'text-[#ff6b00]'}`}>{children}</span>;
}

function H2({ children, hell = false }: { children: React.ReactNode; hell?: boolean }) {
  return (
    <h2 className={`mt-2.5 text-balance text-3xl font-extrabold leading-tight tracking-tight md:text-[42px] ${hell ? 'text-white' : 'text-[#001d3d]'}`}>
      {children}
    </h2>
  );
}

function Orange({ children }: { children: React.ReactNode }) {
  return <span className="text-[#ff6b00]">{children}</span>;
}

function Balken({ zeilen }: { zeilen: Array<[string, number, string, string]> }) {
  return (
    <div className="mt-5 grid grid-cols-[64px_1fr_auto] items-center gap-x-3 gap-y-2 rounded-xl bg-slate-50 px-4 py-3.5 text-xs">
      {zeilen.map(([label, breite, wert, farbe]) => (
        <React.Fragment key={label}>
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</span>
          <span className="h-2 overflow-hidden rounded-full bg-slate-200/70"><span className="block h-full rounded-full" style={{ width: `${breite}%`, background: farbe }} /></span>
          <b className="tabular-nums" style={{ color: farbe === '#94a3b8' ? '#001d3d' : farbe }}>{wert}</b>
        </React.Fragment>
      ))}
    </div>
  );
}

function SchnellCheck({ onStart, angemeldet }: { onStart: () => void; angemeldet: boolean }) {
  const [kaufpreis, setKaufpreis] = useState(130000);
  const [miete, setMiete] = useState(720);
  const [ek, setEk] = useState(35000);

  // Grobe Schätzung: 10 % Nebenkosten, 3,8 % Zins + 2 % Tilgung, 18 % der Miete für nicht umlegbare Kosten und Rücklagen
  const invest = kaufpreis * 1.1;
  const kredit = Math.max(0, invest - ek);
  const rate = (kredit * 0.058) / 12;
  const cf = miete - miete * 0.18 - rate;
  const brutto = ((miete * 12) / invest) * 100;
  const farbe = cf >= 50 ? 'text-emerald-600' : cf >= 0 ? 'text-amber-600' : 'text-red-600';

  const regler = (id: string, label: string, wert: number, set: (v: number) => void, min: number, max: number, step: number) => (
    <div>
      <label htmlFor={id} className="flex justify-between text-sm font-bold text-[#001d3d]">
        {label}<span className="font-semibold tabular-nums text-slate-600">{eur(wert)}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={wert} onChange={e => set(Number(e.target.value))} className="range-input mt-3 w-full" />
    </div>
  );

  return (
    <div className="rounded-3xl bg-white p-6 text-[#001d3d] shadow-2xl md:p-7">
      <div className="flex flex-col gap-5">
        {regler('sc-kaufpreis', 'Kaufpreis', kaufpreis, setKaufpreis, 50000, 600000, 5000)}
        {regler('sc-miete', 'Kaltmiete pro Monat', miete, setMiete, 300, 2500, 10)}
        {regler('sc-ek', 'Eigenkapital', ek, setEk, 0, 200000, 5000)}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-4" aria-live="polite">
        <div>
          <p className="text-xs text-slate-600">Überschuss pro Monat (grob)</p>
          <p className={`text-2xl font-extrabold tabular-nums md:text-[26px] ${farbe}`}>{cf >= 0 ? '+' : '−'}{eur(Math.abs(cf))}</p>
        </div>
        <div>
          <p className="text-xs text-slate-600">Bruttomietrendite</p>
          <p className="text-2xl font-extrabold tabular-nums md:text-[26px]">{brutto.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %</p>
        </div>
        <p className="col-span-2 text-xs text-slate-500">
          {cf >= 50
            ? 'Sieht gut aus. Ob es nach Steuern und mit der Miete vor Ort so bleibt, zeigt die vollständige Analyse.'
            : cf >= 0
              ? 'Knapp. Die vollständige Analyse zeigt, ob Steuervorteile den Unterschied machen.'
              : 'Du würdest monatlich draufzahlen. Mit mehr Eigenkapital oder einem besseren Preis sieht es anders aus.'}
        </p>
      </div>
      <button type="button" onClick={onStart} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ff6b00] px-6 py-4 font-bold text-white shadow-lg shadow-orange-500/25 transition hover:bg-[#ff6b00]/90">
        {angemeldet ? 'Vollständig analysieren' : 'Erste Wohnung kostenlos prüfen'} <ArrowRight size={18} />
      </button>
      {!angemeldet && <p className="mt-3 text-center text-[13px] text-slate-600">{MODELL_KURZ.schnellCheck}</p>}
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const { trackCTA } = useAnalytics();

  const resetAnalysis = useImmoStore(s => s.resetAnalysis);
  const startText = isSignedIn ? 'Neue Analyse starten' : 'Erste Wohnung kostenlos prüfen';

  const starten = (ort: string) => {
    trackCTA('start_analysis', ort);
    if (isSignedIn) resetAnalysis();
    router.push('/input-method');
  };

  const hauptCta = (ort: string) => (
    <button
      type="button"
      data-cta="main"
      onClick={() => starten(ort)}
      className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[#ff6b00] px-7 py-4 text-base font-bold text-white shadow-lg shadow-orange-500/30 transition hover:-translate-y-px hover:bg-[#ff6b00]/95"
    >
      {startText} <ArrowRight size={18} />
    </button>
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(strukturDaten) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqDaten) }} />

      <div className="min-h-screen bg-white text-[#001d3d]">
        <Header variant="sticky" />

        <main>
          {/* Hero */}
          <section className="bg-[radial-gradient(1200px_500px_at_85%_10%,#fff7f0,transparent_60%)] px-5 pb-20 pt-8 md:pb-28 md:pt-16">
            <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14">
              <div className="min-w-0">
                <Eyebrow>Für Kapitalanleger · Einsteiger und Profis</Eyebrow>
                <h1 className="mt-3.5 text-balance text-[40px] font-black leading-[1.04] tracking-[-0.035em] md:text-[58px]">
                  Lohnt sich diese Wohnung? <Orange>Du weißt es in 2 Minuten.</Orange>
                </h1>
                <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-slate-600">
                  Link aus dem Portal einfügen. imvestr rechnet Cashflow, Rendite und Steuern, vergleicht Kaufpreis und Miete mit dem Markt vor Ort und sagt dir in einem Satz, ob sich der Kauf trägt.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  {hauptCta('hero')}
                  <a href="#ablauf" className="inline-flex items-center justify-center gap-2.5 rounded-2xl border-[1.5px] border-slate-200 bg-white px-6 py-4 font-bold text-[#001d3d] transition hover:border-[#001d3d]">
                    <CirclePlay size={18} /> So funktioniert&apos;s
                  </a>
                </div>
                <p className="mt-5 flex items-center gap-1.5 text-[13px] text-slate-600">
                  <Check size={15} strokeWidth={2.6} className="shrink-0 text-emerald-600" />
                  {isSignedIn ? 'Quellen zu allen Marktdaten' : MODELL_KURZ.hero}
                </p>
              </div>

              {/* Ausschnitt einer Analyse */}
              <div className="relative min-w-0" aria-label="Beispiel einer Analyse">
                {/* Mobile: Überleitung, damit das Beispiel an H1 und CTA anknüpft */}
                <div className="mb-4 flex items-center gap-3 lg:hidden">
                  <span className="h-px flex-1 bg-slate-200" />
                  <Eyebrow>So sieht dein Ergebnis aus</Eyebrow>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
                <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-3.5 pb-5 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0">
                <p className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-500 lg:hidden">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ff6b00] text-[11px] text-white">1</span>
                  Link aus dem Portal einfügen
                </p>
                <div className="flex max-w-[420px] items-center gap-2.5 rounded-2xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-2.5 text-[13px] text-slate-500 shadow-lg shadow-slate-900/5">
                  <LinkIcon size={16} className="shrink-0 text-[#ff6b00]" />
                  <span className="min-w-0 flex-1 truncate">immobilienscout24.de/expose/1489…</span>
                  <span className="rounded-lg bg-[#ff6b00] px-3 py-1.5 text-xs font-bold text-white">Analysieren</span>
                </div>
                <div className="mt-2 flex justify-center text-slate-300 lg:hidden" aria-hidden="true"><ArrowDown size={18} /></div>
                <p className="mb-2 mt-1 flex items-center gap-2 text-xs font-bold text-slate-500 lg:hidden">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ff6b00] text-[11px] text-white">2</span>
                  Ergebnis in Klartext
                </p>
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl lg:mt-3.5 shadow-[#001d3d]/15">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">2-Zimmer-Wohnung, Leipzig-Süd</p>
                      <p className="text-xs text-slate-400">48 m² · 100.000 € · Baujahr 1995</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">Beispiel</span>
                  </div>
                  <div className="mt-4 flex gap-3 rounded-2xl bg-emerald-50 px-3.5 py-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white"><Check size={17} strokeWidth={3} className="text-emerald-600" /></span>
                    <div>
                      <p className="text-sm font-bold text-emerald-700">Trägt sich ab dem ersten Monat</p>
                      <p className="text-[13px] text-slate-600">Nach Kredit, Kosten und Steuern bleiben 227 € im Monat.</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[['Cashflow', '227', '€', 'text-emerald-600'], ['Nettorendite', '9,5', '%', ''], ['DSCR', '2,06', '', '']].map(([k, v, u, f]) => (
                      <div key={k} className="rounded-xl border border-slate-200 px-3 py-2.5">
                        <p className="text-[11px] font-semibold text-slate-500">{k}</p>
                        <p className={`text-lg font-bold tabular-nums md:text-xl ${f}`}>{v}<span className="ml-0.5 text-xs text-slate-400">{u}</span></p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="relative mx-4 -mt-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl shadow-[#001d3d]/15 lg:absolute lg:-bottom-20 lg:-right-3 lg:mx-0 lg:mt-0 lg:w-60">
                  <div className="flex items-center justify-between gap-2 text-xs font-bold">
                    <span>Miete vs. Markt</span>
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] text-red-600">111 % drüber</span>
                  </div>
                  <div className="relative mt-3.5 h-[7px] rounded-full bg-slate-100">
                    <span className="absolute inset-y-0 left-[18%] w-[30%] rounded-full bg-slate-300" />
                    <span className="absolute left-[88%] top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-red-600 shadow" />
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">20,00 €/m² statt 9,50 €. Bei Neuvermietung sinkt die Miete wahrscheinlich.</p>
                </div>
                </div>
              </div>
            </div>
          </section>

          <div className="border-y border-slate-100 px-5 py-5">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm font-bold text-slate-400">
              <span className="font-medium text-slate-600">Import aus</span>
              <span>ImmoScout24</span><span>Immowelt</span><span>Kleinanzeigen</span><span>Exposé-Foto</span><span>Manuelle Eingabe</span>
            </div>
          </div>

          {/* Problem */}
          <section className="bg-slate-50 px-5 py-20 md:py-24">
            <div className="mx-auto max-w-6xl">
              <div className="mx-auto max-w-3xl text-center">
                <Eyebrow>Das Problem</Eyebrow>
                <H2>Die Rechnung im Exposé <Orange>geht fast immer auf.</Orange> Deine nicht unbedingt.</H2>
                <p className="mx-auto mt-4 max-w-[60ch] text-lg text-slate-600">
                  Verkäufer rechnen ohne Rücklagen, mit Wunschmiete und ohne Steuern. Drei Fehler, die Käufer am häufigsten teuer bezahlen:
                </p>
              </div>
              <div className="mt-11 grid gap-5 md:grid-cols-3">
                {[
                  { icon: AlertTriangle, titel: 'Vergessene Kosten', text: 'Instandhaltung, Mietausfall und nicht umlagefähiges Hausgeld fehlen in vielen Exposés.',
                    balken: [['Exposé', 90, '+450 €', '#059669'], ['Realität', 28, '+120 €', '#ff6b00']] as Array<[string, number, string, string]> },
                  { icon: TrendingDown, titel: 'Wunschmiete', text: 'Angesetzte Mieten liegen oft über dem, was Mieter vor Ort zahlen. Bei Neuvermietung fehlt die Differenz.',
                    balken: [['Exposé', 92, '1.200 €', '#94a3b8'], ['Markt', 78, '1.020 €', '#ff6b00']] as Array<[string, number, string, string]> },
                  { icon: MapPin, titel: 'Zu teuer gekauft', text: 'Ohne Vergleich mit ähnlichen Wohnungen zahlst du schnell 10–20 % zu viel, und das für Jahrzehnte.',
                    balken: [['Angebot', 85, '3.400 €/m²', '#94a3b8'], ['Markt', 70, '2.900 €/m²', '#ff6b00']] as Array<[string, number, string, string]> },
                ].map(k => (
                  <article key={k.titel} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <k.icon size={20} className="text-[#ff6b00]" />
                    <h3 className="mt-4 text-[19px] font-extrabold">{k.titel}</h3>
                    <p className="mt-2 text-[15px] text-slate-600">{k.text}</p>
                    <Balken zeilen={k.balken} />
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* Ablauf */}
          <section id="ablauf" className="scroll-mt-20 px-5 py-20 md:py-24">
            <div className="mx-auto max-w-6xl">
              <div className="text-center">
                <Eyebrow>So funktioniert&apos;s</Eyebrow>
                <H2>Vom Exposé zur Entscheidung <Orange>in drei Schritten.</Orange></H2>
              </div>
              <div className="mt-12 grid gap-6 md:grid-cols-3">
                <Schritt nr={1} kurz="Eingeben" titel="Link, Foto oder von Hand"
                  text="Füg den Link aus dem Portal ein oder fotografier das Exposé. Die KI liest Preis, Fläche, Miete und Hausgeld aus. Du prüfst und ergänzt.">
                  <div className="flex gap-1.5">
                    {['Link', 'Foto', 'Manuell'].map((t, i) => (
                      <span key={t} className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${i === 0 ? 'border-[#ff6b00] bg-[#fff3e8] text-[#ff6b00]' : 'border-slate-200 bg-white'}`}>{t}</span>
                    ))}
                  </div>
                  <span className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-400">https://www.immobilienscout24.de/expose/…</span>
                  <span className="rounded-lg bg-[#ff6b00] py-2.5 text-center text-xs font-bold text-white">Daten auslesen</span>
                  <span className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs">✓ Kaufpreis 100.000 € · 48 m² · Miete 960 €</span>
                </Schritt>
                <Schritt nr={2} kurz="Verstehen" titel="Ergebnis in Klartext"
                  text="Cashflow nach Steuern, Rendite und Kreditdeckung mit Ampel. Dazu der Vergleich mit Kaufpreisen und Mieten vor Ort.">
                  {[['Cashflow nach Steuern', 'Positiv', '227 €', 'good'], ['Kaufpreis pro m²', '28 % unter Markt', '2.083 €', 'good'], ['Kaltmiete pro m²', '111 % über Markt', '20,00 €', 'bad']].map(([k, p, v, t]) => (
                    <span key={k} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                      <span className="flex justify-between gap-2 text-[11px] font-semibold text-slate-500">{k}
                        <span className={`rounded-full px-2 text-[10px] font-bold ${t === 'good' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>{p}</span>
                      </span>
                      <b className={`mt-1 block tabular-nums ${k.startsWith('Cashflow') ? 'text-emerald-600' : ''}`}>{v}</b>
                    </span>
                  ))}
                </Schritt>
                <Schritt nr={3} kurz="Absichern" titel="Durchspielen und zur Bank"
                  text="Was, wenn die Zinsen steigen? Ein Klick zeigt es. Danach exportierst du einen Report, den du zum Bankgespräch mitnimmst.">
                  <div className="flex gap-1.5">
                    <span className="rounded-lg border border-[#ff6b00] bg-[#fff3e8] px-2.5 py-1.5 text-xs font-semibold text-[#ff6b00]">Zinsen +2 %</span>
                    <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold">Miete −10 %</span>
                  </div>
                  <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs">
                    <span className="flex justify-between border-b border-slate-100 py-1">Überschuss<b><s className="mr-1.5 font-normal text-slate-400">227 €</s>138 €</b></span>
                    <span className="flex justify-between py-1">Zins bis<b>8,6 %</b></span>
                  </span>
                  <span className="rounded-lg bg-[#001d3d] py-2.5 text-center text-xs font-bold text-white">PDF-Report herunterladen</span>
                </Schritt>
              </div>
            </div>
          </section>

          {/* Schnell-Check */}
          <section id="ausprobieren" className="scroll-mt-20 bg-[#001d3d] px-5 py-20 text-white md:py-24">
            <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
              <div className="min-w-0">
                <Eyebrow>Probier&apos;s aus</Eyebrow>
                <H2 hell>Schnell-Check: <Orange>trägt sich deine Wohnung?</Orange></H2>
                <p className="mt-4 max-w-[60ch] text-lg text-slate-300">
                  Drei Regler, eine grobe Schätzung. Die vollständige Analyse rechnet zusätzlich Steuern, Rücklagen und den Markt vor Ort mit ein.
                </p>
              </div>
              <SchnellCheck onStart={() => starten('schnell_check')} angemeldet={!!isSignedIn} />
            </div>
          </section>

          {/* Die vollständige Analyse */}
          <section id="analyse" className="scroll-mt-20 px-5 py-20 md:py-24">
            <div className="mx-auto max-w-6xl">
              <div className="mx-auto max-w-3xl text-center">
                <Eyebrow>Die vollständige Analyse</Eyebrow>
                <H2>Mehr als ein Rechner: <Orange>deine Entscheidung, zu Ende gedacht.</Orange></H2>
                <p className="mx-auto mt-4 max-w-[60ch] text-lg text-slate-600">
                  {MODELL_KURZ.analyseIntro}
                </p>
              </div>
              <div className="mt-11 grid gap-5 md:grid-cols-3">
                <AnalyseKarte icon={TrendingUp} titel="Prognose nach deinem Ziel"
                  text="Vermögen aufbauen, monatlich Geld übrig, Steuern sparen oder später verkaufen: Du wählst, die Prognose antwortet.">
                  <div className="mb-2.5 grid grid-cols-2 gap-1.5">
                    {['Vermögen aufbauen', 'Monatlich Geld übrig', 'Steuern sparen', 'Später verkaufen'].map((t, i) => (
                      <span key={t} className={`rounded-lg border px-2 py-1.5 text-[11px] font-bold ${i === 0 ? 'border-[#ff6b00] bg-[#fff3e8]' : 'border-slate-200 bg-white'}`}>{t}</span>
                    ))}
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs">
                    <p className="text-[13px] leading-snug">
                      Aus <b>20.000 €</b> Eigenkapital werden in 30 Jahren <b className="text-[#1f63c9]">rund 224.000 €</b> Vermögen.
                    </p>
                    {/* Form aus der Prognose der Beispielwohnung (Jahr 1, 10, 20, 30) */}
                    <svg viewBox="0 0 260 80" className="mt-2.5 block h-auto w-full" aria-hidden>
                      <path d="M0 80 L0 44.7 L86.7 31.9 L173.3 18.1 L260 4 L260 80 Z" fill="#cbd5e1" />
                      <path d="M0 80 L0 75.3 L86.7 55.8 L173.3 31.6 L260 4 L260 80 Z" fill="#14946a" />
                      <path d="M0 80 L0 76.2 L86.7 64.5 L173.3 47.9 L260 27 L260 80 Z" fill="#1f63c9" />
                      <path d="M0 75.3 L86.7 55.8 L173.3 31.6 L260 4" fill="none" stroke="#001d3d" strokeWidth="2" />
                    </svg>
                    <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#1f63c9]" />156.000 € in der Wohnung</span>
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#14946a]" />68.000 € auf dem Konto</span>
                    </span>
                    <span className="mt-3 grid grid-cols-3 gap-2">
                      {[['8 Jahre', 'Einsatz zurück'], ['19 Jahre', 'Hälfte abbezahlt'], ['30 Jahre', 'Schuldenfrei']].map(([j, t]) => (
                        <span key={j} className="border-t-2 border-[#ff6b00] pt-1">
                          <b className="block tabular-nums">{j}</b>
                          <span className="text-[11px] leading-tight text-slate-500">{t}</span>
                        </span>
                      ))}
                    </span>
                    <p className="mt-2.5 text-[10px] text-slate-400">Beispielwohnung · Annahmen: 1,5 % Wertsteigerung pro Jahr, Miete konstant</p>
                  </div>
                </AnalyseKarte>
                <AnalyseKarte icon={FlaskConical} titel="Stresstests mit einem Klick"
                  text="Zinsen steigen, Miete sinkt, Preis verhandelt. Und du siehst, wie viel Puffer die Wohnung hat, bevor du draufzahlst.">
                  <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-lg border border-[#ff6b00] bg-[#fff3e8] px-2 py-1 text-[11px] font-bold text-[#ff6b00]">Alles schlecht</span>
                      <span className="text-[11px] text-slate-500">Zins +2 % · Miete −10 %</span>
                    </div>
                    <p className="mt-2.5 text-[11px] font-semibold text-slate-500">Überschuss pro Monat</p>
                    {([['Heute', 227, 'bg-slate-300'], ['Szenario', 84, 'bg-emerald-600']] as const).map(([k, v, farbe]) => (
                      <span key={k} className="mt-1.5 flex items-center gap-2">
                        <span className="w-14 shrink-0 text-slate-500">{k}</span>
                        <span className="h-2 flex-1 rounded-full bg-slate-100"><span className={`block h-full rounded-full ${farbe}`} style={{ width: `${(v / 227) * 100}%` }} /></span>
                        <b className="w-11 shrink-0 text-right tabular-nums">{v} €</b>
                      </span>
                    ))}
                    <span className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2">
                      <span className="text-slate-500">Kreditdeckung (DSCR)</span>
                      <b className="tabular-nums"><s className="mr-1.5 font-normal text-slate-400">2,06</s>1,35</b>
                    </span>
                    <p className="mt-1 text-[11px] font-semibold text-emerald-700">Trägt sich weiter, Bank-Minimum 1,2 erfüllt</p>
                  </div>
                  <div className="mt-2.5 rounded-xl border border-slate-200 bg-white p-3 text-xs">
                    <p className="text-[11px] font-semibold text-slate-500">Puffer: bis hier trägt sich die Wohnung</p>
                    {/* Grüner Bereich = Spielraum zwischen heute und der Grenze, ab der du draufzahlst */}
                    {([['Zinssatz', 'bis 8,6 %', 'heute 3,5 %', 35, 86], ['Kaltmiete', 'bis 555 €', 'heute 960 €', 58, 100], ['Leerstand', 'bis 4,2 Mon.', 'pro Jahr', 0, 35]] as const).map(([k, v, h, von, bis]) => (
                      <span key={k} className="mt-2 block">
                        <span className="flex justify-between"><span>{k} <span className="text-slate-400">{h}</span></span><b className="tabular-nums">{v}</b></span>
                        <span className="relative mt-1 block h-1.5 rounded-full bg-slate-100">
                          <span className="absolute inset-y-0 rounded-full bg-emerald-500" style={{ left: `${von}%`, width: `${bis - von}%` }} />
                        </span>
                      </span>
                    ))}
                  </div>
                </AnalyseKarte>
                <AnalyseKarte icon={FileText} titel="Report für das Bankgespräch"
                  text="Fünf Seiten mit Kennzahlen, Monatsrechnung, Kapitaldienstfähigkeit, Markt, Prognose und Stresstest.">
                  <a href={BEISPIEL_PDF} target="_blank" rel="noopener" className="group block"
                    onClick={() => trackCTA('sample_report_opened', 'analyse_report_card')}>
                    <span className="relative flex justify-center pb-1 pt-2">
                      {BEISPIEL_SEITEN.map((seite, i) => (
                        <Image key={seite.src} src={seite.src} alt={seite.alt} width={400} height={566} unoptimized loading="lazy"
                          sizes="(min-width: 768px) 160px, 44vw"
                          className={`h-auto w-[52%] max-w-[180px] rounded-md border border-slate-200 bg-white shadow-lg shadow-slate-900/10 transition-transform duration-300 ${
                            i === 0 ? 'relative z-10 -rotate-3 group-hover:-rotate-6' : '-ml-[14%] mt-4 rotate-2 group-hover:rotate-3'}`} />
                      ))}
                    </span>
                    <span className="mt-3 flex items-center justify-center gap-1.5 text-sm font-bold text-[#001d3d] underline-offset-4 group-hover:underline">
                      <FileText size={15} className="text-[#ff6b00]" />Beispielreport ansehen (PDF)
                    </span>
                  </a>
                </AnalyseKarte>
              </div>
            </div>
          </section>

          {/* Preise */}
          <PricingSection id="preise" eyebrow="Preise" ort="home" showFaq={false} className="bg-slate-50" />

          {/* Transparenz */}
          <section className="px-5 py-20 md:py-24">
            <div className="mx-auto max-w-6xl">
              <div className="text-center">
                <Eyebrow>Transparenz</Eyebrow>
                <H2>Warum du den Zahlen <Orange>trauen kannst.</Orange></H2>
              </div>
              <div className="mt-11 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <Vertrauen icon={Calculator} titel="Jede Formel offen" text="Bei jeder Kennzahl siehst du, wie sie berechnet wird.">
                  <code className="mt-3.5 block rounded-lg bg-slate-50 p-2.5 font-mono text-xs text-[#001d3d]">DSCR = Überschuss vor Kredit ÷ Kreditrate</code>
                </Vertrauen>
                <Vertrauen icon={BookOpen} titel="Quellen genannt" text="Marktvergleiche zeigen, woher die Daten stammen. Du kannst jede Quelle selbst öffnen." />
                <Vertrauen icon={Scale} titel="Deutsches Steuerrecht" text="AfA nach Baujahr, absetzbare Zinsen, 10-Jahres-Frist beim Verkauf. Vereinfacht, aber nach deutschen Regeln." />
                <Vertrauen icon={CreditCard} titel="Ehrlich statt schön" text="Wenn die Miete über dem Markt liegt oder die Rate knapp wird, steht das ganz oben. Keine Anlageberatung, sondern ein Rechenwerkzeug." />
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="scroll-mt-20 bg-slate-50 px-5 py-20 md:py-24">
            <div className="mx-auto max-w-3xl">
              <div className="text-center"><Eyebrow>FAQ</Eyebrow><H2>Häufige Fragen</H2></div>
              <PricingFaq titel={false} className="mt-10" onOpen={() => trackCTA('faq_opened', 'faq_section')} />
            </div>
          </section>

          {/* Schluss */}
          <section className="bg-[#001d3d] px-5 py-20 text-center text-white md:py-24">
            <div className="mx-auto max-w-3xl">
              <H2 hell>Prüf deine nächste Wohnung, <Orange>bevor du unterschreibst.</Orange></H2>
              <p className="mx-auto mt-4 max-w-[60ch] text-lg text-slate-300">In 2 Minuten weißt du, ob sie sich trägt, ob der Preis passt und wie viel Puffer bleibt.</p>
              <div className="mt-8">{hauptCta('final_cta')}</div>
              {!isSignedIn && <p className="mt-4 text-[13px] text-slate-400">{MODELL_KURZ.hero}</p>}
            </div>
          </section>
        </main>

        <Footer />
        <StickyBottomCTA text={startText} onClick={() => starten('sticky')} />
      </div>
    </>
  );
}

function Schritt({ nr, kurz, titel, text, children }: { nr: number; kurz: string; titel: string; text: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <p className="flex items-center gap-3 text-[13px] font-extrabold text-[#ff6b00]">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ff6b00] text-sm text-white">{nr}</span>{kurz}
      </p>
      <h3 className="mt-3 text-[21px] font-extrabold">{titel}</h3>
      <p className="mt-1.5 text-[15px] text-slate-600">{text}</p>
      <div className="mt-5 flex min-h-[210px] flex-1 flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">{children}</div>
    </div>
  );
}

function AnalyseKarte({ icon: Icon, titel, text, children }: { icon: typeof Lock; titel: string; text: string; children: React.ReactNode }) {
  return (
    <article className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="flex items-center gap-2 text-[19px] font-extrabold"><Icon size={19} className="text-[#ff6b00]" />{titel}</h3>
      <p className="mt-1.5 text-[15px] text-slate-600">{text}</p>
      <div className="mt-4 flex min-h-[150px] flex-1 flex-col justify-end rounded-2xl border border-slate-100 bg-slate-50 p-3.5">{children}</div>
    </article>
  );
}

function Vertrauen({ icon: Icon, titel, text, children }: { icon: typeof Lock; titel: string; text: string; children?: React.ReactNode }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <Icon size={20} className="text-[#ff6b00]" />
      <h3 className="mt-3.5 text-[17px] font-extrabold">{titel}</h3>
      <p className="mt-1.5 text-sm text-slate-600">{text}</p>
      {children}
    </article>
  );
}
