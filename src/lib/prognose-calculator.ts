export interface PrognoseJahr {
  jahr: number;
  restschuld: number;
  eigenkapitalAufbau: number;
  eigenkapitalGesamt: number;
  cashflowMonatlich: number;
  cashflowOhneSondertilgung: number;
  cashflowKumuliert: number;
  cashflowKumuliertOhneSondertilgung: number;
  zinslast: number;
  afaVorteil: number;
  immobilienwert?: number;
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
}

export function berechnePrognose(input: PrognoseInput, jahre = 30): PrognoseData {
  const result: PrognoseJahr[] = [];
  let restschuld = Math.max(0, input.darlehensSumme);
  let kumuliertCF = 0;
  let kumuliertCFOhneSondertilgung = 0;
  const wertsteigerung = input.wertsteigerungPct ?? 0;
  const afaLaufzeit = input.afaLaufzeitJahre ?? 50;
  const afaMonthly = (input.afaJaehrlich ?? 0) / 12;

  for (let jahr = 0; jahr <= jahre; jahr += 1) {
    // AfA-Vorteil nur innerhalb der Laufzeit
    const afaVorteilJaehrlich =
      jahr <= afaLaufzeit && input.afaJaehrlich && input.steuersatz
        ? input.afaJaehrlich * (input.steuersatz / 100)
        : 0;

    const zinslast = restschuld * (input.zins / 100);
    const jahresrate = restschuld * ((input.zins + input.tilgung) / 100);
    const regulareTilgung = Math.max(0, jahresrate - zinslast);
    const sondertilgung = Math.max(0, input.sondertilgungJaehrlich ?? 0);
    const tilgung = Math.min(restschuld, regulareTilgung + sondertilgung);
    const regulareTilgungAllein = Math.min(restschuld, regulareTilgung);

    const zinsMonthly = zinslast / 12;
    const tilgungMonthly = tilgung / 12;
    const regulareTilgungMonthly = regulareTilgungAllein / 12;

    // Cashflow MIT Sondertilgung
    const cashflowVorSteuern =
      input.warmmiete - input.hausgeld - input.kalkKostenMonthly - zinsMonthly - tilgungMonthly;

    // Cashflow OHNE Sondertilgung
    const cashflowVorSteuernOhneSondertilgung =
      input.warmmiete - input.hausgeld - input.kalkKostenMonthly - zinsMonthly - regulareTilgungMonthly;

    // Steuerberechnung (für beide gleich, da Sondertilgung steuerlich nicht relevant)
    const afaMonthlyAktuell = jahr <= afaLaufzeit ? afaMonthly : 0;
    const taxableCashflow = input.warmmiete - input.hausgeld - zinsMonthly - afaMonthlyAktuell;
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

    result.push({
      jahr: input.startJahr + jahr,
      restschuld,
      eigenkapitalAufbau,
      eigenkapitalGesamt,
      cashflowMonatlich,
      cashflowOhneSondertilgung,
      cashflowKumuliert: kumuliertCF,
      cashflowKumuliertOhneSondertilgung: kumuliertCFOhneSondertilgung,
      zinslast,
      afaVorteil: afaVorteilJaehrlich,
      ...(immobilienwert !== undefined ? { immobilienwert } : {}),
    });

    restschuld = Math.max(0, restschuld - tilgung);
    if (restschuld <= 0) {
      restschuld = 0;
    }
  }

  return { jahre: result };
}
