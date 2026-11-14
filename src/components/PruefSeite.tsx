'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ChevronDown, Info, MapPin, Pencil } from 'lucide-react';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { TourLink } from '@/components/TourLink';
import { useImmoStore } from '@/store/useImmoStore';
import { useFeldText } from '@/hooks/useFeldText';
import { formatZahl } from '@/lib/zahlen';
import { parseZahl } from '@/lib/zahlen';
import { berechneEkStartwert } from '@/lib/kennzahlen';
import { findePflichtLuecken, type PflichtFehler } from '@/lib/pflichtfelder';
import { IMPORT_FELD_LABEL, unsichereFelder, type ImportFeld } from '@/lib/importPruefung';
import { BUNDESLAENDER, istBundesland } from '@/config/grunderwerbsteuer';
import { grunderwerbsteuerLabel } from '@/lib/grunderwerbsteuer';
import {
  START_HAUSGELD_UMLAGE_PCT, START_INSTANDHALTUNG_PRO_QM, START_MIETAUSFALL_PCT, startGebaeudeAnteil,
} from '@/lib/startwerte';
import { trackEvent, AnalyticsEvents, leseEingabeMethode } from '@/lib/analytics';

type Status = 'fehlt' | 'unsicher' | 'fehler' | null;

const rund2 = (n: number) => Math.round(n * 100) / 100;

/* ------------------------------------------------------------------ */
/* Zeilen                                                              */
/* ------------------------------------------------------------------ */

type ZahlZeileProps = {
  id: string;
  label: string;
  wert: number;
  /** null = Feld ist leer */
  onWert: (n: number | null) => void;
  einheit?: string;
  status?: Status;
  /** Meldung unter der Zeile (Fehler oder Erklärung) */
  meldung?: string | null;
  hinweis?: string;
  placeholder?: string;
  /** 0 als leeres Feld zeigen (Werte aus dem Inserat, die fehlen) */
  leerBeiNull?: boolean;
  format?: (n: number) => string;
  inputMode?: 'decimal' | 'numeric';
  /** Leeres Feld nicht übernehmen: beim Verlassen steht wieder der bisherige Wert da (Annahmen, Startwerte) */
  ohneLeer?: boolean;
};

