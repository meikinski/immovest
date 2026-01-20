'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useImmoStore } from '@/store/useImmoStore';
import { berechneNebenkosten } from '@/lib/calculations';
import { berechnePrognose } from '@/lib/prognose-calculator';
import HtmlContent from '@/components/HtmlContent';
import {
 BarChart3, BedSingle, Calculator, Calendar, ChartBar, Crown,
  EuroIcon, House, Info, MapPin, ReceiptText, Ruler, SkipForward, SquarePercent, Wallet, WrenchIcon, Lock,
  TrendingUp, Percent, ShieldCheck, MessageSquare, Sparkles
} from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
  ReferenceDot,
  Label,
} from 'recharts';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { Tooltip } from '@/components/Tooltip';
import Slider  from '@/components/Slider';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { usePaywall } from '@/contexts/PaywallContext';
import { UpgradeModal } from '@/components/UpgradeModal';
import { UpsellBanner } from '@/components/UpsellBanner';
import { SaveAnalysisButton } from '@/components/SaveAnalysisButton';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { toast } from 'sonner';
import { SignInButton, useAuth } from '@clerk/nextjs';
import { useStatePersistence } from '@/hooks/useLoginStatePersistence';



type Step = 'input-method' | 'a' | 'a2' | 'b' | 'c' | 'tabs';
const steps = ['a', 'a2', 'b', 'c', 'tabs']; // result/details ersetzt durch tabs

function cityFromAddress(addr: string): string {
  // erwartet Formate wie "Straße 1, 12345 Stadt" oder "... , Stadt"
  if (!addr) return 'deiner Lage';
  const plzOrt = addr.match(/(\d{5})\s+([A-Za-zÄÖÜäöüß\-\s]+)$/);
  if (plzOrt && plzOrt[2]) return plzOrt[2].trim();
  // sonst nimm den letzten Komma-Teil, aber filtere "Deutschland"
  const parts = addr.split(',').map(s => s.trim()).filter(Boolean);
  const last  = parts[parts.length - 1] || '';
  if (!last || /deutschland/i.test(last)) {
    return parts[parts.length - 2]?.trim() || 'deiner Lage';
  }
  return last;
}

