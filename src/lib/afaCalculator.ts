/**
 * AfA-Turbo Calculator für deutsche Immobilien-Abschreibung
 *
 * Implementiert die aktuellen steuerlichen Regelungen:
 * - § 7 Abs. 4 EStG: Lineare AfA (2% oder 3%)
 * - § 7 Abs. 5a EStG: Degressive AfA (5% ab 2023)
 * - § 7b EStG: Sonderabschreibung für Mietwohnungsneubau (5% für 4 Jahre)
 *
 * Quellen:
 * - https://www.haufe.de/steuern/steuerwissen-tipps/bis-zu-10-jaehrliche-abschreibung-afa-turbo-fuer-wohnimmobilien_170_620356.html
 * - § 7 Abs. 4, § 7 Abs. 5a, § 7b EStG
 */

import { AfaModell, ImmobilienTyp, KfwStandard } from '@/store/useImmoStore';

/**
 * Ergebnis der AfA-Berechnung für ein einzelnes Jahr
 */
export interface AfaJahresErgebnis {
  jahr: number;
  linearerBetrag: number;
  sonderAfaBetrag: number;
  gesamtAfA: number;
  restbuchwert: number;
  afaSatz: number; // In Prozent, zur Anzeige
  kumulierteAfA: number;
}

/**
 * Parameter für die AfA-Berechnung
 */
export interface AfaParams {
  kaufpreis: number;
  grundstueckswert: number;
  wohnflaeche: number;
  modell: AfaModell;
  nutzeSonderAfa: boolean;
  startJahr: number;
}

/**
 * Ergebnis der AfA-Berechtigungs-Prüfung
 */
export interface AfaBerechtigungResult {
  linear_2: boolean;
  linear_3: boolean;
  degressiv_5: boolean;
  sonderAfa: boolean;
  gruende: {
    keineLinear3: string | null;
    keineDegressiv: string | null;
    keineSonderAfa: string | null;
  };
}

/**
 * Property-Daten für die Berechtigungsprüfung
 */
export interface AfaPropertyData {
  immobilienTyp: ImmobilienTyp;
  kaufdatum: string;
  bauantragsdatum: string | null;
  kfwStandard: KfwStandard;
  hatQngSiegel: boolean;
  kaufpreis: number;
  wohnflaeche: number;
}

/**
 * Berechnet den AfA-Verlauf für 30+ Jahre nach deutschen Steuerregeln
 *
 * Regeln:
 * - Linear 2%: 2% p.a. vom Gebäudewert (Altimmobilien vor 2023)
 * - Linear 3%: 3% p.a. vom Gebäudewert (ab 2023)
 * - Degressiv 5%: 5% vom Restbuchwert, mit Wechsel zu linear nach § 7a Abs. 9 EStG
 * - Sonder-AfA: Zusätzliche 5% für 4 Jahre, max. 4.000€/m² Bemessungsgrundlage
 */
