import { AUTOSAVE_KEY, useImmoStore } from '@/store/useImmoStore';

/**
 * Wohnung eines Gastes über die Anmeldung retten (Google-Redirect, E-Mail-Bestätigung, Kopfzeile „Anmelden").
 * Gäste auf der Ergebnis-Seite sichern ihre Eingaben laufend unter einem eigenen Schlüssel, getrennt vom Autosave
 * (den /input-method beim Start leert). Nach jeder Anmeldung innerhalb von 24 Stunden landet man wieder beim
 * Ergebnis dieser Wohnung. Kam die Anmeldung über eine gesperrte Vorschau, startet die vollständige Analyse.
 */

const SPEICHER = 'anmelde_rueckkehr_analyse';
export const MAX_ALTER_MS = 24 * 60 * 60 * 1000;

export type GesperrterBereich = 'ki' | 'markt' | 'prognose';

type Gesichert = { zeit: number; bereich: GesperrterBereich | null; adresse: string; daten: Record<string, unknown> };

function leseEintrag(): Gesichert | null {
  try {
    const roh = localStorage.getItem(SPEICHER);
    if (!roh) return null;
    const eintrag = JSON.parse(roh) as Gesichert;
    if (!eintrag?.daten || !(Number(eintrag.daten.kaufpreis) > 0)) return null;
    if (!(Date.now() - eintrag.zeit <= MAX_ALTER_MS)) return null;
    return eintrag;
  } catch {
    return null;
  }
}

/** Gesicherte Wohnung verwerfen (abgeholt oder durch eine andere offene Analyse überholt) */
export function vergissGastWohnung() {
  try { localStorage.removeItem(SPEICHER); } catch { /* privater Modus */ }
}

/**
 * Aktuelle Wohnung des Gastes sichern. Ohne Kaufpreis passiert nichts: ein leerer Stand überschreibt nie
 * eine gesicherte Wohnung. Ohne Bereich bleibt ein vorher gemerkter Bereich derselben Wohnung erhalten.
 */
export function sichereGastWohnung(bereich?: GesperrterBereich) {
  try {
    const store = useImmoStore.getState();
    if (!(store.kaufpreis > 0)) return;
    const daten = store.exportState() as Record<string, unknown>;
    const adresse = String(store.adresse || '');
    const vorher = leseEintrag();
    const gemerkt = bereich ?? (vorher && vorher.adresse === adresse ? vorher.bereich : null);
    const eintrag: Gesichert = { zeit: Date.now(), bereich: gemerkt, adresse, daten };
    localStorage.setItem(SPEICHER, JSON.stringify(eintrag));
    // Autosave sofort schreiben (sonst nur alle 2 s), damit die Seite nach dem Google-Redirect diesen Stand lädt
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(daten));
  } catch { /* privater Modus: dann bleibt nur der normale Autosave */ }
}

/** Gesperrte Vorschau angeklickt: Wohnung und gewünschten Bereich vor der Anmeldung sichern */
export function sichereAnalyseVorAnmeldung(bereich: GesperrterBereich) {
  sichereGastWohnung(bereich);
}

/** Ziel nach der Anmeldung ohne ausdrücklichen Rücksprung: Ergebnis der gesicherten Wohnung, sonst die Eingabe */
export function anmeldeZiel(): string {
  return hatGastWohnung() ? '/step/tabs' : '/input-method';
}

/** Für useSyncExternalStore: localStorage meldet Änderungen im selben Tab nicht, daher kein Abo */
export const keinAbo = () => () => {};

/** Gibt es eine gesicherte Wohnung aus den letzten 24 Stunden? */
export function hatGastWohnung(): boolean {
  return leseEintrag() !== null;
}

/**
 * Gesicherte Wohnung in den Store laden. Überschreibt nie eine andere geöffnete Analyse und lädt nie einen
 * leeren Stand. Gibt true zurück, wenn der Store danach diese Wohnung enthält.
 */
export function stelleGastWohnungWiederHer(eintrag: Gesichert | null = leseEintrag()): boolean {
  if (!eintrag) return false;
  const store = useImmoStore.getState();
  const offeneAdresse = String(store.adresse || '').trim();
  if (store.kaufpreis > 0 && String(store.adresse || '') === eintrag.adresse) return true;
  if (store.kaufpreis > 0 || offeneAdresse) return false; // andere Analyse offen: bleibt, wie sie ist
  store.importData(eintrag.daten as Parameters<typeof store.importData>[0]);
  useImmoStore.getState().updateDerived();
  try { localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(eintrag.daten)); } catch { /* privater Modus */ }
  return true;
}

/**
 * Nach der Anmeldung auf der Ergebnis-Seite einmalig abholen: Wohnung wiederherstellen (falls nötig) und den
 * Bereich nennen, der automatisch geöffnet werden soll (null: nur das Ergebnis zeigen).
 * Gibt null zurück, wenn nichts gesichert war oder eine andere Analyse offen ist.
 */
export function holeAnmeldeRueckkehr(): { bereich: GesperrterBereich | null } | null {
  const eintrag = leseEintrag();
  vergissGastWohnung();
  if (!eintrag) return null;
  return stelleGastWohnungWiederHer(eintrag) ? { bereich: eintrag.bereich } : null;
}

export type WohnungKurz = { titel: string; kaufpreis: number };

/**
 * Wohnung, die ein Gast vor der Anmeldung eingegeben hat (gesicherte Anmelde-Rückkehr, sonst Autosave).
 * Nur lesen, nichts entfernen: für die Kopfzeile auf /sign-up.
 */
export function leseWohnungFuerAnmeldung(): WohnungKurz | null {
  try {
    let daten: Record<string, unknown> | null = null;
    const roh = localStorage.getItem(SPEICHER);
    if (roh) {
      const eintrag = JSON.parse(roh) as Gesichert;
      if (eintrag?.daten && Date.now() - eintrag.zeit <= MAX_ALTER_MS) daten = eintrag.daten;
    }
    if (!daten) {
      const auto = localStorage.getItem(AUTOSAVE_KEY);
      if (auto) daten = JSON.parse(auto) as Record<string, unknown>;
    }
    const kaufpreis = Number(daten?.kaufpreis) || 0;
    if (!daten || kaufpreis <= 0) return null;
    const zimmer = Number(daten.zimmer) || 0;
    const typ = daten.objekttyp === 'haus' ? 'Haus' : daten.objekttyp === 'mfh' ? 'Mehrfamilienhaus' : 'Wohnung';
    const art = zimmer > 0 && typ === 'Wohnung' ? `${String(zimmer).replace('.', ',')}-Zimmer-Wohnung` : typ;
    const adresse = String(daten.adresse || '').trim();
    return { titel: adresse ? `${art}, ${adresse}` : art, kaufpreis };
  } catch {
    return null;
  }
}
