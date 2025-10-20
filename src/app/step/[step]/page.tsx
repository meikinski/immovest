'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { InputField } from '@/components/InputField';
import { useImmoStore } from '@/store/useImmoStore';
import { berechneNebenkosten } from '@/lib/calculations';
import HtmlContent from '@/components/HtmlContent';
import {
 BedSingle, Bot, Calculator, Calendar, ChartBar,
  EuroIcon, House, Info, MapPin, ReceiptText, Ruler, SkipForward, SquarePercent, Wallet, WrenchIcon
} from 'lucide-react';
import { KpiCard } from '@/components/KpiCard';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { Tooltip } from '@/components/Tooltip';
import Slider  from '@/components/Slider';
import { ProgressIndicator } from '@/components/ProgressIndicator';



type Step = 'input-method' | 'a' | 'b' | 'c' | 'tabs';
const steps = ['a', 'b', 'c', 'tabs']; // result/details ersetzt durch tabs

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


  // Hydration guard
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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

  const [objekttyp, setObjekttyp] = useState<'wohnung' | 'haus'>('wohnung');

  const grEStPct    = useImmoStore(s => s.grunderwerbsteuer_pct);
  const grunderwerbsteuer_pct   = useImmoStore(s => s.grunderwerbsteuer_pct);
  const setGrunderwerbsteuerPct = useImmoStore(s => s.setGrunderwerbsteuerPct);

  const notarPct    = useImmoStore(s => s.notar_pct);
  const setNotarPct = useImmoStore(s => s.setNotarPct);

  const maklerPct   = useImmoStore(s => s.makler_pct);
  const setMaklerPct = useImmoStore(s => s.setMaklerPct);

  // Step B: Werte + Setter
  const miete       = useImmoStore(s => s.miete);
  const setMiete    = useImmoStore(s => s.setMiete);

  const hausgeld    = useImmoStore(s => s.hausgeld);
  const setHausgeld = useImmoStore(s => s.setHausgeld);

  const hausgeld_umlegbar     = useImmoStore(s => s.hausgeld_umlegbar);
  const setHausgeldUmlegbar = useImmoStore(s => s.setHausgeldUmlegbar);

  const instandhaltungskostenProQm = useImmoStore(s => s.instandhaltungskosten_pro_qm);
  const setInstandhaltungskostenProQm = useImmoStore(s => s.setInstandhaltungskostenProQm);

  const setMietausfallPct = useImmoStore(s => s.setMietausfallPct);
  const setPersoenlicherSteuersatz = useImmoStore(s => s.setPersoenlicherSteuersatz);

  const afaStore    = useImmoStore(s => s.afa);
  const setAfa      = useImmoStore(s => s.setAfa);
  const setSteuer   = useImmoStore(s => s.setSteuer);

  // Step C: Werte + Setter
  const ek          = useImmoStore(s => s.ek);
  const setEk       = useImmoStore(s => s.setEk);

  const zins        = useImmoStore(s => s.zins);
  const setZins     = useImmoStore(s => s.setZins);

  const tilgung     = useImmoStore(s => s.tilgung);
  const setTilgung  = useImmoStore(s => s.setTilgung);

  // === Tabs (neu) ===
  const [activeTab, setActiveTab] = useState<'kpi' | 'markt' | 'szenarien'>('kpi');
  const [tilgungDeltaPp, setTilgungDeltaPp] = useState<number>(0);