export function berechneAfaVerlauf(params: AfaParams, jahre = 30): AfaJahresErgebnis[] {
  const gebaeudewert = Math.max(0, params.kaufpreis - params.grundstueckswert);

  if (gebaeudewert <= 0) {
    // Kein Gebäudewert = keine AfA
    return Array.from({ length: jahre }, (_, i) => ({
      jahr: params.startJahr + i,
      linearerBetrag: 0,
      sonderAfaBetrag: 0,
      gesamtAfA: 0,
      restbuchwert: 0,
      afaSatz: 0,
      kumulierteAfA: 0,
    }));
  }

  // Sonder-AfA Bemessungsgrundlage (max 4.000€/m² nach § 7b EStG)
  const sonderAfaBemessungsgrundlage = params.nutzeSonderAfa
    ? Math.min(4000 * params.wohnflaeche, gebaeudewert)
    : 0;

  const ergebnisse: AfaJahresErgebnis[] = [];
  let restbuchwert = gebaeudewert;
  let kumulierteAfA = 0;

  // Für degressive AfA mit Sonder-AfA: Berechne, wann der Wechsel zu linear sinnvoll ist
  let wechselZuLinear = false;
  let lineareAfaNachWechsel = 0;

  for (let jahrIndex = 0; jahrIndex < jahre; jahrIndex++) {
    const jahr = params.startJahr + jahrIndex;
    let linearerBetrag = 0;
    let sonderAfaBetrag = 0;

    // Sonder-AfA (nur Jahre 1-4, § 7b EStG)
    if (params.nutzeSonderAfa && jahrIndex < 4 && restbuchwert > 0) {
      sonderAfaBetrag = sonderAfaBemessungsgrundlage * 0.05;
      // Sonder-AfA darf den Restbuchwert nicht übersteigen
      sonderAfaBetrag = Math.min(sonderAfaBetrag, restbuchwert);
    }

    // Haupt-AfA berechnen
    if (params.modell === 'linear_2') {
      // Lineare AfA 2%: konstant über 50 Jahre
      linearerBetrag = gebaeudewert * 0.02;
    } else if (params.modell === 'linear_3') {
      // Lineare AfA 3%: konstant über ~33 Jahre
      linearerBetrag = gebaeudewert * 0.03;
    } else if (params.modell === 'degressiv_5') {
      // Degressive AfA 5%: 5% vom aktuellen Restbuchwert
      // Nach § 7a Abs. 9 EStG: Wechsel zu linear, wenn linear günstiger

      if (!wechselZuLinear) {
        const degressiverBetrag = restbuchwert * 0.05;

        // Berechne lineare AfA auf Restbuchwert für verbleibende Laufzeit
        // Restlaufzeit: 33 Jahre - bereits genutzte Jahre
        const restlaufzeit = Math.max(1, 33 - jahrIndex);
        const lineareAfaAufRestbuchwert = restbuchwert / restlaufzeit;

        // Wechsel zu linear, wenn es günstiger ist
        if (lineareAfaAufRestbuchwert >= degressiverBetrag) {
          wechselZuLinear = true;
          lineareAfaNachWechsel = lineareAfaAufRestbuchwert;
        }
      }

      if (wechselZuLinear) {
        linearerBetrag = lineareAfaNachWechsel;
      } else {
        linearerBetrag = restbuchwert * 0.05;
      }
    }

    // Sicherstellen, dass die AfA nicht den Restbuchwert übersteigt
    const maxAfA = restbuchwert;
    const gesamtAfA = Math.min(linearerBetrag + sonderAfaBetrag, maxAfA);

    // Adjustiere die Einzelbeträge proportional, wenn nötig
    if (linearerBetrag + sonderAfaBetrag > maxAfA && maxAfA > 0) {
      const faktor = maxAfA / (linearerBetrag + sonderAfaBetrag);
      linearerBetrag *= faktor;
      sonderAfaBetrag *= faktor;
    }

    kumulierteAfA += gesamtAfA;
    restbuchwert = Math.max(0, gebaeudewert - kumulierteAfA);

    const afaSatz =
      gebaeudewert > 0 ? (gesamtAfA / gebaeudewert) * 100 : 0;

    ergebnisse.push({
      jahr,
      linearerBetrag: Math.round(linearerBetrag * 100) / 100,
      sonderAfaBetrag: Math.round(sonderAfaBetrag * 100) / 100,
      gesamtAfA: Math.round(gesamtAfA * 100) / 100,
      restbuchwert: Math.round(restbuchwert * 100) / 100,
      afaSatz: Math.round(afaSatz * 100) / 100,
      kumulierteAfA: Math.round(kumulierteAfA * 100) / 100,
    });

    // Wenn der Restbuchwert 0 ist, können wir aufhören
    if (restbuchwert <= 0) {
      // Fülle die restlichen Jahre mit 0 auf
      for (let i = jahrIndex + 1; i < jahre; i++) {
        ergebnisse.push({
          jahr: params.startJahr + i,
          linearerBetrag: 0,
          sonderAfaBetrag: 0,
          gesamtAfA: 0,
          restbuchwert: 0,
          afaSatz: 0,
          kumulierteAfA: Math.round(kumulierteAfA * 100) / 100,
        });
      }
      break;
    }
  }

  return ergebnisse;
}

