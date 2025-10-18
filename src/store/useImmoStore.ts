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
  kaufpreis: number;
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
  cashflow_operativ: number;
  nettorendite: number;
  score: number;
  anschaffungskosten: number;

  
  updateDerived: () => void;   

  setKaufpreis: (v: number) => void;
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

}

// Typ für die Set-Funktion: akzeptiert partielle ImmoState-Updates
type SetFn = (state: Partial<ImmoState>) => void;

export const useImmoStore = create<ImmoState>((set: SetFn, get) => ({
  // Initialwerte
  kaufpreis: 0,
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
}));
