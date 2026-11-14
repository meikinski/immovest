// src/store/useImmoStore.ts
import { create } from 'zustand';
import { berechneScore } from '@/lib/calculations';
import {
  berechneCashflowVorSteuern,
  berechneDarlehen,
  berechneNettomietrendite,
  type KennzahlenEingabe,
} from '@/lib/kennzahlen';
import type { MarketFacts } from '@/lib/marketFacts';
import { BUNDESLAENDER, istBundesland, type BundeslandCode } from '@/config/grunderwerbsteuer';
import { bundeslandAusAdresse } from '@/lib/plzBundesland';
import type { ImportFeld } from '@/lib/importPruefung';
import { leereWerteAlsNull, nullAlsLeererWert } from '@/lib/leereWerte';

/** localStorage-Schlüssel für den automatisch gesicherten Arbeitsstand (siehe useStatePersistence) */
export const AUTOSAVE_KEY = 'immovest_kpi_state';

const clearAutosave = () => {
  try {
    if (typeof window !== 'undefined') localStorage.removeItem(AUTOSAVE_KEY);
  } catch {
    // localStorage nicht verfügbar
  }
};


/**
 * AfA-Modell Typen für verschiedene Abschreibungsmethoden
 * - linear_2: 2% p.a. (Altimmobilien vor 2023)
 * - linear_3: 3% p.a. (ab 2023)
 * - degressiv_5: 5% degressiv (Neubauten 2023-2029)
 */
export type AfaModell = 'linear_2' | 'linear_3' | 'degressiv_5';

export type ImportQuelle = 'url' | 'screenshot';

/**
 * State und Setter für ImmoInvest AI Eingaben (Schritt A)
 */
export interface ImmoState {
  // Analysis metadata
  analysisId: string | null;
  analysisName: string;
  createdAt: string | null;
  updatedAt: string | null;

  // Input fields
  kaufpreis: number;
  objekttyp: 'wohnung' | 'haus' | 'mfh';
  /** 0 = noch kein Satz (Bundesland unbekannt) */
  grunderwerbsteuer_pct: number;
  /** Aus der PLZ erkanntes oder gewähltes Bundesland */
  bundesland: BundeslandCode | null;
  /** true, sobald der Nutzer Satz oder Bundesland selbst gesetzt hat: dann nie automatisch überschreiben */
  grunderwerbsteuerManuell: boolean;
  notar_pct: number;
  makler_pct: number;
  sonstige_kosten: number;
  flaeche: number;
  adresse: string;
  zimmer: number;
  baujahr: number;
  miete: number;
  hausgeld: number;
  hausgeld_umlegbar: number;
  mietausfall_pct: number;

  // MFH-specific fields
  anzahl_wohneinheiten: number;
  verwaltungskosten: number;
  instandhaltungskosten_pro_qm: number;
  steuer: number;
  afa: number;
  ruecklagen: number;
  persoenlicher_steuersatz: number;
  ek: number;
  /** true, sobald der Nutzer das Eigenkapital selbst eingetragen hat: der Startwert überschreibt es dann nie */
  ekManuell: boolean;
  zins: number;
  tilgung: number;

  // Import: fehlende Angaben und Hinweise aus dem Inserat
  importFehlend: ImportFeld[];
  /** Importierte, aber unplausible Angaben (z. B. Hausgeld = Kaltmiete): müssen bestätigt oder geändert werden */
  importUnsicher: ImportFeld[];
  importHinweise: string[];
  /** Woher die Daten kommen: Import per Link oder Foto, sonst null (manuell). "Bearbeiten" öffnet bei Importen die Prüfseite. */
  importQuelle: ImportQuelle | null;

  // AfA-Turbo Felder (§7 Abs. 4, §7 Abs. 5a, §7b EStG)
  // Vereinfacht: Nur afaModell und nutzeSonderAfa, basierend auf Baujahr
  afaModell: AfaModell;
  nutzeSonderAfa: boolean;
  grundstueckswert: number; // Grundstückswert für AfA-Berechnung (Gebäudewert = Kaufpreis - Grundstückswert)

  // Derived fields
  cashflow_operativ: number;
  nettorendite: number;
  score: number;
  anschaffungskosten: number;

