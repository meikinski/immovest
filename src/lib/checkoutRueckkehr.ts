import { AUTOSAVE_KEY, useImmoStore } from '@/store/useImmoStore';

/**
 * Eingaben der gerade geprüften Wohnung über den Stripe-Checkout retten, damit man nach der Zahlung
 * direkt wieder in ihrer Analyse landet statt neu anzufangen.
 */

const SPEICHER = 'checkout_rueckkehr_analyse';
const MAX_ALTER_MS = 24 * 60 * 60 * 1000;

type Gesichert = { zeit: number; zielTab: string | null; daten: Record<string, unknown> };

export function sichereAnalyseVorCheckout(zielTab: string | null) {
  try {
    const daten = useImmoStore.getState().exportState() as Record<string, unknown>;
    const eintrag: Gesichert = { zeit: Date.now(), zielTab, daten };
    localStorage.setItem(SPEICHER, JSON.stringify(eintrag));
    // Autosave ebenfalls aktualisieren, damit die Seite nach der Rückkehr sofort diesen Stand lädt
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(daten));
  } catch { /* privater Modus: dann bleibt nur der normale Autosave */ }
}

/** Gesicherte Analyse zurück in den Store laden. Gibt den Tab zurück, der geöffnet werden soll. */
export function stelleAnalyseNachCheckoutWiederHer(): { wiederhergestellt: boolean; zielTab: string | null } {
  try {
    const roh = localStorage.getItem(SPEICHER);
    if (!roh) return { wiederhergestellt: false, zielTab: null };
    const eintrag = JSON.parse(roh) as Gesichert;
    if (!eintrag?.daten || Date.now() - eintrag.zeit > MAX_ALTER_MS) {
      localStorage.removeItem(SPEICHER);
      return { wiederhergestellt: false, zielTab: null };
    }
    const store = useImmoStore.getState();
    store.importData(eintrag.daten as Parameters<typeof store.importData>[0]);
    setTimeout(() => useImmoStore.getState().updateDerived(), 0);
    return { wiederhergestellt: true, zielTab: eintrag.zielTab };
  } catch {
    return { wiederhergestellt: false, zielTab: null };
  }
}

export function vergissGesicherteAnalyse() {
  try { localStorage.removeItem(SPEICHER); } catch { /* privater Modus */ }
}
