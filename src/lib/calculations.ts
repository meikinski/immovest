
/** Berechnet Nebenkosten auf Basis der Prozentsätze */
export function berechneNebenkosten(
    kaufpreis: number,
    grunderwerbsteuer_pct: number,
    notar_pct: number,
    makler_pct: number
  ) {
    const grunderwerbsteuer_eur = Math.round((grunderwerbsteuer_pct / 100) * kaufpreis);
    const notar_eur = Math.round((notar_pct / 100) * kaufpreis);
    const makler_eur = Math.round((makler_pct / 100) * kaufpreis);
    const nk = grunderwerbsteuer_eur + notar_eur + makler_eur;
    return { grunderwerbsteuer_eur, notar_eur, makler_eur, nk };
  }
  
  /**
 * Berechnet den operativen Monats-Cashflow
 */
export function berechneCashflowOperativ(
    miete: number,
    hausgeld: number,
    hausgeld_umlegbar: number,
    mietausfall_pct: number,
    instandhaltungskosten_pro_qm: number,
    kaufpreis: number,
    grunderwerbsteuer_pct: number,
    notar_pct: number,
    makler_pct: number,
    ek: number,
    zins: number,
    tilgung: number,
    steuer: number,
    afa: number,
    ruecklagen: number,
    objekttyp?: 'wohnung' | 'haus' | 'mfh',
    verwaltungskosten?: number
  ): number {
    // Bei ETW: hausgeld = WEG-Kosten
    // Bei Haus/MFH: hausgeld = 0, verwaltungskosten separat
    const betriebskosten = objekttyp === 'wohnung'
      ? hausgeld_umlegbar + (hausgeld - hausgeld_umlegbar)
      : (verwaltungskosten || 0);

    const mietausfall = (mietausfall_pct / 100) * (miete + hausgeld_umlegbar);
    const instandhaltung = (instandhaltungskosten_pro_qm * (/* qm aus Store holen oder übergeben */ 1)) / 12;
    const zinsRaten = ((kaufpreis - ek) * (zins / 100 + tilgung / 100)) / 12;
    return miete + hausgeld_umlegbar - betriebskosten - mietausfall - instandhaltung - zinsRaten - ruecklagen;
  }
  
  /**
   * Berechnet die Nettomietrendite in Prozent
   */
  export function berechneNettomietrendite(
    miete: number,
    hausgeld: number,
    hausgeld_umlegbar: number,
    kaufpreis: number,
    grunderwerbsteuer_pct: number,
    notar_pct: number,
    makler_pct: number,
    objekttyp?: 'wohnung' | 'haus' | 'mfh',
    verwaltungskosten?: number
  ): number {
    // Bei ETW: nicht umlagefähiges Hausgeld
    // Bei Haus/MFH: Verwaltungskosten
    const nichtUmlage = objekttyp === 'wohnung'
      ? hausgeld - hausgeld_umlegbar
      : (verwaltungskosten || 0);
    const jahresNetto = (miete * 12) - (nichtUmlage * 12);
    const kaufneben = berechneNebenkosten(kaufpreis, grunderwerbsteuer_pct, notar_pct, makler_pct).nk;
    const investition = kaufpreis + kaufneben;
    return (jahresNetto / investition) * 100;
  }
  
  /**
 * Score auf Basis von Yield, Cashflow-EK-Rendite, DSCR-Proxy und BreakEven.
 */
export function berechneScore(
    nettorendite: number,       // in Prozent, z.B. 4.5
    cashflow: number,               // monatlicher Cashflow, z.B. 200
    ek: number,                     // Eigenkapital, z.B. 50000
    jahresrate: number,             // Jahresrate aus Zins+Tilgung, z.B. kreditSumme*(zins+tilg)/100
    breakEvenJahre: number          // Zeitpunkt der Rückzahlung in Jahren, z.B. 15
  ): number {
    // 1. Nettomietrendite-Score (0–100)
    const yieldScore = Math.min(nettorendite / 10, 1) * 100;
  
    // 2. Cashflow-EK-Rendite (Jahres-Cashflow/EK, 5% = 100 Punkte)
    const ekRendite = ek > 0 ? (cashflow * 12) / ek : 0;
    const ekCfScore = Math.min(ekRendite / 0.05, 1) * 100;
  
    // 3. DSCR-Proxy (Jahrescashflow / Jahresrate), ≥2 = 100 Punkte
    const dscr = jahresrate > 0 ? (cashflow * 12) / jahresrate : 0;
    const dscrScore = Math.min(dscr / 2, 1) * 100;
  
    // 4. BreakEven-Score: ≤5 Jahre = 100, ≥20 Jahre = 0, linear dazwischen
    const beNorm = breakEvenJahre <= 5
      ? 1
      : breakEvenJahre >= 20
        ? 0
        : 1 - (breakEvenJahre - 5) / 15;
    const beScore = beNorm * 100;
  
    // Gewichtetes Mittel
    const total =
      0.4 * yieldScore +
      0.3 * ekCfScore +
      0.2 * dscrScore +
      0.1 * beScore;
  
    // auf 0–100 beschränken
    return Math.round(Math.max(0, Math.min(100, total)));
  }
  