  // Generated content
  generatedComment: string;
  lageComment: string;
  mietpreisComment: string;
  qmPreisComment: string;
  investComment: string;

  // Markt-Recherche (Tab 2)
  marktFacts: MarketFacts | null;
  mietMarktDelta: number | null;
  kaufMarktDelta: number | null;

  // Methods
  updateDerived: () => void;
  resetAnalysis: () => void;
  loadAnalysis: (id: string, userId?: string | null) => Promise<boolean>;
  exportState: () => Record<string, unknown>;

  setKaufpreis: (v: number) => void;
  setObjekttyp: (v: 'wohnung' | 'haus' | 'mfh') => void;
  setGrunderwerbsteuerPct: (v: number) => void;
  setBundesland: (v: BundeslandCode | null) => void;
  setEkStartwert: (v: number) => void;
  erledigeImportFeld: (feld: ImportFeld) => void;
  bestaetigeImportFeld: (feld: ImportFeld) => void;
  setNotarPct: (v: number) => void;
  setMaklerPct: (v: number) => void;
  setSonstigeKosten: (v: number) => void;
  setFlaeche: (v: number) => void;
  setAdresse: (v: string) => void;
  setZimmer: (v: number) => void;
  setBaujahr: (v: number) => void;
  setMiete: (v: number) => void;
  setHausgeld: (v: number) => void;
  setHausgeldUmlegbar: (v: number) => void;
  setMietausfallPct: (v: number) => void;
  setInstandhaltungskostenProQm: (v: number) => void;
  setSteuer: (v: number) => void;
  setAfa: (v: number) => void;
  setRuecklagen: (v: number) => void;
  setPersoenlicherSteuersatz: (v: number) => void;
  setEk: (v: number) => void;
  setZins: (v: number) => void;
  setTilgung: (v: number) => void;
  setGeneratedComment: (v: string) => void;
  setLageComment: (v: string) => void;
  setMietpreisComment: (v: string) => void;
  setQmPreisComment: (v: string) => void;
  setInvestComment: (v: string) => void;
  setMarktResearch: (v: { facts: MarketFacts | null; mietDelta: number | null; kaufDelta: number | null }) => void;
  setAnzahlWohneinheiten: (v: number) => void;
  setVerwaltungskosten: (v: number) => void;
  setAnalysisId: (v: string) => void;
  importData: (data: Partial<ImmoState>) => void;

  // AfA-Turbo Setter (vereinfacht: nur Modell und Sonder-AfA)
  setAfaModell: (v: AfaModell) => void;
  setNutzeSonderAfa: (v: boolean) => void;
  setGrundstueckswert: (v: number) => void;
}

// Typ für die Set-Funktion: akzeptiert partielle ImmoState-Updates
type SetFn = (state: Partial<ImmoState>) => void;

// Helper to calculate default AfA based on construction year
const getDefaultAfa = (year: number) => {
  if (!year) return 2;
  if (year < 1925) return 2.5;
  if (year >= 2023) return 3;
  return 2;
};

/**
 * Bestimmt das Standard-AfA-Modell basierend auf dem Baujahr
 * Bei Baujahr >= 2023 wird linear_3 als Default gesetzt (User kann dann degressiv wählen)
 */
const getDefaultAfaModell = (baujahr: number): AfaModell => {
  if (baujahr >= 2023) {
    return 'linear_3'; // Default, User kann degressiv wählen
  }
  return 'linear_2';
};

/**
 * Berechnet den AfA-Satz (%) basierend auf dem gewählten Modell
 * Für UI-Anzeige im ersten Jahr
 */
const getAfaSatzFromModell = (modell: AfaModell, nutzeSonderAfa: boolean): number => {
  switch (modell) {
    case 'linear_2':
      return 2;
    case 'linear_3':
      return 3;
    case 'degressiv_5':
      // 5% degressiv + optional 5% Sonder-AfA = bis zu 10%
      return nutzeSonderAfa ? 10 : 5;
  }
};

