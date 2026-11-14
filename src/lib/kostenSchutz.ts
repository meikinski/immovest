/**
 * Kostenschutz für Routen, die bezahlte KI-, Such- oder Geocoding-APIs aufrufen:
 *  - Rate Limit pro IP (abgemeldet) bzw. pro User-ID (angemeldet), Limits in src/config/limits.ts
 *  - globales Tagesbudget für KI-Aufrufe (AI_DAILY_CALL_CAP)
 *
 * Zähler liegen in Supabase (Tabelle rate_limit_counters, Funktion rate_limit_hit), weil Vercel-Funktionen
 * keinen gemeinsamen Speicher haben. Ist die Datenbank nicht erreichbar, wird abgelehnt (fail closed):
 * lieber kurz keine KI als eine unerwartete Rechnung.
 *
 * Läuft in Node und in der Edge-Runtime (nur Web Crypto, kein node:crypto).
 */
import {
  aiTagesLimit, FENSTER_SEKUNDEN, limitMeldung, MELDUNG_ANMELDUNG, MELDUNG_KI_BUDGET,
  MELDUNG_SCHUTZ_NICHT_VERFUEGBAR, RATE_LIMITS, type LimitBucket, type LimitRegel,
} from '@/config/limits';
import { getSupabaseServerClient } from '@/lib/supabase';

// ---------------------------------------------------------------------------------------------
// Zählerspeicher
// ---------------------------------------------------------------------------------------------

export interface ZaehlerStore {
  /** Zählt key um kosten hoch (Fenster startet beim ersten Treffer) und liefert den neuen Stand. */
  hit(key: string, fensterSekunden: number, kosten?: number): Promise<number>;
}

/** Zähler in Supabase. null, wenn Supabase nicht konfiguriert ist. */
export function supabaseZaehler(): ZaehlerStore | null {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  return {
    async hit(key, fensterSekunden, kosten = 1) {
      const { data, error } = await supabase.rpc('rate_limit_hit', {
        p_key: key,
        p_window_seconds: fensterSekunden,
        p_cost: kosten,
      });
      if (error) throw new Error(`rate_limit_hit fehlgeschlagen: ${error.message}`);
      const stand = Number(data);
      if (!Number.isFinite(stand)) throw new Error('rate_limit_hit lieferte keinen Zählerstand');
      return stand;
    },
  };
}

// ---------------------------------------------------------------------------------------------
// Antworten
// ---------------------------------------------------------------------------------------------

export type SchutzCode = 'auth' | 'rate_limit' | 'ki_budget' | 'schutz_nicht_verfuegbar' | 'paywall';

/**
 * Einheitliche Fehlerantwort. Die Meldung steht in error, message und details, weil die
 * bestehenden Clients je nach Route eines dieser Felder anzeigen.
 */
export function schutzAntwort(
  status: number,
  meldung: string,
  code: SchutzCode,
  extra: Record<string, unknown> = {},
  retryAfterSekunden?: number,
): Response {
  const headers: Record<string, string> = { 'Cache-Control': 'no-store' };
  if (retryAfterSekunden) headers['Retry-After'] = String(retryAfterSekunden);
  return Response.json(
    { success: false, error: meldung, message: meldung, details: meldung, code, ...extra },
    { status, headers },
  );
}

// ---------------------------------------------------------------------------------------------
// Identität
// ---------------------------------------------------------------------------------------------

export type Identitaet = { art: 'user'; id: string } | { art: 'ip'; id: string };

/** Client-IP hinter dem Vercel-Proxy. Vercel setzt x-real-ip / x-forwarded-for selbst (nicht fälschbar). */
export function clientIp(req: Request): string {
  const real = req.headers.get('x-real-ip')?.trim();
  if (real) return real;
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || 'unbekannt';
}

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** User-ID, wenn angemeldet, sonst gehashte IP (Klartext-IPs landen nicht in der Datenbank). */
export async function ermittleIdentitaet(req: Request, userId: string | null): Promise<Identitaet> {
  if (userId) return { art: 'user', id: userId };
  return { art: 'ip', id: (await sha256Hex(`immovest-rl:${clientIp(req)}`)).slice(0, 32) };
}

// ---------------------------------------------------------------------------------------------
// Rate Limit
// ---------------------------------------------------------------------------------------------

export type LimitErgebnis =
  | { ok: true }
  | { ok: false; regel: LimitRegel; meldung: string; retryAfter: number };

