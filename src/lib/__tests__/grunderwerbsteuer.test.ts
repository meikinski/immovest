/**
 * Tests für Grunderwerbsteuer nach Bundesland (PLZ → Bundesland → Satz)
 *
 * Ausführen mit `npx tsx src/lib/__tests__/grunderwerbsteuer.test.ts`
 */

import { BUNDESLAENDER, GRUNDERWERBSTEUER_STAND, type BundeslandCode } from '../../config/grunderwerbsteuer';
import { grunderwerbsteuerFuerAdresse, grunderwerbsteuerFuerBundesland, grunderwerbsteuerLabel } from '../grunderwerbsteuer';
import { bundeslandAusAdresse, bundeslandAusPlz, plzAusAdresse } from '../plzBundesland';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAILED: ${message}`);
  }
  console.log(`✓ ${message}`);
}

// Sätze aus der Config
const erwartet: Record<BundeslandCode, number> = {
  BW: 5.0, BY: 3.5, BE: 6.0, BB: 6.5, HB: 5.5, HH: 5.5, HE: 6.0, MV: 6.0,
  NI: 5.0, NW: 6.5, RP: 5.0, SL: 6.5, SN: 5.5, ST: 5.0, SH: 6.5, TH: 5.0,
};
assert(Object.keys(BUNDESLAENDER).length === 16, 'Alle 16 Bundesländer sind hinterlegt');
for (const [code, satz] of Object.entries(erwartet) as Array<[BundeslandCode, number]>) {
  assert(BUNDESLAENDER[code].satz === satz, `${BUNDESLAENDER[code].name}: ${satz} %`);
}
assert(/^\d{4}-\d{2}-\d{2}$/.test(GRUNDERWERBSTEUER_STAND), 'Prüfdatum ist hinterlegt');

// PLZ → Bundesland (Landeshauptstädte und Grenzfälle)
const plz: Array<[string, BundeslandCode]> = [
  ['70173', 'BW'], ['80331', 'BY'], ['10115', 'BE'], ['14467', 'BB'], ['28195', 'HB'], ['27568', 'HB'],
  ['20095', 'HH'], ['65183', 'HE'], ['19053', 'MV'], ['30159', 'NI'], ['40210', 'NW'], ['55116', 'RP'],
  ['66111', 'SL'], ['01067', 'SN'], ['04109', 'SN'], ['39104', 'ST'], ['24103', 'SH'], ['99084', 'TH'],
  ['89073', 'BW'], ['89231', 'BY'], ['63739', 'BY'], ['68159', 'BW'], ['67059', 'RP'], ['22844', 'SH'],
  ['21029', 'HH'], ['50767', 'NW'],
];
for (const [p, land] of plz) assert(bundeslandAusPlz(p) === land, `PLZ ${p} → ${land}`);

assert(bundeslandAusPlz('1234') === null, 'Vierstellige PLZ ergibt kein Bundesland');
assert(bundeslandAusPlz('00000') === null, 'PLZ 00000 ergibt kein Bundesland');
assert(bundeslandAusPlz(null) === null, 'Fehlende PLZ ergibt kein Bundesland');

// Adresse → PLZ
assert(plzAusAdresse('Musterstraße 12, 04109 Leipzig') === '04109', 'PLZ wird aus der Adresse gelesen');
assert(plzAusAdresse('Hauptstraße 100, 50767 Köln, Deutschland') === '50767', 'Hausnummer wird nicht als PLZ gelesen');
assert(plzAusAdresse('Leipzig') === null, 'Adresse ohne PLZ ergibt keine PLZ');
assert(plzAusAdresse('Tel. 0341123456') === null, 'Längere Ziffernfolgen sind keine PLZ');
assert(bundeslandAusAdresse('50767 Heimersdorf, Köln') === 'NW', 'Bundesland aus importierter Adresse ohne Straße');

// Adresse → Satz
const leipzig = grunderwerbsteuerFuerAdresse('Musterstraße 12, 04109 Leipzig');
assert(leipzig !== null && leipzig.bundesland === 'SN' && leipzig.satz === 5.5, 'Leipzig: Sachsen, 5,5 %');
assert(grunderwerbsteuerFuerAdresse('Marienplatz 1, 80331 München')?.satz === 3.5, 'München: 3,5 %');
assert(grunderwerbsteuerFuerAdresse('Irgendwo ohne PLZ') === null, 'Ohne ableitbares Bundesland kein Satz (keine Annahme von 6,5 %)');
assert(grunderwerbsteuerFuerAdresse('') === null, 'Leere Adresse: kein Satz');
assert(grunderwerbsteuerFuerBundesland('HB').satz === 5.5, 'Direkte Wahl des Bundeslands liefert den Satz');
assert(grunderwerbsteuerLabel('SN') === 'Sachsen: 5,5 %', 'Anzeige neben dem Feld: "Sachsen: 5,5 %"');
assert(grunderwerbsteuerLabel('BW') === 'Baden-Württemberg: 5,0 %', 'Anzeige mit einer Nachkommastelle');

console.log('\nAlle Grunderwerbsteuer-Tests bestanden.');
