/**
 * Kostenschutz für KI-, Scraping- und Geocoding-Routen: alle Limits an einer Stelle.
 *
 * - Abgemeldete Nutzer werden pro IP gezählt (die IP wird nur gehasht gespeichert),
 *   angemeldete Nutzer pro Clerk-User-ID.
 * - Gezählt wird in der Supabase-Tabelle rate_limit_counters
 *   (Migration supabase/migrations/2026-11-14_kosten_schutz.sql).
 * - Ist ein Limit erreicht, antwortet die Route mit HTTP 429 und einer der Meldungen unten.
 *
 * Preise und das Gratis-Kontingent (GRATIS_ANALYSEN) stehen weiterhin in src/config/pricing.ts.
 */

export type Zeitfenster = 'stunde' | 'tag';

export interface LimitRegel {
  fenster: Zeitfenster;
  max: number;
}

export interface BucketLimits {
  /** null = Route verlangt eine Anmeldung, abgemeldete Aufrufe werden vorher mit 401 abgewiesen */
  abgemeldet: LimitRegel[] | null;
  angemeldet: LimitRegel[];
  /** Wort für die Meldung, z. B. "Importe" */
  bezeichnung: string;
}

export const FENSTER_SEKUNDEN: Record<Zeitfenster, number> = {
  stunde: 60 * 60,
  tag: 24 * 60 * 60,
};

export const RATE_LIMITS = {
  /** Exposé-Import per Link (/api/scrape-with-agent) und per Screenshot (/api/extract-from-image) */
  import: {
    abgemeldet: [{ fenster: 'stunde', max: 5 }, { fenster: 'tag', max: 15 }],
    angemeldet: [{ fenster: 'tag', max: 30 }],
    bezeichnung: 'Importe',
  },
  /** Vollständige Analyse mit Marktrecherche (/api/agent/run), nur angemeldet */
  analyse: {
    abgemeldet: null,
    angemeldet: [{ fenster: 'tag', max: 30 }],
    bezeichnung: 'Marktanalysen',
  },
  /** KI-Einschätzung im Kennzahlen-Tab (/api/generateComment), nur angemeldet */
  kommentar: {
    abgemeldet: null,
    angemeldet: [{ fenster: 'tag', max: 60 }],
    bezeichnung: 'KI-Einschätzungen',
  },
  /** KI-Chat (/api/chat), nur angemeldet */
  chat: {
    abgemeldet: null,
    angemeldet: [{ fenster: 'tag', max: 50 }],
    bezeichnung: 'Chat-Nachrichten',
  },
  /** PDF-Report (/api/export/pdf), nur angemeldet. Keine KI-Kosten, aber rechenintensiv. */
  pdf: {
    abgemeldet: null,
    angemeldet: [{ fenster: 'tag', max: 30 }],
    bezeichnung: 'PDF-Reports',
  },
  /** Szenarien speichern/löschen (/api/scenarios POST/DELETE), nur angemeldet */
  szenarien: {
    abgemeldet: null,
    angemeldet: [{ fenster: 'tag', max: 200 }],
    bezeichnung: 'Szenario-Änderungen',
  },
  /** Adress-Vorschläge (/api/geocode). Mapbox kostet ab 100.000 Anfragen im Monat. */
  geocode: {
    abgemeldet: [{ fenster: 'stunde', max: 150 }],
    angemeldet: [{ fenster: 'stunde', max: 300 }],
    bezeichnung: 'Adress-Suchen',
  },
} satisfies Record<string, BucketLimits>;

export type LimitBucket = keyof typeof RATE_LIMITS;

/**
 * Tagesbudget für alle KI-Aufrufe zusammen (Import, Analyse, KI-Einschätzung, Chat).
 * Wert aus der Env-Variable AI_DAILY_CALL_CAP; fehlt sie, gilt dieser Standard.
 * Der Tag beginnt um 0 Uhr deutscher Zeit.
 */
export const AI_DAILY_CALL_CAP_STANDARD = 500;

export function aiTagesLimit(env: Record<string, string | undefined> = process.env): number {
  const roh = Number.parseInt(env.AI_DAILY_CALL_CAP ?? '', 10);
  return Number.isFinite(roh) && roh >= 0 ? roh : AI_DAILY_CALL_CAP_STANDARD;
}

// ---------- Meldungen (Deutsch, werden im UI angezeigt) ----------

export function limitMeldung(bucket: LimitBucket, regel: LimitRegel, angemeldet: boolean): string {
  const was = RATE_LIMITS[bucket].bezeichnung;
  const zeitraum = regel.fenster === 'stunde' ? 'in der letzten Stunde' : 'heute';
  const spaeter = regel.fenster === 'stunde' ? 'in einer Stunde' : 'morgen';
  const tipp = !angemeldet ? ' Mit einem kostenlosen Konto hast du mehr Versuche.' : '';
  return `Du hast ${zeitraum} schon ${regel.max} ${was} gestartet. Bitte versuche es ${spaeter} wieder.${tipp}`;
}

export const MELDUNG_KI_BUDGET =
  'Unsere KI-Funktionen sind heute stark ausgelastet und machen eine kurze Pause. Bitte versuche es morgen wieder. Deine Kennzahlen kannst du weiterhin berechnen.';

export const MELDUNG_SCHUTZ_NICHT_VERFUEGBAR =
  'Diese Funktion ist gerade nicht erreichbar. Bitte versuche es in ein paar Minuten noch einmal.';

export const MELDUNG_ANMELDUNG = 'Bitte melde dich an, um diese Funktion zu nutzen.';

export const MELDUNG_GRATIS_AUFGEBRAUCHT =
  'Deine kostenlose vollständige Analyse ist schon vergeben. Für jede weitere Wohnung brauchst du Premium.';