/** Eine Zeile mit Bezeichnung links und direkt editierbarem Wert rechts */
function ZahlZeile({
  id, label, wert, onWert, einheit, status = null, meldung, hinweis, placeholder,
  leerBeiNull = false, format = n => formatZahl(n), inputMode = 'decimal', ohneLeer = false,
}: ZahlZeileProps) {
  const [text, setText] = useFeldText(wert, format, leerBeiNull ? { start: '', nurPositiv: true } : {});
  const hinweisId = meldung || hinweis ? `${id}-hinweis` : undefined;

  return (
    <div
      data-pruef-zeile={id}
      data-status={status ?? 'ok'}
      className={`px-4 py-3 sm:px-5 ${status === 'fehler' ? 'bg-red-50/70' : status ? 'bg-amber-50' : ''}`}
    >
      <div className="flex items-center gap-3">
        <label htmlFor={id} className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-[#001d3d]">{label}</span>
          {status && status !== 'fehler' && (
            <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
              status === 'fehlt' ? 'bg-amber-200 text-amber-900' : 'border border-amber-300 text-amber-800'
            }`}>
              {status === 'fehlt' ? 'Fehlt' : 'Bitte prüfen'}
            </span>
          )}
        </label>
        <div className="flex items-center gap-1.5">
          <input
            id={id}
            type="text"
            inputMode={inputMode}
            value={text}
            placeholder={placeholder ?? 'eintragen'}
            aria-invalid={status === 'fehler' || status === 'fehlt' || undefined}
            aria-describedby={hinweisId}
            onChange={e => {
              setText(e.target.value);
              const n = parseZahl(e.target.value);
              if (n !== null || !ohneLeer) onWert(n);
            }}
            onBlur={() => {
              const n = parseZahl(text);
              if (n !== null) setText(format(n));
              else if (ohneLeer) setText(format(wert));
            }}
            onFocus={e => e.target.select()}
            className={`w-28 sm:w-40 rounded-xl border bg-white px-3 py-2 text-right text-base font-bold text-[#001d3d] shadow-sm outline-none transition-all placeholder:text-sm placeholder:font-semibold placeholder:text-slate-400 focus:border-[#ff6b00] focus:ring-4 focus:ring-[#ff6b00]/10 ${
              status === 'fehler' ? 'border-red-400' : status === 'fehlt' ? 'border-amber-400' : 'border-slate-200'
            }`}
          />
          <span className="w-11 shrink-0 text-[11px] font-black leading-tight text-slate-400">{einheit}</span>
        </div>
      </div>
      {(meldung || hinweis) && (
        <p
          id={hinweisId}
          role={status === 'fehler' ? 'alert' : undefined}
          className={`mt-1 text-xs ${status === 'fehler' ? 'font-semibold text-red-600' : status === 'fehlt' ? 'font-semibold text-amber-800' : 'text-slate-500'}`}
        >
          {meldung || hinweis}
        </p>
      )}
    </div>
  );
}

function Block({ id, titel, untertitel, children }: { id: string; titel: string; untertitel?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-titel`} className="rounded-[2rem] border border-slate-100 bg-slate-50 shadow-inner">
      <div className="px-4 pt-5 pb-3 sm:px-5">
        <h2 id={`${id}-titel`} className="text-lg font-black tracking-tight text-[#001d3d]">{titel}</h2>
        {untertitel && <p className="mt-0.5 text-xs text-slate-500">{untertitel}</p>}
      </div>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Seite                                                               */
/* ------------------------------------------------------------------ */

/**
 * Prüfseite nach einem Import (Link oder Foto): eine Seite statt der vier Eingabeschritte.
 * 1. Was wir aus dem Inserat gelesen haben (fehlende und unsichere Werte oben)
 * 2. Was wir vom Nutzer brauchen (Eigenkapital, Steuersatz)
 * 3. Unsere Annahmen (eingeklappt)
 * Alle Eingaben gehen direkt in den Store; gerechnet wird wie bisher im Ergebnis.
 */
export function PruefSeite({ mounted, onWeiter }: { mounted: boolean; onWeiter: () => void }) {
  const router = useRouter();
  const s = useImmoStore();
  const setEkStartwert = useImmoStore(x => x.setEkStartwert);
  const {
    kaufpreis, adresse, flaeche, zimmer, baujahr, miete, hausgeld, hausgeld_umlegbar, objekttyp, anzahl_wohneinheiten,
    grunderwerbsteuer_pct, grunderwerbsteuerManuell, bundesland, notar_pct, makler_pct, sonstige_kosten,
    zins, tilgung, mietausfall_pct, instandhaltungskosten_pro_qm, afa, steuer, ek, ekManuell, persoenlicher_steuersatz,
    importFehlend, importHinweise, importQuelle,
  } = s;

  // Daten sind da (nach Neuladen kommen sie erst aus dem Autosave)
  const bereit = mounted && (kaufpreis > 0 || !!adresse.trim() || importFehlend.length > 0);
  const istWohnung = objekttyp === 'wohnung';
  const istMfh = objekttyp === 'mfh';

  // Ohne Daten (Direktaufruf): zurück zur Auswahl der Eingabe
  useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(() => {
      const st = useImmoStore.getState();
      if (!(st.kaufpreis > 0) && !st.adresse.trim() && st.importFehlend.length === 0) router.replace('/input-method');
    }, 300);
    return () => clearTimeout(t);
  }, [mounted, router]);

  // Startwerte der Annahmen in den Store schreiben, damit Ergebnis, Speichern und PDF dieselben Werte nutzen
  const startGesetzt = useRef(false);
  useEffect(() => {
    if (!bereit || startGesetzt.current) return;
    startGesetzt.current = true;
    const st = useImmoStore.getState();
    if (!(st.mietausfall_pct > 0)) st.setMietausfallPct(START_MIETAUSFALL_PCT);
    if (!(st.instandhaltungskosten_pro_qm > 0)) st.setInstandhaltungskostenProQm(START_INSTANDHALTUNG_PRO_QM);
    if (!(st.steuer > 0)) st.setSteuer(startGebaeudeAnteil(st.objekttyp));
  }, [bereit]);

  // Eigenkapital-Startwert: Kaufnebenkosten + 10 % des Kaufpreises (überschreibt nie eine Eingabe)
  const ekStartwert = berechneEkStartwert({
    kaufpreis, grunderwerbsteuerPct: grunderwerbsteuer_pct, notarPct: notar_pct, maklerPct: makler_pct, sonstigeKosten: sonstige_kosten,
  });
  useEffect(() => {
    if (!mounted || ekManuell || !(kaufpreis > 0)) return;
    setEkStartwert(ekStartwert);
  }, [mounted, ekManuell, kaufpreis, ekStartwert, setEkStartwert]);

  // Reihenfolge einmal festlegen, sobald die Daten da sind: fehlende und unsichere Werte oben.
  // Danach bleibt sie stehen, damit Zeilen beim Tippen nicht springen.
  const unsicher = useMemo(() => unsichereFelder(importHinweise), [importHinweise]);
  const [reihenfolge, setReihenfolge] = useState<ImportFeld[] | null>(null);
  const [geprueft, setGeprueft] = useState<Set<ImportFeld>>(() => new Set());
  const [hausgeldLeer, setHausgeldLeer] = useState(false);
  useEffect(() => {
    if (!bereit || reihenfolge) return;
    const alle: ImportFeld[] = ['kaufpreis', 'adresse', 'flaeche', 'zimmer', 'baujahr', 'miete', 'hausgeld'];
    const felder = alle.filter(f => f !== 'hausgeld' || objekttyp === 'wohnung');
    const rang = (f: ImportFeld) => (importFehlend.includes(f) ? 0 : unsicher.includes(f) ? 1 : 2);
    queueMicrotask(() => {
      setReihenfolge([...felder].sort((a, b) => rang(a) - rang(b)));
      setHausgeldLeer(importFehlend.includes('hausgeld'));
    });
  }, [bereit, reihenfolge, importFehlend, unsicher, objekttyp]);

  const markiereGeprueft = (f: ImportFeld) => setGeprueft(prev => (prev.has(f) ? prev : new Set(prev).add(f)));

  // Hausgeld-Aufteilung: Anteil umlagefähig in %, bleibt erhalten, wenn sich der Betrag ändert
  const [umlagePct, setUmlagePct] = useState<number>(START_HAUSGELD_UMLAGE_PCT);
  const umlageGelesen = useRef(false);
  useEffect(() => {
    if (!bereit || umlageGelesen.current) return;
    umlageGelesen.current = true;
    if (hausgeld > 0) queueMicrotask(() => setUmlagePct(rund2((hausgeld_umlegbar / hausgeld) * 100)));
  }, [bereit, hausgeld, hausgeld_umlegbar]);

  // === Pflichtangaben (gleiche Prüfung wie in den Eingabeschritten) ===
  const grEStFehlt = grunderwerbsteuer_pct === 0 && !grunderwerbsteuerManuell;
  const basisLuecken = findePflichtLuecken({
    kaufpreis, adresse, grunderwerbsteuerFehlt: grEStFehlt, objekttyp, flaeche, zimmer,
    anzahlWohneinheiten: anzahl_wohneinheiten, baujahr, miete, ek, zins, tilgung,
  });
  // Hausgeld ist hier zusätzlich Pflicht, wenn es im Inserat fehlte (0 eintragen, falls keins anfällt)
  const luecken: PflichtFehler[] = [
    ...basisLuecken.filter(l => l.schritt !== 'c'),
    ...(istWohnung && hausgeldLeer ? [{ key: 'hausgeld', schritt: 'b' as const, label: 'Hausgeld', text: 'Bitte trag das Hausgeld ein (0, falls keins anfällt).' }] : []),
    ...basisLuecken.filter(l => l.schritt === 'c'),
  ];
  const luecke = (key: string) => luecken.find(l => l.key === key);
  const offenInAnnahmen = luecken.some(l => ['grunderwerbsteuer', 'zins', 'tilgung'].includes(l.key));

  const [annahmenOffen, setAnnahmenOffen] = useState(false);
  const annahmenSichtbar = annahmenOffen || offenInAnnahmen;

  // review_page_viewed: einmal je Aufruf, sobald die Daten da sind
  const gemeldet = useRef(false);
  useEffect(() => {
    if (!bereit || !reihenfolge || gemeldet.current) return;
    gemeldet.current = true;
    trackEvent(AnalyticsEvents.REVIEW_PAGE_VIEWED, {
      input_method: importQuelle ?? leseEingabeMethode(),
      missing_fields_count: luecken.length,
    });
  }, [bereit, reihenfolge, importQuelle, luecken.length]);

  /** Feld ist leer (nicht nur ungültig) */
  const istLeer: Record<ImportFeld, boolean> = {
    kaufpreis: !(kaufpreis > 0),
    adresse: !adresse.trim(),
    flaeche: !(flaeche > 0),
    zimmer: istMfh ? !(anzahl_wohneinheiten > 0) : !(zimmer > 0),
    baujahr: !(baujahr > 0),
    miete: !(miete > 0),
    hausgeld: hausgeldLeer,
  };

  /** Status einer Zeile aus Block 1: fehlt (leer), fehler (ungültig), unsicher (laut Import-Hinweis) */
  const statusVon = (feld: ImportFeld): { status: Status; meldung: string | null } => {
    const l = luecke(feld);
    if (l && istLeer[feld]) return { status: 'fehlt', meldung: importFehlend.includes(feld) || feld === 'hausgeld' ? 'Fehlt im Inserat. Bitte ergänzen.' : l.text };
    if (l) return { status: 'fehler', meldung: l.text };
    if (unsicher.includes(feld) && !geprueft.has(feld)) return { status: 'unsicher', meldung: null };
    return { status: null, meldung: null };
  };

  // === Zeilen aus dem Inserat ===
  const zeile = (feld: ImportFeld) => {
    switch (feld) {
      case 'kaufpreis': {
        const st = statusVon('kaufpreis');
        return (
          <ZahlZeile key={feld} id="pruefen-kaufpreis" label="Kaufpreis" einheit="€" wert={kaufpreis} leerBeiNull placeholder="z. B. 280.000"
            {...st}
            onWert={n => { s.setKaufpreis(n ?? 0); markiereGeprueft('kaufpreis'); if (n && n > 0) s.erledigeImportFeld('kaufpreis'); }} />
        );
      }
      case 'adresse': {
        const st = statusVon('adresse');
        return (
          <div key={feld} data-pruef-zeile="pruefen-adresse" data-status={st.status ?? 'ok'} className={`px-4 py-3 sm:px-5 ${st.status ? 'bg-amber-50' : ''}`}>
            <label htmlFor="pruefen-adresse" className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#001d3d]">Adresse</span>
              {st.status && (
                <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-900">
                  {st.status === 'unsicher' ? 'Bitte prüfen' : 'Fehlt'}
                </span>
              )}
            </label>
            <div className="relative mt-1.5">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-300" size={16} aria-hidden />
              <AddressAutocomplete
                id="pruefen-adresse"
                value={adresse}
                onChange={(val: string) => { s.setAdresse(val); markiereGeprueft('adresse'); if (val.trim()) s.erledigeImportFeld('adresse'); }}
                inputClassName={`w-full rounded-xl border bg-white py-2.5 pl-9 pr-3 text-sm font-bold text-[#001d3d] shadow-sm outline-none transition-all placeholder:font-semibold placeholder:text-slate-400 focus:border-[#ff6b00] focus:ring-4 focus:ring-[#ff6b00]/10 ${st.status === 'fehlt' ? 'border-amber-400' : 'border-slate-200'}`}
              />
            </div>
            <p className={`mt-1 text-xs ${st.status === 'fehlt' ? 'font-semibold text-amber-800' : 'text-slate-500'}`}>
              {st.meldung ?? 'Mit PLZ. Daraus ergibt sich der Grunderwerbsteuersatz.'}
            </p>
          </div>
        );
      }
      case 'flaeche': {
        const st = statusVon('flaeche');
        return (
          <ZahlZeile key={feld} id="pruefen-flaeche" label={istMfh ? 'Wohnfläche gesamt' : 'Wohnfläche'} einheit="m²" wert={flaeche} leerBeiNull placeholder="z. B. 65"
            {...st}
            onWert={n => { s.setFlaeche(n ?? 0); markiereGeprueft('flaeche'); if (n && n > 0) s.erledigeImportFeld('flaeche'); }} />
        );
      }
      case 'zimmer': {
        const st = statusVon('zimmer');
        return istMfh ? (
          <ZahlZeile key={feld} id="pruefen-zimmer" label="Wohneinheiten" wert={anzahl_wohneinheiten} leerBeiNull placeholder="z. B. 6" inputMode="numeric"
            {...st}
            onWert={n => { s.setAnzahlWohneinheiten(n ?? 0); markiereGeprueft('zimmer'); }} />
        ) : (
          <ZahlZeile key={feld} id="pruefen-zimmer" label="Zimmer" wert={zimmer} leerBeiNull placeholder="z. B. 3"
            {...st}
            onWert={n => { s.setZimmer(n ?? 0); markiereGeprueft('zimmer'); if (n && n > 0) s.erledigeImportFeld('zimmer'); }} />
        );
      }
      case 'baujahr': {
        const st = statusVon('baujahr');
        return (
          <ZahlZeile key={feld} id="pruefen-baujahr" label="Baujahr" wert={baujahr} leerBeiNull placeholder="z. B. 1995" inputMode="numeric"
            format={n => String(Math.round(n))}
            {...st}
            onWert={n => { s.setBaujahr(n && n > 0 ? Math.round(n) : 0); markiereGeprueft('baujahr'); if (n && n > 0) s.erledigeImportFeld('baujahr'); }} />
        );
      }
      case 'miete': {
        const st = statusVon('miete');
        return (
          <ZahlZeile key={feld} id="pruefen-miete" label={istMfh ? 'Kaltmiete gesamt' : 'Kaltmiete'} einheit="€/Mon." wert={miete} leerBeiNull placeholder="z. B. 950"
            {...st}
            hinweis={flaeche > 0 && miete > 0 ? `${formatZahl(miete / flaeche, { min: 2, max: 2 })} €/m², ohne Nebenkosten` : 'Pro Monat, ohne Nebenkosten'}
            onWert={n => { s.setMiete(n ?? 0); markiereGeprueft('miete'); if (n && n > 0) s.erledigeImportFeld('miete'); }} />
        );
      }
      case 'hausgeld': {
        const st = statusVon('hausgeld');
        return (
          <ZahlZeile key={feld} id="pruefen-hausgeld" label="Hausgeld" einheit="€/Mon." wert={hausgeld} leerBeiNull={hausgeldLeer} placeholder="z. B. 250"
            {...st}
            hinweis={!st.meldung ? `Davon ${formatZahl(umlagePct)} % umlagefähig (siehe Annahmen)` : undefined}
            onWert={n => {
              setHausgeldLeer(n === null);
              markiereGeprueft('hausgeld');
              const betrag = n ?? 0;
              s.setHausgeld(betrag);
              s.setHausgeldUmlegbar(rund2(betrag * umlagePct / 100));
              if (n !== null) s.erledigeImportFeld('hausgeld');
            }} />
        );
      }
      default:
        return null;
    }
  };

  // === Annahmen ===
  const nebenkostenPct = grunderwerbsteuer_pct + notar_pct + makler_pct;
  const zusammenfassung = [
    `Zins ${formatZahl(zins)} %`,
    `Tilgung ${formatZahl(tilgung)} %`,
    grEStFehlt ? 'Grunderwerbsteuer fehlt' : `Nebenkosten ${formatZahl(nebenkostenPct, { max: 1 })} %`,
    `Instandhaltung ${formatZahl(instandhaltungskosten_pro_qm || START_INSTANDHALTUNG_PRO_QM)} €/m²`,
  ].join(' · ');

  const gest = luecke('grunderwerbsteuer');
  const zinsL = luecke('zins');
  const tilgL = luecke('tilgung');
  const ekL = luecke('ek');

  const weiter = () => {
    if (luecken.length > 0) return;
    onWeiter();
  };

  if (!bereit || !reihenfolge) {
    return <div className="py-24 text-center text-sm text-slate-400">Lädt …</div>;
  }

  const wichtigeHinweise = importHinweise;

  return (
    <>
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-black leading-none tracking-tight text-[#001d3d] md:text-4xl">Kurz prüfen.</h1>
          <TourLink step="pruefen" className="mt-1 shrink-0" />
        </div>
        <p className="mt-3 text-sm text-slate-500">
          Wir haben das Inserat {importQuelle === 'screenshot' ? 'vom Foto ' : ''}gelesen. Prüf die Werte, dann rechnen wir Cashflow und Rendite.
        </p>
      </div>

      <div className="space-y-5">
        {/* 1. Das haben wir gelesen */}
        <Block id="block-gelesen" titel="Das haben wir gelesen" untertitel="Tippe auf einen Wert, um ihn zu ändern.">
          {wichtigeHinweise.length > 0 && (
            <div id="import-hinweise" role="status" className="mx-4 mb-3 flex items-start gap-2.5 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-amber-900 sm:mx-5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <div className="min-w-0">
                <p className="text-xs font-bold">Hinweise aus dem Import</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs leading-relaxed">
                  {wichtigeHinweise.map(h => <li key={h}>{h}</li>)}
                </ul>
              </div>
            </div>
          )}
          <div className="divide-y divide-slate-200/70 border-t border-slate-200/70 bg-white rounded-b-[2rem] overflow-visible">
            {reihenfolge.map(zeile)}
          </div>
        </Block>

        {/* 2. Das brauchen wir von dir */}
        <Block id="block-von-dir" titel="Das brauchen wir von dir" untertitel="Wir haben Startwerte eingetragen. Passe sie an dich an.">
          <div className="divide-y divide-slate-200/70 border-t border-slate-200/70 bg-white rounded-b-[2rem]">
            <ZahlZeile
              id="pruefen-eigenkapital" ohneLeer label="Eigenkapital" einheit="€" wert={ek}
              format={n => formatZahl(n, { max: 0 })}
              status={ekL ? 'fehler' : null}
              meldung={ekL?.text}
              hinweis={!ekManuell ? 'Startwert: Kaufnebenkosten plus 10 % des Kaufpreises.' : 'Geld, das du selbst einbringst.'}
              onWert={n => s.setEk(n ?? 0)}
            />
            <ZahlZeile
              id="pruefen-steuersatz" ohneLeer label="Persönlicher Steuersatz" einheit="%" wert={persoenlicher_steuersatz}
              hinweis="Dein Grenzsteuersatz, oft 30 bis 45 %. Er bestimmt die Steuer auf Mietgewinne."
              onWert={n => s.setPersoenlicherSteuersatz(n ?? 0)}
            />
          </div>
        </Block>

        {/* 3. Unsere Annahmen */}
        <section id="block-annahmen" className="rounded-[2rem] border border-slate-100 bg-slate-50 shadow-inner">
          <button
            type="button"
            aria-expanded={annahmenSichtbar}
            aria-controls="annahmen-liste"
            onClick={() => setAnnahmenOffen(o => !o)}
            disabled={offenInAnnahmen}
            className="flex w-full items-start justify-between gap-3 px-4 py-5 text-left sm:px-5"
          >
            <span className="min-w-0">
              <span className="block text-lg font-black tracking-tight text-[#001d3d]">Unsere Annahmen</span>
              <span className={`mt-0.5 block text-xs ${grEStFehlt ? 'font-semibold text-amber-800' : 'text-slate-500'}`}>{zusammenfassung}</span>
            </span>
            <ChevronDown size={20} aria-hidden className={`mt-1 shrink-0 text-slate-400 transition-transform ${annahmenSichtbar ? 'rotate-180' : ''}`} />
          </button>
          {annahmenSichtbar && (
            <div id="annahmen-liste" className="divide-y divide-slate-200/70 border-t border-slate-200/70 bg-white rounded-b-[2rem]">
              {/* Grunderwerbsteuer: Bundesland aus der PLZ, hier änderbar */}
              <div className={`px-4 py-3 sm:px-5 ${gest ? 'bg-amber-50' : ''}`} data-pruef-zeile="pruefen-grunderwerbsteuer" data-status={gest ? 'fehlt' : 'ok'}>
                <div className="flex items-center gap-3">
                  <label htmlFor="pruefen-bundesland" className="min-w-0 flex-1 text-sm font-semibold text-[#001d3d]">Grunderwerbsteuer</label>
                  <select
                    id="pruefen-bundesland"
                    value={bundesland ?? ''}
                    onChange={e => s.setBundesland(istBundesland(e.target.value) ? e.target.value : null)}
                    className={`w-[9.5rem] sm:w-[13.25rem] rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-[#001d3d] shadow-sm outline-none focus:border-[#ff6b00] focus:ring-4 focus:ring-[#ff6b00]/10 ${gest ? 'border-amber-400' : 'border-slate-200'}`}
                  >
                    <option value="">Bundesland wählen</option>
                    {Object.entries(BUNDESLAENDER).map(([code, land]) => (
                      <option key={code} value={code}>{land.name}</option>
                    ))}
                  </select>
                </div>
                <p className={`mt-1 text-xs ${gest ? 'font-semibold text-amber-800' : 'text-slate-500'}`}>
                  {gest ? gest.text : bundesland ? `${grunderwerbsteuerLabel(bundesland)}${grunderwerbsteuer_pct !== BUNDESLAENDER[bundesland].satz ? ` · eigener Satz ${formatZahl(grunderwerbsteuer_pct)} %` : ''}` : `Eigener Satz ${formatZahl(grunderwerbsteuer_pct)} %`}
                </p>
              </div>
              <ZahlZeile id="pruefen-notar" ohneLeer label="Notar & Grundbuch" einheit="%" wert={notar_pct} hinweis="Üblich sind etwa 1,5 bis 2 % des Kaufpreises."
                onWert={n => s.setNotarPct(n ?? 0)} />
              <ZahlZeile id="pruefen-makler" ohneLeer label="Maklerprovision" einheit="%" wert={makler_pct} hinweis="0, wenn provisionsfrei."
                status={makler_pct > 5 ? 'unsicher' : null}
                onWert={n => s.setMaklerPct(n ?? 0)} />
              <ZahlZeile id="pruefen-zins" ohneLeer label="Zinssatz" einheit="% p. a." wert={zins} status={zinsL ? 'fehler' : null} meldung={zinsL?.text}
                onWert={n => n !== null && s.setZins(n)} />
              <ZahlZeile id="pruefen-tilgung" ohneLeer label="Tilgung" einheit="% p. a." wert={tilgung} status={tilgL ? 'fehler' : null} meldung={tilgL?.text}
                hinweis="Anfangstilgung pro Jahr, typisch 1 bis 3 %."
                onWert={n => n !== null && s.setTilgung(n)} />
              <ZahlZeile id="pruefen-mietausfall" ohneLeer label="Mietausfall" einheit="%" wert={mietausfall_pct} format={n => formatZahl(n, { min: 2 })}
                hinweis="Puffer für Leerstand, in % der Jahresmiete."
                onWert={n => s.setMietausfallPct(n ?? 0)} />
              <ZahlZeile id="pruefen-instandhaltung" ohneLeer label="Instandhaltung" einheit="€/m²" wert={instandhaltungskosten_pro_qm} format={n => formatZahl(n, { min: 2 })}
                hinweis="Rücklage pro m² und Jahr, üblich 5 bis 15 €."
                onWert={n => s.setInstandhaltungskostenProQm(n ?? 0)} />
              <ZahlZeile id="pruefen-afa" ohneLeer label="AfA-Satz" einheit="% p. a." wert={afa}
                hinweis="Abschreibung nach Baujahr: vor 1925 2,5 %, ab 2023 3 %, sonst 2 %."
                onWert={n => s.setAfa(n ?? 0)} />
              <ZahlZeile id="pruefen-gebaeudeanteil" ohneLeer label="Gebäudeanteil" einheit="%" wert={steuer || startGebaeudeAnteil(objekttyp)}
                hinweis="Nur das Gebäude wird abgeschrieben. Wohnung ~75 %, Haus ~80 %, MFH ~85 %."
                onWert={n => s.setSteuer(n ?? 0)} />
              {istWohnung && (
                <ZahlZeile id="pruefen-umlage" ohneLeer label="Hausgeld umlagefähig" einheit="%" wert={umlagePct}
                  hinweis={hausgeld > 0
                    ? `${formatZahl(hausgeld_umlegbar, { min: 2, max: 2 })} € zahlt der Mieter, ${formatZahl(hausgeld - hausgeld_umlegbar, { min: 2, max: 2 })} € trägst du.`
                    : 'Anteil, den der Mieter über die Nebenkosten zahlt. Standard 60 %.'}
                  onWert={n => {
                    const pct = Math.min(100, Math.max(0, n ?? 0));
                    setUmlagePct(pct);
                    s.setHausgeldUmlegbar(rund2(hausgeld * pct / 100));
                  }} />
              )}
            </div>
          )}
        </section>
      </div>

      {/* Ergebnis */}
      <div className="mt-8">
        <button
          id="pruefen-weiter"
          data-step-nav="next"
          type="button"
          onClick={weiter}
          disabled={luecken.length > 0}
          aria-describedby={luecken.length > 0 ? 'pruefen-offen' : undefined}
          className="w-full rounded-2xl bg-[#001d3d] px-6 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-[#001d3d]/90 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
        >
          Ergebnis anzeigen
        </button>
        {luecken.length > 0 && (
          <p id="pruefen-offen" role="status" className="mt-3 flex items-start gap-2 text-sm text-amber-900">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              <span className="font-semibold">Noch offen: </span>
              {luecken.map(l => (l.key in IMPORT_FELD_LABEL ? IMPORT_FELD_LABEL[l.key as ImportFeld] : l.label)).join(', ')}.
            </span>
          </p>
        )}
        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <Pencil size={12} aria-hidden /> Alles lässt sich im Ergebnis über „Bearbeiten“ wieder ändern.
        </p>
      </div>
    </>
  );
}