const [ekDeltaPct, setEkDeltaPct] = useState<number>(0);


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
  const [flaecheText, setFlaecheText] = useState(
    flaeche.toString().replace('.', ',')
  );
  useEffect(() => {
    setFlaecheText(flaeche.toString().replace('.', ','));
  }, [flaeche]);

  // === Derived Values (einheitlich, keine Duplikate) ===
  const warmmiete = miete + hausgeld_umlegbar;

  const {
    grunderwerbsteuer_eur,
    notar_eur,
    makler_eur,
    nk
  } = berechneNebenkosten(kaufpreis, grEStPct, notarPct, maklerPct);

  const anschaffungskosten = kaufpreis + nk;
  const darlehensSumme     = kaufpreis + nk - ek;

  const jahreskaltmiete     = miete * 12;
  const bewirtschaftungskostenJ =
    (hausgeld - hausgeld_umlegbar) * 12 + instandhaltungskostenProQm * flaeche;
  const fkZinsenJahr        = darlehensSumme * (zins / 100);

  // --- Steuer-Berechnung (monatlich) ---
  // Local text states & defaults for Step B (UI-Eingaben in %/€)
  const [mietausfallText, setMietausfallText] = useState('1,00');
  const [instandText,     setInstandText]     = useState('10,00');
  const [persText,        setPersText]        = useState('42,00');
  const [afaText,         setAfaText]         = useState((afaStore ?? 2).toString().replace('.', ','));
  const [gebText,         setGebText]         = useState('75');
  const [hausUmlegText,   setHausUmlegText]   = useState(() => hausgeld_umlegbar.toString());
  const [hausNichtText,   setHausNichtText]   = useState(() => (hausgeld - hausgeld_umlegbar).toString());

  // Zinssatz/Tilgung (Textfelder) für Step C
  const [zinsText,    setZinsText]    = useState((zins ?? 3.5).toString().replace('.', ','));
  const [tilgungText, setTilgungText] = useState((tilgung ?? 2.0).toString().replace('.', ','));

  // Szenarien – zusätzliche Regler
  const [mieteDeltaPct, setMieteDeltaPct]   = useState<number>(0);
  const [preisDeltaPct, setPreisDeltaPct]   = useState<number>(0);
  const [zinsDeltaPp,   setZinsDeltaPp]     = useState<number>(0);
  

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

  // 7) zu versteuernder Cashflow
  const taxableCashflow =
    warmmiete - hausgeldTotal - kalkKostenMonthly - zinsMonthly - afaMonthlyEur;

  // 8) Steuer (monatlich) – kann negativ sein (= Steuervorteil)
  const taxMonthly = taxableCashflow * (effectiveStz / 100);

  // 9) finaler Cashflow nach Steuern
  const cashflowAfterTax = cashflowVorSteuer - taxMonthly;

  const breakEvenJahre = cashflowAfterTax > 0 ? ek / (cashflowAfterTax * 12) : Infinity;

  // Store-Ableitungen aktualisieren, wenn sich Kernwerte ändern
  useEffect(() => {
    updateDerived();
  }, [cashflowVorSteuer, taxMonthly, updateDerived]);

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

  // Bei Wechsel in die Tabs einmalig Derived erzwingen (ersetzt "result")
  useEffect(() => {
    if (step === 'tabs') updateDerived();
  }, [step, updateDerived]);

  // === KI-Kurzkommentar (Tab 1) ===
  const [comment, setComment] = useState<string>('');
  const [isLoadingComment, setIsLoadingComment] = useState<boolean>(false);
  const commentFetched = useRef(false);

  useEffect(() => {
    if (step !== 'tabs') return;
    if (activeTab !== 'kpi') return;
    if (commentFetched.current) return;

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
        setComment(json.comment || '');
        commentFetched.current = true;
      })
      .catch(() => setComment('Leider konnte die KI-Einschätzung nicht geladen werden.'))
      .finally(() => setIsLoadingComment(false));
  }, [step, activeTab, score,
  cashflowVorSteuer, cashflowAfterTax, bruttoMietrendite, nettoMietrendite, ek, anschaffungskosten,
  adresse, flaeche, zimmer, baujahr, miete, hausgeld, hausgeld_umlegbar, zins, tilgung, kaufpreis,darlehensSumme, hausgeldTotal, kalkKostenMonthly, warmmiete, objekttyp]);

  // Bei relevanten Änderungen erneutes Laden des Kurzkommentars erlauben
