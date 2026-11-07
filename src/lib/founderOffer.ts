/**
 * Gründerpreis für das Jahresabo, gesteuert nur über Env-Variablen (kein neuer Code nötig):
 *
 *   FOUNDER_OFFER_ENABLED  "true" schaltet das Angebot ein
 *   FOUNDER_PRICE_ID       eigene Stripe-Price-ID für das Jahresabo zum Gründerpreis
 *   FOUNDER_PRICE_LABEL    angezeigter Preis, z. B. "49 €"
 *   FOUNDER_OFFER_ENDS_AT  ISO-Datum, z. B. "2026-12-31" (gilt bis Ende dieses Tages, deutsche Zeit)
 *                          oder ein Zeitpunkt, z. B. "2026-12-31T18:00:00+01:00"
 *
 * Fehlt etwas oder ist das Enddatum vorbei, gibt es kein Angebot. Nur serverseitig verwenden:
 * Die Werte werden zur Laufzeit gelesen, der Client bekommt sie über /api/pricing/offer.
 */

export type FounderOffer =
  | { active: false }
  | {
      active: true;
      /** z. B. "49 €" */
      priceLabel: string;
      /** Betrag aus dem Label, z. B. 49 (für Analytics und "pro Monat"); null, wenn nicht lesbar */
      amount: number | null;
      /** Ende als ISO-Zeitpunkt */
      endsAt: string;
      /** Ende für Texte, z. B. "31. Dezember 2026" */
      endsAtLabel: string;
    };

const ZEITZONE = 'Europe/Berlin';

/** Offset von Europe/Berlin zu UTC in Minuten für einen Zeitpunkt (60 im Winter, 120 im Sommer) */
function berlinOffsetMinuten(d: Date): number {
  const teile = new Intl.DateTimeFormat('en-US', {
    timeZone: ZEITZONE, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(d);
  const w = (t: string) => Number(teile.find(p => p.type === t)?.value);
  const alsUtc = Date.UTC(w('year'), w('month') - 1, w('day'), w('hour'), w('minute'), w('second'));
  return Math.round((alsUtc - d.getTime()) / 60000);
}

/** Ende des Angebots; reines Datum = bis 23:59:59 deutscher Zeit an diesem Tag */
export function parseOfferEnd(raw: string | undefined): Date | null {
  const wert = (raw ?? '').trim();
  if (!wert) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(wert)) {
    // Mitternacht danach in UTC annähern, dann um den Berliner Offset korrigieren
    const naiv = new Date(`${wert}T23:59:59.999Z`);
    if (isNaN(naiv.getTime())) return null;
    return new Date(naiv.getTime() - berlinOffsetMinuten(naiv) * 60000);
  }
  const d = new Date(wert);
  return isNaN(d.getTime()) ? null : d;
}

/** "49 €" → 49, "49,50 €" → 49.5 */
export function amountFromLabel(label: string): number | null {
  const m = label.replace(/\./g, '').match(/\d+(?:,\d{1,2})?/);
  if (!m) return null;
  const n = Number(m[0].replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function aktiviert(v: string | undefined): boolean {
  return ['true', '1', 'yes', 'on'].includes((v ?? '').trim().toLowerCase());
}

export function getFounderOffer(now: Date = new Date()): FounderOffer {
  if (!aktiviert(process.env.FOUNDER_OFFER_ENABLED)) return { active: false };
  const priceId = (process.env.FOUNDER_PRICE_ID ?? '').trim();
  const priceLabel = (process.env.FOUNDER_PRICE_LABEL ?? '').trim();
  const ende = parseOfferEnd(process.env.FOUNDER_OFFER_ENDS_AT);
  if (!priceId || !priceLabel || !ende || now.getTime() >= ende.getTime()) return { active: false };
  return {
    active: true,
    priceLabel,
    amount: amountFromLabel(priceLabel),
    endsAt: ende.toISOString(),
    endsAtLabel: ende.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: ZEITZONE }),
  };
}

/** Stripe-Price-ID des Gründerpreises, nur solange das Angebot aktiv ist */
export function getActiveFounderPriceId(now: Date = new Date()): string | null {
  return getFounderOffer(now).active ? (process.env.FOUNDER_PRICE_ID ?? '').trim() : null;
}
