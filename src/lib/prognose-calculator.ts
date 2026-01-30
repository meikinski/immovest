import { berechneAfaVerlauf, AfaParams, AfaJahresErgebnis } from './afaCalculator';
import { AfaModell } from '@/store/useImmoStore';

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

  // AfA-Turbo Erweiterungen
  afaLinear: number;
  afaSonder: number;
  afaGesamt: number;
  afaSatz: number;
  afaRestbuchwert: number;
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

  // AfA-Turbo Erweiterungen
  afaModell?: AfaModell;
  nutzeSonderAfa?: boolean;
  kaufpreis?: number;
  grundstueckswert?: number;
  wohnflaeche?: number;
}

export function berechnePrognose(input: PrognoseInput, jahre = 30): PrognoseData {
  const result: PrognoseJahr[] = [];
  let restschuld = Math.max(0, input.darlehensSumme);
  let kumuliertCF = 0;
  let kumuliertCFOhneSondertilgung = 0;

  // Konfiguration
  const wertsteigerung = input.wertsteigerungPct ?? 0;
  const afaLaufzeit = input.afaLaufzeitJahre ?? 50;
  const darlehensTyp = input.darlehensTyp ?? 'degressiv';
  const mietInflation = input.mietInflationPct ?? 0;
  const kostenInflation = input.kostenInflationPct ?? 0;
  const verkaufsNebenkostenPct = input.verkaufsNebenkostenPct ?? 0;

  // AfA-Turbo: Berechne den kompletten AfA-Verlauf, wenn die neuen Parameter vorhanden sind
  let afaVerlauf: AfaJahresErgebnis[] | null = null;
  const useAfaTurbo = input.afaModell !== undefined && input.kaufpreis !== undefined;

  if (useAfaTurbo) {
    const afaParams: AfaParams = {
      kaufpreis: input.kaufpreis!,
      grundstueckswert: input.grundstueckswert ?? Math.round(input.kaufpreis! * 0.2),
      wohnflaeche: input.wohnflaeche ?? 80, // Fallback
      modell: input.afaModell!,
      nutzeSonderAfa: input.nutzeSonderAfa ?? false,
      startJahr: input.startJahr,
    };
    afaVerlauf = berechneAfaVerlauf(afaParams, jahre + 1);
  }

  // Legacy: afaJaehrlich für Rückwärtskompatibilität
  const legacyAfaJaehrlich = input.afaJaehrlich ?? 0;

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
    // AfA-Daten für dieses Jahr (entweder aus AfA-Turbo oder Legacy)
    let afaLinear = 0;
    let afaSonder = 0;
    let afaGesamt = 0;
    let afaSatz = 0;
    let afaRestbuchwert = 0;

    if (useAfaTurbo && afaVerlauf && afaVerlauf[jahr]) {
      const afaJahr = afaVerlauf[jahr];
      afaLinear = afaJahr.linearerBetrag;
      afaSonder = afaJahr.sonderAfaBetrag;
      afaGesamt = afaJahr.gesamtAfA;
      afaSatz = afaJahr.afaSatz;
      afaRestbuchwert = afaJahr.restbuchwert;
    } else if (legacyAfaJaehrlich > 0 && jahr <= afaLaufzeit) {
      // Legacy-Modus: Konstanter AfA-Betrag
      afaLinear = legacyAfaJaehrlich;
      afaGesamt = legacyAfaJaehrlich;
      const gebaeudewert = input.kaufpreis ? input.kaufpreis - (input.grundstueckswert ?? input.kaufpreis * 0.2) : 0;
      afaSatz = gebaeudewert > 0 ? (afaGesamt / gebaeudewert) * 100 : 0;
    }

    // AfA-Vorteil (Steuerersparnis)
    const afaVorteilJaehrlich = input.steuersatz
      ? afaGesamt * (input.steuersatz / 100)
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
    // Verwende die AfA-Turbo Werte wenn verfügbar, sonst Legacy
    const afaMonthlyAktuell = afaGesamt / 12;
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
      // AfA-Turbo Erweiterungen
      afaLinear,
      afaSonder,
      afaGesamt,
      afaSatz,
      afaRestbuchwert,
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
