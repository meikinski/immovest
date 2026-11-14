/**
 * Tests für Importe mit fehlenden Angaben ("Preis auf Anfrage")
 *
 * Ausführen mit `npx tsx src/lib/__tests__/import-pruefung.test.ts`
 */

import fs from 'node:fs';
import path from 'node:path';
import { mapImmoscoutExpose } from '../immoscoutMobileApi';
import { bereinigeHinweise, echterWert, fehlendHinweis, hatGenugDaten, pruefeImport } from '../importPruefung';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAILED: ${message}`);
  }
  console.log(`✓ ${message}`);
}

type Attribut = { label?: string; text?: string; type?: string };
type Expose = { adTargetingParameters: Record<string, string>; sections: Array<{ attributes?: Attribut[] }> };
const ladeFixture = (): Expose =>
  JSON.parse(fs.readFileSync(path.join(__dirname, '../__fixtures__/immoscout-expose-169364993.json'), 'utf8'));

// --- Vollständiges Inserat bleibt unverändert ---
const voll = pruefeImport(mapImmoscoutExpose(ladeFixture()));
assert(voll.daten.kaufpreis === 399000 && voll.daten.flaeche === 111, 'Vollständiges Inserat: Kaufpreis und Fläche übernommen');
assert(!voll.fehlend.includes('kaufpreis') && !voll.fehlend.includes('flaeche') && !voll.fehlend.includes('adresse'), 'Vollständiges Inserat: Kernangaben fehlen nicht');
assert(hatGenugDaten(voll.fehlend), 'Vollständiges Inserat ist brauchbar');

// --- "Preis auf Anfrage": das Portal liefert 1 € als Platzhalter ---
const anfrage = ladeFixture();
anfrage.adTargetingParameters.obj_purchasePrice = '1';
for (const s of anfrage.sections) {
  for (const a of s.attributes ?? []) {
    if (a.label?.startsWith('Kaufpreis')) a.text = '1 €';
  }
}
anfrage.sections.push({ attributes: [
  { label: 'Mieteinnahmen pro Monat:', text: '1 €', type: 'TEXT' },
  { label: 'Hausgeld:', text: '1 €', type: 'TEXT' },
] });
const roh = mapImmoscoutExpose(anfrage);
assert(roh.kaufpreis === 1 && roh.miete === 1 && roh.hausgeld === 1, 'Ausgangslage: Portal liefert 1 € für Kaufpreis, Miete und Hausgeld');
const p = pruefeImport(roh);
assert(p.daten.kaufpreis === null, 'Kaufpreis 1 € wird nicht übernommen (bleibt leer)');
assert(p.daten.miete === null, 'Kaltmiete 1 € wird nicht übernommen (bleibt leer)');
assert(p.daten.hausgeld === null, 'Hausgeld 1 € wird nicht übernommen (bleibt leer)');
assert(p.daten.flaeche === 111 && typeof p.daten.adresse === 'string', 'Vorhandene Angaben bleiben erhalten');
assert(p.fehlend.join(',') === 'kaufpreis,miete,hausgeld', 'Fehlend: Kaufpreis, Kaltmiete, Hausgeld');
assert(
  fehlendHinweis(p.fehlend) === 'Diese Angaben fehlen im Inserat: Kaufpreis, Kaltmiete, Hausgeld. Bitte ergänze sie.',
  'Hinweistext für die erste Eingabeseite'
);
assert(hatGenugDaten(p.fehlend), 'Inserat ohne Preis bleibt importierbar (Fläche und Adresse sind da)');

// --- Einzelne Regeln ---
assert(echterWert('kaufpreis', 0) === null && echterWert('kaufpreis', 1) === null && echterWert('kaufpreis', 999) === null, 'Kaufpreis 0, 1 oder unter 1.000 € ist ein Platzhalter');
assert(echterWert('kaufpreis', 215000) === 215000, 'Echter Kaufpreis bleibt');
assert(echterWert('miete', 1) === null && echterWert('miete', 468.33) === 468.33, 'Miete: 1 € ist Platzhalter, 468,33 € ist echt');
assert(echterWert('hausgeld', null) === null && echterWert('hausgeld', undefined) === null && echterWert('hausgeld', NaN) === null, 'null, undefined und NaN gelten als fehlend');
assert(echterWert('baujahr', 1969) === 1969 && echterWert('baujahr', 1) === null, 'Baujahr 1 ist ein Platzhalter');

const haus = pruefeImport({ kaufpreis: 450000, flaeche: 140, adresse: '01067 Dresden', miete: null, hausgeld: null, zimmer: 5, baujahr: 1995, objekttyp: 'haus' });
assert(haus.fehlend.join(',') === 'miete', 'Haus: fehlendes Hausgeld wird nicht gemeldet');
const mfh = pruefeImport({ kaufpreis: 850000, flaeche: 420, adresse: '50667 Köln', miete: 4800, hausgeld: null, zimmer: null, baujahr: 1995, objekttyp: 'mfh' });
assert(mfh.fehlend.length === 0, 'MFH: Zimmer und Hausgeld sind keine Pflichtangaben');
const leer = pruefeImport({ kaufpreis: 1, flaeche: 0, adresse: '', miete: 1, hausgeld: 1, zimmer: null, baujahr: null, objekttyp: 'wohnung' });
assert(!hatGenugDaten(leer.fehlend), 'Ohne Kaufpreis, Fläche und Adresse ist der Import nicht brauchbar');
const split = pruefeImport({ kaufpreis: 200000, flaeche: 50, adresse: '04109 Leipzig', miete: 600, hausgeld: 1, hausgeld_umlegbar: 0.6, hausgeld_nicht_umlegbar: 0.4, zimmer: 2, baujahr: 1990, objekttyp: 'wohnung' });
assert(split.daten.hausgeld_umlegbar === null && split.daten.hausgeld_nicht_umlegbar === null, 'Aufteilung eines Platzhalter-Hausgelds wird verworfen');
assert(fehlendHinweis(['miete']) === 'Diese Angabe fehlt im Inserat: Kaltmiete. Bitte ergänze sie.', 'Hinweis im Singular');
assert(fehlendHinweis([]) === '', 'Kein Hinweis, wenn nichts fehlt');

// --- Warnungen für die Anzeige ---
const hinweise = bereinigeHinweise([
  '⚠️ In der Anzeige ist kein Hausgeld angegeben. Bitte beim Anbieter erfragen und manuell nachtragen.',
  'ℹ️ Der Anbieter hat die genaue Adresse nicht veröffentlicht – übernommen wurden nur PLZ, Stadtteil und Stadt.',
  '⚠️ ACHTUNG: Kaltmiete erscheint ungewöhnlich niedrig im Verhältnis zum Hausgeld. Bitte die Werte in der Originalanzeige überprüfen!',
  42,
], ['hausgeld']);
assert(hinweise.length === 2, 'Warnung zu einem ohnehin als fehlend gemeldeten Feld wird nicht doppelt gezeigt');
assert(hinweise[0].startsWith('Der Anbieter hat'), 'Emoji-Präfix wird entfernt');
assert(hinweise[1].startsWith('Kaltmiete erscheint'), '"ACHTUNG:" wird entfernt');
assert(bereinigeHinweise(undefined, []).length === 0, 'Ohne Warnungen leere Liste');

console.log('\nAlle Import-Tests bestanden.');
