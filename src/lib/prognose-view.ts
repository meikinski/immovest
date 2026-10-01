import type { PrognoseJahr } from './prognose-calculator';

/** Angenommene ETF-Rendite für den Vergleich im Verkaufsziel */
export const ETF_RENDITE = 0.07;
/** Private Veräußerungsgeschäfte mit Immobilien sind nach 10 Jahren steuerfrei (§ 23 EStG) */
export const SPEKULATIONSFRIST_JAHRE = 10;

/**
 * Ein Jahr der Prognose, bezogen auf das Jahresende.
 *
 * `berechnePrognose` liefert pro Eintrag die Restschuld VOR der Tilgung des Jahres
 * und den kumulierten Cashflow INKLUSIVE des Jahres. Für "Stand Ende Jahr X" wird
 * deshalb Restschuld und Immobilienwert aus dem Folgeeintrag gelesen.
 */
export interface PrognoseViewJahr {
  jahr: number;
  /** Volle Jahre seit Kauf */
  haltedauer: number;

  restschuld: number;
  immobilienwert: number;
  /** Abbezahlter Teil der Wohnung (Wert − Restschuld) */
  anteilWohnung: number;
  /** Summe aller Überschüsse nach Steuern */
  konto: number;
  vermoegen: number;
  eigenkapitalGesamt: number;

  // Monat
  cashflowMonatlich: number;
  mieteMonatlich: number;
  hausgeldMonatlich: number;
  kalkKostenMonatlich: number;
  rateMonatlich: number;
  steuerMonatlich: number;

  // Steuer (Jahr)
  mieteinnahmen: number;
  hausgeld: number;
  zinsen: number;
  afa: number;
  zuVersteuern: number;
  steuer: number;
  ersparnisAfa: number;
  ersparnisZinsen: number;
  ersparnisKumuliert: number;

  // Verkauf am Jahresende
  verkaufskosten: number;
  spekulationssteuer: number;
  verkaufErloes: number;
  gewinn: number;
  /** Jährliche Rendite auf das Eigenkapital (CAGR), null wenn nicht sinnvoll berechenbar */
  renditePa: number | null;
  etfGewinn: number;
}

export interface PrognoseViewOptionen {
  ek: number;
  kaufpreis: number;
  anschaffungskosten: number;
  steuersatzPct: number;
  verkaufsNebenkostenPct: number;
}

export function baueVerlauf(jahre: PrognoseJahr[], o: PrognoseViewOptionen): PrognoseViewJahr[] {
  const st = Math.max(0, o.steuersatzPct) / 100;
  const result: PrognoseViewJahr[] = [];
  let afaKumuliert = 0;
  let ersparnisKumuliert = 0;

  for (let i = 0; i < jahre.length - 1; i += 1) {
    const cur = jahre[i];
    const next = jahre[i + 1];
    const haltedauer = i + 1;

    const restschuld = next.restschuld;
    const immobilienwert = next.immobilienwert ?? o.kaufpreis;
    const anteilWohnung = immobilienwert - restschuld;
    const konto = cur.cashflowKumuliert;

    afaKumuliert += cur.afaGesamt;
    const ersparnisAfa = cur.afaGesamt * st;
    const ersparnisZinsen = cur.zinslast * st;
    ersparnisKumuliert += ersparnisAfa + ersparnisZinsen;

    const verkaufskosten = immobilienwert * (Math.max(0, o.verkaufsNebenkostenPct) / 100);
    const veraeusserungsgewinn = immobilienwert - verkaufskosten - (o.anschaffungskosten - afaKumuliert);
    const spekulationssteuer = haltedauer <= SPEKULATIONSFRIST_JAHRE
      ? Math.max(0, veraeusserungsgewinn) * st
      : 0;
    const verkaufErloes = immobilienwert - verkaufskosten - restschuld + konto - spekulationssteuer;
    const gewinn = verkaufErloes - o.ek;
    const renditePa = o.ek > 0 && verkaufErloes > 0
      ? Math.pow(verkaufErloes / o.ek, 1 / haltedauer) - 1
      : null;

    result.push({
      jahr: cur.jahr,
      haltedauer,
      restschuld,
      immobilienwert,
      anteilWohnung,
      konto,
      vermoegen: anteilWohnung + konto,
      eigenkapitalGesamt: next.eigenkapitalGesamt,

      cashflowMonatlich: cur.cashflowMonatlich,
      mieteMonatlich: cur.mieteinnahmenJaehrlich / 12,
      hausgeldMonatlich: cur.hausgeldJaehrlich / 12,
      kalkKostenMonatlich: cur.kalkKostenJaehrlich / 12,
      rateMonatlich: (cur.zinslast + cur.tilgungJaehrlich) / 12,
      steuerMonatlich: cur.steuerJaehrlich / 12,

      mieteinnahmen: cur.mieteinnahmenJaehrlich,
      hausgeld: cur.hausgeldJaehrlich,
      zinsen: cur.zinslast,
      afa: cur.afaGesamt,
      zuVersteuern: cur.mieteinnahmenJaehrlich - cur.hausgeldJaehrlich - cur.zinslast - cur.afaGesamt,
      steuer: cur.steuerJaehrlich,
      ersparnisAfa,
      ersparnisZinsen,
      ersparnisKumuliert,

      verkaufskosten,
      spekulationssteuer,
      verkaufErloes,
      gewinn,
      renditePa,
      etfGewinn: o.ek * (Math.pow(1 + ETF_RENDITE, haltedauer) - 1),
    });
  }
  return result;
}

export type MeilensteinKey = 'ueberschuss' | 'einsatzZurueck' | 'steuerfrei' | 'haelfte' | 'schuldenfrei';

export interface Meilenstein {
  key: MeilensteinKey;
  jahr: number;
  titel: string;
  text: string;
}

export function baueMeilensteine(
  verlauf: PrognoseViewJahr[],
  o: { ek: number; darlehensSumme: number }
): Meilenstein[] {
  const list: Array<Meilenstein | null> = [];
  const finde = (fn: (j: PrognoseViewJahr) => boolean) => verlauf.find(fn)?.jahr;
  const add = (key: MeilensteinKey, jahr: number | undefined, titel: string, text: string) =>
    list.push(jahr !== undefined ? { key, jahr, titel, text } : null);

  add('ueberschuss', finde(j => j.cashflowMonatlich > 0), 'Überschuss jeden Monat', 'Die Miete deckt alle Kosten');
  add('einsatzZurueck', o.ek > 0 ? finde(j => j.konto >= o.ek) : undefined, 'Einsatz komplett zurück', 'Überschüsse ≥ dein Eigenkapital');
  add('steuerfrei', verlauf[SPEKULATIONSFRIST_JAHRE]?.jahr, 'Verkauf steuerfrei', '10-Jahres-Frist abgelaufen');
  if (o.darlehensSumme > 0) {
    add('haelfte', finde(j => j.restschuld <= o.darlehensSumme / 2), 'Hälfte abbezahlt', 'Dir gehört mehr als der Bank');
    add('schuldenfrei', finde(j => j.restschuld <= 0.5), 'Schuldenfrei', 'Die Kreditrate fällt weg');
  }

  return list
    .filter((m): m is Meilenstein => m !== null)
    .sort((a, b) => a.jahr - b.jahr);
}
