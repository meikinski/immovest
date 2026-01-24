// src/store/useImmoStore.ts
import { create } from 'zustand';
import {
    berechneCashflowOperativ,
    berechneNettomietrendite,
    berechneScore
  } from '@/lib/calculations';


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
  grunderwerbsteuer_pct: number;
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
  zins: number;
  tilgung: number;

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

  // Methods
  updateDerived: () => void;
  resetAnalysis: () => void;
  loadAnalysis: (id: string, userId?: string | null) => Promise<boolean>;
  exportState: () => Record<string, unknown>;

  setKaufpreis: (v: number) => void;
  setObjekttyp: (v: 'wohnung' | 'haus' | 'mfh') => void;
  setGrunderwerbsteuerPct: (v: number) => void;
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
  setAnzahlWohneinheiten: (v: number) => void;
  setVerwaltungskosten: (v: number) => void;
  importData: (data: Partial<ImmoState>) => void;
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

const currentYear = new Date().getFullYear();

const initialState = {
  // Metadata
  analysisId: null,
  analysisName: '',
  createdAt: null,
  updatedAt: null,

  // Initialwerte
  kaufpreis: 0,
  objekttyp: 'wohnung' as const,
  grunderwerbsteuer_pct: 6.5,
  notar_pct: 2,
  makler_pct: 3.57,
  sonstige_kosten: 0,
  flaeche: 0,
  adresse: '',
  zimmer: 0,
  baujahr: currentYear,
  miete: 0,
  hausgeld: 0,
  hausgeld_umlegbar: 0,
  mietausfall_pct: 0,
  anzahl_wohneinheiten: 0,
  verwaltungskosten: 0,
  instandhaltungskosten_pro_qm: 0,
  steuer: 0,
  afa: getDefaultAfa(currentYear),
  ruecklagen: 0,
  persoenlicher_steuersatz: 40,
  ek: 0,
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
};

export const useImmoStore = create<ImmoState>((set: SetFn, get) => ({
  ...initialState,
  updateDerived: () => {
    const s = get();
    const cf = berechneCashflowOperativ(
      s.miete,
      s.hausgeld,
      s.hausgeld_umlegbar,
      s.mietausfall_pct,
      s.instandhaltungskosten_pro_qm,
      s.kaufpreis,
      s.grunderwerbsteuer_pct,
      s.notar_pct,
      s.makler_pct,
      s.ek,
      s.zins,
      s.tilgung,
      s.steuer,
      s.afa,
      s.ruecklagen,
      s.objekttyp,
      s.verwaltungskosten
    );
    const nr = berechneNettomietrendite(
      s.miete,
      s.hausgeld,
      s.hausgeld_umlegbar,
      s.kaufpreis,
      s.grunderwerbsteuer_pct,
      s.notar_pct,
      s.makler_pct,
      s.objekttyp,
      s.verwaltungskosten
    );

    const darlehensSumme = s.kaufpreis - s.ek;
    const jahresrate = darlehensSumme * ((s.zins + s.tilgung) / 100);

    const breakEvenJahre = cf > 0 ? s.ek / (cf * 12) : Infinity;

    const sc = berechneScore(nr, cf, s.ek, jahresrate, breakEvenJahre);
    console.log('updateDerived →', { cf, nr, sc, ek: s.ek, kaufpreis: s.kaufpreis });
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
  setGrunderwerbsteuerPct: (v: number) => {
    set({ grunderwerbsteuer_pct: v, generatedComment: '' });
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
    set({ adresse: v, generatedComment: '' });
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
    set({ hausgeld: v, generatedComment: '' });
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
  setEk: (v: number) => {
    set({ ek: v, generatedComment: '' });
    get().updateDerived();
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
  setAnzahlWohneinheiten: (v: number) => {
    set({ anzahl_wohneinheiten: v, generatedComment: '' });
    get().updateDerived();
  },
  setVerwaltungskosten: (v: number) => {
    set({ verwaltungskosten: v, generatedComment: '' });
    get().updateDerived();
  },
  importData: (data) => {
    // Automatically calculate AfA based on baujahr if not explicitly provided
    const updates = { ...data };
    if (data.baujahr !== undefined && data.afa === undefined) {
      updates.afa = getDefaultAfa(data.baujahr);
    }
    set(updates);
    get().updateDerived();
  },

  resetAnalysis: () => {
    set(initialState);
  },

  loadAnalysis: async (id: string, userId: string | null = null) => {
    try {
      // For now, load from localStorage
      // TODO: Load from Supabase when implemented
      if (typeof window === 'undefined') return false;

      const { loadAnalysis: loadFromStorage } = await import('@/lib/storage');

      const data = loadFromStorage(userId, id);
      if (!data) return false;

      set({
        ...data,
        analysisId: id,
      });
      get().updateDerived();
      return true;
    } catch (error) {
      console.error('Failed to load analysis:', error);
      return false;
    }
  },

  exportState: () => {
    const state = get();
    return {
      analysisId: state.analysisId,
      analysisName: state.analysisName || state.adresse || 'Unbenannte Analyse',
      createdAt: state.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      kaufpreis: state.kaufpreis,
      objekttyp: state.objekttyp,
      grunderwerbsteuer_pct: state.grunderwerbsteuer_pct,
      notar_pct: state.notar_pct,
      makler_pct: state.makler_pct,
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
    };
  },
}));