export default function StepPage() {
  const router = useRouter();
  const params = useParams();
  const stepParam = params.step;
  const step = Array.isArray(stepParam) ? stepParam[0]! : stepParam!;
  const idx = steps.indexOf(step);
  const nextStep = idx < steps.length - 1 ? steps[idx + 1] : 'tabs';
  const showProgress = step !== 'tabs';

  // Auth & Paywall
  const { isSignedIn } = useAuth();
  const { canAccessPremium, incrementPremiumUsage, premiumUsageCount, isPremium, showUpgradeModal, setShowUpgradeModal } = usePaywall();
  const hasIncrementedUsage = useRef(false);

  // Hydration guard
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // State Persistence (lädt Zustand beim Mount, speichert bei Änderungen)
  useStatePersistence();

  // === Common Store (Inputs & Ableitungen) ===
  const score         = useImmoStore(s => s.score);
  const updateDerived = useImmoStore(s => s.updateDerived);

  // Step A: Werte + Setter
  const kaufpreis   = useImmoStore(s => s.kaufpreis);
  const setKaufpreis = useImmoStore(s => s.setKaufpreis);

  const adresse     = useImmoStore(s => s.adresse);
  const setAdresse  = useImmoStore(s => s.setAdresse);

  const flaeche     = useImmoStore(s => s.flaeche);
  const setFlaeche  = useImmoStore(s => s.setFlaeche);

  const zimmer      = useImmoStore(s => s.zimmer);
  const setZimmer   = useImmoStore(s => s.setZimmer);

  const baujahr     = useImmoStore(s => s.baujahr);
  const setBaujahr  = useImmoStore(s => s.setBaujahr);

  const objekttyp = useImmoStore(s => s.objekttyp);
  const setObjekttyp = useImmoStore(s => s.setObjekttyp);

  const grEStPct    = useImmoStore(s => s.grunderwerbsteuer_pct);
  const grunderwerbsteuer_pct   = useImmoStore(s => s.grunderwerbsteuer_pct);
  const setGrunderwerbsteuerPct = useImmoStore(s => s.setGrunderwerbsteuerPct);

  const notarPct    = useImmoStore(s => s.notar_pct);
  const setNotarPct = useImmoStore(s => s.setNotarPct);

  const maklerPct   = useImmoStore(s => s.makler_pct);
  const setMaklerPct = useImmoStore(s => s.setMaklerPct);

  const sonstigeKosten = useImmoStore(s => s.sonstige_kosten);
  const setSonstigeKosten = useImmoStore(s => s.setSonstigeKosten);

  // Step B: Werte + Setter
  const miete       = useImmoStore(s => s.miete);
  const setMiete    = useImmoStore(s => s.setMiete);

  const hausgeld    = useImmoStore(s => s.hausgeld);
  const setHausgeld = useImmoStore(s => s.setHausgeld);

  const hausgeld_umlegbar     = useImmoStore(s => s.hausgeld_umlegbar);
  const setHausgeldUmlegbar = useImmoStore(s => s.setHausgeldUmlegbar);

  const anzahlWohneinheiten = useImmoStore(s => s.anzahl_wohneinheiten);
  const setAnzahlWohneinheiten = useImmoStore(s => s.setAnzahlWohneinheiten);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const verwaltungskosten = useImmoStore(s => s.verwaltungskosten);
  const setVerwaltungskosten = useImmoStore(s => s.setVerwaltungskosten);

  const instandhaltungskostenProQm = useImmoStore(s => s.instandhaltungskosten_pro_qm);
  const setInstandhaltungskostenProQm = useImmoStore(s => s.setInstandhaltungskostenProQm);

  const setMietausfallPct = useImmoStore(s => s.setMietausfallPct);
  const setPersoenlicherSteuersatz = useImmoStore(s => s.setPersoenlicherSteuersatz);

  const afaStore    = useImmoStore(s => s.afa);
  const setAfa      = useImmoStore(s => s.setAfa);
  const setSteuer   = useImmoStore(s => s.setSteuer);
  const steuer      = useImmoStore(s => s.steuer);

  // Step C: Werte + Setter
  const ek          = useImmoStore(s => s.ek);
  const setEk       = useImmoStore(s => s.setEk);

  const zins        = useImmoStore(s => s.zins);
  const setZins     = useImmoStore(s => s.setZins);

  const tilgung     = useImmoStore(s => s.tilgung);
  const setTilgung  = useImmoStore(s => s.setTilgung);

  // === Tabs (neu) ===
  const [activeTab, setActiveTab] = useState<'kpi' | 'markt' | 'prognose' | 'szenarien'>('kpi');
  const [tilgungDeltaPp, setTilgungDeltaPp] = useState<number>(0);
  const [ekDeltaPct, setEkDeltaPct] = useState<number>(0);
  const [openFormulaKey, setOpenFormulaKey] = useState<string | null>(null);


  // === Local UI-States (Step-A Felder, damit Kommaeingaben sauber sind) ===
  const [grunderwerbText, setGrunderwerbText] = useState(
    grEStPct.toString().replace('.', ',')
  );
  const [notarText, setNotarText] = useState(
    notarPct.toString().replace('.', ',')
  );
  const [maklerText, setMaklerText] = useState(
    maklerPct.toString().replace('.', ',')
  );
  const [sonstigeKostenText, setSonstigeKostenText] = useState(
    sonstigeKosten.toString().replace('.', ',')
  );
  const [flaecheText, setFlaecheText] = useState(
    flaeche.toString().replace('.', ',')
  );
  useEffect(() => {
    setFlaecheText(flaeche.toString().replace('.', ','));
  }, [flaeche]);

  // Update maklerText when maklerPct changes (e.g., from URL scraper)
  useEffect(() => {
    setMaklerText(maklerPct.toString().replace('.', ','));
  }, [maklerPct]);

  // Update sonstigeKostenText when sonstigeKosten changes
  useEffect(() => {
    setSonstigeKostenText(sonstigeKosten.toLocaleString('de-DE'));
  }, [sonstigeKosten]);

  // === Derived Values (einheitlich, keine Duplikate) ===
  const warmmiete = miete + hausgeld_umlegbar;

  const {
    grunderwerbsteuer_eur,
    notar_eur,
    makler_eur,
    nk
  } = berechneNebenkosten(kaufpreis, grEStPct, notarPct, maklerPct);

  const anschaffungskosten = kaufpreis + nk + sonstigeKosten;
  const darlehensSumme     = kaufpreis + nk + sonstigeKosten - ek;

  const jahreskaltmiete     = miete * 12;
  const bewirtschaftungskostenJ =
    (hausgeld - hausgeld_umlegbar) * 12 + instandhaltungskostenProQm * flaeche;
  const fkZinsenJahr        = darlehensSumme * (zins / 100);

  // --- Steuer-Berechnung (monatlich) ---
  // Local text states & defaults for Step B (UI-Eingaben in %/€)
  const defaultAfaForBaujahr = (year: number) => {
    if (!year) return 2;
    if (year < 1925) return 2.5;
    if (year >= 2023) return 3;
    return 2;
  };

  const defaultGebaeudeAnteil = (typ: 'wohnung' | 'haus' | 'mfh') => {
    switch (typ) {
      case 'haus':
        return 80;
      case 'mfh':
        return 85;
      case 'wohnung':
      default:
        return 75;
    }
  };

  const [mietausfallText, setMietausfallText] = useState('1,00');
  const [instandText,     setInstandText]     = useState('10,00');
  const [persText,        setPersText]        = useState('42,00');
  const initialAfa = afaStore ?? defaultAfaForBaujahr(baujahr);
  const initialGebaeude = steuer || defaultGebaeudeAnteil(objekttyp);
  const [afaText,         setAfaText]         = useState(initialAfa.toString().replace('.', ','));
  const [gebText,         setGebText]         = useState(initialGebaeude.toString().replace('.', ','));
  const [hausUmlegText,   setHausUmlegText]   = useState(() => hausgeld_umlegbar.toString());
  const [hausNichtText,   setHausNichtText]   = useState(() => (hausgeld - hausgeld_umlegbar).toString());
  const autoAfa = useRef(false);
  const autoGebaeude = useRef(false);

  // Zinssatz/Tilgung (Textfelder) für Step C
  const [zinsText,    setZinsText]    = useState((zins ?? 3.5).toString().replace('.', ','));
  const [tilgungText, setTilgungText] = useState((tilgung ?? 2.0).toString().replace('.', ','));

  // Szenarien – zusätzliche Regler
  const [mieteDeltaPct, setMieteDeltaPct]   = useState<number>(0);
  const [preisDeltaPct, setPreisDeltaPct]   = useState<number>(0);
  const [zinsDeltaPp,   setZinsDeltaPp]     = useState<number>(0);
  const [wertentwicklungAktiv, setWertentwicklungAktiv] = useState<boolean>(false);
  const [wertentwicklungPct, setWertentwicklungPct] = useState<number>(1.5);
  const [sondertilgungJaehrlich, setSondertilgungJaehrlich] = useState<number>(0);
  const [sondertilgungText, setSondertilgungText] = useState<string>('0');
  const [liquiditaetJahrIndex, setLiquiditaetJahrIndex] = useState<number>(0);
  // Kurvendiagramm Toggle-Optionen
  const [zeigeEigenkapitalAufbau, setZeigeEigenkapitalAufbau] = useState<boolean>(false);
  const [zeigeCashflowKumuliert, setZeigeCashflowKumuliert] = useState<boolean>(true);

  // Erweiterte Prognose-Optionen
  const [darlehensTyp, setDarlehensTyp] = useState<'annuitaet' | 'degressiv'>('annuitaet');
  const [mietInflationPct, setMietInflationPct] = useState<number>(0);
  const [kostenInflationPct, setKostenInflationPct] = useState<number>(0);
  const [verkaufsNebenkostenPct, setVerkaufsNebenkostenPct] = useState<number>(5);
  const [zeigeErweiterteOptionen, setZeigeErweiterteOptionen] = useState<boolean>(false);

  // Markt-Deltas von Agent (für Badges)
  const [mietMarktDelta, setMietMarktDelta] = useState<number | null>(null);
  const [kaufMarktDelta, setKaufMarktDelta] = useState<number | null>(null);
  
  const formulaDetails = {
    brutto: {
      title: 'Bruttomietrendite',
      formula: 'Jahreskaltmiete ÷ Anschaffungskosten × 100',
      description: 'Zeigt den Anteil der Jahresmiete am gesamten Kaufpreis (inkl. Nebenkosten).',
    },
    netto: {
      title: 'Nettomietrendite',
      formula: '(Jahreskaltmiete − Bewirtschaftungskosten) ÷ Anschaffungskosten × 100',
      description: 'Bezieht laufende Kosten ein und zeigt die realistischere Rendite.',
    },
    cfVor: {
      title: 'Cashflow vor Steuern',
      formula: 'Warmmiete − Hausgeld − kalk. Kosten − Zins − Tilgung',
      description: 'Was monatlich vor Steuern übrig bleibt (inkl. Puffer für Rücklagen).',
    },
    cfNach: {
      title: 'Cashflow nach Steuern',
      formula: 'Cashflow vor Steuern − Steuer',
      description: 'Was nach Steuern wirklich übrig bleibt.',
    },
    ek: {
      title: 'EK-Rendite',
      formula: '(Jahreskaltmiete − Bewirtschaftungskosten − Zinsen) ÷ Eigenkapital × 100',
      description: 'Rendite auf dein eingesetztes Eigenkapital (vor Tilgung/Steuer).',
    },
    dscr: {
      title: 'DSCR',
      formula: 'NOI ÷ (Zins + Tilgung)',
      description: 'Zeigt, wie gut die Miete die Kreditrate deckt.',
    },
  };

  const renderFormulaDrawer = () => {
    if (!openFormulaKey) return null;
    const details = formulaDetails[openFormulaKey as keyof typeof formulaDetails];
    if (!details) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-xl font-black text-[#001d3d]">{details.title}</h3>
              <p className="text-sm text-slate-600 mt-1">{details.description}</p>
            </div>
            <button
              onClick={() => setOpenFormulaKey(null)}
              className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:border-slate-300 transition"
              aria-label="Formel schließen"
            >
              ×
            </button>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-mono text-slate-800">
            {details.formula}
          </div>
        </div>
      </div>
    );
  };

  // 1) Texte -> Zahlen
  const instandhaltungPct = Number(instandText.replace(',', '.')) || 0;
  const mietausfallPct    = Number(mietausfallText.replace(',', '.')) || 0;
  const afaPct            = Number(afaText.replace(',', '.')) || 0;
  const gebPct            = Number(gebText.replace(',', '.')) || 0;
  const effectiveStz      = Number(persText.replace(',', '.')) || 0;

  // 2) kalkulatorische Kosten (monatlich)
  const instandhaltungMonthly = (instandhaltungPct * flaeche) / 12;
  const mietausfallMonthly    = miete * (mietausfallPct / 100);
  const kalkKostenMonthly     = instandhaltungMonthly + mietausfallMonthly;

  // 3) Hausgeld gesamt (bereits umlagefähig + nicht umlagefähig)
  const hausgeldTotal = hausgeld;

  // 4) Zins & Tilgung (monatlich)
  const zinsMonthly    = (darlehensSumme * (zins / 100)) / 12;
  const tilgungMonthly = (darlehensSumme * (tilgung / 100)) / 12;

  // 5) operativer Cashflow vor Steuern
  const cashflowVorSteuer =
    warmmiete - hausgeldTotal - kalkKostenMonthly - zinsMonthly - tilgungMonthly;

  // 6) AfA (monatlich)
  const gebaeudeAnteilEur = (kaufpreis * gebPct) / 100;
  const afaAnnualEur      = gebaeudeAnteilEur * (afaPct / 100);
  const afaMonthlyEur     = afaAnnualEur / 12;

  // 7) zu versteuernder Cashflow (ohne kalkulatorische Kosten)
  const taxableCashflow =
    warmmiete - hausgeldTotal - zinsMonthly - afaMonthlyEur;

  // 8) Steuer (monatlich) – kann negativ sein (= Steuervorteil)
  const taxMonthly = taxableCashflow * (effectiveStz / 100);

  // 9) finaler Cashflow nach Steuern
  const cashflowAfterTax = cashflowVorSteuer - taxMonthly;

  const breakEvenJahre = cashflowAfterTax > 0 ? ek / (cashflowAfterTax * 12) : Infinity;

  const formatEur = (value: number, maximumFractionDigits = 0) =>
    value.toLocaleString('de-DE', { maximumFractionDigits });

  const prognose = useMemo(
    () =>
      berechnePrognose(
        {
          startJahr: new Date().getFullYear(),
          darlehensSumme,
          ek,
          zins,
          tilgung,
          warmmiete,
          hausgeld: hausgeldTotal,
          kalkKostenMonthly,
          afaJaehrlich: afaAnnualEur,
          steuersatz: effectiveStz,
          immobilienwert: wertentwicklungAktiv ? kaufpreis : undefined,
          wertsteigerungPct: wertentwicklungAktiv ? wertentwicklungPct : undefined,
          sondertilgungJaehrlich,
          darlehensTyp,
          mietInflationPct,
          kostenInflationPct,
          verkaufsNebenkostenPct: wertentwicklungAktiv ? verkaufsNebenkostenPct : undefined,
        },
        30
      ),
    [
      darlehensSumme,
      ek,
      zins,
      tilgung,
      warmmiete,
      hausgeldTotal,
      kalkKostenMonthly,
      afaAnnualEur,
      effectiveStz,
      wertentwicklungAktiv,
      wertentwicklungPct,
      kaufpreis,
      sondertilgungJaehrlich,
      darlehensTyp,
      mietInflationPct,
      kostenInflationPct,
      verkaufsNebenkostenPct,
    ]
  );

  const prognoseMilestones = useMemo(() => {
    const halbschuld = darlehensSumme / 2;
    const halbschuldJahr = prognose.jahre.find(jahr => jahr.restschuld <= halbschuld);
    const selbstfinanziert = prognose.jahre.find(jahr => jahr.cashflowKumuliert >= jahr.restschuld);
    const eigenkapitalGrößerKaufpreis = prognose.jahre.find(jahr => jahr.eigenkapitalGesamt >= kaufpreis);
    const cashflowPositiv = prognose.jahre.find(jahr => jahr.cashflowOhneSondertilgung > 0);

    return {
      halbschuld: halbschuldJahr,
      selbstfinanziert,
      eigenkapitalGrößerKaufpreis,
      cashflowPositiv,
    };
  }, [darlehensSumme, prognose.jahre, kaufpreis]);

  const verkaufSzenarien = useMemo(() => {
    const jahre = [10, 20, 30];
    return jahre.map((jahr) => {
      const daten = prognose.jahre[jahr];
      if (!daten) {
        return {
          jahr,
          restschuld: 0,
          immobilienwert: wertentwicklungAktiv ? kaufpreis : 0,
          eigenkapital: 0,
          cashflowKumuliert: 0,
          verkaufsNebenkosten: 0,
          gesamtErgebnis: 0,
        };
      }
      const immobilienwert = daten.immobilienwert ?? kaufpreis;
      const verkaufsNebenkosten = daten.verkaufsNebenkosten ?? 0;
      const eigenkapital = immobilienwert - verkaufsNebenkosten - daten.restschuld;
      const gesamtErgebnis = eigenkapital + daten.cashflowKumuliert - ek;

      return {
        jahr: daten.jahr,
        restschuld: daten.restschuld,
        immobilienwert,
        eigenkapital,
        cashflowKumuliert: daten.cashflowKumuliert,
        verkaufsNebenkosten,
        gesamtErgebnis,
      };
    });
  }, [prognose.jahre, wertentwicklungAktiv, kaufpreis, ek]);

  const verkaufBreakEven = useMemo(() => {
    const breakEven = prognose.jahre.find((jahr) => {
      const immobilienwert = jahr.immobilienwert ?? kaufpreis;
      const verkaufsNebenkosten = jahr.verkaufsNebenkosten ?? 0;
      const eigenkapitalVerkauf = immobilienwert - verkaufsNebenkosten - jahr.restschuld;
      const gesamtErgebnis = eigenkapitalVerkauf + jahr.cashflowKumuliert - ek;
      return gesamtErgebnis >= 0;
    });
    return breakEven?.jahr ?? null;
  }, [prognose.jahre, kaufpreis, ek]);

  const liquiditaetJahr = prognose.jahre[Math.min(liquiditaetJahrIndex, prognose.jahre.length - 1)] ?? prognose.jahre[0];

  // Store-Ableitungen aktualisieren, wenn sich Kernwerte ändern
  useEffect(() => {
    updateDerived();
  }, [cashflowVorSteuer, taxMonthly, updateDerived]);

  // Default-Werte je Objekttyp setzen
  useEffect(() => {
    if (!mounted) return;

    // Instandhaltungskosten-Defaults
    if (instandhaltungskostenProQm === 0) {
      const defaultInstand = objekttyp === 'wohnung' ? 9 : objekttyp === 'haus' ? 12 : 15;
      setInstandhaltungskostenProQm(defaultInstand);
      setInstandText(defaultInstand.toString().replace('.', ','));
    }

    // Mietausfall-Defaults
    if (mietausfallPct === 0) {
      const defaultMietausfall = (objekttyp === 'mfh' && anzahlWohneinheiten > 3) ? 3 : 5;
      setMietausfallPct(defaultMietausfall);
      setMietausfallText(defaultMietausfall.toFixed(2).replace('.', ','));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objekttyp, anzahlWohneinheiten, mounted]);

  useEffect(() => {
    if (!mounted) return;

    const defaultAfa = defaultAfaForBaujahr(baujahr);
    const parsedAfa = Number(afaText.replace(',', '.')) || 0;
    const shouldUpdateAfa =
      autoAfa.current ||
      parsedAfa === 0 ||
      Math.abs(parsedAfa - defaultAfa) < 0.001;

    if (shouldUpdateAfa) {
      setAfa(defaultAfa);
      setAfaText(defaultAfa.toString().replace('.', ','));
      autoAfa.current = true;
    }

    const defaultGeb = defaultGebaeudeAnteil(objekttyp);
    const parsedGeb = Number(gebText.replace(',', '.')) || 0;
    const shouldUpdateGeb =
      autoGebaeude.current ||
      parsedGeb === 0 ||
      Math.abs(parsedGeb - defaultGeb) < 0.001;

    if (shouldUpdateGeb) {
      setSteuer(defaultGeb);
      setGebText(defaultGeb.toString().replace('.', ','));
      autoGebaeude.current = true;
    }
  }, [baujahr, objekttyp, mounted, setAfa, setSteuer, afaText, gebText]);

  // KPI-Berechnungen (in %)
  const bruttoMietrendite = anschaffungskosten > 0
    ? (jahreskaltmiete / anschaffungskosten) * 100
    : 0;

  const nettoMietrendite  = anschaffungskosten > 0
    ? ((jahreskaltmiete - bewirtschaftungskostenJ) / anschaffungskosten) * 100
    : 0;

  // Alias
  const nettorendite = nettoMietrendite;

  const ekRendite = ek > 0
    ? ((jahreskaltmiete - bewirtschaftungskostenJ - fkZinsenJahr) / ek) * 100
    : 0;

    // Debt Service Coverage Ratio (DSCR): Nettoeinnahmen / Kreditrate
const dscr =
  ((warmmiete - hausgeldTotal - kalkKostenMonthly) /
    (((darlehensSumme * (zins / 100)) / 12) +
     ((darlehensSumme * (tilgung / 100)) / 12))) || 0;



  // Break-Even
  /*const breakEvenJahre = useImmoStore((s) =>
    s.cashflow_operativ > 0 ? s.ek / (s.cashflow_operativ * 12) : Infinity
  );*/

  // Validation function for required fields
  const validateStep = (currentStep: string): { isValid: boolean; missingFields: string[] } => {
    const missing: string[] = [];

    if (currentStep === 'a') {
      // Step A validation - only Kaufpreis
      if (!kaufpreis || kaufpreis <= 0) missing.push('Kaufpreis');
    } else if (currentStep === 'a2') {
      // Step A2 validation - Objektdaten
      if (!adresse || adresse.trim() === '') missing.push('Adresse');
      if (!flaeche || flaeche <= 0) missing.push('Wohnfläche');
      if (flaeche > 0 && flaeche < 10) missing.push('Wohnfläche (mind. 10 m²)');
      // Bei MFH: Validiere anzahl_wohneinheiten statt zimmer
      if (objekttyp === 'mfh') {
        if (!anzahlWohneinheiten || anzahlWohneinheiten <= 0) missing.push('Wohneinheiten');
        if (anzahlWohneinheiten > 50) missing.push('Wohneinheiten (max. 50)');
      } else {
        if (!zimmer || zimmer <= 0) missing.push('Anzahl Zimmer');
        if (zimmer > 20) missing.push('Anzahl Zimmer (max. 20)');
      }
      if (!baujahr || baujahr <= 0) missing.push('Baujahr');
      if (baujahr > 0 && baujahr < 1800) missing.push('Baujahr (muss ab 1800 sein)');
      if (baujahr > new Date().getFullYear() + 2) missing.push('Baujahr (liegt zu weit in der Zukunft)');
    } else if (currentStep === 'b') {
      // Step B validation - ensure Step A is complete first
      if (!kaufpreis || kaufpreis <= 0) missing.push('Kaufpreis');
      if (!adresse || adresse.trim() === '') missing.push('Adresse');
      if (!flaeche || flaeche <= 0) missing.push('Wohnfläche');
      if (flaeche > 0 && flaeche < 10) missing.push('Wohnfläche (mind. 10 m²)');
      // Bei MFH: Validiere anzahl_wohneinheiten statt zimmer
      if (objekttyp === 'mfh') {
        if (!anzahlWohneinheiten || anzahlWohneinheiten <= 0) missing.push('Wohneinheiten');
      } else {
        if (!zimmer || zimmer <= 0) missing.push('Anzahl Zimmer');
      }
      if (!baujahr || baujahr <= 0) missing.push('Baujahr');
      if (baujahr > 0 && baujahr < 1800) missing.push('Baujahr (muss ab 1800 sein)');
      if (baujahr > new Date().getFullYear() + 2) missing.push('Baujahr (liegt zu weit in der Zukunft)');
      if (!miete || miete <= 0) missing.push('Kaltmiete');
    } else if (currentStep === 'c') {
      // Step C validation - ensure all previous steps are complete
      if (!kaufpreis || kaufpreis <= 0) missing.push('Kaufpreis');
      if (!adresse || adresse.trim() === '') missing.push('Adresse');
      if (!flaeche || flaeche <= 0) missing.push('Wohnfläche');
      if (flaeche > 0 && flaeche < 10) missing.push('Wohnfläche (mind. 10 m²)');
      // Bei MFH: Validiere anzahl_wohneinheiten statt zimmer
      if (objekttyp === 'mfh') {
        if (!anzahlWohneinheiten || anzahlWohneinheiten <= 0) missing.push('Wohneinheiten');
      } else {
        if (!zimmer || zimmer <= 0) missing.push('Anzahl Zimmer');
      }
      if (!baujahr || baujahr <= 0) missing.push('Baujahr');
      if (baujahr > 0 && baujahr < 1800) missing.push('Baujahr (muss ab 1800 sein)');
      if (baujahr > new Date().getFullYear() + 2) missing.push('Baujahr (liegt zu weit in der Zukunft)');
      if (!miete || miete <= 0) missing.push('Kaltmiete');
      if (ek === null || ek === undefined || ek < 0) missing.push('Eigenkapital');
      if (zins === null || zins === undefined || zins < 0) missing.push('Zinssatz');
      if (zins > 20) missing.push('Zinssatz (max. 20%)');
      if (tilgung === null || tilgung === undefined || tilgung < 0) missing.push('Tilgungssatz');
      if (tilgung > 10) missing.push('Tilgungssatz (max. 10%)');
    }

    return { isValid: missing.length === 0, missingFields: missing };
  };

  const handleNavigateToNextStep = () => {
    const validation = validateStep(step);

    if (!validation.isValid) {
      toast.error('Bitte fülle alle Pflichtfelder aus', {
        description: `Fehlende Felder: ${validation.missingFields.join(', ')}`,
        duration: 4000,
      });
      return;
    }

    router.push(`/step/${nextStep}`);
  };

  // Bei Wechsel in die Tabs einmalig Derived erzwingen (ersetzt "result")
  useEffect(() => {
    if (step === 'tabs') updateDerived();
  }, [step, updateDerived]);

  // === KI-Kurzkommentar (Tab 1) ===
  const generatedComment = useImmoStore(s => s.generatedComment);
  const setGeneratedComment = useImmoStore(s => s.setGeneratedComment);
  const [isLoadingComment, setIsLoadingComment] = useState<boolean>(false);
  const [isCommentLocked, setIsCommentLocked] = useState<boolean>(false);
  const commentFetched = useRef(false);
  const lastCommentInputs = useRef<string>('');

  useEffect(() => {
    if (step !== 'tabs') return;
    if (activeTab !== 'kpi') return;

    // Validate required fields before generating analysis
    const missingFields = [];
    if (!kaufpreis || kaufpreis <= 0) missingFields.push('Kaufpreis');
    if (!adresse || adresse.trim() === '') missingFields.push('Adresse');
    if (!flaeche || flaeche <= 0) missingFields.push('Fläche');
    if (!zimmer || zimmer <= 0) missingFields.push('Zimmer');
    if (!baujahr || baujahr <= 0) missingFields.push('Baujahr');
    if (!miete || miete <= 0) missingFields.push('Kaltmiete');
    if (!ek && ek !== 0) missingFields.push('Eigenkapital');
    if (!zins && zins !== 0) missingFields.push('Zinssatz');
    if (!tilgung && tilgung !== 0) missingFields.push('Tilgung');

    // If required fields are missing, skip analysis
    if (missingFields.length > 0) {
      console.log('Skipping analysis - missing required fields:', missingFields);
      return;
    }

    // Create fingerprint of inputs to detect real changes
    const inputFingerprint = JSON.stringify({
      kaufpreis, anschaffungskosten, adresse, flaeche, zimmer, baujahr,
      miete, hausgeld, hausgeld_umlegbar, ek, zins, tilgung,
      cashflowVorSteuer, nettoMietrendite, bruttoMietrendite
    });

    // If comment already exists from loaded analysis, mark as fetched and skip
    if (generatedComment && !commentFetched.current) {
      commentFetched.current = true;
      lastCommentInputs.current = inputFingerprint;
      return;
    }

    // Skip if already fetched with same inputs
    if (commentFetched.current && lastCommentInputs.current === inputFingerprint) {
      return;
    }

    lastCommentInputs.current = inputFingerprint;
    setIsLoadingComment(true);
    fetch('/api/generateComment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Basis
  score,
  address: adresse,
  city: cityFromAddress(adresse),
  objektTyp: 'Eigentumswohnung',

  // Größen & Eingaben
  kaufpreis,
  anschaffungskosten,
  context: {
    adresse, flaeche, zimmer, baujahr, objekttyp, miete, hausgeld, hausgeld_umlegbar, zins, tilgung, kaufpreis
  },
  flaeche,
  zimmer,
  baujahr,
  miete,
  hausgeld,
  hausgeld_umlegbar,
  ek,
  zins,
  tilgung,

  // Abgeleitete KPIs
  cashflowVorSteuer,
  cashflowNachSteuern: cashflowAfterTax,
  bruttoMietrendite,
  nettoMietrendite,
  ekQuotePct: anschaffungskosten > 0 ? (ek / anschaffungskosten) * 100 : 0,

  // Schuldendienst & Deckung
  debtServiceMonthly: ((darlehensSumme * ((zins + tilgung) / 100)) / 12),
  noiMonthly: (warmmiete - hausgeldTotal - kalkKostenMonthly),
  dscr: ((warmmiete - hausgeldTotal - kalkKostenMonthly) /
        (((darlehensSumme * (zins / 100)) / 12) + ((darlehensSumme * (tilgung / 100)) / 12))) || 0,

  // Bitte: Ton & Stil (wird im Prompt genutzt)
  tone: 'beraterhaft-kurz',
      }),
    })
      .then(r => r.json())
      .then(json => {
        if (json.locked) {
          setIsCommentLocked(true);
          setGeneratedComment('');
        } else {
          setIsCommentLocked(false);
          setGeneratedComment(json.comment || '');
        }
        commentFetched.current = true;
      })
      .catch(() => setGeneratedComment('Leider konnte die KI-Einschätzung nicht geladen werden.'))
      .finally(() => setIsLoadingComment(false));
  }, [step, activeTab, score, generatedComment, setGeneratedComment,
  cashflowVorSteuer, cashflowAfterTax, bruttoMietrendite, nettoMietrendite, ek, anschaffungskosten,
  adresse, flaeche, zimmer, baujahr, miete, hausgeld, hausgeld_umlegbar, zins, tilgung, kaufpreis,darlehensSumme, hausgeldTotal, kalkKostenMonthly, warmmiete, objekttyp]);

  // Note: Removed the reset effect - we now use fingerprint-based caching

  // === Markt & Lage (Tab 2) – Datencontainer/States ===
  // Use store for persistent comments (instead of local state)
  const lageComment = useImmoStore(s => s.lageComment);
  const setLageComment = useImmoStore(s => s.setLageComment);
  const mietpreisComment = useImmoStore(s => s.mietpreisComment);
  const setMietpreisComment = useImmoStore(s => s.setMietpreisComment);
  const qmPreisComment = useImmoStore(s => s.qmPreisComment);
  const setQmPreisComment = useImmoStore(s => s.setQmPreisComment);
  const investComment = useImmoStore(s => s.investComment);
  const setInvestComment = useImmoStore(s => s.setInvestComment);
  const [loadingDetails, setLoadingDetails]     = useState<boolean>(false);
  const marktFetched = useRef(false);
  const lastMarktInputs = useRef<string>('');

  // Track input changes ANYWHERE in the app (not just on markt tab)
  // This ensures we detect changes made on step pages
  useEffect(() => {
    const inputFingerprint = JSON.stringify({
      adresse, objekttyp, kaufpreis, flaeche, zimmer, baujahr,
      miete, hausgeld, hausgeld_umlegbar, ek, zins, tilgung
    });

    // If inputs have changed since last time, invalidate the cache
    if (lastMarktInputs.current && lastMarktInputs.current !== inputFingerprint) {
      console.log('[Markt] Inputs changed - invalidating comment cache');
      marktFetched.current = false; // This will trigger reload when user goes to markt tab

      // If we currently have comments loaded, clear them immediately
      if (lageComment || mietpreisComment || qmPreisComment || investComment) {
        setLageComment('');
        setMietpreisComment('');
        setQmPreisComment('');
        setInvestComment('');
      }
    }

    lastMarktInputs.current = inputFingerprint;
  }, [adresse, objekttyp, kaufpreis, flaeche, zimmer, baujahr,
      miete, hausgeld, hausgeld_umlegbar, ek, zins, tilgung,
      lageComment, mietpreisComment, qmPreisComment, investComment,
      setLageComment, setMietpreisComment, setQmPreisComment, setInvestComment]);

  // Main effect to fetch comments
  useEffect(() => {
  if (!(step === 'tabs' && activeTab === 'markt')) return;

  // If no premium access, show placeholder content
  if (!canAccessPremium) {
    setLageComment('<p>Premium-Inhalte sind hier verfügbar. Die Lageanalyse bietet detaillierte Einblicke in die Umgebung, Infrastruktur und Entwicklungspotenzial der Immobilie.</p>');
    setMietpreisComment('<p>Hier findest du einen umfassenden Vergleich der Mietpreise in der Umgebung, inklusive Marktpositionierung und Preisentwicklung.</p>');
    setQmPreisComment('<p>Der Kaufpreisvergleich zeigt dir, wie der Quadratmeterpreis im Vergleich zu ähnlichen Objekten in der Gegend einzuordnen ist.</p>');
    setInvestComment('<p>Die Investitionsanalyse kombiniert alle Faktoren und gibt dir eine fundierte Empfehlung für deine Kaufentscheidung.</p>');
    return;
  }

  // Check if we have existing comments - if so and we haven't fetched yet, skip reload
  const hasExistingComments = lageComment && mietpreisComment && qmPreisComment && investComment;

  // If comments exist and we already fetched them this session, skip reload
  if (hasExistingComments && marktFetched.current) {
    console.log('[Markt] Skipping reload - comments already loaded and cache valid');
    return;
  }

  // If already fetched in this session, skip
  if (marktFetched.current) {
    console.log('[Markt] Skipping reload - already fetched in this session');
    return;
  }

  // Increment usage counter (only once per session/analysis)
  if (!isPremium && !hasIncrementedUsage.current) {
    incrementPremiumUsage();
    hasIncrementedUsage.current = true;
  }

  // NOTE: marktFetched moved to AFTER successful API call to prevent blocking retries
  setLoadingDetails(true);

  (async () => {
    try {
      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Basis-Daten
          address: adresse,
          objektTyp: objekttyp === 'wohnung' ? 'Eigentumswohnung' : 'Haus',
          kaufpreis,
          flaeche,
          zimmer,
          baujahr,
          miete,
          hausgeld,
          hausgeld_umlegbar,
          ek,
          zins,
          tilgung,

          // ⚡ NEU: Berechnete KPIs mitschicken
          cashflowVorSteuer,
          cashflowNachSteuern: cashflowAfterTax,
          nettoMietrendite,
          bruttoMietrendite,
          ekRendite,
          dscr,
          anschaffungskosten,
        }),
      });

      const data = await res.json() as {
        analyse: {
          lage: { html: string };
          miete: { html: string; delta_psqm: number | null };
          kauf: { html: string; delta_psqm: number | null };
          facts: unknown;
        };
        invest: { html: string };
        error?: boolean;
        message?: string;
      };

      if (!res.ok || data.error) {
        const errorMsg = data.message || `HTTP ${res.status}`;
        throw new Error(errorMsg);
      }
      setLageComment(data.analyse?.lage?.html?.trim() || '<p>Für diese Adresse liegen aktuell zu wenige Lagehinweise vor.</p>');
      setMietpreisComment(data.analyse?.miete?.html?.trim() || '<p>Für diese Adresse liegen aktuell zu wenige belastbare Mietdaten vor.</p>');
      setQmPreisComment(data.analyse?.kauf?.html?.trim() || '<p>Für diese Adresse liegen aktuell zu wenige belastbare Kaufpreisdaten vor.</p>');
      setInvestComment(data.invest?.html?.trim() || '<p>Investitionsanalyse derzeit nicht verfügbar.</p>');

      // Store delta values if available
      if (data.analyse?.miete?.delta_psqm != null) {
        setMietMarktDelta(data.analyse.miete.delta_psqm);
      }
      if (data.analyse?.kauf?.delta_psqm != null) {
        setKaufMarktDelta(data.analyse.kauf.delta_psqm);
      }

      // Mark as successfully fetched only AFTER successful API call
      marktFetched.current = true;
    } catch (e) {
      console.error('Markt/Agent laden fehlgeschlagen', e);

      // Extract error message to show user why the agent failed
      const errorMessage = e instanceof Error ? e.message : 'Ein unbekannter Fehler ist aufgetreten';
      const errorHtml = `<div class="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p class="font-semibold text-red-800 mb-2">⚠️ Analyse fehlgeschlagen</p>
        <p class="text-red-700 text-sm">${errorMessage}</p>
        <p class="text-red-600 text-xs mt-2">Bitte überprüfe deine Eingaben und versuche es erneut.</p>
      </div>`;

      setLageComment(errorHtml);
      setMietpreisComment('<p>Analyse nicht verfügbar.</p>');
      setQmPreisComment('<p>Analyse nicht verfügbar.</p>');
      setInvestComment('<p>Analyse nicht verfügbar.</p>');
      // Don't set marktFetched on error - allow retry
    } finally {
      setLoadingDetails(false);
    }
  })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [
  step, activeTab,
  adresse, objekttyp,
  kaufpreis, flaeche, zimmer, baujahr,
  miete, hausgeld, hausgeld_umlegbar,
  ek, zins, tilgung,
  // Paywall context dependencies
  canAccessPremium, incrementPremiumUsage, isPremium, setShowUpgradeModal, anschaffungskosten, bruttoMietrendite, cashflowAfterTax, cashflowVorSteuer, dscr, ekRendite, nettoMietrendite
  // Note: Setters and comment states are intentionally excluded to prevent infinite loops
]);