/**
 * Prüft, ob eine Immobilie für bestimmte AfA-Modelle berechtigt ist
 *
 * Kriterien nach aktuellem Steuerrecht:
 * - Linear 2%: Immer verfügbar
 * - Linear 3%: Fertigstellung/Anschaffung ab 01.01.2023
 * - Degressiv 5%: Neubauten mit Bauantrag zwischen 01.10.2023 und 30.09.2029
 * - Sonder-AfA: EH40-Standard + QNG-Siegel + max. 5.200€/m² Anschaffungskosten
 */
export function pruefeAfaBerechtigung(property: AfaPropertyData): AfaBerechtigungResult {
  const kaufdatum = new Date(property.kaufdatum);
  const kaufjahr = kaufdatum.getFullYear();
  const kaufmonat = kaufdatum.getMonth() + 1;

  // Linear 3%: Ab 2023 (Anschaffung oder Fertigstellung)
  const istNach2023 = kaufjahr >= 2023;

  // Degressive AfA 5%: Neubauten mit Bauantrag zwischen 01.10.2023 und 30.09.2029
  let istNeubau2023bis2029 = false;
  if (property.immobilienTyp === 'neubau') {
    // Prüfe Bauantragsdatum wenn vorhanden
    if (property.bauantragsdatum) {
      const bauantrag = new Date(property.bauantragsdatum);
      const bauJahr = bauantrag.getFullYear();
      const bauMonat = bauantrag.getMonth() + 1;

      // Bauantrag muss zwischen 01.10.2023 und 30.09.2029 liegen
      const nachOktober2023 =
        bauJahr > 2023 || (bauJahr === 2023 && bauMonat >= 10);
      const vorOktober2029 =
        bauJahr < 2029 || (bauJahr === 2029 && bauMonat < 10);

      istNeubau2023bis2029 = nachOktober2023 && vorOktober2029;
    } else {
      // Fallback: Verwende Kaufdatum als Näherung
      istNeubau2023bis2029 =
        kaufjahr >= 2023 &&
        (kaufjahr < 2029 || (kaufjahr === 2029 && kaufmonat < 10));
    }
  }

  // Sonder-AfA nach § 7b EStG
  // Voraussetzungen:
  // 1. Neubau-Mietwohnung
  // 2. EH40-Standard (oder besser)
  // 3. QNG-Siegel (Qualitätssiegel Nachhaltiges Gebäude)
  // 4. Max. 5.200€/m² Anschaffungskosten (ab 2023)
  const hatEH40MitQNG =
    property.kfwStandard === 'EH40' && property.hatQngSiegel === true;

  const kostenProQm =
    property.wohnflaeche > 0
      ? property.kaufpreis / property.wohnflaeche
      : Infinity;
  const istUnterObergrenze = kostenProQm <= 5200;

  const sonderAfaBerechtigt =
    istNeubau2023bis2029 && hatEH40MitQNG && istUnterObergrenze;

  // Gründe für Nicht-Berechtigung
  let keineSonderAfaGrund: string | null = null;
  if (!sonderAfaBerechtigt) {
    if (!istNeubau2023bis2029) {
      keineSonderAfaGrund =
        property.immobilienTyp !== 'neubau'
          ? 'Kein Neubau'
          : 'Bauantrag nicht zwischen 10/2023 und 09/2029';
    } else if (!hatEH40MitQNG) {
      if (property.kfwStandard !== 'EH40') {
        keineSonderAfaGrund = 'Kein EH40-Standard';
      } else {
        keineSonderAfaGrund = 'Kein QNG-Siegel vorhanden';
      }
    } else if (!istUnterObergrenze) {
      keineSonderAfaGrund = `Kosten ${Math.round(kostenProQm)}€/m² über Grenze von 5.200€/m²`;
    }
  }

  return {
    linear_2: true, // Immer verfügbar
    linear_3: istNach2023,
    degressiv_5: istNeubau2023bis2029,
    sonderAfa: sonderAfaBerechtigt,
    gruende: {
      keineLinear3: !istNach2023 ? 'Anschaffung vor 2023' : null,
      keineDegressiv: !istNeubau2023bis2029
        ? property.immobilienTyp !== 'neubau'
          ? 'Kein Neubau (nur Bestand/Sanierung)'
          : 'Bauantrag nicht im Zeitraum 10/2023 - 09/2029'
        : null,
      keineSonderAfa: keineSonderAfaGrund,
    },
  };
}

