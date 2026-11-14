/**
 * Tests für die Wohnung eines Gastes über die Anmeldung hinweg
 *
 * Ausführen mit `npx tsx src/lib/__tests__/anmelde-rueckkehr.test.ts`
 */

// localStorage für Node nachbilden (vor dem Import des Stores)
const speicher = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => speicher.get(k) ?? null,
  setItem: (k: string, v: string) => { speicher.set(k, String(v)); },
  removeItem: (k: string) => { speicher.delete(k); },
  clear: () => speicher.clear(),
  key: (i: number) => [...speicher.keys()][i] ?? null,
  get length() { return speicher.size; },
} as Storage;

import { useImmoStore } from '../../store/useImmoStore';
import {
  anmeldeZiel, hatGastWohnung, holeAnmeldeRueckkehr, MAX_ALTER_MS, sichereAnalyseVorAnmeldung, sichereGastWohnung,
  stelleGastWohnungWiederHer,
} from '../anmeldeRueckkehr';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAILED: ${message}`);
  console.log(`✓ ${message}`);
}

const SCHLUESSEL = 'anmelde_rueckkehr_analyse';
const store = () => useImmoStore.getState();

function wohnungEingeben(adresse = 'Teststraße 1, 10115 Berlin', kaufpreis = 250000) {
  store().resetAnalysis();
  store().importData({ adresse, kaufpreis, miete: 900, flaeche: 60 });
}

function leer() {
  speicher.clear();
  store().resetAnalysis();
}

// 1) Leerer Stand wird nie gesichert
leer();
sichereGastWohnung();
assert(!hatGastWohnung(), 'Ohne Kaufpreis wird nichts gesichert');
assert(anmeldeZiel() === '/input-method', 'Ohne gesicherte Wohnung geht es nach der Anmeldung zur Eingabe');

// 2) Gast-Wohnung übersteht das Zurücksetzen (z. B. /input-method nach der Anmeldung)
leer();
wohnungEingeben();
sichereGastWohnung();
assert(hatGastWohnung(), 'Wohnung des Gastes ist gesichert');
assert(anmeldeZiel() === '/step/tabs', 'Mit gesicherter Wohnung geht es nach der Anmeldung zum Ergebnis');
store().resetAnalysis();
assert(store().kaufpreis === 0, 'Store ist nach dem Zurücksetzen leer');
assert(stelleGastWohnungWiederHer(), 'Wiederherstellen in einen leeren Store gelingt');
assert(store().kaufpreis === 250000 && store().adresse === 'Teststraße 1, 10115 Berlin', 'Kaufpreis und Adresse sind wieder da');

// 3) Eine andere geöffnete Analyse wird nie überschrieben
leer();
wohnungEingeben();
sichereGastWohnung();
wohnungEingeben('Andere Straße 5, 80331 München', 400000);
assert(!stelleGastWohnungWiederHer(), 'Andere offene Analyse: nicht wiederherstellen');
assert(store().adresse === 'Andere Straße 5, 80331 München' && store().kaufpreis === 400000, 'Offene Analyse bleibt unverändert');

// 4) Abholen nach der Anmeldung: Bereich aus der gesperrten Vorschau, danach verbraucht
leer();
wohnungEingeben();
sichereAnalyseVorAnmeldung('markt');
sichereGastWohnung(); // laufendes Sichern auf der Ergebnis-Seite behält den Bereich
store().resetAnalysis();
const r = holeAnmeldeRueckkehr();
assert(r?.bereich === 'markt', 'Bereich der gesperrten Vorschau bleibt erhalten und wird zurückgegeben');
assert(store().kaufpreis === 250000, 'Wohnung ist beim Abholen wiederhergestellt');
assert(!hatGastWohnung() && holeAnmeldeRueckkehr() === null, 'Rückkehr wird nur einmal abgeholt');

// 5) Anmeldung über die Kopfzeile: kein Bereich, nur das Ergebnis
leer();
wohnungEingeben();
sichereGastWohnung();
assert(holeAnmeldeRueckkehr()?.bereich === null, 'Ohne gesperrten Bereich: nur Ergebnis, keine automatische Analyse');

// 6) Andere Wohnung: alter Bereich wird nicht übernommen
leer();
wohnungEingeben();
sichereAnalyseVorAnmeldung('prognose');
wohnungEingeben('Neue Allee 3, 50667 Köln', 300000);
sichereGastWohnung();
assert(holeAnmeldeRueckkehr()?.bereich === null, 'Neue Wohnung erbt den Bereich der alten nicht');

// 7) Älter als 24 Stunden: verfällt; jünger: gilt
leer();
wohnungEingeben();
sichereGastWohnung();
const eintrag = JSON.parse(speicher.get(SCHLUESSEL)!);
speicher.set(SCHLUESSEL, JSON.stringify({ ...eintrag, zeit: Date.now() - MAX_ALTER_MS + 60_000 }));
assert(hatGastWohnung(), 'Nach 23 Stunden 59 Minuten noch gültig');
speicher.set(SCHLUESSEL, JSON.stringify({ ...eintrag, zeit: Date.now() - MAX_ALTER_MS - 1 }));
assert(!hatGastWohnung(), 'Nach mehr als 24 Stunden verfallen');

// 8) Gesicherter Eintrag ohne Kaufpreis wird nie geladen
leer();
speicher.set(SCHLUESSEL, JSON.stringify({ zeit: Date.now(), bereich: null, adresse: '', daten: { kaufpreis: 0 } }));
assert(!stelleGastWohnungWiederHer() && store().kaufpreis === 0, 'Leerer Eintrag wird nicht geladen');

console.log('\nAlle Tests der Anmelde-Rückkehr bestanden.');