export async function pruefeRateLimit(
  zaehler: ZaehlerStore,
  bucket: LimitBucket,
  identitaet: Identitaet,
): Promise<LimitErgebnis> {
  const limits = RATE_LIMITS[bucket];
  const angemeldet = identitaet.art === 'user';
  const regeln = angemeldet ? limits.angemeldet : limits.abgemeldet;
  if (!regeln) {
    // Bucket verlangt Anmeldung: dürfte nie erreicht werden, aber sicherheitshalber ablehnen
    return { ok: false, regel: { fenster: 'tag', max: 0 }, meldung: MELDUNG_ANMELDUNG, retryAfter: 0 };
  }
  for (const regel of regeln) {
    const sekunden = FENSTER_SEKUNDEN[regel.fenster];
    const stand = await zaehler.hit(`rl:${bucket}:${identitaet.art}:${identitaet.id}:${regel.fenster}`, sekunden);
    if (stand > regel.max) {
      return { ok: false, regel, meldung: limitMeldung(bucket, regel, angemeldet), retryAfter: sekunden };
    }
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------------------------
// Globales KI-Tagesbudget
// ---------------------------------------------------------------------------------------------

/** Kalendertag in deutscher Zeit, z. B. "2026-11-14" */
export function berlinerTag(jetzt = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(jetzt);
}

export type BudgetErgebnis = { ok: true; stand: number; limit: number } | { ok: false; stand: number; limit: number };

/** Zählt einen KI-Aufruf für heute. Über dem Limit: ablehnen und als Fehler loggen. */
export async function pruefeKiBudget(
  zaehler: ZaehlerStore,
  route: string,
  env: Record<string, string | undefined> = process.env,
  jetzt = new Date(),
): Promise<BudgetErgebnis> {
  const limit = aiTagesLimit(env);
  // Fenster 2 Tage: der Schlüssel enthält den Tag, alte Zeilen räumt die Datenbankfunktion ab
  const stand = await zaehler.hit(`ai:tag:${berlinerTag(jetzt)}`, 2 * 24 * 60 * 60);
  if (stand > limit) {
    console.error(
      `[KI-Budget] Tageslimit erreicht: ${stand - 1} von ${limit} KI-Aufrufen verbraucht, ${route} abgelehnt (AI_DAILY_CALL_CAP).`,
    );
    return { ok: false, stand, limit };
  }
  if (stand === Math.ceil(limit * 0.8)) {
    console.warn(`[KI-Budget] 80 % des Tageslimits erreicht (${stand}/${limit}).`);
  }
  return { ok: true, stand, limit };
}

// ---------------------------------------------------------------------------------------------
// Zusammengesetzter Schutz für einfache Routen
// ---------------------------------------------------------------------------------------------

export interface SchutzDeps {
  getUserId: () => Promise<string | null>;
  zaehler: ZaehlerStore | null;
  env: Record<string, string | undefined>;
}

/** Echte Abhängigkeiten: Clerk und Supabase. Clerk wird erst hier geladen, damit Tests ohne Clerk laufen. */
export async function standardSchutzDeps(): Promise<SchutzDeps> {
  return {
    getUserId: async () => {
      try {
        const { auth } = await import('@clerk/nextjs/server');
        return (await auth()).userId ?? null;
      } catch (e) {
        console.error('[Kostenschutz] Clerk auth() fehlgeschlagen, behandle als abgemeldet', e);
        return null;
      }
    },
    zaehler: supabaseZaehler(),
    env: process.env,
  };
}

export type SchutzErgebnis = { ok: true; userId: string | null } | { ok: false; response: Response };

/**
 * Zähler fehlt (Supabase nicht konfiguriert): in Produktion ablehnen, lokal durchlassen.
 * Gibt null zurück, wenn ohne Zähler weitergemacht werden darf.
 */
function ohneZaehler(env: Record<string, string | undefined>, route: string): Response | null {
  if (env.NODE_ENV === 'production') {
    console.error(`[Kostenschutz] Supabase nicht konfiguriert, ${route} abgelehnt`);
    return schutzAntwort(503, MELDUNG_SCHUTZ_NICHT_VERFUEGBAR, 'schutz_nicht_verfuegbar');
  }
  console.warn(`[Kostenschutz] Supabase nicht konfiguriert, ${route} läuft lokal ohne Limits`);
  return null;
}

/** Rate Limit und (optional) KI-Budget für eine bekannte Identität. */
export async function pruefeLimitsUndBudget(
  req: Request,
  deps: SchutzDeps,
  opts: { route: string; bucket: LimitBucket; ki: boolean; userId: string | null },
): Promise<Response | null> {
  if (!deps.zaehler) return ohneZaehler(deps.env, opts.route);
  try {
    const identitaet = await ermittleIdentitaet(req, opts.userId);
    const limit = await pruefeRateLimit(deps.zaehler, opts.bucket, identitaet);
    if (!limit.ok) {
      console.warn(`[Kostenschutz] Rate Limit ${opts.bucket} (${limit.regel.max}/${limit.regel.fenster}) für ${identitaet.art} erreicht: ${opts.route}`);
      return schutzAntwort(429, limit.meldung, 'rate_limit', {}, limit.retryAfter);
    }
    if (opts.ki) {
      const budget = await pruefeKiBudget(deps.zaehler, opts.route, deps.env);
      if (!budget.ok) return schutzAntwort(503, MELDUNG_KI_BUDGET, 'ki_budget', {}, 60 * 60);
    }
    return null;
  } catch (e) {
    console.error(`[Kostenschutz] Zähler nicht erreichbar, ${opts.route} abgelehnt`, e);
    return schutzAntwort(503, MELDUNG_SCHUTZ_NICHT_VERFUEGBAR, 'schutz_nicht_verfuegbar');
  }
}

/**
 * Anmeldung (falls der Bucket sie verlangt), Rate Limit und KI-Budget in einem Schritt.
 * ki = true zählt den Aufruf gegen AI_DAILY_CALL_CAP.
 */
export async function kiSchutz(
  req: Request,
  opts: { route: string; bucket: LimitBucket; ki: boolean },
  deps?: SchutzDeps,
): Promise<SchutzErgebnis> {
  const d = deps ?? (await standardSchutzDeps());
  const userId = await d.getUserId();
  if (!userId && RATE_LIMITS[opts.bucket].abgemeldet === null) {
    return { ok: false, response: schutzAntwort(401, MELDUNG_ANMELDUNG, 'auth') };
  }
  const abgelehnt = await pruefeLimitsUndBudget(req, d, { ...opts, userId });
  if (abgelehnt) return { ok: false, response: abgelehnt };
  return { ok: true, userId };
}
