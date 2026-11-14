import { BUNDESLAENDER, type BundeslandCode } from '@/config/grunderwerbsteuer';
import { bundeslandAusAdresse } from '@/lib/plzBundesland';
import { formatZahl } from '@/lib/zahlen';

export type GrunderwerbsteuerTreffer = { bundesland: BundeslandCode; name: string; satz: number };

export function grunderwerbsteuerFuerBundesland(code: BundeslandCode): GrunderwerbsteuerTreffer {
  return { bundesland: code, name: BUNDESLAENDER[code].name, satz: BUNDESLAENDER[code].satz };
}

/** Steuersatz zur Adresse (über die PLZ). null, wenn sich kein Bundesland ableiten lässt. */
export function grunderwerbsteuerFuerAdresse(adresse: string | null | undefined): GrunderwerbsteuerTreffer | null {
  const code = bundeslandAusAdresse(adresse);
  return code ? grunderwerbsteuerFuerBundesland(code) : null;
}

/** Anzeige neben dem Feld, z. B. "Sachsen: 5,5 %" */
export function grunderwerbsteuerLabel(code: BundeslandCode): string {
  const { name, satz } = BUNDESLAENDER[code];
  return `${name}: ${formatZahl(satz, { min: 1, max: 2 })} %`;
}