const initialState = {
  // Metadata
  analysisId: null,
  analysisName: '',
  createdAt: null,
  updatedAt: null,

  // Initialwerte
  kaufpreis: 0,
  objekttyp: 'wohnung' as const,
  grunderwerbsteuer_pct: 0,
  bundesland: null as BundeslandCode | null,
  grunderwerbsteuerManuell: false,
  notar_pct: 2,
  makler_pct: 3.57,
  sonstige_kosten: 0,
  flaeche: 0,
  adresse: '',
  zimmer: 0,
  baujahr: 0,
  miete: 0,
  hausgeld: 0,
  hausgeld_umlegbar: 0,
  mietausfall_pct: 0,
  anzahl_wohneinheiten: 0,
  verwaltungskosten: 0,
  instandhaltungskosten_pro_qm: 0,
  steuer: 0,
  afa: getDefaultAfa(0),
  ruecklagen: 0,
  persoenlicher_steuersatz: 40,
  ek: 0,
  ekManuell: false,
  importFehlend: [] as ImportFeld[],
  importUnsicher: [] as ImportFeld[],
  importHinweise: [] as string[],
  importQuelle: null as ImportQuelle | null,
  zins: 3.5,
  tilgung: 2,
  cashflow_operativ: 0,
  nettorendite: 0,
  score: 0,
  anschaffungskosten: 0,
  generatedComment: '',
  lageComment: '',
  mietpreisComment: '',
  qmPreisComment: '',
  investComment: '',
  marktFacts: null,
  mietMarktDelta: null,
  kaufMarktDelta: null,

  // AfA-Turbo Initialwerte (vereinfacht)
  afaModell: 'linear_3' as AfaModell, // Default für Baujahr >= 2023
  nutzeSonderAfa: false,
  grundstueckswert: 0, // Wird automatisch auf ~20% des Kaufpreises berechnet
};