/**
 * Berechnet die jährliche Steuerersparnis durch AfA
 */
export function berechneAfaSteuerersparnis(
  afaBetrag: number,
  grenzsteuersatz: number
): number {
  return afaBetrag * (grenzsteuersatz / 100);
}

/**
 * Ermittelt den optimalen AfA-Zeitpunkt für den Wechsel von degressiv zu linear
 * nach § 7a Abs. 9 EStG
 */
export function berechneOptimalenWechselzeitpunkt(
  gebaeudewert: number,
  startJahr: number
): { jahr: number; restbuchwert: number } | null {
  if (gebaeudewert <= 0) return null;

  let restbuchwert = gebaeudewert;
  const gesamtLaufzeit = 33; // Jahre für 3% linear

  for (let i = 0; i < gesamtLaufzeit; i++) {
    const degressiv = restbuchwert * 0.05;
    const restlaufzeit = gesamtLaufzeit - i;
    const linearAufRest = restbuchwert / restlaufzeit;

    if (linearAufRest >= degressiv) {
      return {
        jahr: startJahr + i,
        restbuchwert: Math.round(restbuchwert * 100) / 100,
      };
    }

    restbuchwert = restbuchwert - degressiv;
  }

  return null;
}

/**
 * Zusammenfassung der AfA-Vorteile über mehrere Jahre
 */
export interface AfaZusammenfassung {
  gesamtAfA30Jahre: number;
  gesamtSteuerersparnis30Jahre: number;
  durchschnittlicherAfaSatz: number;
  jahreMitSonderAfa: number;
  maxAfaSatzJahr1: number;
  wechselZuLinearJahr: number | null;
}

/**
 * Erstellt eine Zusammenfassung der AfA-Vorteile
 */
export function erstelleAfaZusammenfassung(
  verlauf: AfaJahresErgebnis[],
  grenzsteuersatz: number,
  gebaeudewert: number
): AfaZusammenfassung {
  const gesamtAfA30Jahre = verlauf.reduce((sum, j) => sum + j.gesamtAfA, 0);
  const gesamtSteuerersparnis30Jahre = berechneAfaSteuerersparnis(
    gesamtAfA30Jahre,
    grenzsteuersatz
  );

  const jahreMitSonderAfa = verlauf.filter((j) => j.sonderAfaBetrag > 0).length;

  const durchschnittlicherAfaSatz =
    gebaeudewert > 0
      ? ((gesamtAfA30Jahre / gebaeudewert) * 100) / verlauf.length
      : 0;

  // Finde Jahr, in dem von degressiv zu linear gewechselt wird
  // (erkennbar an konstantem Betrag statt sinkendem)
  let wechselZuLinearJahr: number | null = null;
  for (let i = 1; i < verlauf.length - 1; i++) {
    const current = verlauf[i].linearerBetrag;
    const prev = verlauf[i - 1].linearerBetrag;
    const next = verlauf[i + 1].linearerBetrag;

    // Wenn vorher fallend und jetzt konstant, ist das der Wechselpunkt
    if (prev > current && Math.abs(current - next) < 0.01 && current > 0) {
      wechselZuLinearJahr = verlauf[i].jahr;
      break;
    }
  }

  return {
    gesamtAfA30Jahre: Math.round(gesamtAfA30Jahre * 100) / 100,
    gesamtSteuerersparnis30Jahre: Math.round(gesamtSteuerersparnis30Jahre * 100) / 100,
    durchschnittlicherAfaSatz: Math.round(durchschnittlicherAfaSatz * 100) / 100,
    jahreMitSonderAfa,
    maxAfaSatzJahr1: verlauf[0]?.afaSatz || 0,
    wechselZuLinearJahr,
  };
}
