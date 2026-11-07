import { AUTOSAVE_KEY, useImmoStore } from '@/store/useImmoStore';

/**
 * Gäste auf der Ergebnis-Seite: Eingaben der Wohnung vor der Anmeldung (Google-Redirect oder E-Mail im Modal)
 * sichern und merken, welcher Bereich freigeschaltet werden sollte. Nach der Rückkehr landet man wieder
 * bei derselben Wohnung und die vollständige Analyse startet automatisch.
 */

const SPEICHER = 'anmelde_rueckkehr_analyse';
const MAX_ALTER_MS = 60 * 60 * 1000;

export type GesperrterBereich = 'ki' | 'markt' | 'prognose';

type Gesichert = { zeit: number; bereich: GesperrterBereich; adresse: string; daten: Record<string, unknown> };

export function sichereAnalyseVorAnmeldung(bereich: GesperrterBereich) {
  try {
    const daten = useImmoStore.getState().exportState() as Record<string, unknown>;
    const adresse = String(useImmoStore.getState().adresse || '');
    const eintrag: Gesichert = { zeit: Date.now(), bereich, adresse, daten };
    localStorage.setItem(SPEICHER, JSON.stringify(eintrag));
    // Autosave sofort schreiben (sonst nur alle 2 s), damit die Seite nach dem Google-Redirect diesen Stand lädt
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(daten));
  } catch { /* privater Modus: dann bleibt nur der normale Autosave */ }
}

/**
 * Gesicherte Anmelde-Rückkehr einmalig abholen. Lädt die gesicherten Eingaben zurück, falls der Store
 * inzwischen eine andere oder gar keine Wohnung enthält. Gibt den Bereich zurück, der geöffnet werden soll.
 */
export function holeAnmeldeRueckkehr(): GesperrterBereich | null {
  try {
    const roh = localStorage.getItem(SPEICHER);
    if (!roh) return null;
    localStorage.removeItem(SPEICHER);
    const eintrag = JSON.parse(roh) as Gesichert;
    if (!eintrag?.daten || Date.now() - eintrag.zeit > MAX_ALTER_MS) return null;
    const store = useImmoStore.getState();
    const gleicheWohnung = store.kaufpreis > 0 && String(store.adresse || '') === eintrag.adresse;
    if (!gleicheWohnung) {
      store.importData(eintrag.daten as Parameters<typeof store.importData>[0]);
      setTimeout(() => useImmoStore.getState().updateDerived(), 0);
    }
    return eintrag.bereich;
  } catch {
    return null;
  }
}

export function hatAnmeldeRueckkehr(): boolean {
  try { return !!localStorage.getItem(SPEICHER); } catch { return false; }
}