useEffect(() => {
  if (step === 'tabs' && activeTab === 'kpi') {
    commentFetched.current = false;
  }
}, [
  step, activeTab,
  cashflowVorSteuer, nettorendite, ek, anschaffungskosten,
  adresse, flaeche, zimmer, baujahr, miete, hausgeld, hausgeld_umlegbar, zins, tilgung, kaufpreis
]);

  // === Markt & Lage (Tab 2) – Datencontainer/States ===
  const [lageComment, setLageComment]           = useState<string>('');
  const [mietpreisComment, setMietpreisComment] = useState<string>('');
  const [qmPreisComment, setQmPreisComment]     = useState<string>('');
  const [lageTrendComment, setLageTrendComment] = useState<string>('');
  const [investComment, setInvestComment]       = useState<string>('');
  const [loadingDetails, setLoadingDetails]     = useState<boolean>(false);

  useEffect(() => {
  if (!(step === 'tabs' && activeTab === 'markt')) return;

  setLoadingDetails(true);

  (async () => {
    try {
      // das UI kennt alle Felder bereits – wir schicken sie an den Agent-Endpoint
      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: adresse,
          adressse: adresse, // (Tippfehler abgefangen, falls woanders genutzt)
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
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json() as {
        facts: unknown;
        lage?: { html?: string };
        miete?: { html?: string };
        kauf?: { html?: string };
        invest?: { html?: string };
      };

      // Fallbacks „–“ vermeiden: leer -> kurzer Hinweis
      setLageComment(data.lage?.html?.trim() || '<p>Für diese Adresse liegen aktuell zu wenige Lagehinweise vor.</p>');
      setMietpreisComment(data.miete?.html?.trim() || '<p>Für diese Adresse liegen aktuell zu wenige belastbare Mietdaten vor.</p>');
      setQmPreisComment(data.kauf?.html?.trim() || '<p>Für diese Adresse liegen aktuell zu wenige belastbare Kaufpreisdaten vor.</p>');
      setInvestComment(data.invest?.html?.trim() || '<p>Investitionsanalyse derzeit nicht verfügbar.</p>');

      // Optional: Trend könntest du aus data.facts ableiten und setzen
      setLageTrendComment('');
    } catch (e) {
      console.error('Markt/Agent laden fehlgeschlagen', e);
      setLageComment('<p>Leider kein Ergebnis vom Agenten.</p>');
      setMietpreisComment('<p>Leider kein Ergebnis vom Agenten.</p>');
      setQmPreisComment('<p>Leider kein Ergebnis vom Agenten.</p>');
      setInvestComment('<p>Leider kein Ergebnis vom Agenten.</p>');
    } finally {
      setLoadingDetails(false);
    }
  })();
}, [
  step, activeTab,
  adresse, objekttyp,
  kaufpreis, flaeche, zimmer, baujahr,
  miete, hausgeld, hausgeld_umlegbar,
  ek, zins, tilgung
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
const exportPdf = React.useCallback(async () => {
  setPdfBusy(true);
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
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('PDF-Export fehlgeschlagen');

    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'immo_analyse.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('PDF export failed', err);
  } finally {
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

  let content: React.ReactNode;

  if (step === 'a') {
    content = (
      <>
        {/* Header */}
        <div className="flex items-center mb-4">
          <button
            onClick={() => router.back()}
            className="btn-back"
          >
            ←
          </button>
          <div className="ml-4">
            <h1 className="text-3xl font-bold flex items-center gap-2">
               Objektdaten <House className="icon icon-primary" />
            </h1>
            <p className="text-gray-600 mt-1">
              Gib die grundlegenden Informationen zu deinem Objekt ein.
            </p>
          </div>
        </div>

        {/* Kaufpreis */}
        <div className="card">
          <div className="mb-2 text-lg font-semibold flex items-center">
            <span>Kaufpreis</span>
            <span className="ml-2"><EuroIcon /></span>
          </div>
          <InputField
            className="input-uniform input-editable"
            label=""
            type="text"
            value={
              mounted
                ? kaufpreis.toLocaleString('de-DE')
                : kaufpreis.toString()
            }
            onValueChange={v =>
              setKaufpreis(
                Number(
                  v.replace(/\./g, '').replace(',', '.')
                )
              )
            }
            unit=" €"
          />
        </div>

        {/* Kaufnebenkosten */}
        <div className="card bg-white p-4 rounded-2xl shadow-md">
          <div className="mb-2 text-lg font-semibold flex items-center">
            <span>Kaufnebenkosten</span>
            <span className="ml-2"><ReceiptText /></span>
          </div>

          {[
            {
              label: 'Grunderwerbsteuer',
              text: grunderwerbText,
              setText: setGrunderwerbText,
              setter: setGrunderwerbsteuerPct,
              amount: grunderwerbsteuer_eur,
            },
            {
              label: 'Notar & Grundbuch',
              text: notarText,
              setText: setNotarText,
              setter: setNotarPct,
              amount: notar_eur,
            },
            {
              label: 'Maklergebühr',
              text: maklerText,
              setText: setMaklerText,
              setter: setMaklerPct,
              amount: makler_eur,
            },
          ].map((item, i) => (
            <div key={i} className="grid grid-cols-2 gap-4 mb-4 items-end">
              {/* Prozent-Feld */}
              <div className="flex flex-col">
                <label className="block text-xs text-gray-600 mb-1">{item.label}</label>
                <div
                  onBlur={() => {
                    const num = Number(item.text.replace(',', '.'));
                    item.setter(isNaN(num) ? 0 : num);
                  }}
                >
                  <InputField
                    value={item.text}
                    onValueChange={item.setText}
                    unit=" %"
                    className="w-full input-uniform input-editable"
                  />
                </div>
              </div>

              {/* Betrag-Feld */}
              <div className="flex flex-col">
                <label className="block text-xs text-gray-600 mb-1">Betrag</label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={
                      mounted
                        ? item.amount.toLocaleString('de-DE')
                        : item.amount.toString()
                    }
                    className="w-full input-uniform input-computed pr-8 rounded"
                  />
                  <span className="absolute inset-y-0 right-3 flex items-center text-gray-600 pointer-events-none">
                    €
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Total-Zeile */}
          <div className="mt-6">
   <label className="block text-xs text-gray-600 mb-1">Gesamtinvestition</label>
   <div className="relative">
     <input
       type="text"
       readOnly
       value={mounted ? anschaffungskosten.toLocaleString('de-DE') : anschaffungskosten.toString()}
       className="w-full input-total pr-8"
     />
     <span className="absolute inset-y-0 right-3 flex items-center text-gray-600 pointer-events-none">€</span>
   </div>
 </div>
        </div>

        {/* Objekttyp */}
        <div className="card">
  <div className="mb-2 text-lg font-semibold flex items-center">
    <span>Objekttyp</span>
    <span className="ml-2"><House /></span>
  </div>
  <div className="relative">
    <select
      className="w-full select-underline pr-8 appearance-none"
      value={objekttyp}
      onChange={(e) => setObjekttyp(e.target.value as 'wohnung' | 'haus')}
    >
      <option value="wohnung">Eigentumswohnung</option>
      <option value="haus">Haus</option>
    </select>
    <span className="absolute right-4 top-1/2 -translate-y-1/2">▼</span>
  </div>
</div>

        {/* Adresse */}
        <div className="card">
          <div className="mb-2 text-lg font-semibold flex items-center">
            <span>Adresse</span>
            <span className="ml-2"><MapPin /></span>
          </div>
          <AddressAutocomplete
            value={adresse}
            onChange={(val: string) => setAdresse(val)}
          />
        </div>

        {/* Zimmer & Fläche */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <div className='card'>
              <div className="mb-2 text-lg font-semibold flex items-center">
                <span>Zimmer</span><span className="ml-2"><BedSingle /></span>
              </div>
              <InputField
                label=""
                type="text"
                value={zimmer.toString()}
                onValueChange={v => setZimmer(Number(v))}
                className="input-uniform input-editable"
              />
            </div>
          </div>
          <div>
            <div className='card'>
              <div className="mb-2 text-lg font-semibold flex items-center">
                <span>Fläche</span><span className="ml-2"><Ruler /></span>
              </div>
              <div
                onBlur={() => {
                  const num = Number(
                    flaecheText.replace(/\./g, '').replace(',', '.')
                  );
                  setFlaeche(isNaN(num) ? 0 : num);
                }}
              >
                <InputField
                  label=""
                  type="text"
                  value={mounted ? flaecheText : flaecheText}
                  onValueChange={setFlaecheText}
                  unit="m²"
                  className="input-uniform input-editable"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Baujahr */}
        <div className='card'>
          <div className="mb-2 text-lg font-semibold flex items-center">
            <span>Baujahr</span>
            <span className="ml-2"><Calendar /></span>
          </div>
          <InputField
            className="input-editable input-uniform"
            label=""
            type="text"
            value={baujahr.toString()}
            onValueChange={v => setBaujahr(Number(v))}
          />
        </div>

        {/* Weiter Button */}
        <button
          onClick={() => router.push(`/step/${nextStep}`)}
          className="w-full btn-primary flex justify-center space-x-2"
        >
          Weiter <SkipForward className='ml-2' />
        </button>
      </>
    );

  } else if (step === 'b') {
    content = (
      <>
        {/* Header */}
        <div className="flex items-center mb-4">
          <button onClick={() => router.back()} className="btn-back rounded-full p-2">←</button>
          <div className="ml-4">
            <h1 className="text-3xl font-bold flex items-center gap-2">Einnahmen & Kosten <Wallet className="icon icon-primary" /></h1>
            <p className="text-gray-600 mt-1">Gib die monatlichen Einnahmen und Ausgaben für dein Objekt an.</p>
          </div>
        </div>

        {/* Mieteinnahmen */}
        <div className="card bg-white p-4 rounded-2xl shadow-md">
          <div className="mb-2 text-lg font-semibold flex items-center">
            <span>Mieteinnahmen</span>
            <span className="ml-2"><Wallet /></span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Kaltmiete gesamt */}
            <div className="flex flex-col">
              <label className="text-xs text-gray-600 mb-1 flex items-center">
                Kaltmiete gesamt
                <Tooltip text="Die monatliche Nettokaltmiete ohne Nebenkosten.">
                  <Info className="w-4 h-4 text-gray-400 cursor-pointer ml-1 hover:text-gray-600" />
                </Tooltip>
              </label>
              <InputField
                value={miete.toString()}
                onValueChange={v => setMiete(
                  Number(v.replace(/\./g, '').replace(',', '.'))
                )}
                unit="€"
                className="input-uniform input-editable pr-8"
              />
            </div>

            {/* Kaltmiete pro qm */}
            <div className="flex flex-col">
              <label className="text-xs text-gray-600 mb-1">Kaltmiete pro qm</label>
              <div className="relative w-full">
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
                  className="input-computed input-uniform w-full pr-8 rounded-2xl"
                />
                <span className="absolute inset-y-0 right-3 flex items-center text-gray-600 pointer-events-none">
                  €
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mietnebenkosten */}
        <div className='card'>
          <div className="mb-2 text-lg font-semibold flex items-center">Mietnebenkosten&nbsp;<span><ChartBar /></span></div>
          <div className="grid grid-cols-2 gap-4">
            {/* Umlagefähig */}
            <div
              onBlur={() => {
                const um = Number(hausUmlegText.replace(/\./g, '').replace(',', '.'));
                const non = Number(hausNichtText.replace(/\./g, '').replace(',', '.'));
                setHausgeldUmlegbar(isNaN(um) ? 0 : um);
                setHausgeld(isNaN(um) ? non : um + non);
              }}
              className="flex flex-col"
            >
              <label className="text-xs text-gray-600 mb-1">Hausgeld umlagefähig</label>
              <InputField
                value={hausUmlegText}
                onValueChange={setHausUmlegText}
                unit="€"
                className="input-uniform input-editable"
              />
            </div>
            {/* Nicht umlagefähig */}
            <div
              onBlur={() => {
                const um = Number(hausUmlegText.replace(/\./g, '').replace(',', '.'));
                const non = Number(hausNichtText.replace(/\./g, '').replace(',', '.'));
                setHausgeldUmlegbar(isNaN(um) ? 0 : um);
                setHausgeld(isNaN(non) ? um : um + non);
              }}
              className="flex flex-col"
            >
              <label className="text-xs text-gray-600 mb-1">Hausgeld nicht umlagefähig</label>
              <InputField
                value={hausNichtText}
                onValueChange={setHausNichtText}
                unit="€"
                className="input-uniform input-editable"
              />
            </div>
          </div>
        </div>

        {/* Kalkulatorische Kosten */}
        <div className='card'>
          <div className="mb-2 text-lg font-semibold flex items-center">Kalkulatorische Kosten&nbsp;<span><WrenchIcon /></span></div>
          <div className="grid grid-cols-2 gap-4">
            {/* Mietausfall */}
            <div onBlur={() => setMietausfallPct(Number(mietausfallText.replace(',', '.')) || 0)} className="flex flex-col">
              <label className="text-xs text-gray-600 mb-1 flex items-center">
                Kalk. Mietausfall
                <Tooltip text="Puffer für Leerstand/Verzug. 1–3 % der Jahresmiete sind typisch.">
                  <Info className="w-4 h-4 text-gray-400 cursor-pointer ml-1 hover:text-gray-600" />
                </Tooltip>
              </label>
              <InputField
                value={mietausfallText}
                onValueChange={setMietausfallText}
                unit="%"
                className="input-uniform input-editable"
              />
            </div>
            {/* Instandhaltung */}
            <div onBlur={() => setInstandhaltungskostenProQm(Number(instandText.replace(',', '.')) || 0)} className="flex flex-col">
              <label className="text-xs text-gray-600 mb-1 flex items-center">
                Instandhaltungskosten /qm
                <Tooltip text="Ø Aufwand für Reparaturen/Wartung je m²/Jahr. 5–15 € üblich, 10 € als Startwert.">
                  <Info className="w-4 h-4 text-gray-400 cursor-pointer ml-1 hover:text-gray-600" />
                </Tooltip>
              </label>
              <InputField
                value={instandText}
                onValueChange={setInstandText}
                unit="€"
                className="input-uniform input-editable"
              />
            </div>
          </div>
        </div>

        {/* Steuern (optional) */}
        <div className='card'>
          <div className="mb-2 text-lg font-semibold flex items-center">
            Steuern&nbsp;<span><SquarePercent /></span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* AfA Satz */}
            <div onBlur={() => setAfa(Number(afaText.replace(',', '.')))} className="flex flex-col">
              <label className="text-xs text-gray-600 mb-1 flex items-center">
                AfA Satz (% p.a.)
                <Tooltip text="Lineare Abschreibung für Wohnimmobilien. 2 % p.a. sind Standard.">
                  <Info className="w-4 h-4 text-gray-400 cursor-pointer ml-1 hover:text-gray-600" />
                </Tooltip>
              </label>
              <InputField
                value={afaText}
                onValueChange={setAfaText}
                unit="%"
                className="input-uniform input-editable"
              />
            </div>

            {/* Anteil Gebäude */}
            <div onBlur={() => setSteuer(Number(gebText.replace(',', '.')))} className="flex flex-col">
              <label className="text-xs text-gray-600 mb-1 flex items-center">
                Anteil Gebäude am Kaufpreis (%)
                <Tooltip text="Typisch 70–80 % Gebäudeanteil, z. B. 75 %.">
                  <Info className="w-4 h-4 text-gray-400 cursor-pointer ml-1 hover:text-gray-600" />
                </Tooltip>
              </label>
              <InputField
                value={gebText}
                onValueChange={setGebText}
                unit="%"
                className="input-uniform input-editable"
              />
            </div>

            {/* Persönlicher Steuersatz */}
            <div onBlur={() => setPersoenlicherSteuersatz(Number(persText.replace(',', '.')))} className="flex flex-col col-span-2">
              <label className="text-xs text-gray-600 mb-1 flex items-center">
                Pers. Steuersatz (%)
                <Tooltip text="Grenzsteuersatz auf Einkünfte; oft 30–45 %.">
                  <Info className="w-4 h-4 text-gray-400 cursor-pointer ml-1 hover:text-gray-600" />
                </Tooltip>
              </label>
              <InputField
                value={persText}
                onValueChange={setPersText}
                unit="%"
                className="input-uniform input-editable"
              />
            </div>
          </div>
        </div>

        {/* Weiter Button */}
        <button
          onClick={() => router.push(`/step/${nextStep}`)}
          className="w-full btn-primary flex items-center justify-center space-x-2"
        >
          Weiter <SkipForward className='ml-2' />
        </button>
      </>
    );
  } else if (step === 'c') {
    content = (
      <>
        {/* Header */}
        <div className="flex items-center mb-4">
          <button onClick={() => router.back()} className="btn-back">
            ←
          </button>
          <div className="ml-4">
            <h1 className="text-3xl font-bold flex items-center gap-2">Finanzierung <Calculator className="icon icon-primary" /></h1>
            <p className="text-gray-600 mt-1">
              Gib die Details zur Finanzierung deiner Immobilie an.
            </p>
          </div>
        </div>

        {/* Finanzierungskarte */}
        <div className='card'>
          {/* Eigenkapital */}
          <div className="flex flex-col mb-4">
            <label className="text-xs text-gray-600 mb-1">Eigenkapital</label>
            <div className="relative">
              <input
                type="text"
                value={mounted ? ek.toLocaleString('de-DE') : + ' 0'} 
                onChange={e => setEk(
                  Number(
                    e.target.value
                    .replace(/\./g, '')
                    .replace(',', '.')
                  ) || 0
                )}
                className="w-full input-uniform input-editable"
              />
              <span className="absolute inset-y-0 right-3 flex items-center text-gray-600">€</span>
            </div>
          </div>

          {/* Eigenkapitalquote */}
          <div className="flex flex-col mb-4">
            <label className="text-xs text-gray-600 mb-1">Eigenkapitalquote</label>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={
                  mounted && anschaffungskosten > 0
                    ? ((ek / anschaffungskosten) * 100).toFixed(2)
                    : '0,0'
                }
                className="w-full input-uniform input-computed"
              />
              <span className="absolute inset-y-0 right-3 flex items-center text-gray-600">%</span>
            </div>
          </div>

          {/* Darlehenssumme */}
          <div className="flex flex-col mb-4">
            <label className="text-xs text-gray-600 mb-1">Darlehenssumme</label>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={
                  mounted
                    ? darlehensSumme.toLocaleString('de-DE') 
                    : '0'
                }
                className="w-full input-uniform input-editable"
              />
              <span className="absolute inset-y-0 right-3 flex items-center text-gray-600">€</span>
            </div>
          </div>

          {/* Zinssatz */}
          <div className="flex flex-col mb-4">
            <label className="text-xs text-gray-600 mb-1">Zinssatz</label>
            <div className="relative" onBlur={() => {
              const num = Number(zinsText.replace(',', '.'));
              setZins(isNaN(num) ? 0 : num);
            }}>
              <InputField
                value={zinsText}
                onValueChange={setZinsText}
                unit="%"
                className="input-uniform input-editable"
              />
              <span className="absolute inset-y-0 right-3 flex items-center text-gray-600">%</span>
            </div>
          </div>

          {/* Tilgung */}
          <div className="flex flex-col mb-4">
            <label className="text-xs text-gray-600 mb-1">Tilgung</label>
            <div className="relative" onBlur={() => {
              const num = Number(tilgungText.replace(',', '.'));
              setTilgung(isNaN(num) ? 0 : num);
            }}>
              <InputField
                value={tilgungText}
                onValueChange={setTilgungText}
                unit="%"
                className="input-uniform input-editable"
              />
              <span className="absolute inset-y-0 right-3 flex items-center text-gray-600">%</span>
            </div>
          </div>

          {/* Monatliche Rate */}
          <div className="mt-4">
            <label className="text-xs text-gray-600 mb-1 block">Monatliche Rate</label>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={
                  mounted
                    ? (
                        darlehensSumme *
                        ((zins + tilgung) / 100) /
                        12
                      ).toLocaleString('de-DE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      }) + ' €/Monat'
                    : ''
                }
                className="w-full input-total text-center"
              />
            </div>
          </div>
        </div>

        {/* Berechnen-Button */}
        <button
          onClick={() => router.push(`/step/${nextStep}`)}
          className="w-full w-full btn-primary flex items-center justify-center space-x-2"
        >
          Berechnen
          <Calculator className='ml-2' />
        </button>
      </>
    );
  } else if (step === 'tabs') {
    content = (
      <>
        {/* Header */}
        <div className="flex items-center mb-4">
  <button onClick={() => router.back()} className="btn-back">←</button>
  <div className="ml-4">
    <h1 className="text-3xl font-bold">Analyse 📊</h1>
  </div>
</div>


        {/* Eckdaten-Zeile */}
        {/* Eckdaten */}
<div className="card mb-6">
  <h2 className="text-sm font-semibold text-gray-800 mb-3">Eckdaten</h2>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm text-gray-700">
<div>
      <span className="icon-badge"><MapPin size={16} /></span>{' '}
      {shortAddress ? (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adresse.replace(/,\s*(Deutschland|Germany|Bundesrepublik Deutschland|DE)$/i, ''))}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-[var(--color-primary)]"
        >
          {shortAddress}
        </a>
      ) : '–'}
    </div>    <div><span className="font-medium"></span> <span className="text-gray-700 font-medium text-sm"></span></div>
    <div><span className="icon-badge mr-2"><EuroIcon size={16} /></span><span className="font-medium">Kaufpreis:</span>  <span className="text-gray-700 font-medium text-sm">{kaufpreis ? `${kaufpreis.toLocaleString('de-DE')} €` : '–'}</span></div>
    <div><span className="icon-badge mr-2"><Ruler size={16} /></span><span className="font-medium">Fläche:</span><span className="text-gray-700 font-medium text-sm">{flaeche ? `${flaeche.toLocaleString('de-DE')} m²` : '–'}</span></div>
    <div><span className="icon-badge mr-2"><Wallet size={16} /></span><span className="font-medium">Gesamtinvestition:</span><span className="text-gray-700 font-medium text-sm">{anschaffungskosten ? `${anschaffungskosten.toLocaleString('de-DE')} €` : '–'}</span></div>
    <div><span className="icon-badge mr-2"><BedSingle size={16} /></span><span className="font-medium">Zimmer:</span> <span className="text-gray-700 font-medium text-sm">{zimmer || '–'}</span></div>
  </div>
</div>

{/* Tabs */}
<div className="mt-6 mb-5 flex flex-wrap gap-2">
  {([
    { key: 'kpi', label: 'KPIs' },
    { key: 'markt', label: 'Marktvergleich & Lage' },
    { key: 'szenarien', label: 'Szenarien & Export' },
  ] as const).map(t => {
    const active = activeTab === t.key;
    return (
      <button
        key={t.key}
        onClick={() => setActiveTab(t.key)}
        className={[
          'px-4 py-2 rounded-full border text-base transition',
          active
            ? 'font-semibold bg-[hsl(var(--brand))] border-[hsl(var(--brand))] text-white'
            : 'bg-white border-[hsl(var(--accent))] text-gray-700 hover:border-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))] hover:text-white'
        ].join(' ')}
        aria-current={active ? 'page' : undefined}
      >
        {t.label}
      </button>
    );
  })}
</div>



        {/* Tab 1 – KPI-Übersicht (Free) */}
        {activeTab === 'kpi' && (
          <>
            {/* KPI-Karten (Tooltips = Erklärung, keine Pfeile/Icons) */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
  <KpiCard
    title="Cashflow (vor Steuern)"
    value={`${cashflowVorSteuer.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €`}
    // kein trend-Prop mehr → kein Pfeil
    help="Monatlicher Überschuss vor Steuern. Positiv = laufend tragfähig, negativ = Liquiditätslücke."
  />
  <KpiCard
    title="Cashflow (nach Steuern)"
    value={`${cashflowAfterTax.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €`}
    help="Monatlicher Überschuss nach Steuern (vereinfacht). Hilft, die tatsächliche Belastung zu verstehen."
  />
  <KpiCard
    title="Nettomietrendite"
    value={`${nettoMietrendite.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`}
    help="Ertragsrendite nach Bewirtschaftungskosten. < 2% eher schwach, 2–3% solide, > 3% attraktiv (je nach Lage/Objekt)."
  />
  <KpiCard
    title="Bruttomietrendite"
    value={`${bruttoMietrendite.toFixed(1)} %`}
    help="Einfache Rendite ohne Kostenabzüge. Gut zur groben Einordnung, aber optimistischer als netto."
  />
  <KpiCard
    title="EK-Quote"
    value={`${anschaffungskosten > 0 ? ((ek / anschaffungskosten) * 100).toFixed(1) : '0.0'} %`}
    help="Anteil Eigenkapital an der Gesamtinvestition. Höhere Quote = geringerer Zinsdruck, aber gebundenes Kapital."
  />
  <KpiCard
    title="EK-Rendite"
    value={`${ekRendite.toFixed(1)} %`}
    help="Rendite auf dein eingesetztes Eigenkapital. Wichtige Größe für den Kapitalhebel."
  />
  <KpiCard title="Break-Even-Jahr" value={isFinite(breakEvenJahre) ? String(new Date().getFullYear() + Math.round(breakEvenJahre)) : '–'} help="Jahr, in dem der aufsummierte Cashflow ab Start den eingesetzten Betrag (vereinfacht) ausgleicht. Näherungswert." />
  <KpiCard title="Abzahlungsjahr (≈)" value={String(new Date().getFullYear() + Math.round(1 / ((zins + tilgung) / 100)))} help="Näherung: 1/(Zins+Tilgung). Unterstellt konstante Rate ohne Sondertilgungen."/>
<KpiCard
  title="DSCR"
  value={`${dscr.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
  help="Schuldendienstdeckungsgrad: Verhältnis von Nettoeinnahmen zu Kreditrate. Werte > 1,2 gelten als solide, < 1,0 kritisch."
/>
</div>

{/* KI-Kurzkommentar (deutlich beratender Ton) */}
<div className="card-gradient">
  <div className="flex items-center mb-2">
    <span className="font-bold">KI-Einschätzung</span>
    <Bot className="ml-2" />
  </div>
  {isLoadingComment ? (
    <p className="text-gray-500">Lade Einschätzung…</p>
  ) : (
    <HtmlContent className="text-gray-700" html={comment || '<p>–</p>'} />
  )}
  
</div>
<div className="mt-3">
    <button
      onClick={() => setActiveTab('markt')}
      className="btn-secondary"
    >
      Weiter zu Marktvergleich & Lage →
    </button>
  </div>

          </>
        )}

        {/* Tab 2 – Marktvergleich & Lage */}
        {activeTab === 'markt' && (
          <>
            <div className="card-gradient">
              <div className="flex items-center space-x-2">
                <span className="text-medium font-bold">Lagebewertung</span>
                <Bot />
              </div>
              {loadingDetails ? (
                <p className="text-gray-600">Lade Lagebewertung…</p>
              ) : (
                <HtmlContent className="text-gray-600" html={lageComment || '<p>–</p>'} />
              )}
            </div>

            <div className="card-gradient">
              <div className="flex items-center space-x-2">
                <span className="text-medium font-bold">Mietpreisvergleich</span>
                <Bot />
              </div>
              {loadingDetails ? (
                <p className="text-gray-600">Lade Mietpreisvergleich…</p>
              ) : (
                <HtmlContent className="text-gray-600" html={mietpreisComment || '<p>–</p>'} />
              )}
            </div>

            <div className="card-gradient">
              <div className="flex items-center space-x-2">
                <span className="text-medium font-bold">Kaufpreis/m² Vergleich</span>
                <Bot />
              </div>
              {loadingDetails ? (
                <p className="text-gray-600">Lade Vergleich…</p>
              ) : (
                <HtmlContent className="text-gray-600" html={qmPreisComment || '<p>–</p>'} />
              )}
            </div>


            {Boolean(lageTrendComment) && (
              <div className="card-gradient">
                <div className="flex items-center space-x-2">
                  <span className="text-medium font-bold">Lageentwicklungstrend</span>
                  <Bot />
                </div>
                <HtmlContent className="text-gray-600" html={lageTrendComment} />
              </div>
            )}

            


            {/* Investitionsanalyse */}
<div className="card-gradient">
  <div className="flex items-center space-x-2">
    <span className="text-medium font-bold">Investitionsanalyse</span>
    <Bot />
  </div>
  {loadingDetails ? (
    <p className="text-gray-600">Lade Investitionsanalyse…</p>
  ) : (
    <HtmlContent className="text-gray-600" html={investComment || '<p>–</p>'} />
  )}
  
</div>
<div className="mt-3">
    <button
      onClick={() => setActiveTab('szenarien')}
      className="btn-secondary"
    >
      Szenarien testen →
    </button>
  </div>



          </>
        )}

        {/* Tab 3 – Szenarien & Export */}
        {activeTab === 'szenarien' && (
  <>
    {/* Kein H2, Tab-Button dient als Titel */}
<p className="text-gray-600 mt-1 pb-6">
  Wähle die Parameter und nutze den Regler, um das Szenario anzupassen. Über „Ergebnis speichern“ kannst du die Berechnung ablegen.
</p>

    {/* kompakte Regler, Label & Wert in einer Zeile */}
    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="p-4 rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Kaltmiete</span>
        </div>
        <Slider value={mieteDeltaPct} onChange={setMieteDeltaPct} min={-30} max={30} step={0.5} suffix="%" label=""/>
      </div>
      <div className="p-4 rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Kaufpreis</span>
        </div>
        <Slider label="" value={preisDeltaPct} onChange={setPreisDeltaPct} min={-30} max={30} step={0.5} suffix="%" />
      </div>
      <div className="p-4 rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Zins</span>
        </div>
        <Slider label="" value={zinsDeltaPp} onChange={setZinsDeltaPp} min={-3} max={3} step={0.1} suffix="pp" />
      </div>
      <div className="p-4 rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Tilgung</span>
        </div>
        <Slider label="" value={tilgungDeltaPp} onChange={setTilgungDeltaPp} min={-3} max={3} step={0.1} suffix="pp" />
      </div>
      <div className="p-4 rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Eigenkapital</span>
        </div>
        <Slider label="" value={ekDeltaPct} onChange={setEkDeltaPct} min={-100} max={100} step={1} suffix="%" />
      </div>
    </div>

    {/* Base vs Szenario */}
        {(() => {
      const scMiete     = Math.max(0, miete * (1 + mieteDeltaPct / 100));
      const scKaufpreis = Math.max(0, kaufpreis * (1 + preisDeltaPct / 100));
      const scZins      = Math.max(0, zins + zinsDeltaPp);
      const scTilgung   = Math.max(0, tilgung + tilgungDeltaPp);
      const scEk        = Math.max(0, ek * (1 + ekDeltaPct / 100));

      const { nk: scNk }    = berechneNebenkosten(scKaufpreis, grunderwerbsteuer_pct, notarPct, maklerPct);
      const scAnschaffung   = scKaufpreis + scNk;
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

      const scBruttoRendite = scAnschaffung > 0 ? (scJahresKalt - 0) / scAnschaffung * 100 : 0;
      const scNettoRendite  = scAnschaffung > 0 ? ((scJahresKalt - scBewJ) / scAnschaffung) * 100 : 0;
      const scEkRendite     = scEk > 0 ? ((scJahresKalt - scBewJ - scFkZinsenJahr) / scEk) * 100 : 0;

      const rateMonat   = (darlehensSumme * ((zins + tilgung) / 100)) / 12;
      const scRateMonat = (scDarlehen * ((scZins + scTilgung) / 100)) / 12;

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
        { label: "Nettomietrendite",   base: nettoMietrendite,   sc: scNettoRendite,    unit: "%", higherIsBetter: true,  fractionDigits: 1 },
        { label: "Bruttomietrendite",  base: bruttoMietrendite,  sc: scBruttoRendite,   unit: "%", higherIsBetter: true,  fractionDigits: 1 },
        { label: "EK-Rendite",         base: ekRendite,          sc: scEkRendite,       unit: "%", higherIsBetter: true,  fractionDigits: 1 },
      ];

      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basis */}
          <div className="card bg-white">
            <h3 className="font-semibold mb-3">Aktuelle Eingaben</h3>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
              <div>Kaufpreis</div>             <div className="text-right">{kaufpreis.toLocaleString('de-DE')} €</div>
              <div>Gesamtinvestition</div>     <div className="text-right">{anschaffungskosten.toLocaleString('de-DE')} €</div>
              <div>Eigenkapital</div>          <div className="text-right">{ek.toLocaleString('de-DE')} €</div>
              <div>Darlehenssumme</div>        <div className="text-right">{darlehensSumme.toLocaleString('de-DE')} €</div>
              <div>Zins / Tilgung</div>        <div className="text-right">{zins.toFixed(2)} % / {tilgung.toFixed(2)} %</div>
              <div>Monatliche Rate</div>       <div className="text-right">{rateMonat.toLocaleString('de-DE', { maximumFractionDigits: 2 })} €</div>
              <div>Kaltmiete</div>             <div className="text-right">{miete.toLocaleString('de-DE')} €</div>

              <div className="pt-2 border-t font-medium">Cashflow (vor Steuern)</div>
              <div className="text-right pt-2 border-t font-medium">
                {cashflowVorSteuer.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €
              </div>

              <div>Nettomietrendite</div>      <div className="text-right">{nettoMietrendite.toFixed(1)} %</div>
              <div>Bruttomietrendite</div>     <div className="text-right">{bruttoMietrendite.toFixed(1)} %</div>
              <div>EK-Rendite</div>            <div className="text-right">{ekRendite.toFixed(1)} %</div>
            </div>
          </div>

          {/* Szenario – ohne Icons, Delta unter dem Wert */}
          <div className="card card-scenario">
            <h3 className="font-semibold mb-3">Szenario</h3>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
              {rows.map((r) => {
                const delta  = r.sc - r.base;
                const better = r.higherIsBetter !== false ? delta > 0 : delta < 0;
                const color  = nz(delta) ? "text-gray-600"
                              : better ? "text-[hsl(var(--success))]"
                                       : "text-[hsl(var(--danger))]";
                const fd = r.fractionDigits ?? (r.unit === "%" ? 1 : r.unit === "€" ? 0 : 0);

                return (
                  <div className="contents" key={r.label}>
                    <div>{r.label}</div>
                    <div className="text-right">
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
                                    ? Math.abs(delta).toLocaleString("de-DE", { maximumFractionDigits: fd, minimumFractionDigits: fd }) + " %"
                                    : Math.abs(delta).toLocaleString("de-DE", { maximumFractionDigits: fd, minimumFractionDigits: fd })
                              )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    })()}


    {/* Actions unten – modern, ohne Bullet-Liste */}
    <div className="mt-6 flex flex-col sm:flex-row gap-3">
      <button
  className="btn-primary"
  onClick={exportPdf}
  disabled={pdfBusy}
>
  {pdfBusy ? 'Exportiert…' : 'PDF exportieren'}
</button>
      <button className="btn-secondary">
        Ergebnis speichern
      </button>
    </div>
  </>
)}

      </>
    );
  } else {
    content = <p>Seite existiert nicht</p>;
  }

  return (
    <div className="max-w-xl mx-auto py-10">
      {showProgress && <ProgressIndicator currentStep={step as Step} />}
      {content}
    </div>
  );
}
