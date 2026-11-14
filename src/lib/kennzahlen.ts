import { berechneNebenkosten } from '@/lib/calculations';

/** Bruttomietrendite in %: Jahreskaltmiete ÷ Kaufpreis (ohne Kaufnebenkosten, übliche Definition) */
export function berechneBruttomietrendite(jahreskaltmiete: number, kaufpreis: number): number {
  return kaufpreis > 0 ? (jahreskaltmiete / kaufpreis) * 100 : 0;
}

export type EkStartwertEingabe = {
  kaufpreis: number;
  grunderwerbsteuerPct: number;
  notarPct: number;
  maklerPct: number;
  sonstigeKosten?: number;
};

/**
 * Startwert fürs Eigenkapital: Kaufnebenkosten (Grunderwerbsteuer, Notar, Makler, Sonstige)
 * plus 10 % des Kaufpreises, auf volle 1.000 € gerundet.
 */
export function berechneEkStartwert(e: EkStartwertEingabe): number {
  if (!(e.kaufpreis > 0)) return 0;
  const { nk } = berechneNebenkosten(e.kaufpreis, e.grunderwerbsteuerPct || 0, e.notarPct || 0, e.maklerPct || 0);
  return Math.round((nk + (e.sonstigeKosten || 0) + e.kaufpreis * 0.1) / 1000) * 1000;
}
