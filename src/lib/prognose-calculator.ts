export interface PrognoseJahr {
  jahr: number;
  restschuld: number;
  eigenkapitalAufbau: number;
  eigenkapitalGesamt: number;
  cashflowMonatlich: number;
  cashflowOhneSondertilgung: number;
  cashflowVorSteuern: number;
  cashflowKumuliert: number;
  cashflowKumuliertOhneSondertilgung: number;
  zinslast: number;
  afaVorteil: number;
  immobilienwert?: number;
  warmmieteAktuell?: number;
  verkaufsNebenkosten?: number;
}

export interface PrognoseData {
  jahre: PrognoseJahr[];
}

export interface PrognoseInput {
  startJahr: number;
  darlehensSumme: number;
  ek: number;
  zins: number;
  tilgung: number;
  warmmiete: number;
  hausgeld: number;
  kalkKostenMonthly: number;
  afaJaehrlich?: number;
  afaLaufzeitJahre?: number;
  steuersatz?: number;
  immobilienwert?: number;
  wertsteigerungPct?: number;
  sondertilgungJaehrlich?: number;
  // Erweiterte Optionen
  darlehensTyp?: 'annuitaet' | 'degressiv';
  mietInflationPct?: number;
  kostenInflationPct?: number;
  verkaufsNebenkostenPct?: number;
}

export function berechnePrognose(input: PrognoseInput, jahre = 30): PrognoseData {
  const result: PrognoseJahr[] = [];
  let restschuld = Math.max(0, input.darlehensSumme);
  let kumuliertCF = 0;
  let kumuliertCFOhneSondertilgung = 0;

  // Konfiguration
  const wertsteigerung = input.wertsteigerungPct ?? 0;
  const afaLaufzeit = input.afaLaufzeitJahre ?? 50;
  const afaMonthly = (input.afaJaehrlich ?? 0) / 12;
  const darlehensTyp = input.darlehensTyp ?? 'degressiv';
  const mietInflation = input.mietInflationPct ?? 0;
  const kostenInflation = input.kostenInflationPct ?? 0;
  const verkaufsNebenkostenPct = input.verkaufsNebenkostenPct ?? 0;

  // Annuitäten-Berechnung (einmalig für konstante Rate)
  let annuitaetMonatlich = 0;
  if (darlehensTyp === 'annuitaet') {
    const zinsMonatlich = input.zins / 100 / 12;
    const laufzeitMonate = jahre * 12;
    if (zinsMonatlich > 0) {
      annuitaetMonatlich =
        (input.darlehensSumme * zinsMonatlich * Math.pow(1 + zinsMonatlich, laufzeitMonate)) /
        (Math.pow(1 + zinsMonatlich, laufzeitMonate) - 1);
    } else {
      annuitaetMonatlich = input.darlehensSumme / laufzeitMonate;
    }
  }

  for (let jahr = 0; jahr <= jahre; jahr += 1) {
    // AfA-Vorteil nur innerhalb der Laufzeit
    const afaVorteilJaehrlich =
      jahr <= afaLaufzeit && input.afaJaehrlich && input.steuersatz
        ? input.afaJaehrlich * (input.steuersatz / 100)
        : 0;

    // Inflation: Miete und Kosten steigen
    const warmmieteAktuell = input.warmmiete * Math.pow(1 + mietInflation / 100, jahr);
    const hausgeldAktuell = input.hausgeld * Math.pow(1 + kostenInflation / 100, jahr);
    const kalkKostenAktuell = input.kalkKostenMonthly * Math.pow(1 + kostenInflation / 100, jahr);

    // Tilgungsberechnung je nach Darlehenstyp
    let zinslast: number;
    let regulareTilgung: number;
    let regulareTilgungMonthly: number;

    if (darlehensTyp === 'annuitaet') {
      // Annuitätendarlehen: Konstante monatliche Rate
      zinslast = restschuld * (input.zins / 100);
      const zinsMonthly = zinslast / 12;
      regulareTilgungMonthly = Math.max(0, annuitaetMonatlich - zinsMonthly);
      regulareTilgung = regulareTilgungMonthly * 12;
    } else {
      // Degressives Darlehen: Rate sinkt mit Restschuld
      zinslast = restschuld * (input.zins / 100);
      const jahresrate = restschuld * ((input.zins + input.tilgung) / 100);
      regulareTilgung = Math.max(0, jahresrate - zinslast);
      regulareTilgungMonthly = regulareTilgung / 12;
    }

    const sondertilgung = Math.max(0, input.sondertilgungJaehrlich ?? 0);
    const tilgung = Math.min(restschuld, regulareTilgung + sondertilgung);
    const regulareTilgungAllein = Math.min(restschuld, regulareTilgung);

    const zinsMonthly = zinslast / 12;
    const tilgungMonthly = tilgung / 12;
    const regulareTilgungMonthlyFinal = regulareTilgungAllein / 12;

    // Cashflow MIT Sondertilgung
    const cashflowVorSteuern =
      warmmieteAktuell - hausgeldAktuell - kalkKostenAktuell - zinsMonthly - tilgungMonthly;

    // Cashflow OHNE Sondertilgung
    const cashflowVorSteuernOhneSondertilgung =
      warmmieteAktuell - hausgeldAktuell - kalkKostenAktuell - zinsMonthly - regulareTilgungMonthlyFinal;

    // Steuerberechnung (für beide gleich, da Sondertilgung steuerlich nicht relevant)
    const afaMonthlyAktuell = jahr <= afaLaufzeit ? afaMonthly : 0;
    const taxableCashflow = warmmieteAktuell - hausgeldAktuell - zinsMonthly - afaMonthlyAktuell;
    const taxMonthly = taxableCashflow * ((input.steuersatz ?? 0) / 100);

    const cashflowMonatlich = cashflowVorSteuern - taxMonthly;
    const cashflowOhneSondertilgung = cashflowVorSteuernOhneSondertilgung - taxMonthly;

    kumuliertCF += cashflowMonatlich * 12;
    kumuliertCFOhneSondertilgung += cashflowOhneSondertilgung * 12;

    const eigenkapitalAufbau = input.darlehensSumme - restschuld;
    const eigenkapitalGesamt = input.ek + eigenkapitalAufbau;
    const immobilienwert = input.immobilienwert
      ? input.immobilienwert * Math.pow(1 + wertsteigerung / 100, jahr)
      : undefined;

    // Verkaufsnebenkosten
    const verkaufsNebenkosten = immobilienwert
      ? immobilienwert * (verkaufsNebenkostenPct / 100)
      : undefined;

    result.push({
      jahr: input.startJahr + jahr,
      restschuld,
      eigenkapitalAufbau,
      eigenkapitalGesamt,
      cashflowMonatlich,
      cashflowOhneSondertilgung,
      cashflowVorSteuern,
      cashflowKumuliert: kumuliertCF,
      cashflowKumuliertOhneSondertilgung: kumuliertCFOhneSondertilgung,
      zinslast,
      afaVorteil: afaVorteilJaehrlich,
      ...(immobilienwert !== undefined ? { immobilienwert } : {}),
      ...(warmmieteAktuell !== input.warmmiete ? { warmmieteAktuell } : {}),
      ...(verkaufsNebenkosten !== undefined ? { verkaufsNebenkosten } : {}),
    });

    restschuld = Math.max(0, restschuld - tilgung);
    if (restschuld <= 0) {
      restschuld = 0;
    }
  }

  return { jahre: result };
}
