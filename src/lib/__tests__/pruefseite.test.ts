/**
 * Tests für die Prüfseite nach einem Import: Pflichtangaben, unsichere Werte, Startwerte
 *
 * Ausführen mit `npx tsx src/lib/__tests__/pruefseite.test.ts`
 */

import { findePflichtLuecken, type PflichtWerte } from '../pflichtfelder';
import { unsichereFelder } from '../importPruefung';
import { startAfa, startGebaeudeAnteil, START_INSTANDHALTUNG_PRO_QM, START_MIETAUSFALL_PCT } from '../startwerte';
import { berechneEkStartwert } from '../kennzahlen';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAILED: ${message}`);
  }
  console.log(`✓ ${message}`);
}

const vollstaendig: PflichtWerte = {
  kaufpreis: 399000, adresse: 'Musterstr. 1, 04103 Leipzig', grunderwerbsteuerFehlt: false,
  objekttyp: 'wohnung', flaeche: 111, zimmer: 4, anzahlWohneinheiten: 0, baujahr: 1998,
  miete: 1250, ek: 80000, zins: 3.5, tilgung: 2,
};

// --- Vollständiger Import: nichts offen, Button aktiv ---
assert(findePflichtLuecken(vollstaendig, 2026).length === 0, 'Vollständiger Import: keine offenen Pflichtangaben');

// --- Import ohne Preis ("Preis auf Anfrage") ---
const ohnePreis = findePflichtLuecken({ ...vollstaendig, kaufpreis: 0 }, 2026);
assert(ohnePreis.length === 1 && ohnePreis[0].key === 'kaufpreis', 'Ohne Kaufpreis: genau der Kaufpreis ist offen');
assert(ohnePreis[0].schritt === 'a', 'Kaufpreis gehört zu Schritt 1');

// --- Reihenfolge entspricht den Eingabeschritten ---
const viele = findePflichtLuecken({ ...vollstaendig, kaufpreis: 0, miete: 0, zins: 25, adresse: ' ' }, 2026);
assert(viele.map(l => l.key).join(',') === 'kaufpreis,adresse,miete,zins', 'Lücken in Schrittreihenfolge');

// --- Ungültige Werte ---
assert(findePflichtLuecken({ ...vollstaendig, flaeche: 5 }, 2026)[0]?.text.includes('mindestens 10'), 'Fläche unter 10 m² ist ungültig');
assert(findePflichtLuecken({ ...vollstaendig, baujahr: 2040 }, 2026)[0]?.key === 'baujahr', 'Baujahr weit in der Zukunft ist ungültig');
assert(findePflichtLuecken({ ...vollstaendig, grunderwerbsteuerFehlt: true }, 2026)[0]?.key === 'grunderwerbsteuer', 'Ohne Bundesland fehlt die Grunderwerbsteuer');
assert(findePflichtLuecken({ ...vollstaendig, ek: 0 }, 2026).length === 0, 'Eigenkapital 0 ist erlaubt');

// --- Mehrfamilienhaus: Wohneinheiten statt Zimmer ---
const mfh = findePflichtLuecken({ ...vollstaendig, objekttyp: 'mfh', zimmer: 0, anzahlWohneinheiten: 0 }, 2026);
assert(mfh.length === 1 && mfh[0].label === 'Wohneinheiten', 'MFH: Wohneinheiten sind Pflicht, Zimmer nicht');

// --- Unsichere Werte aus den Import-Hinweisen ---
assert(
  unsichereFelder(['Kaltmiete erscheint sehr niedrig (unter 400€). Bitte manuell überprüfen!']).join(',') === 'miete',
  'Hinweis zur Kaltmiete markiert die Kaltmiete'
);
assert(
  unsichereFelder(['Automatisch korrigiert: Agent hatte Kaltmiete und Hausgeld vertauscht. Werte wurden korrigiert.']).join(',') === 'miete,hausgeld',
  'Vertauschte Werte markieren Kaltmiete und Hausgeld'
);
assert(
  unsichereFelder(['Hausgeld-Aufteilung: 60% umlegbar, 40% nicht umlegbar (Standardverteilung)', 'Hausgeld-Verteilung ist Schätzung (60/40)']).length === 0,
  'Hinweise zur 60/40-Aufteilung markieren nicht den Hausgeld-Betrag'
);
assert(unsichereFelder(['Maklergebühr erscheint sehr hoch (7%). Bitte überprüfen']).length === 0, 'Makler-Hinweis betrifft keine Zeile aus dem Inserat');
assert(unsichereFelder(null).length === 0 && unsichereFelder([42]).length === 0, 'Ungültige Hinweise werden ignoriert');

// --- Startwerte ---
assert(startAfa(1900) === 2.5 && startAfa(1998) === 2 && startAfa(2024) === 3 && startAfa(0) === 2, 'AfA-Startwert nach Baujahr');
assert(startGebaeudeAnteil('wohnung') === 75 && startGebaeudeAnteil('haus') === 80 && startGebaeudeAnteil('mfh') === 85, 'Gebäudeanteil je Objektart');
assert(START_MIETAUSFALL_PCT === 1 && START_INSTANDHALTUNG_PRO_QM === 10, 'Startwerte Mietausfall 1 % und Instandhaltung 10 €/m² wie in Schritt 3');

// Eigenkapital: Kaufnebenkosten + 10 % des Kaufpreises, auf 1.000 € gerundet
// 300.000 € in Sachsen (5,5 %), Notar 2 %, Makler 3,57 % → NK 33.210 € + 30.000 € = 63.210 € → 63.000 €
assert(
  berechneEkStartwert({ kaufpreis: 300000, grunderwerbsteuerPct: 5.5, notarPct: 2, maklerPct: 3.57, sonstigeKosten: 0 }) === 63000,
  'Eigenkapital-Startwert: Nebenkosten plus 10 %, gerundet auf 1.000 €'
);

console.log('\nAlle Prüfseiten-Tests bestanden.');
assert(
  unsichereFelder(['Kaltmiete erscheint sehr niedrig (11,26 €/m²). Bitte manuell in der Originalanzeige überprüfen!']).join(',') === 'miete',
  'Miet-Hinweis mit €/m² markiert nicht die Wohnfläche'
);

// --- Unplausibles Hausgeld aus dem Import muss bestätigt werden (wie in Schritt 3) ---
const hg = findePflichtLuecken({ ...vollstaendig, hausgeldUnbestaetigt: true }, 2026);
assert(hg.length === 1 && hg[0].key === 'hausgeld' && hg[0].schritt === 'b', 'Unbestätigtes Hausgeld ist eine offene Pflichtangabe');
assert(findePflichtLuecken({ ...vollstaendig, objekttyp: 'haus', hausgeldUnbestaetigt: true }, 2026).length === 0, 'Bei Häusern zählt die Hausgeld-Bestätigung nicht');
