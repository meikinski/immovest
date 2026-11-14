'use client';

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useImmoStore } from '@/store/useImmoStore';
import { berechneNebenkosten } from '@/lib/calculations';
import { berechnePrognose, berechneAbzahlungsjahr } from '@/lib/prognose-calculator';
import { berechneSzenario, type SzenarioBasis, type SzenarioDeltas } from '@/lib/szenario';
import HtmlContent from '@/components/HtmlContent';
import { KpiTile, type KpiRating } from '@/components/KpiTile';
import { PrognoseTab } from '@/components/PrognoseTab';
import { SzenarienTab } from '@/components/SzenarienTab';
import { StrategyCheckBody, StrategyCheckHeader } from '@/components/StrategyCheckCard';
import { InvestRecommendation, LocationCard, MarketCompareCard, SourcesCard, splitSections } from '@/components/MarketAnalysis';
import { baueReportDaten } from '@/lib/report-daten';
import { GRATIS_ANALYSEN, PREIS_MONAT, preis } from '@/lib/preise';
import type { MarketFacts } from '@/lib/marketFacts';
import {
 BarChart3, BedSingle, Calculator, Calendar, ChartBar, Crown,
  EuroIcon, House, Info, MapPin, ReceiptText, Ruler, SkipForward, SquarePercent, Wallet, WrenchIcon, Lock,
  TrendingUp, Percent, ShieldCheck, Sparkles
} from 'lucide-react';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { Tooltip } from '@/components/Tooltip';
import { AfaSelection } from '@/components/AfaSelection';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { usePaywall } from '@/contexts/PaywallContext';
import { UpgradeModal } from '@/components/UpgradeModal';
import { SecondAnalysisPaywall } from '@/components/SecondAnalysisPaywall';
import { PurchaseTracker } from '@/components/konto/PurchaseTracker';
import { stelleAnalyseNachCheckoutWiederHer, vergissGesicherteAnalyse } from '@/lib/checkoutRueckkehr';
import { UpsellBanner } from '@/components/UpsellBanner';
import { SaveAnalysisButton, speichereAnalyse } from '@/components/SaveAnalysisButton';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { toast } from 'sonner';
import { trackEvent, AnalyticsEvents, leseEingabeMethode, meldeAnalyseAbgeschlossen, meldeAnalyseGespeichert } from '@/lib/analytics';
import { useAuth } from '@clerk/nextjs';
import { signInHref, signUpHref } from '@/lib/anmeldeLinks';
import { GastHinweisBanner } from '@/components/GratisVorteile';
import { useStatePersistence } from '@/hooks/useLoginStatePersistence';
import { LockedPreview } from '@/components/LockedPreview';
import { holeAnmeldeRueckkehr, sichereAnalyseVorAnmeldung, type GesperrterBereich } from '@/lib/anmeldeRueckkehr';
import { TourLink } from '@/components/TourLink';
import { berechneBruttomietrendite, berechneEkRendite, berechneEkStartwert, berechneNettomietrendite, type KennzahlenEingabe } from '@/lib/kennzahlen';
import { formatZahl, formatZahlOderLeer, parseZahl } from '@/lib/zahlen';
import { useFeldText } from '@/hooks/useFeldText';
import { BUNDESLAENDER, istBundesland } from '@/config/grunderwerbsteuer';
import { grunderwerbsteuerLabel } from '@/lib/grunderwerbsteuer';
import { fehlendHinweis, hausgeldUnsicherHinweis, type ImportFeld } from '@/lib/importPruefung';
import { findePflichtLuecken, type PflichtFehler } from '@/lib/pflichtfelder';
import { START_INSTANDHALTUNG_PRO_QM, START_MIETAUSFALL_PCT, startAfa, startGebaeudeAnteil } from '@/lib/startwerte';
import { PruefSeite } from '@/components/PruefSeite';



type Step = 'input-method' | 'a' | 'a2' | 'b' | 'c' | 'pruefen' | 'tabs';
const steps = ['a', 'a2', 'b', 'c', 'tabs']; // result/details ersetzt durch tabs

/** Eingabe lesen (deutsches Format); NaN bei leerer oder unlesbarer Eingabe */
const zahl = (text: string) => parseZahl(text) ?? NaN;

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

type TabId = 'kpi' | 'markt' | 'prognose' | 'szenarien';

/**
 * Rückkehr aus dem Stripe-Checkout der Paywall (?checkout=success|canceled):
 * Eingaben der Wohnung wiederherstellen, Kauf bestätigen und danach den gewünschten Tab öffnen.
 * Als Kind gerendert, damit der Effekt vor dem Autosave-Laden der Seite läuft.
 */
function CheckoutRueckkehr({ onTab }: { onTab: (tab: TabId) => void }) {
  const searchParams = useSearchParams();
  const checkout = searchParams.get('checkout');
  const zielTab = useRef<TabId | null>(null);
  const erledigt = useRef(false);

  useEffect(() => {
    if (!checkout || erledigt.current) return;
    erledigt.current = true;
    const { zielTab: tab } = stelleAnalyseNachCheckoutWiederHer();
    if (checkout === 'canceled') {
      vergissGesicherteAnalyse();
      toast.info('Zahlung abgebrochen. Es wurde nichts berechnet, deine Eingaben sind noch da.');
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }
    if (tab === 'markt' || tab === 'prognose' || tab === 'szenarien') zielTab.current = tab;
  }, [checkout]);

  if (checkout !== 'success') return null;
  return (
    <PurchaseTracker
      onPremiumAktiv={() => {
        vergissGesicherteAnalyse();
        onTab(zielTab.current ?? 'markt');
      }}
    />
  );
}

