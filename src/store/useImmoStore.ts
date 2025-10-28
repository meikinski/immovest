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
  objekttyp: 'wohnung' | 'haus';
  grunderwerbsteuer_pct: number;
  notar_pct: number;
  makler_pct: number;
  flaeche: number;
  adresse: string;
  zimmer: number;
  baujahr: number;
  miete: number;
  hausgeld: number;
  hausgeld_umlegbar: number;
  mietausfall_pct: number;
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

  // Methods
  updateDerived: () => void;
  resetAnalysis: () => void;
  loadAnalysis: (id: string, userId?: string | null) => Promise<boolean>;
  exportState: () => Record<string, unknown>;

  setKaufpreis: (v: number) => void;
  setObjekttyp: (v: 'wohnung' | 'haus') => void;
  setGrunderwerbsteuerPct: (v: number) => void;
  setNotarPct: (v: number) => void;
  setMaklerPct: (v: number) => void;
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
  importData: (data: Partial<ImmoState>) => void;
}

// Typ für die Set-Funktion: akzeptiert partielle ImmoState-Updates
type SetFn = (state: Partial<ImmoState>) => void;

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
  flaeche: 0,
  adresse: '',
  zimmer: 0,
  baujahr: new Date().getFullYear(),
  miete: 0,
  hausgeld: 0,
  hausgeld_umlegbar: 0,
  mietausfall_pct: 0,
  instandhaltungskosten_pro_qm: 0,
  steuer: 0,
  afa: 2,
  ruecklagen: 0,
  persoenlicher_steuersatz: 40,
  ek: 0,
  zins: 3.5,
  tilgung: 2,
  cashflow_operativ: 0,
  nettorendite: 0,
  score: 0,
  anschaffungskosten: 0,
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
      s.ruecklagen
    );
    const nr = berechneNettomietrendite(
      s.miete,
      s.hausgeld,
      s.hausgeld_umlegbar,
      s.kaufpreis,
      s.grunderwerbsteuer_pct,
      s.notar_pct,
      s.makler_pct
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
    set({ kaufpreis: v });
    get().updateDerived();
  },
  setObjekttyp: (v: 'wohnung' | 'haus') => {
    set({ objekttyp: v });
  },
  setGrunderwerbsteuerPct: (v: number) => {
    set({ grunderwerbsteuer_pct: v });
    get().updateDerived();
  },
  setNotarPct: (v: number) => {
    set({ notar_pct: v });
    get().updateDerived();
  },
  setMaklerPct: (v: number) => {
    set({ makler_pct: v });
    get().updateDerived();
  },
  setFlaeche: (v: number) => {
    set({ flaeche: v });
    get().updateDerived();
  },
  setAdresse: (v: string) => {
    set({ adresse: v });
    get().updateDerived();
  },
  setZimmer: (v: number) => {
    set({ zimmer: v });
    get().updateDerived();
  },
  setBaujahr: (v: number) => {
    set({ baujahr: v });
    get().updateDerived();
  },
  setMiete: (v: number) => {
    set({ miete: v });
    get().updateDerived();
  },
  setHausgeld: (v: number) => {
    set({ hausgeld: v });
    get().updateDerived();
  },
  setHausgeldUmlegbar: (v: number) => {
    set({ hausgeld_umlegbar: v });
    get().updateDerived();
  },
  setMietausfallPct: (v: number) => {
    set({ mietausfall_pct: v });
    get().updateDerived();
  },
  setInstandhaltungskostenProQm: (v: number) => {
    set({ instandhaltungskosten_pro_qm: v });
    get().updateDerived();
  },
  setSteuer: (v: number) => {
    set({ steuer: v });
    get().updateDerived();
  },
  setAfa: (v: number) => {
    set({ afa: v });
    get().updateDerived();
  },
  setRuecklagen: (v: number) => {
    set({ ruecklagen: v });
    get().updateDerived();
  },
  setPersoenlicherSteuersatz: (v: number) => {
    set({ persoenlicher_steuersatz: v });
    get().updateDerived();
  },
  setEk: (v: number) => {
    set({ ek: v });
    get().updateDerived();
  },
  setZins: (v: number) => {
    set({ zins: v });
    get().updateDerived();
  },
  setTilgung: (v: number) => {
    set({ tilgung: v });
    get().updateDerived();
  },
  importData: (data) => {
    set(data);
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
    };
  },
}));