export const useImmoStore = create<ImmoState>((set: SetFn, get) => ({
  ...initialState,
  updateDerived: () => {
    const s = get();
    // Dieselben Formeln wie die Ergebnis-Karten (src/lib/kennzahlen.ts), damit gespeicherte Werte,
    // die Liste "Meine Analysen" und der Chat dieselben Zahlen zeigen wie die Karten
    const eingabe: KennzahlenEingabe = {
      kaufpreis: s.kaufpreis,
      grunderwerbsteuerPct: s.grunderwerbsteuer_pct,
      notarPct: s.notar_pct,
      maklerPct: s.makler_pct,
      sonstigeKosten: s.sonstige_kosten,
      miete: s.miete,
      hausgeld: s.hausgeld,
      hausgeldUmlegbar: s.hausgeld_umlegbar,
      instandhaltungProQmJahr: s.instandhaltungskosten_pro_qm,
      flaeche: s.flaeche,
      mietausfallPct: s.mietausfall_pct,
      ek: s.ek,
      zins: s.zins,
      tilgung: s.tilgung,
    };
    const cf = berechneCashflowVorSteuern(eingabe);
    const nr = berechneNettomietrendite(eingabe);

    const darlehensSumme = berechneDarlehen(eingabe);
    const jahresrate = darlehensSumme * ((s.zins + s.tilgung) / 100);

    const breakEvenJahre = cf > 0 ? s.ek / (cf * 12) : Infinity;

    const sc = berechneScore(nr, cf, s.ek, jahresrate, breakEvenJahre);
    set({ cashflow_operativ: cf, nettorendite: nr, score: sc });
  },
  // Setter-Implementierungen
  setKaufpreis: (v: number) => {
    set({ kaufpreis: v, generatedComment: '' });
    get().updateDerived();
  },
  setObjekttyp: (v: 'wohnung' | 'haus' | 'mfh') => {
    set({ objekttyp: v, generatedComment: '' });
    get().updateDerived();
  },
  // Eingabe des Nutzers: gilt ab jetzt, die Adresse überschreibt den Satz nicht mehr
  setGrunderwerbsteuerPct: (v: number) => {
    set({ grunderwerbsteuer_pct: v, grunderwerbsteuerManuell: true, generatedComment: '' });
    get().updateDerived();
  },
  // Auswahl des Bundeslands im Formular: Satz aus der Config übernehmen
  setBundesland: (v: BundeslandCode | null) => {
    if (!v) {
      set({ bundesland: null });
      return;
    }
    set({ bundesland: v, grunderwerbsteuer_pct: BUNDESLAENDER[v].satz, grunderwerbsteuerManuell: true, generatedComment: '' });
    get().updateDerived();
  },
  setNotarPct: (v: number) => {
    set({ notar_pct: v, generatedComment: '' });
    get().updateDerived();
  },
  setMaklerPct: (v: number) => {
    set({ makler_pct: v, generatedComment: '' });
    get().updateDerived();
  },
  setSonstigeKosten: (v: number) => {
    set({ sonstige_kosten: v, generatedComment: '' });
    get().updateDerived();
  },
  setFlaeche: (v: number) => {
    set({ flaeche: v, generatedComment: '' });
    get().updateDerived();
  },
  setAdresse: (v: string) => {
    // Bundesland aus der PLZ ableiten und den Satz vorbelegen, solange der Nutzer nichts selbst gesetzt hat
    const land = get().grunderwerbsteuerManuell ? null : bundeslandAusAdresse(v);
    set({
      adresse: v,
      generatedComment: '',
      ...(land ? { bundesland: land, grunderwerbsteuer_pct: BUNDESLAENDER[land].satz } : {}),
    });
    get().updateDerived();
  },
  setZimmer: (v: number) => {
    set({ zimmer: v, generatedComment: '' });
    get().updateDerived();
  },
  setBaujahr: (v: number) => {
    const newAfa = getDefaultAfa(v);
    set({ baujahr: v, afa: newAfa, generatedComment: '' });
    get().updateDerived();
  },
  setMiete: (v: number) => {
    set({ miete: v, generatedComment: '' });
    get().updateDerived();
  },
  setHausgeld: (v: number) => {
    // Ein geänderter Wert gilt als geprüft; Verlassen des Felds ohne Änderung nicht
    const geaendert = Math.abs(v - get().hausgeld) >= 0.005;
    set({
      hausgeld: v,
      generatedComment: '',
      ...(geaendert ? { importUnsicher: get().importUnsicher.filter(f => f !== 'hausgeld') } : {}),
    });
    get().updateDerived();
  },
  setHausgeldUmlegbar: (v: number) => {
    set({ hausgeld_umlegbar: v, generatedComment: '' });
    get().updateDerived();
  },
  setMietausfallPct: (v: number) => {
    set({ mietausfall_pct: v, generatedComment: '' });
    get().updateDerived();
  },
  setInstandhaltungskostenProQm: (v: number) => {
    set({ instandhaltungskosten_pro_qm: v, generatedComment: '' });
    get().updateDerived();
  },
  setSteuer: (v: number) => {
    set({ steuer: v, generatedComment: '' });
    get().updateDerived();
  },
  setAfa: (v: number) => {
    set({ afa: v, generatedComment: '' });
    get().updateDerived();
  },
  setRuecklagen: (v: number) => {
    set({ ruecklagen: v, generatedComment: '' });
    get().updateDerived();
  },
  setPersoenlicherSteuersatz: (v: number) => {
    set({ persoenlicher_steuersatz: v, generatedComment: '' });
    get().updateDerived();
  },
  // Eingabe des Nutzers
  setEk: (v: number) => {
    set({ ek: v, ekManuell: true, generatedComment: '' });
    get().updateDerived();
  },
  // Vorbelegung (Kaufnebenkosten + 10 % des Kaufpreises): nur solange der Nutzer nichts eingetragen hat
  setEkStartwert: (v: number) => {
    if (get().ekManuell || get().ek === v) return;
    set({ ek: v, generatedComment: '' });
    get().updateDerived();
  },
  bestaetigeImportFeld: (feld: ImportFeld) => {
    if (!get().importUnsicher.includes(feld)) return;
    set({ importUnsicher: get().importUnsicher.filter(f => f !== feld) });
  },
  erledigeImportFeld: (feld: ImportFeld) => {
    if (!get().importFehlend.includes(feld)) return;
    set({ importFehlend: get().importFehlend.filter(f => f !== feld) });
  },
  setZins: (v: number) => {
    set({ zins: v, generatedComment: '' });
    get().updateDerived();
  },
  setTilgung: (v: number) => {
    set({ tilgung: v, generatedComment: '' });
    get().updateDerived();
  },
  setGeneratedComment: (v: string) => {
    set({ generatedComment: v });
  },
  setLageComment: (v: string) => {
    set({ lageComment: v });
  },
  setMietpreisComment: (v: string) => {
    set({ mietpreisComment: v });
  },
  setQmPreisComment: (v: string) => {
    set({ qmPreisComment: v });
  },
  setInvestComment: (v: string) => {
    set({ investComment: v });
  },
  setMarktResearch: ({ facts, mietDelta, kaufDelta }) => {
    set({ marktFacts: facts, mietMarktDelta: mietDelta, kaufMarktDelta: kaufDelta });
  },
  setAnzahlWohneinheiten: (v: number) => {
    set({ anzahl_wohneinheiten: v, generatedComment: '' });
    get().updateDerived();
  },
  setVerwaltungskosten: (v: number) => {
    set({ verwaltungskosten: v, generatedComment: '' });
    get().updateDerived();
  },
  setAnalysisId: (v: string) => {
    set({ analysisId: v });
  },

  // AfA-Turbo Setter (vereinfacht)
  setAfaModell: (v: AfaModell) => {
    // Update auch den afa-Satz für Rückwärtskompatibilität
    const s = get();
    const newAfaSatz = getAfaSatzFromModell(v, s.nutzeSonderAfa);
    set({ afaModell: v, afa: newAfaSatz, generatedComment: '' });
    get().updateDerived();
  },
  setNutzeSonderAfa: (v: boolean) => {
    const s = get();
    const newAfaSatz = getAfaSatzFromModell(s.afaModell, v);
    set({ nutzeSonderAfa: v, afa: newAfaSatz, generatedComment: '' });
    get().updateDerived();
  },
  setGrundstueckswert: (v: number) => {
    set({ grundstueckswert: v, generatedComment: '' });
    get().updateDerived();
  },

  importData: (eingang) => {
    // Gespeicherte und importierte Stände tragen null für fehlende Angaben, der Store 0 (Feld leer)
    const grEStOffen = (eingang as Record<string, unknown>).grunderwerbsteuer_pct === null;
    const data = nullAlsLeererWert(eingang as Record<string, unknown>) as typeof eingang;
    if (grEStOffen) delete (data as Record<string, unknown>).grunderwerbsteuer_pct;
    // Automatically calculate AfA based on baujahr if not explicitly provided
    const updates = { ...data, ...(grEStOffen ? { grunderwerbsteuer_pct: 0 } : {}) };
    if (data.baujahr !== undefined && data.afa === undefined) {
      updates.afa = getDefaultAfa(data.baujahr);
    }

    // Migration für alte Daten ohne AfA-Turbo Felder
    if (data.afaModell === undefined && data.baujahr !== undefined) {
      updates.afaModell = getDefaultAfaModell(data.baujahr);
      updates.nutzeSonderAfa = false;
      // Grundstückswert auf 20% des Kaufpreises setzen wenn nicht vorhanden
      if (data.grundstueckswert === undefined && data.kaufpreis) {
        updates.grundstueckswert = Math.round(data.kaufpreis * 0.2);
      }
    }

    // Gespeicherte Stände ohne die neuen Merker: vorhandene Werte gelten als vom Nutzer gesetzt
    if (data.grunderwerbsteuer_pct !== undefined && data.grunderwerbsteuerManuell === undefined) {
      updates.grunderwerbsteuerManuell = true;
    }
    if (data.ek !== undefined && data.ekManuell === undefined) {
      updates.ekManuell = true;
    }
    if (data.importQuelle !== undefined && data.importQuelle !== 'url' && data.importQuelle !== 'screenshot') {
      updates.importQuelle = null;
    }
    if (data.bundesland !== undefined && !istBundesland(data.bundesland)) {
      updates.bundesland = null;
    }
    // Neuer Import oder Adresse ohne Satz: Bundesland aus der PLZ ableiten
    if (data.adresse !== undefined && data.grunderwerbsteuer_pct === undefined && !get().grunderwerbsteuerManuell) {
      const land = bundeslandAusAdresse(data.adresse);
      if (land) {
        updates.bundesland = land;
        updates.grunderwerbsteuer_pct = BUNDESLAENDER[land].satz;
      }
    } else if (data.adresse !== undefined && data.bundesland === undefined) {
      updates.bundesland = bundeslandAusAdresse(data.adresse);
    }

    set(updates);
    get().updateDerived();
  },

  resetAnalysis: () => {
    // Sonst stellt die Step-Seite den Stand der vorherigen Analyse wieder her
    clearAutosave();
    set(initialState);
  },

  loadAnalysis: async (id: string, userId: string | null = null) => {
    try {
      if (typeof window === 'undefined') return false;

      const { loadAnalysis: loadFromStorage } = await import('@/lib/storage');

      // 1) Lokale Kopie (schnell, auch offline)
      let data: Record<string, unknown> | null = loadFromStorage(userId, id);

      // 2) Sonst aus Supabase (anderes Gerät, gelöschte Browserdaten)
      if (!data && userId) {
        const res = await fetch(`/api/analysis/${encodeURIComponent(id)}`);
        if (res.ok) {
          const json = (await res.json()) as { analysis?: Record<string, unknown> };
          data = json.analysis ?? null;
        }
      }
      if (!data) return false;

      // Vorherigen Zustand verwerfen, damit keine Felder der zuletzt geöffneten Analyse übrig bleiben
      clearAutosave();
      set({ ...initialState });
      get().importData({ ...(data as Partial<ImmoState>), analysisId: id });
      return true;
    } catch (error) {
      console.error('Failed to load analysis:', error);
      return false;
    }
  },

  exportState: () => {
    const state = get();
    return leereWerteAlsNull({
      analysisId: state.analysisId,
      analysisName: state.analysisName || state.adresse || 'Unbenannte Analyse',
      createdAt: state.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      kaufpreis: state.kaufpreis,
      objekttyp: state.objekttyp,
      grunderwerbsteuer_pct: state.grunderwerbsteuer_pct,
      bundesland: state.bundesland,
      grunderwerbsteuerManuell: state.grunderwerbsteuerManuell,
      notar_pct: state.notar_pct,
      makler_pct: state.makler_pct,
      sonstige_kosten: state.sonstige_kosten,
      flaeche: state.flaeche,
      adresse: state.adresse,
      zimmer: state.zimmer,
      baujahr: state.baujahr,
      miete: state.miete,
      hausgeld: state.hausgeld,
      hausgeld_umlegbar: state.hausgeld_umlegbar,
      mietausfall_pct: state.mietausfall_pct,
      anzahl_wohneinheiten: state.anzahl_wohneinheiten,
      verwaltungskosten: state.verwaltungskosten,
      instandhaltungskosten_pro_qm: state.instandhaltungskosten_pro_qm,
      steuer: state.steuer,
      afa: state.afa,
      ruecklagen: state.ruecklagen,
      persoenlicher_steuersatz: state.persoenlicher_steuersatz,
      ek: state.ek,
      ekManuell: state.ekManuell,
      importFehlend: state.importFehlend,
      importUnsicher: state.importUnsicher,
      importHinweise: state.importHinweise,
      importQuelle: state.importQuelle,
      zins: state.zins,
      tilgung: state.tilgung,
      cashflow_operativ: state.cashflow_operativ,
      nettorendite: state.nettorendite,
      score: state.score,
      anschaffungskosten: state.anschaffungskosten,
      generatedComment: state.generatedComment,
      lageComment: state.lageComment,
      mietpreisComment: state.mietpreisComment,
      qmPreisComment: state.qmPreisComment,
      investComment: state.investComment,
      marktFacts: state.marktFacts,
      mietMarktDelta: state.mietMarktDelta,
      kaufMarktDelta: state.kaufMarktDelta,

      // AfA-Turbo Felder (vereinfacht)
      afaModell: state.afaModell,
      nutzeSonderAfa: state.nutzeSonderAfa,
      grundstueckswert: state.grundstueckswert,
    });
  },
}));
