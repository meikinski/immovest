
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
  