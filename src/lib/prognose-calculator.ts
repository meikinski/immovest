export interface PrognoseJahr {
  jahr: number;
  restschuld: number;
  eigenkapital: number;
  cashflowMonatlich: number;
  cashflowKumuliert: number;
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
  cashflowMonatlich: number;
  afaJaehrlich?: number;
  steuersatz?: number;
  immobilienwert?: number;
  wertsteigerungPct?: number;
  sondertilgungJaehrlich?: number;
}

export function berechnePrognose(input: PrognoseInput, jahre = 30): PrognoseData {
  const result: PrognoseJahr[] = [];
  let restschuld = Math.max(0, input.darlehensSumme);
  let kumuliertCF = 0;
  const wertsteigerung = input.wertsteigerungPct ?? 0;
  const afaVorteilJaehrlich =
    input.afaJaehrlich && input.steuersatz
      ? input.afaJaehrlich * (input.steuersatz / 100)
      : 0;

  for (let jahr = 0; jahr <= jahre; jahr += 1) {
    if (jahr > 0) {
      const jahresrate = restschuld * ((input.zins + input.tilgung) / 100);
      const zinsen = restschuld * (input.zins / 100);
      const regulareTilgung = Math.max(0, jahresrate - zinsen);
      const sondertilgung = Math.max(0, input.sondertilgungJaehrlich ?? 0);
      const tilgung = Math.min(restschuld, regulareTilgung + sondertilgung);

      restschuld = Math.max(0, restschuld - tilgung);
      kumuliertCF += input.cashflowMonatlich * 12;
    }

    const eigenkapital = input.ek + (input.darlehensSumme - restschuld);
    const immobilienwert = input.immobilienwert
      ? input.immobilienwert * Math.pow(1 + wertsteigerung / 100, jahr)
      : undefined;

    result.push({
      jahr: input.startJahr + jahr,
      restschuld,
      eigenkapital,
      cashflowMonatlich: input.cashflowMonatlich,
      cashflowKumuliert: kumuliertCF,
      zinslast: restschuld * (input.zins / 100),
      afaVorteil: afaVorteilJaehrlich,
      ...(immobilienwert !== undefined ? { immobilienwert } : {}),
    });
  }

  return { jahre: result };
}
