/**
 * PLZ → Bundesland.
 *
 * Erzeugt aus den GeoNames-Postleitzahlen (CC BY 4.0, https://www.geonames.org, über
 * github.com/zauberware/postal-codes-json-xml-csv). Jeder Eintrag "PLZ+Kürzel" markiert den Beginn eines
 * Bereichs, der bis zum nächsten Eintrag gilt. PLZ, die in zwei Ländern liegen (31 Stück), sind dem Land
 * mit den meisten Orten zugeordnet, offensichtliche Fehleinträge (Land grenzt nicht an) sind entfernt. Deshalb bleibt der Steuersatz im Formular immer änderbar.
 */
import type { BundeslandCode } from '@/config/grunderwerbsteuer';

const BEREICHE_ROH = [
  '01053SN 01945BB 02619SN 03039BB 04022SN 04600TH 04643SN 04895BB 06073ST 06553TH 06618ST 07318TH',
  '07919SN 07922TH 07952SN 07955TH 07985SN 07987TH 08037SN 10026BE 10858BB 10859BE 10908BB 10910NW',
  '10912BE 12521BB 12524BE 12529BB 12552BE 12712BB 13047BE 13660BB 14045BE 14322BB 14328BE 14329BB',
  '14457BE 14458BB 15227BE 15228BB 17030MV 17268BB 17305MV 17326BB 17328MV 19309BB 19367MV 20038HH',
  '21039SH 21071HH 21172NI 21175HH 21217NI 21462SH 21522NI 21524SH 21614NI 22032HH 22113SH 22115HH',
  '22139SH 22143HH 22145SH 22147HH 22780HE 22781BW 22782HH 22839SH 23923MV 24088SH 26060BY 26090NI',
  '27498SH 27499HH 27554HB 27607NI 28100HB 28104NI 28105HB 28182NI 28183HB 28788NI 29410ST 29439NI',
  '30686NW 30689NI 31774NW 31778NI 32042NW 34105HE 34346NI 34359HE 34414NW 34454HE 35508BY 35509HE',
  '36404TH 37069NI 37213HE 37308TH 37412NI 37669NW 37691NI 37696NW 37697NI 38486ST 38516NI 38817ST',
  '38999NI 39014ST 40180NW 48455NI 48477NW 48480NI 48485NW 48488NI 48493NW 48499NI 48563NW 49068NI',
  '49447NW 49448NI 49475NW 49562NI 50123NW 50423HH 50424SL 50425NW 51598RP 51641NW 53423RP 53602NW',
  '53619RP 53637NW 54187RP 55246HE 55257RP 56476HE 56477RP 57068NW 57517RP 58079NW 59969HE 60647BE',
  '60651NW 60699HE 63715BY 64271HE 65164NW 65166HE 65558RP 65589HE 65623RP 65627HE 65629RP 65717HE',
  '66087SL 66482RP 66538SL 66849RP 68051BW 68517HE 68526BW 68619HE 68721BW 69239HE 69242BW 69483HE',
  '69493BW 69509HE 69514BW 69517HE 70131BW 76725RP 77633BW 78458BY 78459BW 80097BY 88038BW 88129BY',
  '88147BW 88149BY 88209BW 89090BY 89129BW 89229BY 89516BW 90051BY 96035BE 96039NW 96044BY 96063HE',
  '96076BE 96077BY 96515TH 97024BY 97877BW 97892BY 97896BW 97901BY 97922BW 98496TH',
].join(' ');

const BEREICHE: Array<[number, BundeslandCode]> = BEREICHE_ROH.split(' ').map(
  e => [Number(e.slice(0, 5)), e.slice(5) as BundeslandCode]
);

/** Bundesland zu einer fünfstelligen PLZ, sonst null */
export function bundeslandAusPlz(plz: string | null | undefined): BundeslandCode | null {
  if (!plz || !/^\d{5}$/.test(plz)) return null;
  const n = Number(plz);
  if (n < BEREICHE[0][0] || n > 99998) return null;
  let lo = 0;
  let hi = BEREICHE.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (BEREICHE[mid][0] <= n) lo = mid;
    else hi = mid - 1;
  }
  return BEREICHE[lo][1];
}

/** Erste fünfstellige PLZ in einer Adresse ("Musterstr. 1, 04109 Leipzig" → "04109") */
export function plzAusAdresse(adresse: string | null | undefined): string | null {
  const m = (adresse ?? '').match(/(?<!\d)\d{5}(?!\d)/);
  return m ? m[0] : null;
}

export function bundeslandAusAdresse(adresse: string | null | undefined): BundeslandCode | null {
  return bundeslandAusPlz(plzAusAdresse(adresse));
}