// Anzeige-Adresse ohne Landeszusatz
const shortAddress = React.useMemo(() => {
  if (!adresse) return '';
  const parts = adresse.split(',').map(s => s.trim());
  if (parts.length <= 1) return adresse;
  const last = parts[parts.length - 1]?.toLowerCase();
  if (['deutschland','germany','bundesrepublik deutschland','de'].includes(last)) {
    return parts.slice(0, -1).join(', ');
  }
  return adresse;
}, [adresse]);

// ⬇️ HIER EINSETZEN
const cancelPdfExport = React.useCallback(() => {
  if (pdfAbortController.current) {
    pdfAbortController.current.abort();
    pdfAbortController.current = null;
    setPdfBusy(false);
    toast.info('PDF-Export abgebrochen');
  }
}, []);

const exportPdf = React.useCallback(async () => {
  setPdfBusy(true);
  pdfAbortController.current = new AbortController();
  try {
    // HTML → Plaintext lokal, damit ESLint ruhig bleibt
    const strip = (html: string) =>
      (html || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

    // Szenario-Werte berechnen (aus aktuellen UI-States)
    const scMiete     = Math.max(0, miete * (1 + mieteDeltaPct / 100));
    const scKaufpreis = Math.max(0, kaufpreis * (1 + preisDeltaPct / 100));
    const scZins      = Math.max(0, zins + zinsDeltaPp);
    const scTilgung   = Math.max(0, tilgung + tilgungDeltaPp);
    const scEk        = Math.max(0, ek * (1 + ekDeltaPct / 100));
    

    const { nk: scNk } = berechneNebenkosten(
      scKaufpreis, grunderwerbsteuer_pct, notarPct, maklerPct
    );
    const scAnsch    = scKaufpreis + scNk;
    const scDarl     = Math.max(0, scAnsch - scEk);
    const scZMon     = (scDarl * (scZins / 100)) / 12;
    const scTMon     = (scDarl * (scTilgung / 100)) / 12;
    const scInstand  = (Number(instandText.replace(',', '.')) || 0) * flaeche / 12;
    const scMietausf = scMiete * ((Number(mietausfallText.replace(',', '.')) || 0) / 100);
    const scKalk     = scInstand + scMietausf;
    const scWarm     = scMiete + hausgeld_umlegbar;

    const scCFvSt = scWarm - hausgeld - scKalk - scZMon - scTMon;
    const scBewJ  = (hausgeld - hausgeld_umlegbar) * 12 + instandhaltungskostenProQm * flaeche;
    const scNetto = scAnsch > 0 ? ((scMiete * 12 - scBewJ) / scAnsch) * 100 : 0;
    const debtServiceMonthly = (darlehensSumme * ((zins + tilgung) / 100)) / 12;

    const ekQuotePct = anschaffungskosten > 0 ? (ek / anschaffungskosten) * 100 : 0;
    const scEkR   = scEk > 0 ? ((scMiete * 12 - scBewJ - (scDarl * (scZins / 100))) / scEk) * 100 : 0;

    const scRateMon    = (scDarl * ((scZins + scTilgung) / 100)) / 12;
    const scNoiMonthly = (scWarm) - hausgeld - scKalk;                 // wie im App-Tab
    const scDscr       = scRateMon > 0 ? (scNoiMonthly / scRateMon) : 0;
    const scBruttoRend = scAnsch > 0 ? ((scMiete * 12) / scAnsch) * 100 : 0;
    
    // Abzahlungsjahr (≈) wie in der App: aktuelles Jahr + 1/(zins+tilgung)
    const payoffYearsApprox = (scZins + scTilgung) > 0 ? Math.round(1 / ((scZins + scTilgung) / 100)) : 0;
    const scAbzahlungsjahr  = payoffYearsApprox ? new Date().getFullYear() + payoffYearsApprox : null;

    // (optional) Cashflow nach Steuern (wie Basis, aber mit Szenariowerten)
    const gebPctN = Number(gebText.replace(',', '.')) || 0;
    const afaPctN = Number(afaText.replace(',', '.')) || 0;
    const gebaeudeAnteilEurSc = (scKaufpreis * gebPctN) / 100;
    const afaAnnualEurSc      = gebaeudeAnteilEurSc * (afaPctN / 100);
    const afaMonthlyEurSc     = afaAnnualEurSc / 12;
    const effStzN             = Number(persText.replace(',', '.')) || 0;
    const taxableSc           = scWarm - hausgeld - scKalk - scZMon - afaMonthlyEurSc;
    const taxMonthlySc        = taxableSc * (effStzN / 100);
    const scCashflowAfterTax  = scCFvSt - taxMonthlySc;

    const payload = {
      address: shortAddress || adresse,
      kaufpreis, flaeche, zimmer, baujahr,
      miete, ek, zins, tilgung,
      cashflowVorSteuer,
      nettoMietrendite, bruttoMietrendite, ekRendite,
      anschaffungskosten, darlehensSumme,
      lageText: strip(lageComment),
      mietvergleich: strip(mietpreisComment),
      preisvergleich: strip(qmPreisComment),
      szenario: {
        kaufpreis: scKaufpreis, miete: scMiete, zins: scZins, tilgung: scTilgung, ek: scEk,
        cashflowVorSteuer: scCFvSt, nettoRendite: scNetto, ekRendite: scEkR
      },
      debtServiceMonthly,
  ekQuotePct,
  bruttorendite: scBruttoRend,
  noiMonthly: scNoiMonthly,
  dscr: scDscr,
  rateMonat: scRateMon,
  abzahlungsjahr: scAbzahlungsjahr,
  cashflowNachSteuern: scCashflowAfterTax
    };

    const res = await fetch('/api/export/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: pdfAbortController.current?.signal
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || 'PDF-Export fehlgeschlagen');
    }

    // Force download by converting to octet-stream blob
    const originalBlob = await res.blob();
    const blob = new Blob([originalBlob], { type: 'application/octet-stream' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = 'immo_analyse.pdf';
    a.style.display = 'none';
    a.target = '_self';  // Prevent opening in new tab
    document.body.appendChild(a);
    a.click();

    // Clean up after a short delay to ensure download starts
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    toast.success('PDF erfolgreich heruntergeladen');
  } catch (err) {
    console.error('PDF export failed', err);
    // Don't show error toast if the request was aborted
    if (err instanceof Error && err.name !== 'AbortError') {
      toast.error('PDF-Export fehlgeschlagen. Bitte versuche es erneut.');
    }
  } finally {
    pdfAbortController.current = null;
    setPdfBusy(false);
  }
}, [
  // Exhaustive deps aller verwendeten States/Variablen, die oben genutzt werden
  mieteDeltaPct, preisDeltaPct, zinsDeltaPp, tilgungDeltaPp, ekDeltaPct,
  miete, kaufpreis, zins, tilgung, ek,
  grunderwerbsteuer_pct, notarPct, maklerPct,
  instandText, mietausfallText, flaeche,
  hausgeld_umlegbar, hausgeld, instandhaltungskostenProQm,
  shortAddress, adresse, zimmer, baujahr,
  cashflowVorSteuer, nettoMietrendite, bruttoMietrendite, ekRendite,
  anschaffungskosten, darlehensSumme,
  lageComment, mietpreisComment, qmPreisComment, afaText, gebText, persText,
]);


  // === Quick Recommendations (Tab 1) ===
  const recommendations: string[] = [];
  if (cashflowVorSteuer < 0) {
    recommendations.push('Cashflow ist negativ – Refinanzierung prüfen');
  } else {
    recommendations.push('Cashflow positiv – solide Grundlage');
  }
  if (nettorendite < 1) {
    recommendations.push('Nettorendite < 1 % – Renditemaximierung überlegen');
  } else if (nettorendite < 3) {
    recommendations.push('Nettorendite zw. 1 % und 3 % – moderates Investment');
  } else {
    recommendations.push('Nettorendite ≥ 3 % – starkes Investment');
  }

  //pdf export
  const [pdfBusy, setPdfBusy] = useState(false);
  const pdfAbortController = useRef<AbortController | null>(null);

  let content: React.ReactNode;

  if (step === 'a') {
    content = (
      <>
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-[#001d3d] tracking-tight leading-none">Kaufpreis & Nebenkosten.</h1>
        </div>

        {/* Input Container */}
        <div className="bg-slate-50 rounded-[2.5rem] p-6 md:p-12 border border-slate-100/50 shadow-inner space-y-6 max-w-5xl mx-auto">

          {/* Kaufpreis */}
          <div className="space-y-1.5 w-full">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-1">Kaufpreis</label>
            <div className="relative group">
              <EuroIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff6b00] transition-colors" size={18} />
              <input
                type="text"
                value={mounted ? kaufpreis.toLocaleString('de-DE') : kaufpreis.toString()}
                onChange={(e) => setKaufpreis(Number(e.target.value.replace(/\./g, '').replace(',', '.')))}
                onFocus={(e) => e.target.select()}
                className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-5 text-base font-bold text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Kaufnebenkosten Section */}
          <div className="pt-4">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Kaufnebenkosten</h3>

            <div className="grid grid-cols-1 gap-6">
              {[
                { label: 'Grunderwerbsteuer', text: grunderwerbText, setText: setGrunderwerbText, setter: setGrunderwerbsteuerPct, amount: grunderwerbsteuer_eur },
                { label: 'Notar & Grundbuch', text: notarText, setText: setNotarText, setter: setNotarPct, amount: notar_eur },
                { label: 'Maklergebühr', text: maklerText, setText: setMaklerText, setter: setMaklerPct, amount: makler_eur },
              ].map((item, i) => (
                <div key={i} className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-1">{item.label}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Prozent Input */}
                    <div
                      onBlur={() => {
                        const num = Number(item.text.replace(',', '.'));
                        item.setter(isNaN(num) ? 0 : num);
                      }}
                    >
                      <div className="relative group">
                        <SquarePercent className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff6b00] transition-colors" size={18} />
                        <input
                          type="text"
                          value={item.text}
                          onChange={(e) => item.setText(e.target.value)}
                          onFocus={(e) => e.target.select()}
                          className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-5 text-base font-bold text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm"
                        />
                      </div>
                    </div>

                    {/* Betrag */}
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={mounted ? item.amount.toLocaleString('de-DE') : item.amount.toString()}
                        className="w-full bg-slate-100 border border-slate-200 rounded-2xl py-4 px-5 text-base font-bold text-slate-500 cursor-not-allowed shadow-sm"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-[10px]">€</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Sonstige Kosten */}
              <div className="space-y-1.5 col-span-full">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-1 flex items-center">
                  Sonstige Kosten
                  <Tooltip text="Z. B. Renovierung, Küche, Möbel, Parkplatz oder andere einmalige Kosten beim Kauf.">
                    <Info className="w-4 h-4 text-slate-400 cursor-pointer ml-1 hover:text-slate-600" />
                  </Tooltip>
                </label>
                <div
                  onBlur={() => {
                    const num = Number(sonstigeKostenText.replace(/\./g, '').replace(',', '.'));
                    setSonstigeKosten(isNaN(num) ? 0 : num);
                  }}
                >
                  <div className="relative group">
                    <EuroIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff6b00] transition-colors" size={18} />
                    <input
                      type="text"
                      value={sonstigeKostenText}
                      onChange={(e) => setSonstigeKostenText(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-5 text-base font-bold text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Gesamtinvestition */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-1">Gesamtinvestition</label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={mounted ? anschaffungskosten.toLocaleString('de-DE') : anschaffungskosten.toString()}
                    className="w-full bg-gradient-to-br from-[#ff6b00] to-[#ff6b00]/90 border-2 border-[#ff6b00] rounded-2xl py-5 px-5 text-lg font-black text-white cursor-not-allowed shadow-lg"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-white/90 font-black text-sm">€</span>
                </div>
              </div>
            </div>

            {/* Warnung bei hoher Maklergebühr */}
            {maklerPct > 5 && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl text-yellow-800 text-sm flex items-start gap-3">
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Hohe Maklergebühr</p>
                  <p className="text-xs mt-1">
                    Die Maklergebühr von {maklerPct.toLocaleString('de-DE', {minimumFractionDigits: 1, maximumFractionDigits: 2})}% liegt über dem üblichen Rahmen von 2-4%. Bitte prüfe, ob dieser Wert korrekt ist.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-8">
          <button
            onClick={handleNavigateToNextStep}
            className="w-full bg-[#001d3d] text-white rounded-2xl py-4 px-6 text-base font-bold hover:bg-[#001d3d]/90 transition-all shadow-lg"
          >
            Weiter
          </button>
        </div>
      </>
    );

  } else if (step === 'a2') {
    content = (
      <>
        {/* Back Button & Title */}
        <div className="flex items-center gap-6 mb-12">
          <button
            onClick={() => router.push('/step/a')}
            className="w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <SkipForward size={20} className="rotate-180 text-slate-600" />
          </button>
          <h1 className="text-4xl md:text-5xl font-black text-[#001d3d] tracking-tight leading-none">Objektdaten.</h1>
        </div>

        {/* Input Container */}
        <div className="bg-slate-50 rounded-[2.5rem] p-6 md:p-12 border border-slate-100/50 shadow-inner space-y-6 max-w-5xl mx-auto">

          {/* Objekttyp */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-1">Objekttyp</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setObjekttyp('wohnung')}
                className={`flex-1 px-3 sm:px-5 py-3.5 rounded-full text-xs sm:text-base font-semibold transition-all duration-200 min-h-[48px] ${
                  objekttyp === 'wohnung'
                    ? 'bg-[#ff6b00] text-white shadow-lg'
                    : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                }`}
              >
                <span className="hidden sm:inline">Eigentumswohnung</span>
                <span className="sm:hidden">ETW</span>
              </button>
              <button
                type="button"
                onClick={() => setObjekttyp('haus')}
                className={`flex-1 px-3 sm:px-5 py-3.5 rounded-full text-xs sm:text-base font-semibold transition-all duration-200 min-h-[48px] ${
                  objekttyp === 'haus'
                    ? 'bg-[#ff6b00] text-white shadow-lg'
                    : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                }`}
              >
                Haus
              </button>
              <button
                type="button"
                onClick={() => setObjekttyp('mfh')}
                className={`flex-1 px-3 sm:px-5 py-3.5 rounded-full text-xs sm:text-base font-semibold transition-all duration-200 min-h-[48px] ${
                  objekttyp === 'mfh'
                    ? 'bg-[#ff6b00] text-white shadow-lg'
                    : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                }`}
              >
                <span className="hidden sm:inline">Mehrfamilienhaus</span>
                <span className="sm:hidden">MFH</span>
              </button>
            </div>
          </div>

          {/* Adresse */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-1">Adresse</label>
            <div className="relative group">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff6b00] transition-colors z-10" size={18} />
              <AddressAutocomplete
                value={adresse}
                onChange={(val: string) => setAdresse(val)}
              />
            </div>
          </div>

          {/* Zimmer/Wohneinheiten & Fläche */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-1">
                {objekttyp === 'mfh' ? 'Wohneinheiten' : 'Zimmer'}
              </label>
              <div className="relative group">
                {objekttyp === 'mfh' ? (
                  <House className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff6b00] transition-colors" size={18} />
                ) : (
                  <BedSingle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff6b00] transition-colors" size={18} />
                )}
                <input
                  type="text"
                  value={objekttyp === 'mfh' ? anzahlWohneinheiten.toString() : zimmer.toString()}
                  onChange={(e) => objekttyp === 'mfh' ? setAnzahlWohneinheiten(Number(e.target.value)) : setZimmer(Number(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-5 text-base font-bold text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm"
                />
              </div>
              {objekttyp === 'mfh' && (
                <p className="text-xs text-slate-500 ml-1">Anzahl vermietbarer Wohnungen</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-1">
                {objekttyp === 'mfh' ? 'Gesamtwohnfläche' : 'Fläche'}
              </label>
              <div
                onBlur={() => {
                  const num = Number(flaecheText.replace(/\./g, '').replace(',', '.'));
                  setFlaeche(isNaN(num) ? 0 : num);
                }}
              >
                <div className="relative group">
                  <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff6b00] transition-colors" size={18} />
                  <input
                    type="text"
                    value={mounted ? flaecheText : flaecheText}
                    onChange={(e) => setFlaecheText(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-5 text-base font-bold text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm"
                  />
                </div>
              </div>
              {objekttyp === 'mfh' && (
                <p className="text-xs text-slate-500 ml-1">Gesamte Wohnfläche aller Einheiten</p>
              )}
            </div>
          </div>

          {/* Baujahr */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-1">Baujahr</label>
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff6b00] transition-colors" size={18} />
              <input
                type="text"
                value={baujahr.toString()}
                onChange={(e) => setBaujahr(Number(e.target.value))}
                onFocus={(e) => e.target.select()}
                className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-5 text-base font-bold text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => router.push('/step/a')}
            className="w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <SkipForward size={20} className="rotate-180 text-slate-600" />
          </button>
          <button
            onClick={handleNavigateToNextStep}
            className="flex-1 bg-[#001d3d] text-white rounded-2xl py-4 px-6 text-base font-bold hover:bg-[#001d3d]/90 transition-all shadow-lg"
          >
            Weiter
          </button>
        </div>
      </>
    );

  } else if (step === 'b') {
    content = (
      <>
        {/* Back Button & Title */}
        <div className="flex items-center gap-6 mb-12">
          <button
            onClick={() => router.push('/step/a2')}
            className="w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <SkipForward size={20} className="rotate-180 text-slate-600" />
          </button>
          <h1 className="text-4xl md:text-5xl font-black text-[#001d3d] tracking-tight leading-none">Ertrag & Hausgeld.</h1>
        </div>

        {/* Input Container */}
        <div className="bg-slate-50 rounded-[2.5rem] p-6 md:p-12 border border-slate-100/50 shadow-inner space-y-6 max-w-5xl mx-auto">

          {/* Mieteinnahmen Section */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-4">Mieteinnahmen</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Kaltmiete gesamt */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-1 flex items-center">
                  {objekttyp === 'mfh' ? 'Kaltmiete gesamt (alle Einheiten)' : 'Kaltmiete gesamt'}
                  <Tooltip text={objekttyp === 'mfh'
                    ? 'Die Summe der monatlichen Nettokaltmiete aller Wohneinheiten ohne Nebenkosten.'
                    : 'Die monatliche Nettokaltmiete ohne Nebenkosten.'}>
                    <Info className="w-4 h-4 text-slate-400 cursor-pointer ml-1 hover:text-slate-600" />
                  </Tooltip>
                </label>
                <div className="relative group">
                  <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff6b00] transition-colors" size={18} />
                  <input
                    type="text"
                    value={miete.toString()}
                    onChange={(e) => setMiete(Number(e.target.value.replace(/\./g, '').replace(',', '.')))}
                    onFocus={(e) => e.target.select()}
                    className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-5 text-base font-bold text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Kaltmiete pro qm */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-1">Kaltmiete pro qm</label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={
                      mounted && flaeche > 0
                        ? (miete / flaeche).toLocaleString('de-DE', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : ''
                    }
                    className="w-full bg-slate-100 border border-slate-200 rounded-2xl py-4 px-5 text-base font-bold text-slate-500 cursor-not-allowed shadow-sm"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-[10px]">€</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mietnebenkosten / Betriebskosten Section */}
          <div className="pt-4">
            <h3 className="text-sm font-bold text-slate-700 mb-4">
              {objekttyp === 'wohnung' ? 'Mietnebenkosten' : 'Betriebskosten'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Umlagefähig - für alle Objekttypen */}
              <div
                onBlur={() => {
                  const um = Number(hausUmlegText.replace(/\./g, '').replace(',', '.'));
                  setHausgeldUmlegbar(isNaN(um) ? 0 : um);
                  if (objekttyp === 'wohnung') {
                    const non = Number(hausNichtText.replace(/\./g, '').replace(',', '.'));
                    setHausgeld(isNaN(um) ? non : um + non);
                  }
                }}
                className="space-y-1.5"
              >
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-1 flex items-center">
                  {objekttyp === 'wohnung' ? 'Hausgeld umlagefähig' : 'Nebenkosten umlagbar'}
                  <Tooltip text={objekttyp === 'wohnung'
                    ? 'Teil der WEG-Umlage, der auf Mieter umgelegt werden kann (z.B. Hausmeister, Müll).'
                    : 'Monatliche Nebenkosten, die auf Mieter umgelegt werden (Wasser, Müll, Grundsteuer, etc.).'}>
                    <Info className="w-4 h-4 text-slate-400 cursor-pointer ml-1 hover:text-slate-600" />
                  </Tooltip>
                </label>
                <div className="relative group">
                  <ChartBar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff6b00] transition-colors" size={18} />
                  <input
                    type="text"
                    value={hausUmlegText}
                    onChange={(e) => setHausUmlegText(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-5 text-base font-bold text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Für ETW: Nicht umlagefähiges Hausgeld */}
              {objekttyp === 'wohnung' && (
                <div
                  onBlur={() => {
                    const um = Number(hausUmlegText.replace(/\./g, '').replace(',', '.'));
                    const non = Number(hausNichtText.replace(/\./g, '').replace(',', '.'));
                    setHausgeldUmlegbar(isNaN(um) ? 0 : um);
                    setHausgeld(isNaN(non) ? um : um + non);
                  }}
                  className="space-y-1.5"
                >
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-1 flex items-center">
                    Hausgeld nicht umlagefähig
                    <Tooltip text="Teil der WEG-Umlage, der vom Eigentümer getragen wird (z.B. Instandhaltungsrücklage, Verwaltung).">
                      <Info className="w-4 h-4 text-slate-400 cursor-pointer ml-1 hover:text-slate-600" />
                    </Tooltip>
                  </label>
                  <div className="relative group">
                    <ChartBar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff6b00] transition-colors" size={18} />
                    <input
                      type="text"
                      value={hausNichtText}
                      onChange={(e) => setHausNichtText(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-5 text-base font-bold text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>
              )}

              {/* Für Haus/MFH: Verwaltungskosten */}
              {(objekttyp === 'haus' || objekttyp === 'mfh') && (
                <div
                  onBlur={() => {
                    const verw = Number(hausNichtText.replace(/\./g, '').replace(',', '.'));
                    setVerwaltungskosten(isNaN(verw) ? 0 : verw);
                  }}
                  className="space-y-1.5"
                >
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-1 flex items-center">
                    Verwaltungskosten
                    <Tooltip text={objekttyp === 'mfh'
                      ? 'Externe Hausverwaltung (typisch: 18-30 € pro Wohneinheit/Monat).'
                      : 'Externe Verwaltung falls vorhanden (bei Selbstverwaltung: 0 €).'}>
                      <Info className="w-4 h-4 text-slate-400 cursor-pointer ml-1 hover:text-slate-600" />
                    </Tooltip>
                  </label>
                  <div className="relative group">
                    <WrenchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff6b00] transition-colors" size={18} />
                    <input
                      type="text"
                      value={hausNichtText}
                      onChange={(e) => setHausNichtText(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-5 text-base font-bold text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Hinweise zu Hausgeld-Verteilung */}
            {objekttyp === 'wohnung' && (() => {
              const umlegbarNum = Number(hausUmlegText.replace(/\./g, '').replace(',', '.')) || 0;
              const nichtUmlegbarNum = Number(hausNichtText.replace(/\./g, '').replace(',', '.')) || 0;
              const totalHausgeld = umlegbarNum + nichtUmlegbarNum;

              // Fall 1: Automatische 60/40 Verteilung wurde vorgenommen
              const isAutoDistribution = hausgeld > 0 && hausgeld_umlegbar > 0 &&
                Math.abs(hausgeld_umlegbar - hausgeld * 0.6) < 0.5 &&
                Math.abs((hausgeld - hausgeld_umlegbar) - hausgeld * 0.4) < 0.5;

              // Fall 2: Nur umlagefähig eingetragen, nicht-umlagefähig fehlt
              const onlyUmlegbarFilled = umlegbarNum > 0 && nichtUmlegbarNum === 0;

              // Fall 3: Nur nicht-umlagefähig eingetragen, umlagefähig fehlt
              const onlyNichtUmlegbarFilled = nichtUmlegbarNum > 0 && umlegbarNum === 0;

              if (isAutoDistribution) {
                return (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-2xl text-blue-800 text-sm flex items-start gap-3">
                    <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Automatische Hausgeld-Verteilung (60/40)</p>
                      <p className="text-xs mt-1">
                        Das Hausgeld wurde automatisch im Verhältnis <strong>60% umlagefähig ({(hausgeld * 0.6).toFixed(2)} €)</strong> / <strong>40% nicht umlagefähig ({(hausgeld * 0.4).toFixed(2)} €)</strong> aufgeteilt. Bitte prüfe diese Werte und passe sie bei Bedarf an die tatsächliche Verteilung laut WEG-Abrechnung an.
                      </p>
                    </div>
                  </div>
                );
              } else if (onlyUmlegbarFilled) {
                const recommendedUmlegbar = totalHausgeld * 0.6;
                const recommendedNichtUmlegbar = totalHausgeld * 0.4;
                return (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl text-yellow-800 text-sm flex items-start gap-3">
                    <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Hausgeld-Verteilung empfohlen</p>
                      <p className="text-xs mt-1">
                        Du hast nur das umlagefähige Hausgeld eingetragen. Für eine korrekte Kalkulation sollte das Gesamthausgeld aufgeteilt werden. <strong>Standardverteilung:</strong>
                      </p>
                      <p className="text-xs mt-1">
                        • 60% umlagefähig: <strong>{recommendedUmlegbar.toFixed(2)} €</strong><br />
                        • 40% nicht umlagefähig: <strong>{recommendedNichtUmlegbar.toFixed(2)} €</strong>
                      </p>
                    </div>
                  </div>
                );
              } else if (onlyNichtUmlegbarFilled) {
                const recommendedUmlegbar = totalHausgeld * 0.6;
                const recommendedNichtUmlegbar = totalHausgeld * 0.4;
                return (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl text-yellow-800 text-sm flex items-start gap-3">
                    <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Hausgeld-Verteilung empfohlen</p>
                      <p className="text-xs mt-1">
                        Du hast nur das nicht umlagefähige Hausgeld eingetragen. Für eine korrekte Kalkulation sollte das Gesamthausgeld aufgeteilt werden. <strong>Standardverteilung:</strong>
                      </p>
                      <p className="text-xs mt-1">
                        • 60% umlagefähig: <strong>{recommendedUmlegbar.toFixed(2)} €</strong><br />
                        • 40% nicht umlagefähig: <strong>{recommendedNichtUmlegbar.toFixed(2)} €</strong>
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>

          {/* Kalkulatorische Kosten Section */}
          <div className="pt-4">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Kalkulatorische Kosten</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mietausfall */}
              <div
                onBlur={() => setMietausfallPct(Number(mietausfallText.replace(',', '.')) || 0)}
                className="space-y-1.5"
              >
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-1 flex items-start min-h-[44px]">
                  <span className="flex items-center">
                    Kalk. Mietausfall
                    <Tooltip text="Puffer für Leerstand/Verzug. 1–3 % der Jahresmiete sind typisch.">
                      <Info className="w-4 h-4 text-slate-400 cursor-pointer ml-1 hover:text-slate-600" />
                    </Tooltip>
                  </span>
                </label>
                <div className="relative group">
                  <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff6b00] transition-colors" size={18} />
                  <input
                    type="text"
                    value={mietausfallText}
                    onChange={(e) => setMietausfallText(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-5 text-base font-bold text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Instandhaltung */}
              <div
                onBlur={() => setInstandhaltungskostenProQm(Number(instandText.replace(',', '.')) || 0)}
                className="space-y-1.5"
              >
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-1 flex items-start min-h-[44px]">
                  <span className="flex items-center">
                    Instandhaltungskosten /qm
                    <Tooltip text="Ø Aufwand für Reparaturen/Wartung je m²/Jahr. 5–15 € üblich, 10 € als Startwert.">
                      <Info className="w-4 h-4 text-slate-400 cursor-pointer ml-1 hover:text-slate-600" />
                    </Tooltip>
                  </span>
                </label>
                <div className="relative group">
                  <WrenchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff6b00] transition-colors" size={18} />
                  <input
                    type="text"
                    value={instandText}
                    onChange={(e) => setInstandText(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-5 text-base font-bold text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Steuern Section */}
          <div className="pt-4">
            <h3 className="text-sm font-bold text-slate-700 mb-2">Steuern</h3>
            <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
              <div className="flex gap-2">
                <Info className="mt-0.5 h-4 w-4 text-slate-400" />
                <p>
                  Hinweis für Einsteiger: AfA-Satz und Gebäudeanteil hängen von Baujahr und Objektart ab.
                  Wir setzen Standardwerte (z. B. vor 1925: 2,5 %, ab 1925: 2 %, ab 2023: 3 %) – bitte prüfe
                  sie bei Bedarf.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* AfA Satz */}
              <div
                onBlur={() => setAfa(Number(afaText.replace(',', '.')))}
                className="space-y-1.5"
              >
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-1 flex items-start min-h-[44px]">
                  <span className="flex items-center">
                    AfA Satz (% p.a.)
                    <Tooltip text="Lineare Abschreibung für Wohnimmobilien. Typisch 2 % p.a., vor 1925 2,5 %, ab 2023 3 % (vereinfachte Orientierung).">
                      <Info className="w-4 h-4 text-slate-400 cursor-pointer ml-1 hover:text-slate-600" />
                    </Tooltip>
                  </span>
                </label>
                <div className="relative group">
                  <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff6b00] transition-colors" size={18} />
                  <input
                    type="text"
                    value={afaText}
                    onChange={(e) => {
                      autoAfa.current = false;
                      setAfaText(e.target.value);
                    }}
                    onFocus={(e) => e.target.select()}
                    className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-5 text-base font-bold text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Anteil Gebäude */}
              <div
                onBlur={() => setSteuer(Number(gebText.replace(',', '.')))}
                className="space-y-1.5"
              >
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-1 flex items-start min-h-[44px]">
                  <span className="flex items-center">
                    Anteil Gebäude am Kaufpreis (%)
                    <Tooltip text="Orientierung je Objektart: ETW ~75 %, Haus ~80 %, MFH ~85 %.">
                      <Info className="w-4 h-4 text-slate-400 cursor-pointer ml-1 hover:text-slate-600" />
                    </Tooltip>
                  </span>
                </label>
                <div className="relative group">
                  <House className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff6b00] transition-colors" size={18} />
                  <input
                    type="text"
                    value={gebText}
                    onChange={(e) => {
                      autoGebaeude.current = false;
                      setGebText(e.target.value);
                    }}
                    onFocus={(e) => e.target.select()}
                    className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-5 text-base font-bold text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Persönlicher Steuersatz */}
              <div
                onBlur={() => setPersoenlicherSteuersatz(Number(persText.replace(',', '.')))}
                className="space-y-1.5 col-span-full"
              >
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-1 flex items-start min-h-[44px]">
                  <span className="flex items-center">
                    Pers. Steuersatz (%)
                    <Tooltip text="Grenzsteuersatz auf Einkünfte; oft 30–45 %.">
                      <Info className="w-4 h-4 text-slate-400 cursor-pointer ml-1 hover:text-slate-600" />
                    </Tooltip>
                  </span>
                </label>
                <div className="relative group">
                  <SquarePercent className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff6b00] transition-colors" size={18} />
                  <input
                    type="text"
                    value={persText}
                    onChange={(e) => setPersText(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-5 text-base font-bold text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => router.push('/step/a2')}
            className="w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <SkipForward size={20} className="rotate-180 text-slate-600" />
          </button>
          <button
            onClick={handleNavigateToNextStep}
            className="flex-1 bg-[#001d3d] text-white rounded-2xl py-4 px-6 text-base font-bold hover:bg-[#001d3d]/90 transition-all shadow-lg"
          >
            Weiter
          </button>
        </div>
      </>
    );
  } else if (step === 'c') {
    content = (
      <>
        {/* Back Button & Title */}
        <div className="flex items-center gap-6 mb-12">
          <button
            onClick={() => router.push('/step/b')}
            className="w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <SkipForward size={20} className="rotate-180 text-slate-600" />
          </button>
          <h1 className="text-4xl md:text-5xl font-black text-[#001d3d] tracking-tight leading-none">Eigenkapital & Kredit.</h1>
        </div>

        {/* Input Container */}
        <div className="bg-slate-50 rounded-[2.5rem] p-6 md:p-12 border border-slate-100/50 shadow-inner space-y-6 max-w-5xl mx-auto">

          {/* Eigenkapital */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-1">Eigenkapital</label>
            <div className="relative group">
              <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff6b00] transition-colors" size={18} />
              <input
                type="text"
                value={mounted ? ek.toLocaleString('de-DE') : '0'}
                onChange={(e) => setEk(Number(e.target.value.replace(/\./g, '').replace(',', '.')) || 0)}
                onFocus={(e) => e.target.select()}
                className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-5 text-base font-bold text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Eigenkapitalquote & Darlehenssumme */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Eigenkapitalquote */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-1">Eigenkapitalquote</label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={
                    mounted && anschaffungskosten > 0
                      ? ((ek / anschaffungskosten) * 100).toFixed(2)
                      : '0,0'
                  }
                  className="w-full bg-slate-100 border border-slate-200 rounded-2xl py-4 px-5 text-base font-bold text-slate-500 cursor-not-allowed shadow-sm"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-[10px]">%</span>
              </div>
            </div>

            {/* Darlehenssumme */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-1">Darlehenssumme</label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={mounted ? darlehensSumme.toLocaleString('de-DE') : '0'}
                  className="w-full bg-slate-100 border border-slate-200 rounded-2xl py-4 px-5 text-base font-bold text-slate-500 cursor-not-allowed shadow-sm"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-[10px]">€</span>
              </div>
            </div>
          </div>

          {/* Zinssatz & Tilgung */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Zinssatz */}
            <div
              onBlur={() => {
                const num = Number(zinsText.replace(',', '.'));
                setZins(isNaN(num) ? 0 : num);
              }}
              className="space-y-1.5"
            >
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-1">Zinssatz</label>
              <div className="relative group">
                <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff6b00] transition-colors" size={18} />
                <input
                  type="text"
                  value={zinsText}
                  onChange={(e) => setZinsText(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-5 text-base font-bold text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Tilgung */}
            <div
              onBlur={() => {
                const num = Number(tilgungText.replace(',', '.'));
                setTilgung(isNaN(num) ? 0 : num);
              }}
              className="space-y-1.5"
            >
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-1">Tilgung</label>
              <div className="relative group">
                <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff6b00] transition-colors" size={18} />
                <input
                  type="text"
                  value={tilgungText}
                  onChange={(e) => setTilgungText(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-5 text-base font-bold text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Monatliche Rate */}
          <div className="pt-6 border-t border-slate-200">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-1">Monatliche Rate</label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={
                    mounted
                      ? (darlehensSumme * ((zins + tilgung) / 100) / 12).toLocaleString('de-DE', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        }) + ' €/Monat'
                      : ''
                  }
                  className="w-full bg-gradient-to-br from-[#ff6b00] to-[#ff6b00]/90 border-2 border-[#ff6b00] rounded-2xl py-5 px-5 text-lg font-black text-white cursor-not-allowed shadow-lg text-center"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => router.push('/step/b')}
            className="w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <SkipForward size={20} className="rotate-180 text-slate-600" />
          </button>
          <button
            onClick={handleNavigateToNextStep}
            className="flex-1 bg-[#001d3d] text-white rounded-2xl py-4 px-6 text-base font-bold hover:bg-[#001d3d]/90 transition-all shadow-lg"
          >
            Investment analysieren
          </button>
        </div>
      </>
    );
  } else if (step === 'tabs') {
    content = (
      <div className="fixed inset-0 flex flex-col bg-[#F8FAFC] pt-16">
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 lg:px-10 py-6 bg-white border-b border-slate-200">
            <div className="bg-gradient-to-br from-[#001d3d] to-[#003366] rounded-3xl p-6 shadow-lg flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-[#ff6b00] rounded-2xl flex items-center justify-center shadow-md">
                  <House size={28} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight flex items-center gap-2 text-white">
                    {shortAddress || adresse || 'Immobilie'}
                  </h2>
                  <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mt-1">
                    {flaeche}m² • {objekttyp} • {kaufpreis.toLocaleString('de-DE')} €
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/step/c')}
                  className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition-all backdrop-blur-sm border border-white/20"
                >
                  Bearbeiten
                </button>
                <button
                  onClick={() => router.push('/step/a')}
                  className="px-5 py-3 bg-[#ff6b00] hover:bg-[#ff6b00]/90 text-white rounded-2xl text-xs font-bold transition-all shadow-lg"
                >
                  Neue Analyse
                </button>
              </div>
            </div>
          </div>

          <div className="sticky top-4 z-40 bg-white border-b border-slate-200 shadow-sm">
            <div className="px-6 lg:px-10 flex gap-10 overflow-x-auto no-scrollbar">
              {([
                { id: 'kpi', label: 'KPI Analyse', icon: BarChart3 },
                { id: 'markt', label: 'Marktvergleich & Investitionsanalyse', icon: ChartBar },
                { id: 'prognose', label: 'Prognose & Entwicklung', icon: TrendingUp },
                { id: 'szenarien', label: 'Szenarien & PDF Export', icon: Calculator }
              ] as const).map(t => {
                const locked = (t.id === 'markt' || t.id === 'szenarien') && (!isSignedIn || !canAccessPremium);
                return (
                  <button
                    key={t.id}
                    onClick={() => locked ? setShowUpgradeModal(true) : setActiveTab(t.id)}
                    className={`relative py-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap ${activeTab === t.id ? 'text-[#001d3d]' : 'text-slate-300 hover:text-slate-500'}`}
                  >
                    {locked ? (
                      <Lock size={14} />
                    ) : (
                      <t.icon size={14} className={activeTab === t.id ? 'text-[#ff6b00]' : ''} />
                    )}
                    {t.label}
                    {activeTab === t.id && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#ff6b00] rounded-t-full shadow-[0_-2px_8px_rgba(255,140,0,0.3)]" />}
                  </button>
                );
              })}
            </div>
          </div>

        <div className="px-6 lg:px-10 py-10 space-y-10">
        {/* Tab 1 – KPI-Übersicht (Free) */}
        {activeTab === 'kpi' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {renderFormulaDrawer()}
            {/* Main KPI Cards */}
            <div className="lg:col-span-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* KPI Card 1 - Bruttomietrendite */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#ff6b00]/30 transition-all flex flex-col justify-center items-center text-center min-h-[140px]">
                  <div className="flex items-center gap-1 mb-3">
                    <div className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center">
                      <SquarePercent size={14} className="text-[#ff6b00]" />
                    </div>
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">Brutto</span>
                    <Tooltip
                      text={(
                        <div className="space-y-2">
                          <p className="text-xs text-slate-700">
                            Anteil der Jahresmiete am Kaufpreis (ohne Kosten). Je höher, desto besser.
                          </p>
                          <button
                            type="button"
                            className="text-xs font-bold text-[#ff6b00] hover:text-[#ff8c00] underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenFormulaKey('brutto');
                            }}
                          >
                            Wie wird das berechnet?
                          </button>
                        </div>
                      )}
                    >
                      <Info size={12} className="text-slate-400 cursor-help" />
                    </Tooltip>
                  </div>
                  <div className="text-3xl font-black text-[#001d3d]">
                    {bruttoMietrendite.toFixed(1)}%
                  </div>
                </div>

                {/* KPI Card 2 - Nettomietrendite */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#ff6b00]/30 transition-all flex flex-col justify-center items-center text-center min-h-[140px]">
                  <div className="flex items-center gap-1 mb-3">
                    <div className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center">
                      <Percent size={14} className="text-[#ff6b00]" />
                    </div>
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">Netto</span>
                    <Tooltip
                      text={(
                        <div className="space-y-2">
                          <p className="text-xs text-slate-700">
                            Rendite nach laufenden Kosten. Zeigt realistischer, was vom Investment bleibt.
                          </p>
                          <button
                            type="button"
                            className="text-xs font-bold text-[#ff6b00] hover:text-[#ff8c00] underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenFormulaKey('netto');
                            }}
                          >
                            Wie wird das berechnet?
                          </button>
                        </div>
                      )}
                    >
                      <Info size={12} className="text-slate-400 cursor-help" />
                    </Tooltip>
                  </div>
                  <div className="text-3xl font-black text-[#001d3d]">
                    {nettoMietrendite.toFixed(1)}%
                  </div>
                </div>

                {/* KPI Card 3 - Cashflow vor Steuern */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#ff6b00]/30 transition-all flex flex-col justify-center items-center text-center min-h-[140px]">
                  <div className="flex items-center gap-1 mb-3">
                    <div className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center">
                      <Wallet size={14} className="text-[#ff6b00]" />
                    </div>
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">CF vor St.</span>
                    <Tooltip
                      text={(
                        <div className="space-y-2">
                          <p className="text-xs text-slate-700">
                            Monatlicher Überschuss vor Steuern. Rücklagen sind bereits eingeplant.
                          </p>
                          <button
                            type="button"
                            className="text-xs font-bold text-[#ff6b00] hover:text-[#ff8c00] underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenFormulaKey('cfVor');
                            }}
                          >
                            Wie wird das berechnet?
                          </button>
                        </div>
                      )}
                    >
                      <Info size={12} className="text-slate-400 cursor-help" />
                    </Tooltip>
                  </div>
                  <div className={`text-3xl font-black ${(prognose.jahre[0]?.cashflowVorSteuern ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(prognose.jahre[0]?.cashflowVorSteuern ?? 0).toFixed(0)}€
                  </div>
                </div>

                {/* KPI Card 4 - Cashflow nach Steuern */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#ff6b00]/30 transition-all flex flex-col justify-center items-center text-center min-h-[140px]">
                  <div className="flex items-center gap-1 mb-3">
                    <div className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center">
                      <ReceiptText size={14} className="text-[#ff6b00]" />
                    </div>
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">CF nach St.</span>
                    <Tooltip
                      text={(
                        <div className="space-y-2">
                          <p className="text-xs text-slate-700">
                            Cashflow nach Steuern. Das ist das Geld, das am Monatsende übrig bleibt.
                          </p>
                          <button
                            type="button"
                            className="text-xs font-bold text-[#ff6b00] hover:text-[#ff8c00] underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenFormulaKey('cfNach');
                            }}
                          >
                            Wie wird das berechnet?
                          </button>
                        </div>
                      )}
                    >
                      <Info size={12} className="text-slate-400 cursor-help" />
                    </Tooltip>
                  </div>
                  <div className={`text-3xl font-black ${(prognose.jahre[0]?.cashflowOhneSondertilgung ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(prognose.jahre[0]?.cashflowOhneSondertilgung ?? 0).toFixed(0)}€
                  </div>
                </div>

                {/* KPI Card 5 - EK-Rendite */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#ff6b00]/30 transition-all flex flex-col justify-center items-center text-center min-h-[140px]">
                  <div className="flex items-center gap-1 mb-3">
                    <div className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center">
                      <TrendingUp size={14} className="text-[#ff6b00]" />
                    </div>
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">EK-Rendite</span>
                    <Tooltip
                      text={(
                        <div className="space-y-2">
                          <p className="text-xs text-slate-700">
                            Rendite auf dein eingesetztes Eigenkapital (vor Tilgung/Steuer). Je höher, desto effizienter arbeitet dein Eigenkapital.
                          </p>
                          <button
                            type="button"
                            className="text-xs font-bold text-[#ff6b00] hover:text-[#ff8c00] underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenFormulaKey('ek');
                            }}
                          >
                            Wie wird das berechnet?
                          </button>
                        </div>
                      )}
                    >
                      <Info size={12} className="text-slate-400 cursor-help" />
                    </Tooltip>
                  </div>
                  <div className="text-3xl font-black text-[#001d3d]">
                    {ekRendite.toFixed(1)}%
                  </div>
                </div>

                {/* KPI Card 6 - DSCR */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#ff6b00]/30 transition-all flex flex-col justify-center items-center text-center min-h-[140px]">
                  <div className="flex items-center gap-1 mb-3">
                    <div className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center">
                      <ShieldCheck size={14} className="text-[#ff6b00]" />
                    </div>
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">DSCR</span>
                    <Tooltip
                      text={(
                        <div className="space-y-2">
                          <p className="text-xs text-slate-700">
                            Zeigt, ob die Miete die Kreditrate deckt. Über 1,2 ist stark, unter 1,0 kritisch.
                          </p>
                          <button
                            type="button"
                            className="text-xs font-bold text-[#ff6b00] hover:text-[#ff8c00] underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenFormulaKey('dscr');
                            }}
                          >
                            Wie wird das berechnet?
                          </button>
                        </div>
                      )}
                    >
                      <Info size={12} className="text-slate-400 cursor-help" />
                    </Tooltip>
                  </div>
                  <div className={`text-3xl font-black ${dscr >= 1.2 ? 'text-green-600' : dscr >= 1.0 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {dscr.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* KI-Kurzkommentar - Modernisiert */}
              <div className="bg-orange-50 rounded-[2.5rem] p-8 md:p-10 text-[#001d3d] relative overflow-hidden shadow-xl min-h-[480px] flex flex-col justify-center border border-orange-100 hover:shadow-[0_0_40px_rgba(255,107,0,0.5)] hover:border-[#ff6b00] transition-all duration-300">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff6b00] opacity-5 rounded-full -mr-20 -mt-20 blur-3xl" />

                {/* Blur Overlay wenn nicht angemeldet */}
                {isCommentLocked && !isLoadingComment && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-[2.5rem] p-6">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border-2 border-slate-100">
                      <div className="w-14 h-14 bg-gradient-to-br from-[#ff6b00] to-[#ff8c00] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
                        <Lock className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-black mb-2 text-[#001d3d] text-center">KI-Einschätzung freischalten</h3>
                      <p className="text-slate-600 mb-5 text-sm leading-relaxed text-center">
                        Melde dich an und erhalte eine KI-Analyse plus 2 Premium-Analysen kostenlos.
                      </p>
                      <SignInButton mode="modal" forceRedirectUrl="/step/tabs" fallbackRedirectUrl="/step/tabs">
                        <button className="w-full px-5 py-3 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] hover:from-[#ff6b00]/90 hover:to-[#ff8c00]/90 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm">
                          <Lock size={18} />
                          Kostenlos anmelden
                        </button>
                      </SignInButton>
                    </div>
                  </div>
                )}

                {/* Content (geblurred wenn locked) */}
                <div className={`relative z-10 ${isCommentLocked && !isLoadingComment ? 'blur-sm pointer-events-none select-none' : ''}`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#ff6b00] to-[#ff8c00] rounded-full flex items-center justify-center shadow-lg shadow-orange-500/40">
                      <Sparkles size={20} className="text-white" />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight">imvestr KI-Strategie-Check</h3>
                  </div>
                  {isLoadingComment ? (
                    <LoadingSpinner
                      size="sm"
                      messages={[
                        'Analysiere Cashflow und Rendite...',
                        'Bewerte Eigenkapitalquote...',
                        'Prüfe Schuldendienstdeckung...',
                        'Erstelle Investment-Einschätzung...',
                      ]}
                    />
                  ) : (
                    <div className="space-y-6 text-slate-700 leading-relaxed">
                      <HtmlContent className="text-lg" html={generatedComment || '<p>–</p>'} />
                    </div>
                  )}
                </div>
              </div>

              {/* Weiter Button mit Blur wenn KI-Kommentar locked oder Premium nicht verfügbar */}
              <div className={`relative mt-8 mb-16 ${isCommentLocked ? 'blur-sm pointer-events-none select-none' : ''}`}>
                <button
                  onClick={() => {
                    if (!isSignedIn || !canAccessPremium) {
                      setShowUpgradeModal(true);
                    } else {
                      setActiveTab('markt');
                    }
                  }}
                  className={`btn-primary ${(!isSignedIn || !canAccessPremium) ? 'opacity-75' : ''}`}
                >
                  {(!isSignedIn || !canAccessPremium) && <Lock size={16} className="mr-2" />}
                  Weiter zu Marktvergleich & Lage →
                </button>
              </div>
            </div>

            {/* Sidebar with Details */}
            <div className="lg:col-span-4 space-y-6 sticky top-4 self-start">
              <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
                <h4 className="text-[10px] font-black uppercase text-slate-600 mb-8 tracking-widest flex items-center gap-2">
                  <BarChart3 size={16} className="text-[#ff6b00]" /> Finanzierungsübersicht
                </h4>
                <div className="space-y-6">
                  {/* Gesamtinvestition */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">Gesamtinvestition</span>
                      <span className="text-xl font-black text-[#001d3d]">
                        {anschaffungskosten.toLocaleString('de-DE')}€
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-500">
                      Inkl. Nebenkosten
                    </p>
                  </div>

                  {/* Darlehenssumme */}
                  <div className="border-t border-slate-100 pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">Darlehenssumme</span>
                      <span className="text-xl font-black text-[#001d3d]">
                        {darlehensSumme.toLocaleString('de-DE')}€
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-500">
                      Finanzierungsbetrag
                    </p>
                  </div>

                  {/* Eigenkapital */}
                  <div className="border-t border-slate-100 pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">Eigenkapital</span>
                      <span className="text-xl font-black text-[#001d3d]">
                        {ek.toLocaleString('de-DE')}€
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-500">
                      Eingesetztes Kapital
                    </p>
                  </div>

                  {/* EK-Quote */}
                  <div className="border-t border-slate-100 pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">EK-Quote</span>
                      <span className="text-xl font-black text-[#001d3d]">
                        {anschaffungskosten > 0 ? ((ek / anschaffungskosten) * 100).toFixed(1) : '0.0'}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#ff6b00] to-[#001d3d] h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, anschaffungskosten > 0 ? ((ek / anschaffungskosten) * 100) : 0)}%` }}
                      />
                    </div>
                  </div>

                  {/* Break-Even */}
                  <div className="border-t border-slate-100 pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">Break-Even</span>
                      <span className="text-lg font-black text-[#001d3d]">
                        {isFinite(breakEvenJahre) ? new Date().getFullYear() + Math.round(breakEvenJahre) : '–'}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-500">
                      Jahr der EK-Rückgewinnung
                    </p>
                  </div>

                  {/* Abzahlungsjahr */}
                  <div className="border-t border-slate-100 pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">Abzahlungsjahr</span>
                      <span className="text-lg font-black text-[#001d3d]">
                        {new Date().getFullYear() + Math.round(1 / ((zins + tilgung) / 100))}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-500">
                      Voraussichtliche Entschuldung
                    </p>
                  </div>
                </div>
              </div>

              {/* Compact Info Card */}
              <div className="bg-gradient-to-br from-[#001d3d] to-[#003366] p-6 rounded-[2rem] text-white shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Info size={16} className="text-[#ff6b00]" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Hinweis</span>
                </div>
                <p className="text-[10px] leading-relaxed opacity-90 mb-3">
                  Alle Berechnungen beziehen sich auf das erste Jahr nach Anschaffung der Immobilie.
                </p>
                <p className="text-[10px] leading-relaxed opacity-90">
                  Die KPIs basieren auf Ihren Eingaben. Für detaillierte Marktvergleiche und Szenarien nutzen Sie die Premium-Features.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2 – Marktvergleich & Lage */}
        {activeTab === 'markt' && (
          <div className="relative">
            {/* Blur Overlay when locked */}
            {(!isSignedIn || !canAccessPremium) && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-2xl p-6">
                <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border-2 border-slate-100">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#ff6b00] to-[#ff8c00] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
                    <Lock className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-black mb-2 text-[#001d3d] text-center">Premium Feature</h3>
                  <p className="text-slate-600 mb-5 text-sm leading-relaxed text-center">
                    Schalte Marktvergleich & Lageanalyse frei.
                  </p>
                  {!isSignedIn ? (
                    <SignInButton mode="modal" forceRedirectUrl="/step/tabs" fallbackRedirectUrl="/step/tabs">
                      <button className="w-full px-5 py-3 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] hover:from-[#ff6b00]/90 hover:to-[#ff8c00]/90 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm">
                        <Lock size={18} />
                        Kostenlos anmelden
                      </button>
                    </SignInButton>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowUpgradeModal(true)}
                        className="w-full px-5 py-3 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] hover:from-[#ff6b00]/90 hover:to-[#ff8c00]/90 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        <Crown size={18} />
                        Jetzt freischalten
                      </button>
                      <p className="text-xs text-slate-500 mt-3 text-center font-medium">
                        {2 - premiumUsageCount > 0
                          ? `${2 - premiumUsageCount} kostenlose Analyse${2 - premiumUsageCount > 1 ? 'n' : ''} verfügbar`
                          : 'Nur 13,99 €/Monat'}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Content (blurred when locked) */}
            <div className={(!isSignedIn || !canAccessPremium) ? 'blur-md pointer-events-none select-none' : ''}>

            {/* Block 1: Objekt- & Marktanalyse - Modernisiert */}
            <div className="bg-orange-50 rounded-[2.5rem] p-8 md:p-10 text-[#001d3d] relative overflow-hidden shadow-xl mb-8 border border-orange-100 hover:shadow-[0_0_40px_rgba(255,107,0,0.5)] hover:border-[#ff6b00] transition-all duration-300">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff6b00] opacity-5 rounded-full -mr-20 -mt-20 blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#ff6b00] to-[#ff8c00] rounded-full flex items-center justify-center shadow-lg shadow-orange-500/40">
                    <Sparkles size={20} className="text-[#001d3d]" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">Objekt- & Marktanalyse</h3>
                </div>

              {loadingDetails ? (
                <LoadingSpinner
                  messages={[
                    'Analysiere Lage und Umgebung...',
                    'Recherchiere Marktdaten...',
                    'Vergleiche Miet- und Kaufpreise...',
                    'Bewerte Marktposition...',
                    'Gleich fertig...'
                  ]}
                />
              ) : (
                <div className="space-y-6 text-slate-700 leading-relaxed">
                  {/* Lage */}
                  <div>
                    <h3 className="text-sm font-semibold text-[#001d3d] mb-2">Lage & Umgebung</h3>
                    <HtmlContent className="text-slate-700" html={lageComment || '<p>–</p>'} />
                  </div>

                  {/* Mietpreis */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-[#001d3d]">Mietpreis-Vergleich</h3>
                      {mietMarktDelta != null && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                          mietMarktDelta > 10 ? 'bg-red-500/20 text-red-300' :
                          mietMarktDelta > 0 ? 'bg-yellow-500/20 text-yellow-300' :
                          mietMarktDelta > -10 ? 'bg-green-500/20 text-green-300' :
                          'bg-blue-500/20 text-blue-300'
                        }`}>
                          {mietMarktDelta > 0 ? '+' : ''}{mietMarktDelta.toFixed(1)}%
                        </span>
                      )}
                    </div>
                    <HtmlContent className="text-slate-700" html={mietpreisComment || '<p>–</p>'} />
                  </div>

                  {/* Kaufpreis */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-[#001d3d]">Kaufpreis-Vergleich</h3>
                      {kaufMarktDelta != null && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                          kaufMarktDelta > 10 ? 'bg-red-500/20 text-red-300' :
                          kaufMarktDelta > 0 ? 'bg-yellow-500/20 text-yellow-300' :
                          kaufMarktDelta > -10 ? 'bg-green-500/20 text-green-300' :
                          'bg-blue-500/20 text-blue-300'
                        }`}>
                          {kaufMarktDelta > 0 ? '+' : ''}{kaufMarktDelta.toFixed(1)}%
                        </span>
                      )}
                    </div>
                    <HtmlContent className="text-slate-700" html={qmPreisComment || '<p>–</p>'} />
                  </div>
                </div>
              )}
              </div>
            </div>

            {/* Block 2: Investment-Empfehlung - Modernisiert */}
            <div className="bg-orange-50 rounded-[2.5rem] p-8 md:p-10 text-[#001d3d] relative overflow-hidden shadow-xl border border-orange-100 hover:shadow-[0_0_40px_rgba(255,107,0,0.5)] hover:border-[#ff6b00] transition-all duration-300">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff6b00] opacity-5 rounded-full -mr-20 -mt-20 blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#ff6b00] to-[#ff8c00] rounded-full flex items-center justify-center shadow-lg shadow-orange-500/40">
                    <Sparkles size={20} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">Investment-Empfehlung</h3>
                </div>
                {loadingDetails ? (
                  <LoadingSpinner
                    messages={[
                      'Konsolidiere alle Daten...',
                      'Erstelle Investment-Bewertung...',
                      'Prüfe Optimierungspotenzial...',
                      'Formuliere Empfehlung...',
                      'Fast geschafft...'
                    ]}
                  />
                ) : (
                  <div className="space-y-6 text-slate-700 leading-relaxed">
                    <HtmlContent className="text-lg" html={investComment || '<p>–</p>'} />
                  </div>
                )}
              </div>
            </div>
<div className="mt-8 mb-16">
    <button
      onClick={() => setActiveTab('szenarien')}
      className="btn-primary"
    >
      Szenarien testen →
    </button>
  </div>
            </div>
          </div>
        )}

        {/* Tab 3 – Prognose */}
        {activeTab === 'prognose' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-black text-[#001d3d]">Entwicklung über 30 Jahre</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Restschuld, Eigenkapital und kumulierter Cashflow im Zeitverlauf.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <input
                        type="checkbox"
                        checked={zeigeEigenkapitalAufbau}
                        onChange={(event) => setZeigeEigenkapitalAufbau(event.target.checked)}
                        className="accent-[#ff6b00]"
                      />
                      EK-Aufbau (zusätzlich)
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <input
                        type="checkbox"
                        checked={zeigeCashflowKumuliert}
                        onChange={(event) => setZeigeCashflowKumuliert(event.target.checked)}
                        className="accent-[#ff6b00]"
                      />
                      Cashflow kumuliert
                    </label>
                  </div>
                </div>

                {/* Erweiterte Optionen */}
                <div className="mb-6">
                  <button
                    onClick={() => setZeigeErweiterteOptionen(!zeigeErweiterteOptionen)}
                    className="w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-bold bg-gradient-to-r from-slate-50 to-slate-100 hover:from-[#ff6b00]/10 hover:to-[#ff6b00]/5 rounded-xl border border-slate-200 transition-all shadow-sm"
                  >
                    <span className="flex items-center gap-2 text-[#001d3d]">
                      {zeigeErweiterteOptionen ? '▼' : '▶'} Erweiterte Optionen
                      <span className="text-[9px] font-normal text-slate-500">(Annuität, Inflation, Immobilienwert)</span>
                    </span>
                    {!zeigeErweiterteOptionen && (
                      <span className="px-2 py-1 bg-[#ff6b00] text-white text-[9px] font-black rounded-full">
                        NEU
                      </span>
                    )}
                  </button>
                  {zeigeErweiterteOptionen && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                      {/* Darlehenstyp */}
                      <div className="mb-4">
                        <label className="text-xs font-bold text-slate-600 mb-2 block">Darlehenstyp</label>
                        <div className="flex gap-3">
                          <label className="flex items-center gap-2 text-xs text-slate-600">
                            <input
                              type="radio"
                              value="degressiv"
                              checked={darlehensTyp === 'degressiv'}
                              onChange={(e) => setDarlehensTyp(e.target.value as 'degressiv')}
                              className="accent-[#ff6b00]"
                            />
                            Degressiv
                          </label>
                          <label className="flex items-center gap-2 text-xs text-slate-600">
                            <input
                              type="radio"
                              value="annuitaet"
                              checked={darlehensTyp === 'annuitaet'}
                              onChange={(e) => setDarlehensTyp(e.target.value as 'annuitaet')}
                              className="accent-[#ff6b00]"
                            />
                            Annuität ⭐
                          </label>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1">
                          {darlehensTyp === 'degressiv'
                            ? 'Rate sinkt mit Restschuld (selten)'
                            : 'Konstante Rate, wie bei echten Immobilienkrediten'}
                        </p>
                      </div>

                      {/* Inflation Slider in Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Slider
                          label="Mietinflation p.a."
                          value={mietInflationPct}
                          onChange={setMietInflationPct}
                          min={0}
                          max={5}
                          step={0.1}
                          suffix="%"
                        />
                        <Slider
                          label="Kosteninflation p.a."
                          value={kostenInflationPct}
                          onChange={setKostenInflationPct}
                          min={0}
                          max={5}
                          step={0.1}
                          suffix="%"
                        />
                      </div>

                      {/* Immobilienwert & Wertentwicklung */}
                      <div className="mt-4 border-t border-slate-200 pt-4">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-600 mb-3">
                          <input
                            type="checkbox"
                            checked={wertentwicklungAktiv}
                            onChange={(event) => setWertentwicklungAktiv(event.target.checked)}
                            className="accent-[#ff6b00]"
                          />
                          Immobilienwert im Chart anzeigen
                        </label>
                        {wertentwicklungAktiv && (
                          <div className="pl-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Slider
                              label="Wertentwicklung p.a."
                              value={wertentwicklungPct}
                              onChange={setWertentwicklungPct}
                              min={-5}
                              max={5}
                              step={0.1}
                              suffix="%"
                            />
                            <Slider
                              label="Verkaufsnebenkosten"
                              value={verkaufsNebenkostenPct}
                              onChange={setVerkaufsNebenkostenPct}
                              min={0}
                              max={15}
                              step={0.5}
                              suffix="%"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={prognose.jahre} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="jahr" tick={{ fontSize: 10 }} />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) => `${formatEur(value / 1000)}k`}
                      />
                      <ChartTooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload || !payload.length) return null;

                          const jahr = label;
                          const data = prognose.jahre.find(j => j.jahr === jahr);

                          // Check if this is a milestone year
                          let milestoneInfo: { title: string; description: string } | null = null;

                          if (prognoseMilestones.halbschuld?.jahr === jahr) {
                            milestoneInfo = {
                              title: '🎯 50% getilgt!',
                              description: 'Du hast die Hälfte deines Darlehens abbezahlt. Deine Zinslast wird ab jetzt deutlich sinken.'
                            };
                          } else if (prognoseMilestones.selbstfinanziert?.jahr === jahr) {
                            milestoneInfo = {
                              title: '💰 Selbstfinanziert!',
                              description: 'Dein kumulierter Cashflow deckt die Restschuld. Du könntest theoretisch alles selbst abbezahlen.'
                            };
                          } else if (prognoseMilestones.eigenkapitalGrößerKaufpreis?.jahr === jahr) {
                            milestoneInfo = {
                              title: '🏆 Eigenkapital > Kaufpreis!',
                              description: 'Dein Eigenkapital überschreitet den ursprünglichen Kaufpreis. Du hast mehr Vermögen aufgebaut als investiert.'
                            };
                          } else if (prognoseMilestones.cashflowPositiv?.jahr === jahr) {
                            milestoneInfo = {
                              title: '✅ Cashflow positiv!',
                              description: 'Ab jetzt erwirtschaftet deine Immobilie monatlich Überschuss - selbstfinanzierter Vermögensaufbau beginnt!'
                            };
                          }

                          return (
                            <div className="bg-white border-2 border-slate-200 rounded-xl p-3 shadow-xl max-w-xs">
                              <p className="text-xs font-black text-slate-700 mb-2">Jahr {jahr}</p>
                              {milestoneInfo && (
                                <div className="mb-3 pb-3 border-b-2 border-[#ff6b00]">
                                  <p className="text-sm font-black text-[#ff6b00] mb-1">{milestoneInfo.title}</p>
                                  <p className="text-[10px] text-slate-600 leading-relaxed">{milestoneInfo.description}</p>
                                </div>
                              )}
                              <div className="space-y-1">
                                {payload.map((entry: any, index: number) => (
                                  <div key={index} className="flex justify-between gap-3">
                                    <span className="text-[10px] font-bold" style={{ color: entry.color }}>
                                      {entry.name}:
                                    </span>
                                    <span className="text-[10px] font-black text-slate-700">
                                      {formatEur(Number(entry.value))} €
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Line
                        type="monotone"
                        dataKey="restschuld"
                        name="Restschuld"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={false}
                      />
                      {zeigeEigenkapitalAufbau && (
                        <Line
                          type="monotone"
                          dataKey="eigenkapitalAufbau"
                          name="EK-Aufbau (ohne Start-EK)"
                          stroke="#22c55e"
                          strokeWidth={2}
                          strokeDasharray="3 3"
                          dot={false}
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey="eigenkapitalGesamt"
                        name="Eigenkapital gesamt"
                        stroke="#16a34a"
                        strokeWidth={2}
                        dot={false}
                      />
                      {zeigeCashflowKumuliert && (
                        <Line
                          type="monotone"
                          dataKey="cashflowKumuliert"
                          name="Cashflow kumuliert"
                          stroke="#0ea5e9"
                          strokeWidth={2}
                          dot={false}
                        />
                      )}
                      {wertentwicklungAktiv && (
                        <Line
                          type="monotone"
                          dataKey="immobilienwert"
                          name="Immobilienwert"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          dot={false}
                        />
                      )}

                      {/* Highlight intersection points */}
                      {prognoseMilestones.halbschuld && (
                        <ReferenceDot
                          x={prognoseMilestones.halbschuld.jahr}
                          y={prognoseMilestones.halbschuld.restschuld}
                          r={6}
                          fill="#ff6b00"
                          stroke="#fff"
                          strokeWidth={2}
                        >
                          <Label
                            value="50% getilgt"
                            position="top"
                            fill="#001d3d"
                            fontSize={10}
                            fontWeight="bold"
                          />
                        </ReferenceDot>
                      )}

                      {zeigeCashflowKumuliert && prognoseMilestones.selbstfinanziert && (
                        <ReferenceDot
                          x={prognoseMilestones.selbstfinanziert.jahr}
                          y={prognoseMilestones.selbstfinanziert.restschuld}
                          r={6}
                          fill="#0ea5e9"
                          stroke="#fff"
                          strokeWidth={2}
                        >
                          <Label
                            value="Selbstfinanziert"
                            position="top"
                            fill="#001d3d"
                            fontSize={10}
                            fontWeight="bold"
                          />
                        </ReferenceDot>
                      )}

                      {wertentwicklungAktiv && prognoseMilestones.eigenkapitalGrößerKaufpreis && (
                        <ReferenceDot
                          x={prognoseMilestones.eigenkapitalGrößerKaufpreis.jahr}
                          y={prognoseMilestones.eigenkapitalGrößerKaufpreis.eigenkapitalGesamt}
                          r={6}
                          fill="#16a34a"
                          stroke="#fff"
                          strokeWidth={2}
                        >
                          <Label
                            value="EK > Kaufpreis"
                            position="top"
                            fill="#001d3d"
                            fontSize={10}
                            fontWeight="bold"
                          />
                        </ReferenceDot>
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-lg font-black text-[#001d3d]">Liquiditäts-Dashboard</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Werte am Ende des ausgewählten Jahres (nach Tilgung)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Jahr</span>
                    <select
                      value={liquiditaetJahrIndex}
                      onChange={(event) => setLiquiditaetJahrIndex(Number(event.target.value))}
                      className="text-xs font-bold text-[#001d3d] bg-white border border-slate-200 rounded-xl px-3 py-2"
                    >
                      {prognose.jahre.map((jahr, index) => (
                        <option key={jahr.jahr} value={index}>
                          {jahr.jahr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-wider">Cashflow ohne Sondertilgung</p>
                    <p className={`text-2xl font-black mt-2 ${(liquiditaetJahr?.cashflowOhneSondertilgung ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatEur(liquiditaetJahr?.cashflowOhneSondertilgung ?? 0)} €
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">Monatlich verfügbar</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-wider">Cashflow mit Sondertilgung</p>
                    <p className={`text-2xl font-black mt-2 ${(liquiditaetJahr?.cashflowMonatlich ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatEur(liquiditaetJahr?.cashflowMonatlich ?? 0)} €
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {sondertilgungJaehrlich > 0
                        ? `Inkl. ${formatEur(sondertilgungJaehrlich / 12)} € Sondertilgung/Monat`
                        : 'Keine Sondertilgung eingegeben'}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-wider">Restschuld</p>
                    <p className="text-2xl font-black mt-2 text-[#001d3d]">
                      {formatEur(liquiditaetJahr?.restschuld ?? 0)} €
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">Verbleibende Schuld</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-wider">AfA Vorteil / Jahr</p>
                    <p className="text-2xl font-black mt-2 text-[#001d3d]">
                      {formatEur(liquiditaetJahr?.afaVorteil ?? 0)} €
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {(liquiditaetJahr?.afaVorteil ?? 0) > 0
                        ? 'Fest (AfA × Steuersatz), unabhängig von Zinsen'
                        : 'AfA-Zeitraum abgelaufen'}
                    </p>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white border border-slate-100 rounded-2xl p-4">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-1">
                      Sondertilgung p.a.
                    </label>
                    <div className="relative mt-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={sondertilgungText}
                        onFocus={(event) => event.target.select()}
                        onChange={(event) => {
                          const nextValue = event.target.value.replace(/[^\d]/g, '');
                          setSondertilgungText(nextValue);
                          setSondertilgungJaehrlich(Number(nextValue) || 0);
                        }}
                        onBlur={() => {
                          const normalized = Number(sondertilgungText.replace(/[^\d]/g, '')) || 0;
                          setSondertilgungText(normalized.toLocaleString('de-DE'));
                          setSondertilgungJaehrlich(normalized);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 text-sm font-bold text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">€</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2">
                      💡 Sondertilgung reduziert deine Restschuld schneller und spart langfristig Zinsen. Sie wird als zusätzliche monatliche Auszahlung vom Cashflow abgezogen.
                    </p>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-2xl p-4">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em]">Eigenkapital gesamt</p>
                    <p className="text-2xl font-black mt-3 text-[#001d3d]">
                      {formatEur(liquiditaetJahr?.eigenkapitalGesamt ?? 0)} €
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">Start-EK + Tilgungsfortschritt</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                  <Info size={16} className="text-[#ff6b00]" />
                  <h4 className="text-sm font-black text-[#001d3d]">So liest du die Kurven</h4>
                </div>
                <ul className="space-y-3 text-[11px] text-slate-600">
                  <li>
                    <span className="font-bold text-red-600">Restschuld</span> (rot) sinkt jedes Jahr durch reguläre Tilgung und
                    optionale Sondertilgung.
                  </li>
                  <li>
                    <span className="font-bold text-green-700">Eigenkapital gesamt</span> (grün) zeigt dein Start-EK plus den
                    Tilgungsfortschritt. Es wächst automatisch mit jeder Kreditrate.
                  </li>
                  <li>
                    <span className="font-bold text-green-600">EK-Aufbau</span> (hellgrün gestrichelt, optional) zeigt nur die
                    abgezahlte Schuld – ohne dein eingesetztes Start-EK.
                  </li>
                  <li>
                    <span className="font-bold text-blue-500">Cashflow kumuliert</span> (blau, optional) summiert deinen jährlichen
                    Überschuss nach Steuern. Kann anfangs negativ sein.
                  </li>
                  <li>
                    <span className="font-bold text-purple-600">Immobilienwert</span> (lila, optional) zeigt die simulierte
                    Wertentwicklung deiner Immobilie basierend auf der gewählten Wertsteigerungsrate.
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar size={16} className="text-[#ff6b00]" />
                  <h4 className="text-sm font-black text-[#001d3d]">Meilensteine</h4>
                </div>
                <p className="text-[10px] text-slate-500 mb-4">
                  Wichtige Zeitpunkte in deiner Immobilieninvestition
                </p>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Cashflow positiv</span>
                      <span className="text-sm font-black text-[#001d3d]">
                        {prognoseMilestones.cashflowPositiv?.jahr ?? '–'}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-400">Monatlicher Überschuss nach Steuern (ohne Sondertilgung)</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Restschuld &lt; 50%</span>
                      <span className="text-sm font-black text-[#001d3d]">
                        {prognoseMilestones.halbschuld?.jahr ?? '–'}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-400">Hälfte des Kredits abbezahlt</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Selbstfinanziert</span>
                      <span className="text-sm font-black text-[#001d3d]">
                        {prognoseMilestones.selbstfinanziert?.jahr ?? '–'}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-400">Cashflow kumuliert ≥ Restschuld (Schnittpunkt im Chart)</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">EK &gt; Kaufpreis</span>
                      <span className="text-sm font-black text-[#001d3d]">
                        {prognoseMilestones.eigenkapitalGrößerKaufpreis?.jahr ?? '–'}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-400">Eigenkapital übersteigt Kaufpreis (volle Ownership)</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-black text-[#001d3d]">Verkaufsszenarien</h4>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    {wertentwicklungAktiv && verkaufsNebenkostenPct > 0 ? 'Inkl. Nebenkosten' : 'Ohne Nebenkosten'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mb-4">
                  <span className="font-bold text-[#001d3d]">Ergebnis =</span> Immobilienwert
                  {wertentwicklungAktiv && verkaufsNebenkostenPct > 0 && ` − Nebenkosten (${verkaufsNebenkostenPct}%)`}
                  {' '}− Restschuld + kumulierter Cashflow − Start-EK
                </p>
                {(!wertentwicklungAktiv || verkaufsNebenkostenPct === 0) && (
                  <p className="text-[9px] text-slate-400 mb-4">
                    💡 Aktiviere &quot;Erweiterte Optionen&quot; → &quot;Verkaufsnebenkosten&quot;, um Maklerkosten (~3-7%) und Vorfälligkeitsentschädigung zu berücksichtigen
                  </p>
                )}
                <div className="space-y-4">
                  {verkaufSzenarien.map((szenario) => (
                    <div key={szenario.jahr} className="bg-slate-50 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">
                          Verkauf nach {szenario.jahr}
                        </span>
                        <span className={`text-sm font-black ${szenario.gesamtErgebnis >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatEur(szenario.gesamtErgebnis)} €
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 space-y-1">
                        <p>Immobilienwert: {formatEur(szenario.immobilienwert)} €</p>
                        {szenario.verkaufsNebenkosten > 0 && (
                          <p className="text-red-600">− Verkaufsnebenkosten: {formatEur(szenario.verkaufsNebenkosten)} €</p>
                        )}
                        <p>− Restschuld: {formatEur(szenario.restschuld)} €</p>
                        <p className={szenario.cashflowKumuliert >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {szenario.cashflowKumuliert >= 0 ? '+ ' : ''}Cashflow kumuliert: {formatEur(szenario.cashflowKumuliert)} €
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 mt-4">
                  {verkaufBreakEven
                    ? `Erster Verkauf ohne Verlust voraussichtlich ab ${verkaufBreakEven}.`
                    : 'In diesem Modell wird der Break-Even durch Verkauf nicht erreicht.'}
                </p>
              </div>

              <div className="bg-gradient-to-br from-[#001d3d] to-[#003366] p-6 rounded-[2rem] text-white shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Info size={16} className="text-[#ff6b00]" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Prognose-Hinweis</span>
                </div>
                <p className="text-[10px] leading-relaxed opacity-90 mb-3">
                  <span className="font-bold">Darlehensmodell:</span> {darlehensTyp === 'degressiv'
                    ? 'Degressives Modell – Zins und Tilgung werden prozentual auf die Restschuld berechnet. Die Rate sinkt mit der Zeit.'
                    : 'Annuitätendarlehen – Die monatliche Rate bleibt konstant. Der Zinsanteil sinkt, der Tilgungsanteil steigt mit der Zeit.'}
                </p>
                <p className="text-[10px] leading-relaxed opacity-90 mb-3">
                  <span className="font-bold">AfA-Abschreibung:</span> Der steuerliche Vorteil durch AfA wird standardmäßig für 50 Jahre berechnet. Danach entfällt der Steuervorteil.
                </p>
                <p className="text-[10px] leading-relaxed opacity-90 mb-3">
                  <span className="font-bold">Inflation:</span> {mietInflationPct > 0 || kostenInflationPct > 0
                    ? `Miete steigt um ${mietInflationPct}% p.a., Kosten steigen um ${kostenInflationPct}% p.a.`
                    : 'Miete und Kosten bleiben konstant (0% Inflation).'}
                </p>
                <p className="text-[10px] leading-relaxed opacity-90">
                  <span className="font-bold">Erweiterte Optionen:</span> Nutze &quot;Erweiterte Optionen&quot; für realitätsnahe Simulationen (Annuitätendarlehen, Inflation, Verkaufsnebenkosten).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4 – Szenarien & Export */}
        {activeTab === 'szenarien' && (
          <div className="relative">
            {/* Blur Overlay when locked */}
            {(!isSignedIn || !canAccessPremium) && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-2xl p-6">
                <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border-2 border-slate-100">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#ff6b00] to-[#ff8c00] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
                    <Lock className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-black mb-2 text-[#001d3d] text-center">Premium Feature</h3>
                  <p className="text-slate-600 mb-5 text-sm leading-relaxed text-center">
                    Schalte Szenarien & PDF Export frei.
                  </p>
                  {!isSignedIn ? (
                    <SignInButton mode="modal" forceRedirectUrl="/step/tabs" fallbackRedirectUrl="/step/tabs">
                      <button className="w-full px-5 py-3 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] hover:from-[#ff6b00]/90 hover:to-[#ff8c00]/90 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm">
                        <Lock size={18} />
                        Kostenlos anmelden
                      </button>
                    </SignInButton>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowUpgradeModal(true)}
                        className="w-full px-5 py-3 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] hover:from-[#ff6b00]/90 hover:to-[#ff8c00]/90 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        <Crown size={18} />
                        Jetzt freischalten
                      </button>
                      <p className="text-xs text-slate-500 mt-3 text-center font-medium">
                        {2 - premiumUsageCount > 0
                          ? `${2 - premiumUsageCount} kostenlose Analyse${2 - premiumUsageCount > 1 ? 'n' : ''} verfügbar`
                          : 'Nur 13,99 €/Monat'}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Content (blurred when locked) */}
            <div className={(!isSignedIn || !canAccessPremium) ? 'blur-md pointer-events-none select-none' : ''}>
  <>
    {/* Kein H2, Tab-Button dient als Titel */}
<p className="text-gray-600 mt-1 pb-6">
  Wähle die Parameter und nutze den Regler, um das Szenario anzupassen. Über „Ergebnis speichern“ kannst du die Berechnung ablegen.
</p>

    {/* kompakte Regler, Label & Wert in einer Zeile */}
    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      <Slider label="Kaltmiete" value={mieteDeltaPct} onChange={setMieteDeltaPct} min={-30} max={30} step={0.5} suffix="%" />
      <Slider label="Kaufpreis" value={preisDeltaPct} onChange={setPreisDeltaPct} min={-30} max={30} step={0.5} suffix="%" />
      <Slider label="Zins" value={zinsDeltaPp} onChange={setZinsDeltaPp} min={-3} max={3} step={0.1} suffix="pp" />
      <Slider label="Tilgung" value={tilgungDeltaPp} onChange={setTilgungDeltaPp} min={-3} max={3} step={0.1} suffix="pp" />
      <Slider label="Eigenkapital" value={ekDeltaPct} onChange={setEkDeltaPct} min={-100} max={100} step={1} suffix="%" />
    </div>

    {/* Base vs Szenario */}
        {(() => {
      const scMiete     = Math.max(0, miete * (1 + mieteDeltaPct / 100));
      const scKaufpreis = Math.max(0, kaufpreis * (1 + preisDeltaPct / 100));
      const scZins      = Math.max(0, zins + zinsDeltaPp);
      const scTilgung   = Math.max(0, tilgung + tilgungDeltaPp);
      const scEk        = Math.max(0, ek * (1 + ekDeltaPct / 100));

      const { nk: scNk }    = berechneNebenkosten(scKaufpreis, grunderwerbsteuer_pct, notarPct, maklerPct);
      const scAnschaffung   = scKaufpreis + scNk + sonstigeKosten;
      const scDarlehen      = Math.max(0, scAnschaffung - scEk);

      const scWarmmiete     = scMiete + hausgeld_umlegbar;
      const scJahresKalt    = scMiete * 12;

      const scBewJ          = (hausgeld - hausgeld_umlegbar) * 12 + instandhaltungskostenProQm * flaeche;
      const scFkZinsenJahr  = scDarlehen * (scZins / 100);

      const scZinsMonthly    = (scDarlehen * (scZins / 100)) / 12;
      const scTilgungMonthly = (scDarlehen * (scTilgung / 100)) / 12;

      const instandhaltungPctN = Number(instandText.replace(',', '.')) || 0;
      const mietausfallPctN    = Number(mietausfallText.replace(',', '.')) || 0;
      const scInstandMonthly   = (instandhaltungPctN * flaeche) / 12;
      const scMietausfallMon   = scMiete * (mietausfallPctN / 100);
      const scKalkKostenMon    = scInstandMonthly + scMietausfallMon;

      const scCashflowVorSt    = scWarmmiete - hausgeld - scKalkKostenMon - scZinsMonthly - scTilgungMonthly;

      const rateMonat   = (darlehensSumme * ((zins + tilgung) / 100)) / 12;
      const scRateMonat = (scDarlehen * ((scZins + scTilgung) / 100)) / 12;

      // Cashflow nach Steuern für Szenario
      const gebPctN = Number(gebText.replace(',', '.')) || 0;
      const afaPctN = Number(afaText.replace(',', '.')) || 0;
      const gebaeudeAnteilEurSc = (scKaufpreis * gebPctN) / 100;
      const afaAnnualEurSc = gebaeudeAnteilEurSc * (afaPctN / 100);
      const afaMonthlyEurSc = afaAnnualEurSc / 12;
      const taxableCashflowSc = scWarmmiete - hausgeld - scZinsMonthly - afaMonthlyEurSc;
      const effectiveStz = Number(persText.replace(',', '.')) || 0;
      const taxMonthlySc = taxableCashflowSc * (effectiveStz / 100);
      const scCashflowAfterTax = scCashflowVorSt - taxMonthlySc;

      // DSCR für Szenario
      const scDSCR = scRateMonat > 0
        ? (scWarmmiete - hausgeld - scKalkKostenMon) / scRateMonat
        : 0;

      const scBruttoRendite = scAnschaffung > 0 ? (scJahresKalt - 0) / scAnschaffung * 100 : 0;
      const scNettoRendite  = scAnschaffung > 0 ? ((scJahresKalt - scBewJ) / scAnschaffung) * 100 : 0;
      const scEkRendite     = scEk > 0 ? ((scJahresKalt - scBewJ - scFkZinsenJahr) / scEk) * 100 : 0;

    // --- Szenario: Helpers & Rows (keine weitere IIFE im JSX) ---
      type Unit = "€" | "%" | "" | "pp";
      type Row = {
        label: string;
        base: number;
        sc: number;
        unit?: Unit;
        higherIsBetter?: boolean;      // default: true
        fractionDigits?: number;       // default: 0 for €, 1 für %
        renderMain?: () => React.ReactNode;  // z.B. für "Zins / Tilgung"
        renderDelta?: () => React.ReactNode; // eigener Delta-Renderer
      };

      const nz = (x:number) => Math.abs(x) < 1e-9;
      const nowrap = "whitespace-nowrap";
      const fmt = (v:number, unit?:Unit, fd?:number) => {
        const digits = fd ?? (unit === "%" ? 1 : unit === "€" ? 0 : 0);
        const core = v.toLocaleString("de-DE", {
          maximumFractionDigits: digits,
          minimumFractionDigits: digits,
        });
        if (unit === "%") return core + " %";
        if (unit === "€") return <span className={nowrap}>{core} €</span>;
        if (unit === "pp") return core + " pp";
        return core;
      };

      // Zins/Tilgung: Delta über die SUMME (niedriger ist besser)
      const sumBaseZT  = (zins ?? 0) + (tilgung ?? 0);
      const sumScZT    = (scZins ?? 0) + (scTilgung ?? 0);
      const deltaSumZT = sumScZT - sumBaseZT;
      const ztBetter   = deltaSumZT < 0;
      const ztDeltaColor = nz(deltaSumZT) ? "text-gray-600"
                           : ztBetter ? "text-[hsl(var(--success))]"
                                      : "text-[hsl(var(--danger))]";

      const rows: Row[] = [
        { label: "Kaufpreis",          base: kaufpreis,          sc: scKaufpreis,       unit: "€", higherIsBetter: false, fractionDigits: 0 },
        { label: "Gesamtinvestition",  base: anschaffungskosten, sc: scAnschaffung,     unit: "€", higherIsBetter: false, fractionDigits: 0 },
        { label: "Eigenkapital",       base: ek,                 sc: scEk,              unit: "€", higherIsBetter: true,  fractionDigits: 0 },
        { label: "Darlehenssumme",     base: darlehensSumme,     sc: scDarlehen,        unit: "€", higherIsBetter: false, fractionDigits: 0 },
        {
          label: "Zins / Tilgung",
          base: sumBaseZT,
          sc: sumScZT,
          unit: "%",
          higherIsBetter: false,
          fractionDigits: 2,
          renderMain: () => (
            <span className={nowrap}>{scZins.toFixed(2)} % / {scTilgung.toFixed(2)} %</span>
          ),
          renderDelta: () => (
            <div className={`text-xs mt-0.5 ${ztDeltaColor}`}>
              Δ gesamt: {nz(deltaSumZT) ? "±0" : (deltaSumZT > 0 ? "+" : "−") + Math.abs(deltaSumZT).toFixed(2) + " pp"}
            </div>
          ),
        },
        { label: "Monatliche Rate",    base: rateMonat,          sc: scRateMonat,       unit: "€", higherIsBetter: false, fractionDigits: 2 },
        { label: "Kaltmiete",          base: miete,              sc: scMiete,           unit: "€", higherIsBetter: true,  fractionDigits: 0 },
        { label: "Cashflow (vor St.)", base: cashflowVorSteuer,  sc: scCashflowVorSt,   unit: "€", higherIsBetter: true,  fractionDigits: 0 },
        { label: "Cashflow (nach St.)", base: cashflowAfterTax,  sc: scCashflowAfterTax, unit: "€", higherIsBetter: true,  fractionDigits: 0 },
        { label: "DSCR",               base: dscr,               sc: scDSCR,            unit: "",  higherIsBetter: true,  fractionDigits: 2 },
        { label: "Nettomietrendite",   base: nettoMietrendite,   sc: scNettoRendite,    unit: "%", higherIsBetter: true,  fractionDigits: 1 },
        { label: "Bruttomietrendite",  base: bruttoMietrendite,  sc: scBruttoRendite,   unit: "%", higherIsBetter: true,  fractionDigits: 1 },
        { label: "EK-Rendite",         base: ekRendite,          sc: scEkRendite,       unit: "%", higherIsBetter: true,  fractionDigits: 1 },
      ];

      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basis */}
          <div className="card bg-white">
            <h3 className="font-semibold mb-3">Aktuelle Eingaben</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
              <div>Kaufpreis</div>             <div className="text-right">{kaufpreis.toLocaleString('de-DE')} €</div>
              <div>Gesamtinvestition</div>     <div className="text-right">{anschaffungskosten.toLocaleString('de-DE')} €</div>
              <div>Eigenkapital</div>          <div className="text-right">{ek.toLocaleString('de-DE')} €</div>
              <div>Darlehenssumme</div>        <div className="text-right">{darlehensSumme.toLocaleString('de-DE')} €</div>
              <div>Zins / Tilgung</div>        <div className="text-right">{zins.toFixed(2)} % / {tilgung.toFixed(2)} %</div>
              <div>Monatliche Rate</div>       <div className="text-right">{rateMonat.toLocaleString('de-DE', { maximumFractionDigits: 2 })} €</div>
              <div>Kaltmiete</div>             <div className="text-right">{miete.toLocaleString('de-DE')} €</div>

              {/* Separator */}
              <div className="col-span-2 border-t border-gray-300 my-2" />

              <div className="font-medium">Cashflow (vor Steuern)</div>
              <div className="text-right font-medium">
                {cashflowVorSteuer.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €
              </div>


              <div>Cashflow (nach Steuern)</div>
              <div className="text-right">
                {cashflowAfterTax.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €
              </div>

              <div>DSCR</div>                  <div className="text-right">{dscr.toFixed(2)}</div>
              <div>Nettomietrendite</div>      <div className="text-right">{nettoMietrendite.toFixed(1)} %</div>
              <div>Bruttomietrendite</div>     <div className="text-right">{bruttoMietrendite.toFixed(1)} %</div>
              <div>EK-Rendite</div>            <div className="text-right">{ekRendite.toFixed(1)} %</div>
            </div>
          </div>

          {/* Szenario – ohne Icons, Delta unter dem Wert */}
          <div className="card card-scenario">
            <h3 className="font-semibold mb-3">Szenario</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
              {rows.map((r) => {
  const delta  = r.sc - r.base;
  const better = r.higherIsBetter !== false ? delta > 0 : delta < 0;
  const color  = nz(delta) ? "text-gray-600"
                : better ? "text-[hsl(var(--success))]"
                         : "text-[hsl(var(--danger))]";
  const fd = r.fractionDigits ?? (r.unit === "%" ? 1 : r.unit === "€" ? 0 : 0);

  // Trennstrich vor "Cashflow (vor St.)" einfügen
  const showSeparator = r.label === "Cashflow (vor St.)";

  return (
    <React.Fragment key={r.label}>
      {/* Separator */}
      {showSeparator && (
        <div className="col-span-2 border-t border-gray-300 my-2" />
      )}

      {/* Label */}
      <div className={showSeparator ? "font-medium pt-2" : ""}>{r.label}</div>

      {/* Value */}
      <div className={`text-right ${showSeparator ? "font-medium pt-2" : ""}`}>
        {/* Hauptwert */}
        <div className="text-gray-800">
          {r.renderMain ? r.renderMain() : fmt(r.sc, r.unit, fd)}
        </div>
        {/* Delta-Zeile */}
        <div className={`text-xs mt-0.5 ${r.renderDelta ? "" : color}`}>
          {r.renderDelta
            ? r.renderDelta()
            : nz(delta)
              ? "±0"
              : (delta > 0 ? "+" : "−") + (
                  r.unit === "€"
                    ? Math.abs(delta).toLocaleString("de-DE", { maximumFractionDigits: fd, minimumFractionDigits: fd }) + " €"
                    : r.unit === "%"
                      ? Math.abs(delta).toLocaleString("de-DE", { maximumFractionDigits: fd, minimumFractionDigits: fd }) + " %"
                      : Math.abs(delta).toLocaleString("de-DE", { maximumFractionDigits: fd, minimumFractionDigits: fd })
                )}
        </div>
      </div>
    </React.Fragment>
  );
})}
            </div>
          </div>
        </div>
      );
    })()}


    {/* Actions unten – modern, ohne Bullet-Liste */}
    <div className="mt-8 mb-16 flex flex-col sm:flex-row gap-3">
      {pdfBusy ? (
        <button
          className="btn-secondary flex items-center gap-2"
          onClick={cancelPdfExport}
        >
          Abbrechen
        </button>
      ) : (
        <button
          className="btn-primary flex items-center gap-2"
          onClick={exportPdf}
        >
          PDF exportieren
        </button>
      )}
      <SaveAnalysisButton />
      {pdfBusy && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <LoadingSpinner size="sm" />
          PDF wird erstellt...
        </div>
      )}
    </div>
  </>
            </div>
          </div>
        )}
        </div>

        <Footer noPadding />
        </div>
      </div>
    );
  } else {
    content = <p>Seite existiert nicht</p>;
  }

  const freeUsagesRemaining = Math.max(0, 2 - premiumUsageCount);

  return (
    <div className="min-h-screen bg-white">
      <Header variant="fixed" />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        remainingFreeUses={freeUsagesRemaining}
      />

      {/* Upsell Banner: Show after 1st premium usage */}
      {step === 'tabs' && !isPremium && premiumUsageCount >= 1 && (
        <UpsellBanner
          remainingFreeUses={freeUsagesRemaining}
          onDismiss={() => {
            // Store dismissal in sessionStorage to not show again this session
            sessionStorage.setItem('upsell_banner_dismissed', 'true');
          }}
        />
      )}

      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10 pt-24">
        {showProgress && <ProgressIndicator currentStep={step as Step} />}
        {content}
      </div>

      {step !== 'tabs' && <Footer />}
    </div>
  );
}