export default function StepPage() {
  const router = useRouter();
  const params = useParams();
  const stepParam = params.step;
  const step = Array.isArray(stepParam) ? stepParam[0]! : stepParam!;
  const idx = steps.indexOf(step);
  const nextStep = idx < steps.length - 1 ? steps[idx + 1] : 'tabs';
  // Prüfseite nach einem Import: eine Seite statt vier Schritten, ohne Fortschrittsbalken
  const showProgress = step !== 'tabs' && step !== 'pruefen';

  // Auth & Paywall
  const { isSignedIn, userId, getToken } = useAuth();
  // Gäste: Anmeldung mit E-Mail schaltet die komplette Analyse dieser Wohnung kostenlos frei.
  // Eingaben vorher sichern, damit man nach Google-Redirect oder E-Mail-Bestätigung wieder bei dieser Wohnung landet.
  const gastFreischalten = (bereich: GesperrterBereich, modus: 'sign_up' | 'sign_in' = 'sign_up', quelle: 'preview' | 'banner' = 'preview') => {
    if (quelle === 'preview') trackEvent(AnalyticsEvents.LOCKED_PREVIEW_CLICKED, { section: bereich, action: modus });
    sichereAnalyseVorAnmeldung(bereich);
    // Eigene Seite statt Clerk-Fenster: Überschrift mit der Wohnung, Rückkehr über redirect_url
    router.push(modus === 'sign_in' ? signInHref('/step/tabs') : signUpHref(quelle === 'preview' ? 'locked_preview' : 'result_banner', '/step/tabs'));
  };
  const { canAccessPremium, incrementPremiumUsage, premiumUsageCount, isPremium, premiumStatusLoaded, showUpgradeModal, setShowUpgradeModal, upgradeTrigger, refreshPremiumStatus } = usePaywall();
  const freeUsagesRemaining = Math.max(0, GRATIS_ANALYSEN - premiumUsageCount);

  // Hydration guard
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // State Persistence (lädt Zustand beim Mount, speichert bei Änderungen)
  useStatePersistence();

  // === Common Store (Inputs & Ableitungen) ===
  const score         = useImmoStore(s => s.score);
  const updateDerived = useImmoStore(s => s.updateDerived);
  const analysisId    = useImmoStore(s => s.analysisId);

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
  const bundesland = useImmoStore(s => s.bundesland);
  const setBundesland = useImmoStore(s => s.setBundesland);
  const grEStManuell = useImmoStore(s => s.grunderwerbsteuerManuell);
  const importFehlend = useImmoStore(s => s.importFehlend);
  const importHinweise = useImmoStore(s => s.importHinweise);
  const erledigeImportFeld = useImmoStore(s => s.erledigeImportFeld);
  const importQuelle = useImmoStore(s => s.importQuelle);
  const importUnsicher = useImmoStore(s => s.importUnsicher);
  const bestaetigeImportFeld = useImmoStore(s => s.bestaetigeImportFeld);

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

  const mietausfallStore = useImmoStore(s => s.mietausfall_pct);
  const setMietausfallPct = useImmoStore(s => s.setMietausfallPct);
  const persoenlicherSteuersatz = useImmoStore(s => s.persoenlicher_steuersatz);
  const setPersoenlicherSteuersatz = useImmoStore(s => s.setPersoenlicherSteuersatz);

  const afaStore    = useImmoStore(s => s.afa);
  const setAfa      = useImmoStore(s => s.setAfa);
  const setSteuer   = useImmoStore(s => s.setSteuer);
  const steuer      = useImmoStore(s => s.steuer);

  // AfA-Turbo Felder (vereinfacht)
  const afaModell = useImmoStore(s => s.afaModell);
  const setAfaModell = useImmoStore(s => s.setAfaModell);
  const nutzeSonderAfa = useImmoStore(s => s.nutzeSonderAfa);
  const setNutzeSonderAfa = useImmoStore(s => s.setNutzeSonderAfa);
  const grundstueckswert = useImmoStore(s => s.grundstueckswert);
  const setGrundstueckswert = useImmoStore(s => s.setGrundstueckswert);

  // Step C: Werte + Setter
  const ek          = useImmoStore(s => s.ek);
  const setEk       = useImmoStore(s => s.setEk);
  const ekManuell   = useImmoStore(s => s.ekManuell);
  const setEkStartwert = useImmoStore(s => s.setEkStartwert);

  const zins        = useImmoStore(s => s.zins);
  const setZins     = useImmoStore(s => s.setZins);

  const tilgung     = useImmoStore(s => s.tilgung);
  const setTilgung  = useImmoStore(s => s.setTilgung);

  // === Tabs (neu) ===
  const [activeTab, setActiveTab] = useState<TabId>('kpi');
  const [tilgungDeltaPp, setTilgungDeltaPp] = useState<number>(0);
  const [ekDeltaPct, setEkDeltaPct] = useState<number>(0);
  const [openFormulaKey, setOpenFormulaKey] = useState<string | null>(null);


  // === Local UI-States (Step-A Felder, damit Kommaeingaben sauber sind) ===
  // Grunderwerbsteuer: leer, solange kein Bundesland bekannt ist (kein stiller Standardwert)
  const grEStUnbekannt = grEStPct === 0 && !grEStManuell;
  const [grunderwerbText, setGrunderwerbText] = useFeldText(
    grEStPct, n => (grEStUnbekannt ? '' : formatZahl(n)), { key: grEStUnbekannt ? 'leer' : 'gesetzt' }
  );
  const [notarText, setNotarText] = useFeldText(notarPct, n => formatZahl(n));
  const [maklerText, setMaklerText] = useState(
    formatZahl(maklerPct)
  );
  const [sonstigeKostenText, setSonstigeKostenText] = useState(
    formatZahl(sonstigeKosten)
  );
  // Fläche und Miete: Text bleibt beim Tippen stehen ("46," darf nicht zu "46" werden), der Store bekommt die Zahl
  const [flaecheText, setFlaecheText] = useState(formatZahlOderLeer(flaeche));
  useEffect(() => {
    setFlaecheText(t => (parseZahl(t) ?? 0) === flaeche ? t : formatZahlOderLeer(flaeche));
  }, [flaeche]);
  const [mieteText, setMieteText] = useFeldText(miete, n => formatZahlOderLeer(n));

  // Baujahr ohne Tausenderpunkt, leer statt 0
  const [baujahrText, setBaujahrText] = useState(baujahr ? String(baujahr) : '');
  useEffect(() => {
    setBaujahrText(baujahr ? String(baujahr) : '');
  }, [baujahr]);

  // Update maklerText when maklerPct changes (e.g., from URL scraper)
  useEffect(() => {
    setMaklerText(formatZahl(maklerPct));
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

  // --- Steuer-Berechnung (monatlich) ---
  // Local text states & defaults for Step B (UI-Eingaben in %/€)

  // Eingetragene Werte aus dem Store übernehmen (die Seite wird je Schritt neu aufgebaut), sonst Startwerte
  const [mietausfallText, setMietausfallText] = useFeldText(mietausfallStore, n => formatZahl(n, { min: 2 }), { start: formatZahl(START_MIETAUSFALL_PCT, { min: 2 }), nurPositiv: true });
  const [instandText,     setInstandText]     = useFeldText(instandhaltungskostenProQm, n => formatZahl(n, { min: 2 }), { start: formatZahl(START_INSTANDHALTUNG_PRO_QM, { min: 2 }), nurPositiv: true });
  const [persText,        setPersText]        = useState('42,00');
  const initialAfa = afaStore ?? startAfa(baujahr);
  const initialGebaeude = steuer || startGebaeudeAnteil(objekttyp);
  const [afaText,         setAfaText]         = useState(formatZahl(initialAfa));
  const [gebText,         setGebText]         = useState(formatZahl(initialGebaeude));
  // Fehlt das Hausgeld im Inserat, bleiben die Felder leer statt 0
  const hausgeldFehlt = importFehlend.includes('hausgeld');
  const [hausUmlegText,   setHausUmlegText]   = useState(() => hausgeldFehlt && !hausgeld_umlegbar ? '' : formatZahl(hausgeld_umlegbar));
  const [hausNichtText,   setHausNichtText]   = useState(() => hausgeldFehlt && !hausgeld ? '' : formatZahl(hausgeld - hausgeld_umlegbar));
  const autoAfa = useRef(false);
  const autoGebaeude = useRef(false);

  // Zinssatz/Tilgung (Textfelder) für Step C
  const [zinsText,    setZinsText]    = useState(formatZahl(zins ?? 3.5));
  const [tilgungText, setTilgungText] = useState(formatZahl(tilgung ?? 2.0));

  // Sync local text values with store values when navigating back from edit
  useEffect(() => {
    setZinsText(formatZahl(zins));
  }, [zins]);

  useEffect(() => {
    setTilgungText(formatZahl(tilgung));
  }, [tilgung]);

  useEffect(() => {
    if (afaStore !== undefined && afaStore !== null) {
      setAfaText(formatZahl(afaStore));
    }
  }, [afaStore]);

  useEffect(() => {
    if (steuer !== undefined && steuer !== null) {
      setGebText(formatZahl(steuer));
    }
  }, [steuer]);

  useEffect(() => {
    if (persoenlicherSteuersatz !== undefined && persoenlicherSteuersatz !== null) {
      setPersText(formatZahl(persoenlicherSteuersatz));
    }
  }, [persoenlicherSteuersatz]);

  // Szenarien – zusätzliche Regler
  const [mieteDeltaPct, setMieteDeltaPct]   = useState<number>(0);
  const [preisDeltaPct, setPreisDeltaPct]   = useState<number>(0);
  const [zinsDeltaPp,   setZinsDeltaPp]     = useState<number>(0);
  const [wertentwicklungPct, setWertentwicklungPct] = useState<number>(1.5);

  // Prognose-Annahmen
  const [darlehensTyp, setDarlehensTyp] = useState<'annuitaet' | 'degressiv'>('annuitaet');
  const [mietInflationPct, setMietInflationPct] = useState<number>(0);
  const [kostenInflationPct, setKostenInflationPct] = useState<number>(0);
  const [verkaufsNebenkostenPct, setVerkaufsNebenkostenPct] = useState<number>(5);

  // Markt-Recherche vom Agent (Vergleichs-Karten, Lage-Fakten, Quellen) – im Store, damit sie mitgespeichert wird
  const marktFacts = useImmoStore(s => s.marktFacts);
  const mietMarktDelta = useImmoStore(s => s.mietMarktDelta);
  const kaufMarktDelta = useImmoStore(s => s.kaufMarktDelta);
  const setMarktResearch = useImmoStore(s => s.setMarktResearch);


  const formulaDetails = {
    brutto: {
      title: 'Bruttomietrendite',
      formula: 'Jahreskaltmiete ÷ Kaufpreis × 100',
      description: 'Zeigt den Anteil der Jahreskaltmiete am Kaufpreis, ohne Kaufnebenkosten und laufende Kosten.',
    },
    netto: {
      title: 'Nettomietrendite',
      formula: '(Jahreskaltmiete − nicht umlagefähiges Hausgeld − Instandhaltung) ÷ Gesamtinvestition × 100. Gesamtinvestition = Kaufpreis + Kaufnebenkosten (Grunderwerbsteuer, Notar, Makler) + sonstige Kosten',
      description: 'Bezieht laufende Kosten und Kaufnebenkosten ein und zeigt die realistischere Rendite.',
    },
    cfVor: {
      title: 'Cashflow vor Steuern',
      formula: 'Kaltmiete + umlagefähiges Hausgeld − Hausgeld gesamt − kalk. Kosten (Instandhaltung, Mietausfall) − Zins − Tilgung',
      description: 'Was monatlich vor Steuern übrig bleibt (inkl. Puffer für Rücklagen).',
    },
    cfNach: {
      title: 'Cashflow nach Steuern',
      formula: 'Cashflow vor Steuern − Steuer',
      description: 'Was nach Steuern wirklich übrig bleibt.',
    },
    ek: {
      title: 'EK-Rendite',
      formula: '(Jahreskaltmiete − nicht umlagefähiges Hausgeld − Instandhaltung − Zinsen im 1. Jahr) ÷ Eigenkapital × 100',
      description: 'Rendite auf dein eingesetztes Eigenkapital (vor Tilgung/Steuer). Ohne Eigenkapital lässt sie sich nicht berechnen.',
    },
    dscr: {
      title: 'DSCR',
      formula: '(Kaltmiete + umlagefähiges Hausgeld − Hausgeld gesamt − kalk. Kosten) ÷ (Zins + Tilgung)',
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
  const instandhaltungPct = zahl(instandText) || 0;
  const mietausfallPct    = zahl(mietausfallText) || 0;
  const afaPct            = zahl(afaText) || 0;
  const gebPct            = zahl(gebText) || 0;
  const effectiveStz      = zahl(persText) || 0;

  // 2) kalkulatorische Kosten (monatlich)
  const instandhaltungMonthly = (instandhaltungPct * flaeche) / 12;
  const mietausfallMonthly    = miete * (mietausfallPct / 100);
  const kalkKostenMonthly     = instandhaltungMonthly + mietausfallMonthly;

  // 3) Hausgeld gesamt (bereits umlagefähig + nicht umlagefähig)
  const hausgeldTotal = hausgeld;

  // 4) AfA (monatlich) - needed for prognose calculation
  const gebaeudeAnteilEur = (kaufpreis * gebPct) / 100;
  const afaAnnualEur      = gebaeudeAnteilEur * (afaPct / 100);

  const formatEur = (value: number, maximumFractionDigits = 0) =>
    value.toLocaleString('de-DE', { maximumFractionDigits });

  // Grundstückswert für AfA (Fallback: 20% des Kaufpreises)
  const effectiveGrundstueckswert = grundstueckswert > 0 ? grundstueckswert : Math.round(kaufpreis * 0.2);

  // Abzahlung kann länger als die 30 angezeigten Jahre dauern, daher 60 Jahre rechnen
  const { prognose, abzahlungsjahr } = useMemo(
    () => {
      const lang = berechnePrognose(
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
          immobilienwert: kaufpreis,
          wertsteigerungPct: wertentwicklungPct,
          darlehensTyp,
          mietInflationPct,
          kostenInflationPct,
          verkaufsNebenkostenPct,
          // AfA-Turbo Parameter
          afaModell,
          nutzeSonderAfa,
          kaufpreis,
          grundstueckswert: effectiveGrundstueckswert,
          wohnflaeche: flaeche,
        },
        60
      );
      return {
        prognose: { jahre: lang.jahre.slice(0, 31) },
        abzahlungsjahr: berechneAbzahlungsjahr(lang.jahre),
      };
    },
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
      wertentwicklungPct,
      kaufpreis,
      darlehensTyp,
      mietInflationPct,
      kostenInflationPct,
      verkaufsNebenkostenPct,
      // AfA-Turbo Abhängigkeiten
      afaModell,
      nutzeSonderAfa,
      effectiveGrundstueckswert,
      flaeche,
    ]
  );

  // Extract cashflow values from prognose year 0 to ensure consistency
  const cashflowVorSteuer = prognose.jahre[0]?.cashflowVorSteuern ?? 0;
  const cashflowAfterTax = prognose.jahre[0]?.cashflowMonatlich ?? 0;
  const taxMonthly = cashflowVorSteuer - cashflowAfterTax;
  const breakEvenJahre = cashflowAfterTax > 0 ? ek / (cashflowAfterTax * 12) : Infinity;

  // Szenario: gleiche Rechnung für Szenarien-Tab, Speichern und PDF
  const szenarioBasis = useMemo<SzenarioBasis>(() => ({
    kaufpreis, miete, ek, zins, tilgung,
    grunderwerbsteuerPct: grunderwerbsteuer_pct, notarPct, maklerPct, sonstigeKosten,
    hausgeld: hausgeldTotal, hausgeldUmlegbar: hausgeld_umlegbar,
    instandhaltungProQmJahr: instandhaltungskostenProQm, instandKalkProQmJahr: instandhaltungPct,
    mietausfallPct, flaeche,
    afaJaehrlich: afaAnnualEur, steuersatzPct: effectiveStz, darlehensTyp,
    afaModell, nutzeSonderAfa, grundstueckswert: effectiveGrundstueckswert,
  }), [
    kaufpreis, miete, ek, zins, tilgung, grunderwerbsteuer_pct, notarPct, maklerPct, sonstigeKosten,
    hausgeldTotal, hausgeld_umlegbar, instandhaltungskostenProQm, instandhaltungPct, mietausfallPct, flaeche,
    afaAnnualEur, effectiveStz, darlehensTyp, afaModell, nutzeSonderAfa, effectiveGrundstueckswert,
  ]);
  const szenarioDeltas = useMemo<SzenarioDeltas>(() => ({
    preisPct: preisDeltaPct, mietePct: mieteDeltaPct, ekPct: ekDeltaPct, zinsPp: zinsDeltaPp, tilgungPp: tilgungDeltaPp,
  }), [preisDeltaPct, mieteDeltaPct, ekDeltaPct, zinsDeltaPp, tilgungDeltaPp]);
  const scenarioCalculations = useMemo(() => berechneSzenario(szenarioBasis, szenarioDeltas), [szenarioBasis, szenarioDeltas]);
  const setSzenarioDeltas = (d: SzenarioDeltas) => {
    setPreisDeltaPct(d.preisPct);
    setMieteDeltaPct(d.mietePct);
    setEkDeltaPct(d.ekPct);
    setZinsDeltaPp(d.zinsPp);
    setTilgungDeltaPp(d.tilgungPp);
  };

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
      setInstandText(formatZahl(defaultInstand, { min: 2 }));
    }

    // Mietausfall-Defaults
    if (mietausfallPct === 0) {
      const defaultMietausfall = (objekttyp === 'mfh' && anzahlWohneinheiten > 3) ? 3 : 5;
      setMietausfallPct(defaultMietausfall);
      setMietausfallText(formatZahl(defaultMietausfall, { min: 2 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objekttyp, anzahlWohneinheiten, mounted]);

  useEffect(() => {
    // Die Prüfseite setzt ihre Startwerte selbst; hier würde die Automatik dort eingetragene Werte überschreiben
    if (!mounted || step === 'pruefen') return;

    const defaultAfa = startAfa(baujahr);
    const parsedAfa = zahl(afaText) || 0;
    const shouldUpdateAfa =
      autoAfa.current ||
      parsedAfa === 0 ||
      Math.abs(parsedAfa - defaultAfa) < 0.001;

    if (shouldUpdateAfa) {
      setAfa(defaultAfa);
      setAfaText(formatZahl(defaultAfa));
      autoAfa.current = true;
    }

    const defaultGeb = startGebaeudeAnteil(objekttyp);
    const parsedGeb = zahl(gebText) || 0;
    const shouldUpdateGeb =
      autoGebaeude.current ||
      parsedGeb === 0 ||
      Math.abs(parsedGeb - defaultGeb) < 0.001;

    if (shouldUpdateGeb) {
      setSteuer(defaultGeb);
      setGebText(formatZahl(defaultGeb));
      autoGebaeude.current = true;
    }
  }, [baujahr, objekttyp, mounted, step, setAfa, setSteuer, afaText, gebText]);

  // KPI-Berechnungen (in %)
  // Bruttomietrendite: Jahreskaltmiete ÷ Kaufpreis (ohne Nebenkosten, übliche Definition)
  const bruttoMietrendite = berechneBruttomietrendite(jahreskaltmiete, kaufpreis);

  // Nettomietrendite und EK-Rendite: dieselben Funktionen wie im Store (Speichern, Liste, Chat)
  const kennzahlenEingabe: KennzahlenEingabe = {
    kaufpreis, grunderwerbsteuerPct: grEStPct, notarPct, maklerPct, sonstigeKosten, miete, hausgeld,
    hausgeldUmlegbar: hausgeld_umlegbar, instandhaltungProQmJahr: instandhaltungskostenProQm, flaeche,
    mietausfallPct, ek, zins, tilgung,
  };
  // (Jahreskaltmiete − nicht umlagefähiges Hausgeld − Instandhaltung) ÷ Gesamtinvestition
  const nettoMietrendite = berechneNettomietrendite(kennzahlenEingabe);

  // Alias
  const nettorendite = nettoMietrendite;

  // null bei EK = 0: dann neutrale Anzeige statt 0,0 %
  const ekRendite = berechneEkRendite(kennzahlenEingabe);

    // Debt Service Coverage Ratio (DSCR): Nettoeinnahmen / Kreditrate
const dscr =
  ((warmmiete - hausgeldTotal - kalkKostenMonthly) /
    (((darlehensSumme * (zins / 100)) / 12) +
     ((darlehensSumme * (tilgung / 100)) / 12))) || 0;



  // Break-Even
  /*const breakEvenJahre = useImmoStore((s) =>
    s.cashflow_operativ > 0 ? s.ek / (s.cashflow_operativ * 12) : Infinity
  );*/

  // === Pflichtfelder ===
  // Jede Lücke gehört zu einem Schritt. "Weiter" ist gesperrt, solange im aktuellen oder einem früheren Schritt etwas fehlt.
  const [fehlerSichtbar, setFehlerSichtbar] = useState(false);

  const pflichtFehler = (): PflichtFehler[] =>
    findePflichtLuecken({
      kaufpreis, adresse, objekttyp, flaeche, zimmer, anzahlWohneinheiten, baujahr, miete, ek, zins, tilgung,
      grunderwerbsteuerFehlt: step === 'a' ? parseZahl(grunderwerbText) === null : grEStUnbekannt,
      hausgeldUnbestaetigt: objekttyp === 'wohnung' && importUnsicher.includes('hausgeld'),
    })
      // Nur Lücken bis einschließlich des aktuellen Schritts zählen
      .filter(x => steps.indexOf(x.schritt) <= idx);
  const offeneFehler = fehlerSichtbar ? pflichtFehler() : [];
  /** Meldung direkt am Feld (nur für Felder des aktuellen Schritts) */
  const feldFehler = (key: string) => {
    const treffer = offeneFehler.find(x => x.key === key && x.schritt === step);
    return treffer ? (
      <p role="alert" data-feld-fehler={key} className="text-xs font-semibold text-red-600 ml-1 mt-1">{treffer.text}</p>
    ) : null;
  };
  /** Feld fehlt im importierten Inserat und ist noch nicht ergänzt */
  const fehltImInserat = (feld: ImportFeld) => importFehlend.includes(feld);
  const inseratHinweis = (feld: ImportFeld) =>
    fehltImInserat(feld) && !offeneFehler.some(x => x.key === feld && x.schritt === step) ? (
      <p className="text-xs font-semibold text-amber-700 ml-1 mt-1">Fehlt im Inserat. Bitte ergänzen.</p>
    ) : null;
  /** Rahmenfarbe für Felder mit Fehler (rot) oder fehlender Angabe aus dem Inserat (gelb) */
  const feldRahmen = (key: string, feld?: ImportFeld) =>
    offeneFehler.some(x => x.key === key && x.schritt === step)
      ? ' border-red-500! ring-2 ring-red-500/10'
      : feld && fehltImInserat(feld)
        ? ' border-amber-400! bg-amber-50/50!'
        : '';
  const SCHRITT_NR: Record<string, number> = { a: 1, a2: 2, b: 3, c: 4 };
  /** Lücken aus früheren Schritten, mit Link dorthin (steht über dem Weiter-Button) */
  const fruehereFehler = () => {
    const frueher = offeneFehler.filter(x => x.schritt !== step);
    if (frueher.length === 0) return null;
    return (
      <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <p className="font-semibold">Diese Angaben fehlen noch:</p>
        <ul className="mt-1 space-y-1">
          {frueher.map(x => (
            <li key={x.key}>
              <Link href={`/step/${x.schritt}`} className="font-semibold underline underline-offset-2">
                {x.label} (Schritt {SCHRITT_NR[x.schritt]})
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Flush all text input values to store before navigation
  const flushAllInputs = () => {
    // Step A inputs
    // Grunderwerbsteuer nur schreiben, wenn der Nutzer den Wert geändert hat (sonst gälte er als manuell gesetzt)
    const grEStNum = zahl(grunderwerbText);
    if (!isNaN(grEStNum) && grEStNum !== grEStPct) setGrunderwerbsteuerPct(grEStNum);

    const notarNum = zahl(notarText);
    if (!isNaN(notarNum) && notarNum !== notarPct) setNotarPct(notarNum);

    const maklerNum = zahl(maklerText);
    if (!isNaN(maklerNum) && maklerNum !== maklerPct) setMaklerPct(maklerNum);

    const sonstigeNum = zahl(sonstigeKostenText);
    if (!isNaN(sonstigeNum)) setSonstigeKosten(sonstigeNum);

    // Step A2 inputs
    const flaecheNum = zahl(flaecheText);
    if (!isNaN(flaecheNum)) setFlaeche(flaecheNum);

    const baujahrNum = parseInt(baujahrText, 10);
    if (!isNaN(baujahrNum) && baujahrNum > 0) setBaujahr(baujahrNum);

    // Step B inputs
    const afaNum = zahl(afaText);
    if (!isNaN(afaNum)) setAfa(afaNum);

    const gebNum = zahl(gebText);
    if (!isNaN(gebNum)) setSteuer(gebNum);

    const hausUmlegNum = zahl(hausUmlegText);
    if (!isNaN(hausUmlegNum)) setHausgeldUmlegbar(hausUmlegNum);

    const instandNum = zahl(instandText);
    if (!isNaN(instandNum)) setInstandhaltungskostenProQm(instandNum);

    const mietausfallNum = zahl(mietausfallText);
    if (!isNaN(mietausfallNum)) setMietausfallPct(mietausfallNum);

    const persNum = zahl(persText);
    if (!isNaN(persNum)) setPersoenlicherSteuersatz(persNum);

    // Step C inputs
    const zinsNum = zahl(zinsText);
    if (!isNaN(zinsNum)) setZins(zinsNum);

    const tilgungNum = zahl(tilgungText);
    if (!isNaN(tilgungNum)) setTilgung(tilgungNum);
  };

  const handleNavigateToNextStep = () => {
    // Flush all pending input values first
    flushAllInputs();

    // Gesperrt, solange Pflichtfelder fehlen: Meldung direkt am Feld, erstes betroffenes Feld in den Blick holen
    const fehler = pflichtFehler();
    if (fehler.length > 0) {
      setFehlerSichtbar(true);
      requestAnimationFrame(() => {
        document.querySelector('[role="alert"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }

    router.push(`/step/${nextStep}`);
  };

  // Redirect /step/tabs → /step/a when store is empty (unqualified direct traffic)
  useEffect(() => {
    if (!mounted) return;
    if (step === 'tabs' && kaufpreis <= 0) {
      router.replace('/step/a');
    }
  }, [step, mounted, kaufpreis, router]);

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
    // Gäste sehen nur eine Platzhalter-Vorschau: kein KI-Aufruf (Kosten, keine echten Daten im DOM)
    if (isSignedIn !== true) return;

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
      .then(async r => {
        const json = await r.json().catch(() => ({}));
        // Rate Limit / Tagesbudget / Fehler: freundliche Meldung des Servers anzeigen
        if (!r.ok) return { comment: json.message || json.error || 'Leider konnte die KI-Einschätzung nicht geladen werden.' };
        return json;
      })
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
  }, [step, activeTab, isSignedIn, score, generatedComment, setGeneratedComment,
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

  // Die kostenlose Analyse gilt für eine Wohnung (Adresse). Sie bleibt offen, auch nachdem der Zähler
  // hochgezählt wurde, nach Neuladen und wenn Miete oder Preis nachträglich angepasst werden.
  const gratisSchluessel = (adresse || '').trim().toLowerCase();
  const freigabeSpeicher = userId ? `gratis_freigabe_${userId}` : null;
  const [gratisFreigabe, setGratisFreigabe] = useState<string | null>(null);
  useEffect(() => {
    if (!freigabeSpeicher) return;
    try { setGratisFreigabe(localStorage.getItem(freigabeSpeicher)); } catch { /* privater Modus */ }
  }, [freigabeSpeicher]);
  const hatVollzugang = isPremium || canAccessPremium || (!!gratisSchluessel && gratisFreigabe === gratisSchluessel);

  // Rückkehr nach der Anmeldung aus einer gesperrten Vorschau: gleiche Wohnung, vollständige Analyse startet automatisch.
  // KI-Einschätzung lädt im KPI-Tab von selbst, Markt und Prognose werden direkt geöffnet (startet den Markt-Abruf).
  const anmeldeRueckkehrGeprueft = useRef(false);
  useEffect(() => {
    if (step !== 'tabs' || !isSignedIn || !premiumStatusLoaded || anmeldeRueckkehrGeprueft.current) return;
    anmeldeRueckkehrGeprueft.current = true;
    const bereich = holeAnmeldeRueckkehr();
    if (!bereich) return;
    if (bereich === 'ki') {
      setActiveTab('kpi');
      return;
    }
    // Freigabe direkt lesen: der State aus localStorage ist in diesem Durchlauf evtl. noch nicht gesetzt
    const schluessel = (useImmoStore.getState().adresse || '').trim().toLowerCase();
    let freigabe = gratisFreigabe;
    try { if (freigabeSpeicher) freigabe = localStorage.getItem(freigabeSpeicher) ?? gratisFreigabe; } catch { /* privater Modus */ }
    if (isPremium || canAccessPremium || (!!schluessel && freigabe === schluessel)) {
      setActiveTab(bereich);
      toast.success('Freigeschaltet: Die vollständige Analyse dieser Wohnung startet.');
    } else {
      // Bestehendes Konto mit verbrauchter Gratis-Analyse: normale Paywall, Limits unverändert
      setShowUpgradeModal(true, `tab_${bereich}`);
    }
  }, [step, isSignedIn, premiumStatusLoaded, isPremium, canAccessPremium, gratisFreigabe, freigabeSpeicher, setShowUpgradeModal]);

  // Wer Prognose oder Szenarien direkt öffnet, verbraucht die kostenlose Analyse ebenso wie beim Marktvergleich
  useEffect(() => {
    if (step !== 'tabs' || (activeTab !== 'prognose' && activeTab !== 'szenarien')) return;
    if (!isSignedIn || !premiumStatusLoaded || isPremium || !gratisSchluessel || !canAccessPremium) return;
    let gespeicherteFreigabe = gratisFreigabe;
    try { if (freigabeSpeicher) gespeicherteFreigabe = localStorage.getItem(freigabeSpeicher) ?? gratisFreigabe; } catch { /* privater Modus */ }
    if (gespeicherteFreigabe === gratisSchluessel) return;
    incrementPremiumUsage();
    setGratisFreigabe(gratisSchluessel);
    try { if (freigabeSpeicher) localStorage.setItem(freigabeSpeicher, gratisSchluessel); } catch { /* privater Modus */ }
  }, [step, activeTab, isSignedIn, premiumStatusLoaded, isPremium, gratisSchluessel, canAccessPremium, gratisFreigabe, freigabeSpeicher, incrementPremiumUsage]);

  // Die kostenlose vollständige Analyse bleibt im Konto gespeichert: automatisch, sobald sie freigeschaltet ist,
  // und erneut, wenn Marktdaten oder KI-Einschätzung dazukommen. Der Speichern-Knopf bleibt für alle weiteren Stände.
  const istGratisAnalyse = !!isSignedIn && premiumStatusLoaded && !isPremium && !!gratisSchluessel && gratisFreigabe === gratisSchluessel;
  useEffect(() => {
    if (step !== 'tabs' || !istGratisAnalyse || !(kaufpreis > 0)) return;
    const t = setTimeout(() => {
      speichereAnalyse(userId)
        .then(id => meldeAnalyseGespeichert({ analysisId: id, saveType: 'auto', plan: 'free' }))
        .catch(e => console.warn('[Analyse] Automatisches Speichern fehlgeschlagen', e));
    }, 1500);
    return () => clearTimeout(t);
  }, [step, istGratisAnalyse, kaufpreis, userId, marktFacts, generatedComment, lageComment, investComment]);

  // Neues Gerät oder gelöschte Browserdaten: Die Freigabe steht nur im Browser. Wird die gespeicherte
  // Gratis-Analyse (mit Marktdaten) wieder geöffnet, gilt sie weiter als freigeschaltet.
  useEffect(() => {
    if (step !== 'tabs' || !freigabeSpeicher || !premiumStatusLoaded || isPremium || canAccessPremium) return;
    if (!gratisSchluessel || !analysisId || !marktFacts) return;
    try {
      if (localStorage.getItem(freigabeSpeicher) !== null) return;
      localStorage.setItem(freigabeSpeicher, gratisSchluessel);
    } catch { return; /* privater Modus */ }
    queueMicrotask(() => setGratisFreigabe(gratisSchluessel));
  }, [step, freigabeSpeicher, premiumStatusLoaded, isPremium, canAccessPremium, gratisSchluessel, analysisId, marktFacts]);

  // kpi_result_viewed: einmal pro Wohnung, sobald das KPI-Ergebnis steht (auch für Gäste).
  // analysis_completed folgt erst, wenn die vollständige Analyse (Markt, KI, Prognose) fertig ist.
  const kpiGemeldet = useRef<string | null>(null);
  useEffect(() => {
    if (!mounted || step !== 'tabs' || !(kaufpreis > 0)) return;
    if (isSignedIn === undefined) return;
    const wohnung = gratisSchluessel || `kaufpreis_${kaufpreis}`;
    if (kpiGemeldet.current === wohnung) return;
    const speicher = 'analytics_kpi_result_viewed';
    let erledigt: string[] = [];
    try { erledigt = JSON.parse(localStorage.getItem(speicher) || '[]'); } catch { /* privater Modus */ }
    kpiGemeldet.current = wohnung;
    if (erledigt.includes(wohnung)) return;
    trackEvent(AnalyticsEvents.KPI_RESULT_VIEWED, {
      input_method: leseEingabeMethode(),
      object_type: objekttyp,
      signed_in: !!isSignedIn,
    });
    try { localStorage.setItem(speicher, JSON.stringify([...erledigt, wohnung].slice(-50))); } catch { /* privater Modus */ }
  }, [mounted, step, kaufpreis, isSignedIn, gratisSchluessel, objekttyp]);

  // Startwert fürs Eigenkapital: Kaufnebenkosten + 10 % des Kaufpreises, auf 1.000 € gerundet.
  // Gilt nur, solange der Nutzer nichts eingetragen hat (setEkStartwert überschreibt nie eine Eingabe).
  const ekStartwert = berechneEkStartwert({
    kaufpreis, grunderwerbsteuerPct: grEStPct, notarPct, maklerPct, sonstigeKosten,
  });
  useEffect(() => {
    if (!mounted || (step !== 'c' && step !== 'pruefen') || ekManuell || !(kaufpreis > 0)) return;
    setEkStartwert(ekStartwert);
  }, [mounted, step, ekManuell, kaufpreis, ekStartwert, setEkStartwert]);

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
      setMarktResearch({ facts: null, mietDelta: null, kaufDelta: null });
    }

    lastMarktInputs.current = inputFingerprint;
  }, [adresse, objekttyp, kaufpreis, flaeche, zimmer, baujahr,
      miete, hausgeld, hausgeld_umlegbar, ek, zins, tilgung,
      lageComment, mietpreisComment, qmPreisComment, investComment,
      setLageComment, setMietpreisComment, setQmPreisComment, setInvestComment, setMarktResearch]);

  // Main effect to fetch comments
  useEffect(() => {
  if (!(step === 'tabs' && activeTab === 'markt')) return;

  // Erst entscheiden, wenn Anmeldung und Plan bekannt sind, sonst würde ein verbrauchtes Kontingent kurz als frei gelten
  if (isSignedIn === undefined || (isSignedIn && !premiumStatusLoaded)) return;

  // Gäste: nur statische Vorschau, kein Markt-/KI-Aufruf
  if (!isSignedIn) return;

  // If no premium access, show placeholder content
  if (!hatVollzugang) {
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

  // Gespeicherte/geladene Analyse mit echter Recherche → nicht erneut abrufen.
  // marktFacts fehlt bei älteren Speicherständen, daher zusätzlich Platzhalter/Fehlertexte ausschließen.
  const istPlatzhalter = (html: string) =>
    html.includes('Premium-Inhalte sind hier verfügbar') ||
    html.includes('Analyse fehlgeschlagen') ||
    html.includes('Analyse nicht verfügbar') ||
    html.includes('Die Investitionsanalyse kombiniert alle Faktoren');
  const hatEchteRecherche = marktFacts || (!istPlatzhalter(lageComment) && !istPlatzhalter(investComment));
  if (hasExistingComments && hatEchteRecherche) {
    console.log('[Markt] Skipping reload - loaded analysis already has research data');
    marktFetched.current = true;
    return;
  }

  // If already fetched in this session, skip
  if (marktFetched.current) {
    console.log('[Markt] Skipping reload - already fetched in this session');
    return;
  }

  // Läuft schon eine Abfrage (Effekt erneut ausgelöst), nicht doppelt starten
  if (loadingDetails) return;

  // Kostenlose Analyse: Gezählt wird ausschließlich auf dem Server (/api/agent/run, nach Erfolg).
  // Die Freigabe im localStorage ist nur ein Anzeige-Zwischenspeicher, damit die Wohnung offen bleibt.
  let gespeicherteFreigabe = gratisFreigabe;
  try { if (freigabeSpeicher) gespeicherteFreigabe = localStorage.getItem(freigabeSpeicher) ?? gratisFreigabe; } catch { /* privater Modus */ }
  const neueGratisAnalyse = !isPremium && gespeicherteFreigabe !== gratisSchluessel;
  if (neueGratisAnalyse) {
    setGratisFreigabe(gratisSchluessel);
    try { if (freigabeSpeicher) localStorage.setItem(freigabeSpeicher, gratisSchluessel); } catch { /* privater Modus */ }
  }

  // NOTE: marktFetched moved to AFTER successful API call to prevent blocking retries
  setLoadingDetails(true);

  (async () => {
    try {
      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Stabile ID der Analyse (für die Zuordnung der Gratis-Analyse auf dem Server)
          analysisId,
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
          // Ohne Eigenkapital keine EK-Rendite (Feld entfällt)
          ekRendite: ekRendite ?? undefined,
          dscr,
          anschaffungskosten,
        }),
      });

      const data = await res.json() as {
        analyse: {
          lage: { html: string };
          miete: { html: string; delta_psqm: number | null };
          kauf: { html: string; delta_psqm: number | null };
          facts: MarketFacts | null;
        };
        invest: { html: string };
        error?: boolean;
        message?: string;
      };

      // 402: Gratis-Analyse ist auf dem Server schon für eine andere Wohnung vergeben → Paywall
      if (res.status === 402) {
        if (neueGratisAnalyse) {
          setGratisFreigabe(null);
          try { if (freigabeSpeicher && localStorage.getItem(freigabeSpeicher) === gratisSchluessel) localStorage.removeItem(freigabeSpeicher); } catch { /* privater Modus */ }
        }
        marktFetched.current = true; // nicht in Schleife erneut anfragen
        setLageComment('<p>Premium-Inhalte sind hier verfügbar. Die Lageanalyse bietet detaillierte Einblicke in die Umgebung, Infrastruktur und Entwicklungspotenzial der Immobilie.</p>');
        setMietpreisComment('<p>Hier findest du einen umfassenden Vergleich der Mietpreise in der Umgebung, inklusive Marktpositionierung und Preisentwicklung.</p>');
        setQmPreisComment('<p>Der Kaufpreisvergleich zeigt dir, wie der Quadratmeterpreis im Vergleich zu ähnlichen Objekten in der Gegend einzuordnen ist.</p>');
        setInvestComment('<p>Die Investitionsanalyse kombiniert alle Faktoren und gibt dir eine fundierte Empfehlung für deine Kaufentscheidung.</p>');
        void refreshPremiumStatus();
        setShowUpgradeModal(true, 'tab_markt');
        return;
      }

      // 401 / 429 / 503: freundliche Meldung vom Server, ohne Hinweis auf falsche Eingaben
      if ([401, 429, 503].includes(res.status)) {
        throw Object.assign(new Error(data.message || 'Bitte versuche es später noch einmal.'), { schutz: true });
      }

      if (!res.ok || data.error) {
        const errorMsg = data.message || `HTTP ${res.status}`;
        throw new Error(errorMsg);
      }
      setLageComment(data.analyse?.lage?.html?.trim() || '<p>Für diese Adresse liegen aktuell zu wenige Lagehinweise vor.</p>');
      setMietpreisComment(data.analyse?.miete?.html?.trim() || '<p>Für diese Adresse liegen aktuell zu wenige belastbare Mietdaten vor.</p>');
      setQmPreisComment(data.analyse?.kauf?.html?.trim() || '<p>Für diese Adresse liegen aktuell zu wenige belastbare Kaufpreisdaten vor.</p>');
      setInvestComment(data.invest?.html?.trim() || '<p>Investitionsanalyse derzeit nicht verfügbar.</p>');

      setMarktResearch({
        facts: data.analyse?.facts ?? null,
        mietDelta: data.analyse?.miete?.delta_psqm ?? null,
        kaufDelta: data.analyse?.kauf?.delta_psqm ?? null,
      });

      // Mark as successfully fetched only AFTER successful API call
      marktFetched.current = true;

      // Zählerstand (Gratis-Analyse) vom Server holen, der Server ist die einzige Quelle
      if (!isPremium) void refreshPremiumStatus();

      // analysis_completed: Marktvergleich und KI-Investitionsanalyse sind geladen, die Prognose rechnet lokal
      meldeAnalyseAbgeschlossen({
        userId,
        schluessel: gratisSchluessel || analysisId || `kaufpreis_${kaufpreis}`,
        plan: isPremium ? 'premium' : 'free',
      });
    } catch (e) {
      console.error('Markt/Agent laden fehlgeschlagen', e);

      // Extract error message to show user why the agent failed
      const errorMessage = (e instanceof Error ? e.message : 'Ein unbekannter Fehler ist aufgetreten')
        .replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string));
      const istSchutz = !!(e as { schutz?: boolean })?.schutz;
      const errorHtml = istSchutz
        ? `<div class="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p class="font-semibold text-amber-800 mb-2">Kurze Pause</p>
        <p class="text-amber-700 text-sm">${errorMessage}</p>
      </div>`
        : `<div class="p-4 bg-red-50 border border-red-200 rounded-lg">
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
  canAccessPremium, isPremium, setShowUpgradeModal, refreshPremiumStatus, isSignedIn, premiumStatusLoaded, hatVollzugang, analysisId, anschaffungskosten, bruttoMietrendite, cashflowAfterTax, cashflowVorSteuer, dscr, ekRendite, nettoMietrendite
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
  // PDF-Report gibt es mit Premium und in der kostenlosen Analyse
  if (!isSignedIn || !hatVollzugang) {
    setShowUpgradeModal(true, 'pdf_export');
    return;
  }
  setPdfBusy(true);
  pdfAbortController.current = new AbortController();
  try {
    const fazitHtml = splitSections(investComment || '').find(sec => /fazit/i.test(sec.title))?.html ?? '';
    const payload = baueReportDaten({
      adresse: shortAddress || adresse || '',
      objekttyp,
      flaeche,
      zimmer,
      baujahr,
      nebenkosten: {
        grunderwerbsteuer: grunderwerbsteuer_eur, notar: notar_eur, makler: makler_eur,
        grunderwerbsteuerPct: grunderwerbsteuer_pct, notarPct, maklerPct,
      },
      basis: szenarioBasis,
      deltas: szenarioDeltas,
      anschaffungskosten,
      prognoseJahre: prognose.jahre,
      annahmen: { wertsteigerungPct: wertentwicklungPct, mietInflationPct, kostenInflationPct, verkaufsNebenkostenPct },
      markt: {
        facts: marktFacts ?? null,
        mietDelta: mietMarktDelta ?? null,
        kaufDelta: kaufMarktDelta ?? null,
        mietHtml: mietpreisComment,
        kaufHtml: qmPreisComment,
        lageHtml: lageComment,
        fazitHtml,
      },
    });

    let token: string | null = null;
    try { token = await getToken(); } catch { /* Cookie kann reichen */ }
    const res = await fetch('/api/export/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      // Vollständige Adresse für die Plan-Prüfung (im Report steht sie aufgeteilt in Titel und Ort)
      body: JSON.stringify({ ...payload, adresse }),
      signal: pdfAbortController.current?.signal
    });
    if (res.status === 401 || res.status === 402 || res.status === 403) {
      toast.info('Den PDF-Report gibt es in deiner kostenlosen Analyse oder mit Premium.');
      setShowUpgradeModal(true, 'pdf_export');
      return;
    }
    if (res.status === 429 || res.status === 503) {
      const d = await res.json().catch(() => ({}));
      toast.error(d.message || 'Bitte versuche es später noch einmal.');
      return;
    }
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
    a.download = 'investment-report.pdf';
    a.style.display = 'none';
    a.target = '_self';  // Prevent opening in new tab
    document.body.appendChild(a);
    a.click();

    // Clean up after a short delay to ensure download starts
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    trackEvent(AnalyticsEvents.PDF_DOWNLOADED, { plan: isPremium ? 'premium' : 'free' });
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
  isSignedIn, hatVollzugang, isPremium, setShowUpgradeModal, getToken,
  shortAddress, adresse, objekttyp, flaeche, zimmer, baujahr,
  grunderwerbsteuer_eur, notar_eur, makler_eur, grunderwerbsteuer_pct, notarPct, maklerPct,
  szenarioBasis, szenarioDeltas, anschaffungskosten, prognose,
  wertentwicklungPct, mietInflationPct, kostenInflationPct, verkaufsNebenkostenPct,
  marktFacts, mietMarktDelta, kaufMarktDelta, mietpreisComment, qmPreisComment, lageComment, investComment,
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

        {/* Import: fehlende Angaben und Hinweise aus dem Inserat */}
        {mounted && (importFehlend.length > 0 || importHinweise.length > 0) && (
          <div id="import-hinweis" role="status" className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 flex items-start gap-3">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              {importFehlend.length > 0 && <p className="font-semibold">{fehlendHinweis(importFehlend)}</p>}
              {importHinweise.length > 0 && (
                <>
                  <p className={`font-semibold ${importFehlend.length > 0 ? 'mt-3' : ''}`}>Bitte prüfe diese Werte aus dem Import:</p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-xs leading-relaxed">
                    {importHinweise.map(h => <li key={h}>{h}</li>)}
                  </ul>
                </>
              )}
            </div>
          </div>
        )}

        {/* Input Container */}
        <div className="bg-slate-50 rounded-[2.5rem] p-6 md:p-12 border border-slate-100/50 shadow-inner space-y-6 max-w-5xl mx-auto">

          {/* Adresse: steht in Schritt 1, weil die PLZ den Grunderwerbsteuersatz bestimmt */}
          <div className="space-y-1.5" id="adresse-feld">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-1">Adresse</label>
            <div className={`relative group rounded-2xl${offeneFehler.some(x => x.key === 'adresse') ? ' ring-2 ring-red-500' : fehltImInserat('adresse') ? ' ring-2 ring-amber-400' : ''}`}>
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff6b00] transition-colors z-10" size={18} />
              <AddressAutocomplete
                value={adresse}
                onChange={(val: string) => { setAdresse(val); if (val.trim()) erledigeImportFeld('adresse'); }}
              />
            </div>
            {feldFehler('adresse')}
            {inseratHinweis('adresse')}
            <p className="text-xs text-slate-400 ml-1 mt-1">Mit PLZ. Daraus ergibt sich der Grunderwerbsteuersatz deines Bundeslands.</p>
          </div>

          {/* Kaufpreis */}
          <div className="space-y-1.5 w-full">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-1">Kaufpreis</label>
            <div className="relative group">
              <EuroIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff6b00] transition-colors" size={18} />
              <input
                id="kaufpreis-input"
                type="text"
                value={mounted ? (kaufpreis === 0 ? '' : kaufpreis.toLocaleString('de-DE')) : ''}
                placeholder="z.B. 280.000"
                inputMode="decimal"
                onChange={(e) => { const n = zahl(e.target.value) || 0; setKaufpreis(n); if (n > 0) erledigeImportFeld('kaufpreis'); }}
                onFocus={(e) => e.target.select()}
                className={`w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-5 text-base font-bold text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm${feldRahmen('kaufpreis', 'kaufpreis')}`}
              />
            </div>
            {feldFehler('kaufpreis')}
            {inseratHinweis('kaufpreis')}
            <p className="text-xs text-slate-400 ml-1 mt-1">Gesamtkaufpreis laut Exposé</p>
          </div>

          {/* Kaufnebenkosten Section */}
          <div className="pt-4">
            <h3 className="text-sm font-bold text-slate-700 mb-1">Kaufnebenkosten</h3>
            <p className="text-xs text-slate-400 mb-4">Notar, Grunderwerbsteuer, ggf. Makler</p>

            <div className="grid grid-cols-1 gap-6">
              {[
                { label: 'Grunderwerbsteuer', text: grunderwerbText, setText: setGrunderwerbText, setter: setGrunderwerbsteuerPct, wert: grEStPct, amount: grunderwerbsteuer_eur, id: 'grunderwerbsteuer-input' },
                { label: 'Notar & Grundbuch', text: notarText, setText: setNotarText, setter: setNotarPct, wert: notarPct, amount: notar_eur, id: 'notar-input' },
                { label: 'Maklergebühr', text: maklerText, setText: setMaklerText, setter: setMaklerPct, wert: maklerPct, amount: makler_eur, id: 'makler-input' },
              ].map((item, i) => (
                <div key={i} className="space-y-1.5">
                  <label htmlFor={item.id} className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-1">{item.label}</label>
                  {/* Grunderwerbsteuer: Bundesland aus der PLZ, hier änderbar. Ohne Bundesland bleibt der Satz leer. */}
                  {item.id === 'grunderwerbsteuer-input' && (
                    <select
                      id="bundesland-select"
                      aria-label="Bundesland"
                      value={bundesland ?? ''}
                      onChange={(e) => setBundesland(istBundesland(e.target.value) ? e.target.value : null)}
                      className={`w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 text-sm font-semibold text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm${feldRahmen('grunderwerbsteuer')}`}
                    >
                      <option value="">Bundesland wählen</option>
                      {Object.entries(BUNDESLAENDER).map(([code, land]) => (
                        <option key={code} value={code}>{land.name}</option>
                      ))}
                    </select>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Prozent Input */}
                    <div
                      onBlur={() => {
                        // Nur echte Änderungen schreiben, sonst gälte ein vorbelegter Satz als manuell gesetzt
                        const num = zahl(item.text);
                        const neu = isNaN(num) ? 0 : num;
                        if (neu !== item.wert) item.setter(neu);
                        if (!isNaN(num)) item.setText(formatZahl(num));
                      }}
                    >
                      <div className="relative group">
                        <SquarePercent className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff6b00] transition-colors" size={18} />
                        <input
                          id={item.id}
                          type="text"
                          inputMode="decimal"
                          value={item.text}
                          placeholder={item.id === 'grunderwerbsteuer-input' ? 'Bundesland wählen' : undefined}
                          onChange={(e) => item.setText(e.target.value)}
                          onFocus={(e) => e.target.select()}
                          className={`w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-5 text-base font-bold placeholder:text-sm placeholder:font-semibold placeholder:text-slate-400 text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm${item.id === 'grunderwerbsteuer-input' ? feldRahmen('grunderwerbsteuer') : ''}`}
                        />
                      </div>
                    </div>

                    {/* Betrag */}
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={mounted ? item.amount.toLocaleString('de-DE') : ''}
                        className="w-full bg-slate-100 border border-slate-200 rounded-2xl py-4 px-5 text-base font-bold text-slate-500 cursor-not-allowed shadow-sm"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-[10px]">€</span>
                    </div>
                  </div>
                  {item.id === 'grunderwerbsteuer-input' && (
                    <>
                      {feldFehler('grunderwerbsteuer')}
                      <p id="grunderwerbsteuer-hinweis" className="text-xs text-slate-500 ml-1 mt-1">
                        {mounted && bundesland && grEStPct === BUNDESLAENDER[bundesland].satz
                          ? <><span className="font-semibold text-[#001d3d]">{grunderwerbsteuerLabel(bundesland)}</span> · Satz deines Bundeslands, du kannst ihn ändern.</>
                          : mounted && bundesland
                            ? <>Eigener Satz. Üblich wäre: {grunderwerbsteuerLabel(bundesland)}</>
                            : mounted && !grEStUnbekannt
                              ? 'Eigener Satz.'
                              : 'Bundesland wählen: Der Satz liegt je nach Bundesland zwischen 3,5 % und 6,5 %.'}
                      </p>
                    </>
                  )}
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
                    const num = zahl(sonstigeKostenText);
                    setSonstigeKosten(isNaN(num) ? 0 : num);
                    setSonstigeKostenText(formatZahl(isNaN(num) ? 0 : num));
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
                    value={mounted ? anschaffungskosten.toLocaleString('de-DE') : ''}
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
        {fruehereFehler()}
        <div className="mt-8">
          <button
            data-step-nav="next"
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
            <div id="objekttyp-selector" className="flex gap-3">
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
                  inputMode="decimal"
                  value={formatZahlOderLeer(objekttyp === 'mfh' ? anzahlWohneinheiten : zimmer)}
                  onChange={(e) => {
                    const n = zahl(e.target.value) || 0;
                    if (objekttyp === 'mfh') setAnzahlWohneinheiten(n); else setZimmer(n);
                    if (n > 0) erledigeImportFeld('zimmer');
                  }}
                  onFocus={(e) => e.target.select()}
                  className={`w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-5 text-base font-bold text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm${feldRahmen('zimmer', objekttyp === 'mfh' ? undefined : 'zimmer')}`}
                />
              </div>
              {feldFehler('zimmer')}
              {objekttyp !== 'mfh' && inseratHinweis('zimmer')}
              {objekttyp === 'mfh' && (
                <p className="text-xs text-slate-500 ml-1">Anzahl vermietbarer Wohnungen</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-1">
                {objekttyp === 'mfh' ? 'Gesamtwohnfläche' : 'Fläche'}
              </label>
              <div className="relative group">
                <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff6b00] transition-colors" size={18} />
                <input
                  type="text"
                  id="flaeche-input"
                  inputMode="decimal"
                  value={flaecheText}
                  placeholder="z.B. 65"
                  onChange={(e) => {
                    const text = e.target.value;
                    setFlaecheText(text);
                    const num = zahl(text);
                    setFlaeche(isNaN(num) ? 0 : num);
                    if (num > 0) erledigeImportFeld('flaeche');
                  }}
                  onBlur={() => setFlaecheText(formatZahlOderLeer(flaeche))}
                  onFocus={(e) => e.target.select()}
                  className={`w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-5 text-base font-bold text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm${feldRahmen('flaeche', 'flaeche')}`}
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-[10px]">m²</span>
              </div>
              {feldFehler('flaeche')}
              {inseratHinweis('flaeche')}
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
                value={baujahrText}
                onChange={(e) => {
                  const text = e.target.value;
                  setBaujahrText(text);
                  const newBaujahr = parseInt(text, 10);
                  if (!isNaN(newBaujahr) && newBaujahr > 0) {
                    const newAfaValue = startAfa(newBaujahr);
                    const newGebValue = startGebaeudeAnteil(objekttyp);

                    autoAfa.current = true;
                    autoGebaeude.current = true;

                    setAfaText(formatZahl(newAfaValue));
                    setAfa(newAfaValue);
                    setGebText(formatZahl(newGebValue));
                    setSteuer(newGebValue);
                    setBaujahr(newBaujahr);
                    erledigeImportFeld('baujahr');
                  } else if (text.trim() === '') {
                    setBaujahr(0);
                  }
                }}
                inputMode="numeric"
                placeholder="z.B. 1995"
                onFocus={(e) => e.target.select()}
                className={`w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-5 text-base font-bold text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm${feldRahmen('baujahr', 'baujahr')}`}
              />
            </div>
            {feldFehler('baujahr')}
            {inseratHinweis('baujahr')}
          </div>
        </div>

        {/* Buttons */}
        {fruehereFehler()}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => router.push('/step/a')}
            className="w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <SkipForward size={20} className="rotate-180 text-slate-600" />
          </button>
          <button
            data-step-nav="next"
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
          <h1 className="text-4xl md:text-5xl font-black text-[#001d3d] tracking-tight leading-none">Miete & Kosten.</h1>
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
                    id="miete-input"
                    type="text"
                    inputMode="decimal"
                    value={mieteText}
                    placeholder="z.B. 950"
                    onChange={(e) => {
                      const text = e.target.value;
                      setMieteText(text);
                      const num = zahl(text);
                      setMiete(isNaN(num) ? 0 : num);
                      if (num > 0) erledigeImportFeld('miete');
                    }}
                    onBlur={() => setMieteText(formatZahlOderLeer(miete))}
                    onFocus={(e) => e.target.select()}
                    className={`w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-5 text-base font-bold text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm${feldRahmen('miete', 'miete')}`}
                  />
                </div>
                {feldFehler('miete')}
                {inseratHinweis('miete')}
                <p className="text-xs text-slate-400 ml-1 mt-1">Nettokaltmiete pro Monat, ohne Nebenkosten</p>
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
                  const um = zahl(hausUmlegText);
                  setHausgeldUmlegbar(isNaN(um) ? 0 : um);
                  if (objekttyp === 'wohnung') {
                    const non = zahl(hausNichtText) || 0;
                    setHausgeld(isNaN(um) ? non : um + non);
                  }
                  if (!isNaN(um)) { setHausUmlegText(formatZahl(um)); erledigeImportFeld('hausgeld'); }
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
                    id="hausgeld-umlegbar-input"
                    type="text"
                    inputMode="decimal"
                    value={hausUmlegText}
                    placeholder="z.B. 150"
                    onChange={(e) => setHausUmlegText(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className={`w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-5 text-base font-bold text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm${objekttyp === 'wohnung' ? feldRahmen('hausgeld', 'hausgeld') : ''}`}
                  />
                </div>
                {objekttyp === 'wohnung' && inseratHinweis('hausgeld')}
              </div>

              {/* Für ETW: Nicht umlagefähiges Hausgeld */}
              {objekttyp === 'wohnung' && (
                <div
                  onBlur={() => {
                    const um = zahl(hausUmlegText) || 0;
                    const non = zahl(hausNichtText);
                    setHausgeldUmlegbar(um);
                    setHausgeld(isNaN(non) ? um : um + non);
                    if (!isNaN(non)) { setHausNichtText(formatZahl(non)); erledigeImportFeld('hausgeld'); }
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
                      id="hausgeld-nicht-umlegbar-input"
                      type="text"
                      inputMode="decimal"
                      value={hausNichtText}
                      placeholder="z.B. 100"
                      onChange={(e) => setHausNichtText(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className={`w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-5 text-base font-bold text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm${feldRahmen('hausgeld', 'hausgeld')}`}
                    />
                  </div>
                </div>
              )}

              {/* Für Haus/MFH: Verwaltungskosten */}
              {(objekttyp === 'haus' || objekttyp === 'mfh') && (
                <div
                  onBlur={() => {
                    const verw = zahl(hausNichtText);
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

            {/* Importiertes Hausgeld unplausibel (= Kaltmiete oder über 60 % davon): Nutzer muss bestätigen */}
            {mounted && objekttyp === 'wohnung' && importUnsicher.includes('hausgeld') && hausgeld > 0 && miete > 0 && (
              <div id="hausgeld-unsicher" role="alert" className="mt-4 p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-sm flex items-start gap-3">
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-semibold">Hausgeld unsicher</p>
                  <p className="text-xs mt-1">{hausgeldUnsicherHinweis(hausgeld, miete)}</p>
                  <button
                    type="button"
                    onClick={() => bestaetigeImportFeld('hausgeld')}
                    className="mt-3 inline-flex items-center rounded-xl border border-amber-400 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition"
                  >
                    Hausgeld stimmt so
                  </button>
                </div>
              </div>
            )}

            {/* Hinweise zu Hausgeld-Verteilung */}
            {objekttyp === 'wohnung' && (() => {
              const umlegbarNum = zahl(hausUmlegText) || 0;
              const nichtUmlegbarNum = zahl(hausNichtText) || 0;
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
                        Das Hausgeld wurde automatisch im Verhältnis <strong>60% umlagefähig ({formatZahl(hausgeld * 0.6, { min: 2 })} €)</strong> / <strong>40% nicht umlagefähig ({formatZahl(hausgeld * 0.4, { min: 2 })} €)</strong> aufgeteilt. Bitte prüfe diese Werte und passe sie bei Bedarf an die tatsächliche Verteilung laut WEG-Abrechnung an.
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
                        • 60% umlagefähig: <strong>{formatZahl(recommendedUmlegbar, { min: 2 })} €</strong><br />
                        • 40% nicht umlagefähig: <strong>{formatZahl(recommendedNichtUmlegbar, { min: 2 })} €</strong>
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
                        • 60% umlagefähig: <strong>{formatZahl(recommendedUmlegbar, { min: 2 })} €</strong><br />
                        • 40% nicht umlagefähig: <strong>{formatZahl(recommendedNichtUmlegbar, { min: 2 })} €</strong>
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
                onBlur={() => { const n = zahl(mietausfallText) || 0; setMietausfallPct(n); setMietausfallText(formatZahl(n, { min: 2 })); }}
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
                    id="mietausfall-input"
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
                onBlur={() => { const n = zahl(instandText) || 0; setInstandhaltungskostenProQm(n); setInstandText(formatZahl(n, { min: 2 })); }}
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
                    id="instandhaltung-input"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* AfA Satz */}
              <div
                onBlur={() => { const n = zahl(afaText) || 0; setAfa(n); setAfaText(formatZahl(n)); }}
                className="space-y-1.5"
              >
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-1 flex items-start min-h-[44px]">
                  <span className="flex items-center">
                    AfA Satz (% p.a.)
                    <Tooltip text="Lineare Abschreibung für Wohnimmobilien. Der AfA-Satz hängt vom Baujahr ab: vor 1925: 2,5 % p.a., ab 1925: 2 % p.a., ab 2023: 3 % p.a. (vereinfachte Orientierung). Wir setzen den Standardwert automatisch basierend auf dem eingegebenen Baujahr – bitte prüfe ihn bei Bedarf.">
                      <Info className="w-4 h-4 text-slate-400 cursor-pointer ml-1 hover:text-slate-600" />
                    </Tooltip>
                  </span>
                </label>
                <div className="relative group">
                  <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff6b00] transition-colors" size={18} />
                  <input
                    id="afa-input"
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
                onBlur={() => { const n = zahl(gebText) || 0; setSteuer(n); setGebText(formatZahl(n)); }}
                className="space-y-1.5"
              >
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-1 flex items-start min-h-[44px]">
                  <span className="flex items-center">
                    Anteil Gebäude am Kaufpreis (%)
                    <Tooltip text="Orientierung je Objektart: ETW ~75 %, Haus ~80 %, MFH ~85 %. Wir hinterlegen den Gebäudeanteil automatisch basierend auf der Objektart.">
                      <Info className="w-4 h-4 text-slate-400 cursor-pointer ml-1 hover:text-slate-600" />
                    </Tooltip>
                  </span>
                </label>
                <div className="relative group">
                  <House className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff6b00] transition-colors" size={18} />
                  <input
                    id="gebaeude-input"
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
                onBlur={() => { const n = zahl(persText) || 0; setPersoenlicherSteuersatz(n); setPersText(formatZahl(n)); }}
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
                    id="steuersatz-input"
                    type="text"
                    value={persText}
                    onChange={(e) => setPersText(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-5 text-base font-bold text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* AfA-Turbo Abschnitt - nur bei Baujahr >= 2023 */}
            {baujahr >= 2023 && (
              <div className="mt-8 pt-6 border-t border-slate-200">
                <AfaSelection
                  baujahr={baujahr}
                  afaModell={afaModell}
                  nutzeSonderAfa={nutzeSonderAfa}
                  onAfaModellChange={setAfaModell}
                  onNutzeSonderAfaChange={setNutzeSonderAfa}
                />
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        {fruehereFehler()}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => router.push('/step/a2')}
            className="w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <SkipForward size={20} className="rotate-180 text-slate-600" />
          </button>
          <button
            data-step-nav="next"
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
          <h1 className="text-4xl md:text-5xl font-black text-[#001d3d] tracking-tight leading-none">Finanzierung.</h1>
        </div>

        {/* Input Container */}
        <div className="bg-slate-50 rounded-[2.5rem] p-6 md:p-12 border border-slate-100/50 shadow-inner space-y-6 max-w-5xl mx-auto">

          {/* Eigenkapital */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-1">Eigenkapital</label>
            <div className="relative group">
              <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff6b00] transition-colors" size={18} />
              <input
                id="eigenkapital-input"
                type="text"
                inputMode="decimal"
                value={mounted ? ek.toLocaleString('de-DE') : ''}
                onChange={(e) => setEk(zahl(e.target.value) || 0)}
                onFocus={(e) => e.target.select()}
                className={`w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-5 text-base font-bold text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm${feldRahmen('ek')}`}
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-[10px]">€</span>
            </div>
            {feldFehler('ek')}
            {mounted && !ekManuell && kaufpreis > 0 && (
              <p id="eigenkapital-hinweis" className="text-xs text-slate-500 ml-1 mt-1">
                Startwert: Kaufnebenkosten plus 10 % des Kaufpreises. Passe ihn an dein Eigenkapital an.
              </p>
            )}
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
                      ? formatZahl((ek / anschaffungskosten) * 100, { min: 1, max: 1 })
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
                const num = zahl(zinsText);
                setZins(isNaN(num) ? 0 : num);
                setZinsText(formatZahl(isNaN(num) ? 0 : num));
              }}
              className="space-y-1.5"
            >
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-1">Zinssatz</label>
              <div className="relative group">
                <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff6b00] transition-colors" size={18} />
                <input
                  id="zins-input"
                  type="text"
                  value={zinsText}
                  inputMode="decimal"
                  onChange={(e) => setZinsText(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className={`w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-5 text-base font-bold text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm${feldRahmen('zins')}`}
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-[10px]">% p. a.</span>
              </div>
              {feldFehler('zins')}
            </div>

            {/* Tilgung */}
            <div
              onBlur={() => {
                const num = zahl(tilgungText);
                setTilgung(isNaN(num) ? 0 : num);
                setTilgungText(formatZahl(isNaN(num) ? 0 : num));
              }}
              className="space-y-1.5"
            >
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] ml-1">Tilgung</label>
              <div className="relative group">
                <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff6b00] transition-colors" size={18} />
                <input
                  id="tilgung-input"
                  type="text"
                  value={tilgungText}
                  inputMode="decimal"
                  onChange={(e) => setTilgungText(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className={`w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-5 text-base font-bold text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm${feldRahmen('tilgung')}`}
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-[10px]">% p. a.</span>
              </div>
              {feldFehler('tilgung')}
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
        {fruehereFehler()}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => router.push('/step/b')}
            className="w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <SkipForward size={20} className="rotate-180 text-slate-600" />
          </button>
          <button
            data-step-nav="next"
            onClick={handleNavigateToNextStep}
            className="flex-1 bg-[#001d3d] text-white rounded-2xl py-4 px-6 text-base font-bold hover:bg-[#001d3d]/90 transition-all shadow-lg"
          >
            Investment analysieren
          </button>
        </div>
      </>
    );
  } else if (step === 'pruefen') {
    content = <PruefSeite mounted={mounted} onWeiter={() => router.push('/step/tabs')} />;
  } else if (step === 'tabs') {
    content = (
      <div className="fixed inset-0 flex flex-col bg-[#F8FAFC] pt-16">
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 lg:px-10 py-6 bg-white border-b border-slate-200">
            <div id="results-header" className="bg-gradient-to-br from-[#001d3d] to-[#003366] rounded-3xl p-6 shadow-lg flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-[#ff6b00] rounded-2xl flex items-center justify-center shadow-md">
                  <House size={28} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight flex items-center gap-2 text-white">
                    {shortAddress || adresse || 'Immobilie'}
                  </h2>
                  <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mt-1">
                    {formatZahl(flaeche)} m² • {objekttyp} • {kaufpreis.toLocaleString('de-DE')} €
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <TourLink step="tabs" hell />
                <button
                  // Importierte Wohnungen: alle Werte auf einer Seite prüfen, manuelle Eingabe: letzter Schritt
                  onClick={() => router.push(importQuelle ? '/step/pruefen' : '/step/c')}
                  className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition-all backdrop-blur-sm border border-white/20"
                >
                  Bearbeiten
                </button>
              </div>
            </div>
          </div>

          <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
            <div id="tabs-navigation" className="px-6 lg:px-10 flex gap-10 overflow-x-auto no-scrollbar">
              {([
                { id: 'kpi', label: 'KPI Analyse', icon: BarChart3 },
                { id: 'markt', label: 'Marktvergleich & Investitionsanalyse', icon: ChartBar },
                { id: 'prognose', label: 'Prognose & Entwicklung', icon: TrendingUp },
                { id: 'szenarien', label: 'Szenarien & PDF Export', icon: Calculator }
              ] as const).map(t => {
                // Markt, Prognose, Szenarien & PDF-Report gehören zur kostenlosen Analyse, danach Premium
                const locked = t.id !== 'kpi' && (!isSignedIn || !hatVollzugang);
                return (
                  <button
                    key={t.id}
                    onClick={() => !locked ? setActiveTab(t.id) : (!isSignedIn && t.id !== 'szenarien') ? setActiveTab(t.id) : setShowUpgradeModal(true, `tab_${t.id}`)}
                    className={`relative py-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap ${activeTab === t.id ? 'text-[#001d3d]' : 'text-slate-300 hover:text-slate-500'}`}
                  >
                    {locked ? (
                      <Lock size={14} />
                    ) : (
                      <t.icon size={14} className={activeTab === t.id ? 'text-[#ff6b00]' : ''} />
                    )}
                    {t.label}
                    {locked && !isSignedIn && t.id !== 'szenarien' && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black tracking-wider text-emerald-700">Gratis</span>
                    )}
                    {activeTab === t.id && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#ff6b00] rounded-t-full shadow-[0_-2px_8px_rgba(255,140,0,0.3)]" />}
                  </button>
                );
              })}
            </div>
          </div>

        <div className="px-6 lg:px-10 py-10 space-y-10">
        {!isSignedIn && activeTab !== 'szenarien' && <GastHinweisBanner onFreischalten={() => gastFreischalten('markt', 'sign_up', 'banner')} />}
        {/* Tab 1 – KPI-Übersicht (Free) */}
        {activeTab === 'kpi' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {renderFormulaDrawer()}
            {(() => {
              const fmtNum = (n: number, fd = 0) =>
                n.toLocaleString('de-DE', { minimumFractionDigits: fd, maximumFractionDigits: fd });
              const cfVor = prognose.jahre[0]?.cashflowVorSteuern ?? 0;
              const cfNach = prognose.jahre[0]?.cashflowMonatlich ?? 0;
              const rateCf = (v: number): [KpiRating, string] =>
                v > 10 ? ['good', 'Positiv'] : v >= -10 ? ['ok', 'Ausgeglichen'] : ['bad', 'Negativ'];
              const bruttoRating: [KpiRating, string] =
                bruttoMietrendite >= 5 ? ['good', 'Stark'] : bruttoMietrendite >= 4 ? ['ok', 'Solide'] : ['bad', 'Niedrig'];
              const nettoRating: [KpiRating, string] =
                nettoMietrendite >= 4 ? ['good', 'Stark'] : nettoMietrendite >= 3 ? ['good', 'Solide'] : nettoMietrendite >= 2 ? ['ok', 'Moderat'] : ['bad', 'Niedrig'];
              // EK = 0: neutraler Zustand ohne Bewertung
              const ekRating: [KpiRating, string] | [undefined, undefined] =
                ekRendite === null ? [undefined, undefined]
                  : ekRendite >= 6 ? ['good', 'Stark'] : ekRendite >= 3 ? ['ok', 'Moderat'] : ['bad', 'Niedrig'];
              const dscrRating: [KpiRating, string] =
                dscr >= 1.2 ? ['good', 'Komfortabel'] : dscr >= 1.0 ? ['ok', 'Knapp'] : ['bad', 'Kritisch'];
              const cfVorRating = rateCf(cfVor);
              const cfNachRating = rateCf(cfNach);

              const ekQuote = anschaffungskosten > 0 ? Math.min(100, Math.max(0, (ek / anschaffungskosten) * 100)) : 0;
              const breakEvenYear = isFinite(breakEvenJahre) ? new Date().getFullYear() + Math.round(breakEvenJahre) : null;
              const payoffYear = abzahlungsjahr;

              const renderWeiterButton = (visibility: string) => (
                <div className={`relative mt-2 mb-16 ${visibility} ${isCommentLocked ? 'blur-sm pointer-events-none select-none' : ''}`}>
                  <button
                    onClick={() => {
                      if (!isSignedIn) {
                        // Gäste sehen im Tab die gesperrte Vorschau
                        setActiveTab('markt');
                      } else if (!hatVollzugang) {
                        setShowUpgradeModal(true, 'weiter_markt');
                      } else {
                        setActiveTab('markt');
                      }
                    }}
                    className={`btn-primary ${(!isSignedIn || !hatVollzugang) ? 'opacity-75' : ''}`}
                  >
                    {(!isSignedIn || !hatVollzugang) && <Lock size={16} className="mr-2" />}
                    Weiter zu Marktvergleich & Lage →
                  </button>
                </div>
              );

              return (
                <>
            {/* Main KPI Cards */}
            <div className="lg:col-span-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <KpiTile
                  id="kpi-brutto"
                  icon={SquarePercent}
                  label="Bruttorendite"
                  value={fmtNum(bruttoMietrendite, 1)}
                  unit="%"
                  caption="Jahreskaltmiete / Kaufpreis"
                  rating={bruttoRating[0]}
                  ratingLabel={bruttoRating[1]}
                  help="Anteil der Jahreskaltmiete am Kaufpreis, ohne Nebenkosten und laufende Kosten. Je höher, desto besser."
                  onShowFormula={() => setOpenFormulaKey('brutto')}
                />
                <KpiTile
                  id="kpi-netto"
                  icon={Percent}
                  label="Nettorendite"
                  value={fmtNum(nettoMietrendite, 1)}
                  unit="%"
                  caption="Nach laufenden Kosten, auf Gesamtinvestition"
                  rating={nettoRating[0]}
                  ratingLabel={nettoRating[1]}
                  help="Rendite nach laufenden Kosten. Zeigt realistischer, was vom Investment bleibt."
                  onShowFormula={() => setOpenFormulaKey('netto')}
                />
                <KpiTile
                  id="kpi-cashflow"
                  icon={Wallet}
                  label="Cashflow"
                  value={fmtNum(cfVor)}
                  unit="€"
                  caption="pro Monat, vor Steuern"
                  rating={cfVorRating[0]}
                  ratingLabel={cfVorRating[1]}
                  colorValue
                  help="Monatlicher Überschuss vor Steuern. Rücklagen sind bereits eingeplant."
                  onShowFormula={() => setOpenFormulaKey('cfVor')}
                />
                <KpiTile
                  icon={ReceiptText}
                  label="Cashflow"
                  value={fmtNum(cfNach)}
                  unit="€"
                  caption="pro Monat, nach Steuern"
                  rating={cfNachRating[0]}
                  ratingLabel={cfNachRating[1]}
                  colorValue
                  help="Cashflow nach Steuern. Das ist das Geld, das am Monatsende übrig bleibt."
                  onShowFormula={() => setOpenFormulaKey('cfNach')}
                />
                <KpiTile
                  icon={TrendingUp}
                  label="EK-Rendite"
                  value={ekRendite === null ? '–' : fmtNum(ekRendite, 1)}
                  unit={ekRendite === null ? undefined : '%'}
                  caption={ekRendite === null ? 'Ohne Eigenkapital nicht berechenbar' : 'Auf eingesetztes Eigenkapital'}
                  rating={ekRating[0]}
                  ratingLabel={ekRating[1]}
                  help="Rendite auf dein eingesetztes Eigenkapital (vor Tilgung/Steuer). Je höher, desto effizienter arbeitet dein Eigenkapital."
                  onShowFormula={() => setOpenFormulaKey('ek')}
                />
                <KpiTile
                  icon={ShieldCheck}
                  label="DSCR"
                  value={fmtNum(dscr, 2)}
                  caption="Schuldendienstdeckung"
                  rating={dscrRating[0]}
                  ratingLabel={dscrRating[1]}
                  help="Zeigt, ob die Miete die Kreditrate deckt. Über 1,2 ist stark, unter 1,0 kritisch."
                  onShowFormula={() => setOpenFormulaKey('dscr')}
                />
              </div>

              {/* KI-Strategie-Check (Gäste: gesperrte Platzhalter-Vorschau, kein KI-Aufruf) */}
              {!isSignedIn ? (
                <LockedPreview bereich="ki" onFreischalten={gastFreischalten} />
              ) : (
              <div className={`relative bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 md:p-8 overflow-hidden ${isCommentLocked && !isLoadingComment ? 'min-h-[460px]' : ''}`}>
                {/* Blur Overlay wenn nicht angemeldet */}
                {isCommentLocked && !isLoadingComment && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm p-6">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-slate-100">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#ff6b00] to-[#ff8c00] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
                        <Lock className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold mb-2 text-[#001d3d] text-center">KI-Einschätzung freischalten</h3>
                      <p className="text-slate-600 mb-5 text-sm leading-relaxed text-center">
                        Die KI-Einschätzung gehört zur vollständigen Analyse. Deine kostenlose Analyse ist schon für eine andere Wohnung vergeben, mit Premium bekommst du sie für jede weitere Wohnung.
                      </p>
                      <button onClick={() => setShowUpgradeModal(true, 'ki_einschaetzung')} className="w-full px-5 py-3 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] hover:from-[#ff6b00]/90 hover:to-[#ff8c00]/90 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm">
                        <Lock size={18} />
                        Premium ansehen
                      </button>
                    </div>
                  </div>
                )}

                <div className={isCommentLocked && !isLoadingComment ? 'blur-sm pointer-events-none select-none' : ''}>
                  {isLoadingComment ? (
                    <>
                      <StrategyCheckHeader />
                      <div className="mt-6">
                        <LoadingSpinner
                          size="sm"
                          messages={[
                            'Analysiere Cashflow und Rendite...',
                            'Bewerte Eigenkapitalquote...',
                            'Prüfe Schuldendienstdeckung...',
                            'Erstelle Investment-Einschätzung...',
                          ]}
                        />
                      </div>
                    </>
                  ) : isCommentLocked ? (
                    <>
                      <StrategyCheckHeader verdict="Einschätzung" tone="neutral" />
                      <div className="mt-6 space-y-3" aria-hidden>
                        <div className="h-3 rounded bg-slate-200 w-11/12" />
                        <div className="h-3 rounded bg-slate-200 w-4/5" />
                        <div className="grid grid-cols-2 gap-4 pt-4">
                          <div className="h-24 rounded-xl bg-emerald-50" />
                          <div className="h-24 rounded-xl bg-amber-50" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <StrategyCheckBody raw={generatedComment || ''} />
                  )}
                </div>
              </div>
              )}

              {/* Weiter Button mit Blur wenn KI-Kommentar locked oder Premium nicht verfügbar (Desktop: unter dem KI-Kommentar) */}
              {renderWeiterButton('hidden lg:block')}
            </div>

            {/* Sidebar with Details */}
            <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-20 lg:self-start">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                <h4 className="text-sm font-bold text-[#001d3d] flex items-center gap-2">
                  <BarChart3 size={16} className="text-[#ff6b00]" /> Finanzierung
                </h4>

                {/* Gesamtinvestition */}
                <div className="mt-5">
                  <p className="text-xs text-slate-500">Gesamtinvestition inkl. Nebenkosten</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-[#001d3d] tabular-nums">
                    {fmtNum(anschaffungskosten)} €
                  </p>
                </div>

                {/* EK / Darlehen Aufteilung */}
                <div className="mt-5">
                  <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="bg-[#ff6b00] h-full transition-all" style={{ width: `${ekQuote}%` }} />
                    <div className="bg-[#001d3d] h-full transition-all" style={{ width: `${100 - ekQuote}%` }} />
                  </div>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="flex items-center gap-2 text-slate-600">
                        <span className="w-2.5 h-2.5 rounded-sm bg-[#ff6b00]" /> Eigenkapital
                      </dt>
                      <dd className="font-semibold text-[#001d3d] tabular-nums">
                        {fmtNum(ek)} € <span className="ml-1 text-xs font-medium text-slate-400">{fmtNum(ekQuote, 1)} %</span>
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="flex items-center gap-2 text-slate-600">
                        <span className="w-2.5 h-2.5 rounded-sm bg-[#001d3d]" /> Darlehen
                      </dt>
                      <dd className="font-semibold text-[#001d3d] tabular-nums">
                        {fmtNum(darlehensSumme)} € <span className="ml-1 text-xs font-medium text-slate-400">{fmtNum(100 - ekQuote, 1)} %</span>
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Zeitachse */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">EK zurück</p>
                    <p className="mt-0.5 text-lg font-bold text-[#001d3d] tabular-nums">{breakEvenYear ?? '–'}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Schuldenfrei</p>
                    <p className="mt-0.5 text-lg font-bold text-[#001d3d] tabular-nums">{payoffYear ?? '–'}</p>
                  </div>
                </div>
              </div>

              {/* Hinweis */}
              <div className="flex gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
                <Info size={16} className="mt-0.5 shrink-0 text-slate-400" />
                <p className="text-xs leading-relaxed text-slate-500">
                  Alle Werte beziehen sich auf das erste Jahr nach Kauf und basieren auf deinen Eingaben. Marktvergleich, Prognose und Szenarien findest du in den weiteren Tabs. Deine erste Analyse enthält alles, ab der 2. Wohnung brauchst du Premium.
                </p>
              </div>
            </div>

            {/* Mobile: Weiter Button unter der Finanzierung-Card */}
            {renderWeiterButton('lg:hidden')}
                </>
              );
            })()}

          </div>
        )}

        {/* Tab 2 – Marktvergleich & Lage (Gäste: gesperrte Platzhalter-Vorschau, kein Markt-Aufruf) */}
        {activeTab === 'markt' && !isSignedIn && (
          <LockedPreview bereich="markt" onFreischalten={gastFreischalten} />
        )}
        {activeTab === 'markt' && isSignedIn && (
          <div className="relative">
            {/* Blur Overlay when locked */}
            {!hatVollzugang && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-2xl p-6">
                  <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border-2 border-slate-100">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#ff6b00] to-[#ff8c00] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
                    <Lock className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-black mb-2 text-[#001d3d] text-center">Premium Feature</h3>
                  <p className="text-slate-600 mb-5 text-sm leading-relaxed text-center">
                    Schalte Marktvergleich & Lageanalyse frei.
                  </p>
                    <>
                      <button
                        onClick={() => setShowUpgradeModal(true, 'overlay_markt')}
                        className="w-full px-5 py-3 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] hover:from-[#ff6b00]/90 hover:to-[#ff8c00]/90 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        <Crown size={18} />
                        Jetzt freischalten
                      </button>
                      <p className="text-xs text-slate-500 mt-3 text-center font-medium">
                        {freeUsagesRemaining > 0
                          ? `${freeUsagesRemaining} kostenlose Analyse${freeUsagesRemaining > 1 ? 'n' : ''} verfügbar`
                          : `Deine kostenlose Analyse ist aufgebraucht · Nur ${preis(PREIS_MONAT)} €/Monat`}
                      </p>
                    </>
                  </div>
              </div>
            )}

            {/* Content (blurred when locked) */}
            <div className={!hatVollzugang ? 'blur-md pointer-events-none select-none' : ''}>

            {loadingDetails ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8">
                <LoadingSpinner
                  messages={[
                    'Analysiere Lage und Umgebung...',
                    'Recherchiere Marktdaten...',
                    'Vergleiche Miet- und Kaufpreise...',
                    'Erstelle Investment-Bewertung...',
                    'Gleich fertig...'
                  ]}
                />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <MarketCompareCard
                    kind="miete"
                    own={flaeche > 0 ? miete / flaeche : 0}
                    delta={mietMarktDelta}
                    facts={marktFacts?.rent}
                    html={mietpreisComment}
                  />
                  <MarketCompareCard
                    kind="kauf"
                    own={flaeche > 0 ? kaufpreis / flaeche : 0}
                    delta={kaufMarktDelta}
                    facts={marktFacts?.price}
                    html={qmPreisComment}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className={marktFacts?.citations?.length ? 'lg:col-span-8' : 'lg:col-span-12'}>
                    <LocationCard html={lageComment} facts={marktFacts} />
                  </div>
                  {!!marktFacts?.citations?.length && (
                    <div className="lg:col-span-4">
                      <SourcesCard citations={marktFacts.citations} />
                    </div>
                  )}
                </div>

                <InvestRecommendation html={investComment} />
              </div>
            )}
<div className="mt-8 mb-16">
    <button
      onClick={() => (isSignedIn && hatVollzugang) ? setActiveTab('szenarien') : setShowUpgradeModal(true, 'weiter_szenarien')}
      className="btn-primary"
    >
      {(!isSignedIn || !hatVollzugang) && <Lock size={16} className="mr-2" />}
      Szenarien testen →
    </button>
  </div>
            </div>
          </div>
        )}

        {/* Tab 3 – Prognose (Gäste: gesperrte Platzhalter-Vorschau) */}
        {activeTab === 'prognose' && !isSignedIn && (
          <LockedPreview bereich="prognose" onFreischalten={gastFreischalten} />
        )}
        {activeTab === 'prognose' && isSignedIn && (
          <div className="relative">
            {/* Blur Overlay when locked */}
            {!hatVollzugang && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-2xl p-6">
                  <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border-2 border-slate-100">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#ff6b00] to-[#ff8c00] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
                    <Lock className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-black mb-2 text-[#001d3d] text-center">Premium Feature</h3>
                  <p className="text-slate-600 mb-5 text-sm leading-relaxed text-center">
                    Schalte Prognose & Entwicklung frei.
                  </p>
                    <>
                      <button
                        onClick={() => setShowUpgradeModal(true, 'overlay_prognose')}
                        className="w-full px-5 py-3 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] hover:from-[#ff6b00]/90 hover:to-[#ff8c00]/90 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        <Crown size={18} />
                        Jetzt freischalten
                      </button>
                      <p className="text-xs text-slate-500 mt-3 text-center font-medium">
                        {freeUsagesRemaining > 0
                          ? `${freeUsagesRemaining} kostenlose Analyse${freeUsagesRemaining > 1 ? 'n' : ''} verfügbar`
                          : `Deine kostenlose Analyse ist aufgebraucht · Nur ${preis(PREIS_MONAT)} €/Monat`}
                      </p>
                    </>
                  </div>
              </div>
            )}

            {/* Content (blurred when locked) */}
            <div className={!hatVollzugang ? 'blur-md pointer-events-none select-none' : ''}>
          <PrognoseTab
              jahre={prognose.jahre}
              ek={ek}
              kaufpreis={kaufpreis}
              anschaffungskosten={anschaffungskosten}
              darlehensSumme={darlehensSumme}
              steuersatzPct={effectiveStz}
              wertsteigerungPct={wertentwicklungPct}
              setWertsteigerungPct={setWertentwicklungPct}
              mietInflationPct={mietInflationPct}
              setMietInflationPct={setMietInflationPct}
              kostenInflationPct={kostenInflationPct}
              setKostenInflationPct={setKostenInflationPct}
              verkaufsNebenkostenPct={verkaufsNebenkostenPct}
              setVerkaufsNebenkostenPct={setVerkaufsNebenkostenPct}
              darlehensTyp={darlehensTyp}
              setDarlehensTyp={setDarlehensTyp}
              onWeiter={() => (isSignedIn && hatVollzugang) ? setActiveTab('szenarien') : setShowUpgradeModal(true, 'weiter_szenarien')}
            />
            </div>
          </div>
        )}

        {/* Tab 4 – Szenarien & Export */}
        {activeTab === 'szenarien' && (
          <div className="relative">
            {/* Blur Overlay when locked */}
            {(!isSignedIn || !hatVollzugang) && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-2xl p-6">
                <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border-2 border-slate-100">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#ff6b00] to-[#ff8c00] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
                    <Lock className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-black mb-2 text-[#001d3d] text-center">{!isSignedIn ? 'Kostenlos freischalten' : 'Premium Feature'}</h3>
                  <p className="text-slate-600 mb-5 text-sm leading-relaxed text-center">
                    {!isSignedIn
                      ? 'Melde dich an: Szenarien und der PDF-Report für die Bank sind in deiner kostenlosen Analyse enthalten.'
                      : 'Deine kostenlose Analyse ist aufgebraucht. Szenarien und den PDF-Report für weitere Wohnungen gibt es mit Premium.'}
                  </p>
                  {!isSignedIn ? (
                    <button onClick={() => gastFreischalten('prognose')} className="w-full px-5 py-3 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] hover:from-[#ff6b00]/90 hover:to-[#ff8c00]/90 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm">
                      <Lock size={18} />
                      Kostenlos anmelden
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowUpgradeModal(true, 'overlay_szenarien')}
                        className="w-full px-5 py-3 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] hover:from-[#ff6b00]/90 hover:to-[#ff8c00]/90 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        <Crown size={18} />
                        Jetzt freischalten
                      </button>
                      <p className="text-xs text-slate-500 mt-3 text-center font-medium">
                        Nur {preis(PREIS_MONAT)} €/Monat · Jederzeit kündbar
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Content (blurred when locked) */}
            <div className={(!isSignedIn || !hatVollzugang) ? 'blur-md pointer-events-none select-none' : ''}>
              <SzenarienTab
                basis={szenarioBasis}
                deltas={szenarioDeltas}
                setDeltas={setSzenarioDeltas}
                pdfBusy={pdfBusy}
                onPdfExport={exportPdf}
                onPdfCancel={cancelPdfExport}
                speichern={
                <SaveAnalysisButton
                  scenarioData={{
                    mieteDeltaPct,
                    preisDeltaPct,
                    zinsDeltaPp,
                    tilgungDeltaPp,
                    ekDeltaPct,
                    wertentwicklungAktiv: true,
                    wertentwicklungPct,
                    darlehensTyp,
                    mietInflationPct,
                    kostenInflationPct,
                    verkaufsNebenkostenPct,
                    scenarioKaufpreis: scenarioCalculations.scKaufpreis,
                    scenarioMiete: scenarioCalculations.scMiete,
                    scenarioZins: scenarioCalculations.scZins,
                    scenarioTilgung: scenarioCalculations.scTilgung,
                    scenarioEk: scenarioCalculations.scEk,
                    scenarioCashflowVorSteuer: scenarioCalculations.scCashflowVorSt,
                    scenarioCashflowNachSteuer: scenarioCalculations.scCashflowAfterTax,
                    scenarioNettorendite: scenarioCalculations.scNettoRendite,
                    scenarioBruttorendite: scenarioCalculations.scBruttoRendite,
                    // Speicherformat erwartet eine Zahl (Spalte NOT NULL DEFAULT 0)
                    scenarioEkRendite: scenarioCalculations.scEkRendite ?? 0,
                    scenarioNoiMonthly: scenarioCalculations.scNoiMonthly,
                    scenarioDscr: scenarioCalculations.scDSCR,
                    scenarioRateMonat: scenarioCalculations.scRateMonat,
                    scenarioAbzahlungsjahr: scenarioCalculations.scAbzahlungsjahr,
                  }}
                />
                }
              />
            </div>
          </div>
        )}

        {/* Abschluss der vollständigen Analyse: zweite Wohnung zum Vergleich prüfen (nicht Teil des PDF-Reports) */}
        {activeTab === 'szenarien' && isSignedIn && hatVollzugang && (
          <section data-pdf-exclude className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm print:hidden md:p-6">
            <h4 className="text-base font-black text-[#001d3d]">Vergleich sie mit einer zweiten Wohnung</h4>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Eine Wohnung allein sagt wenig. Prüf eine Alternative und sieh, welche sich besser trägt.
            </p>
            <div className="mt-5 flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
              <Link
                href="/input-method"
                onClick={() => trackEvent(AnalyticsEvents.COMPARE_CTA_CLICKED, { plan: isPremium ? 'premium' : 'free' })}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ff6b00] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-colors hover:bg-[#ff6b00]/90 md:w-auto md:px-6"
              >
                Zweite Wohnung prüfen
              </Link>
              {/* Gratis-Analyse ist verbraucht: offen sagen, dass die nächste Wohnung Premium braucht */}
              {premiumStatusLoaded && !isPremium && (
                <p className="text-center text-xs font-medium text-slate-500 md:text-left">Ab der 2. Wohnung mit Premium</p>
              )}
            </div>
          </section>
        )}
        </div>

        <Footer noPadding />
        </div>
      </div>
    );
  } else {
    content = <p>Seite existiert nicht</p>;
  }

  return (
    <div className="min-h-screen bg-white">
      <Header variant="fixed" />

      {step === 'tabs' && (
        <Suspense fallback={null}>
          <CheckoutRueckkehr onTab={setActiveTab} />
        </Suspense>
      )}

      {isSignedIn ? (
        // Angemeldet ohne Premium: Die Sperre greift erst, wenn die Gratis-Analyse für eine andere Wohnung verbraucht ist
        <SecondAnalysisPaywall
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          adresse={adresse}
          kaufpreis={kaufpreis}
          flaeche={flaeche}
          zimmer={zimmer}
          gratisAdresse={gratisFreigabe}
          quelle={upgradeTrigger}
          onGratisAnalyseGeladen={() => setActiveTab('kpi')}
        />
      ) : (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          remainingFreeUses={freeUsagesRemaining}
        />
      )}

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
        {showProgress && (
          <div className="mb-6 -mt-2 flex items-start justify-between gap-4">
            <p className="text-sm text-gray-500">
              Gib deine Immobiliendaten ein — wir berechnen Cashflow und Rendite sofort.
            </p>
            {/* Tour nur auf Wunsch, nie automatisch */}
            <TourLink step={step as 'a' | 'a2' | 'b' | 'c'} className="mt-0.5 shrink-0" />
          </div>
        )}
        {step === 'tabs' && mounted && kaufpreis === 0 && (
          <div className="mb-6 bg-orange-50 border border-orange-200 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#001d3d]">Du schaust auf ein leeres Ergebnis.</p>
              <p className="text-xs text-gray-500 mt-0.5">Starte eine eigene Analyse — kostenlos und in 60 Sekunden.</p>
            </div>
            <Link href="/input-method" className="bg-[#ff6b00] text-white px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap flex-shrink-0">
              Jetzt starten →
            </Link>
          </div>
        )}
        {content}
      </div>

      {step !== 'tabs' && <Footer />}
    </div>
  );
}
