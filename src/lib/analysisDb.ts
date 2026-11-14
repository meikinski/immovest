// Server-Helfer für die analyses-Tabelle.
//
// IDs: Im Client (Store, localStorage, URLs) hat jede Analyse eine stabile `analysisId`
// (z. B. "analysis_1727..._x1y2"). In Supabase steht sie in `client_id`; der Primärschlüssel
// `id` ist eine UUID, auf die u. a. scenarios.analysis_id verweist.
// Ältere Zeilen haben kein client_id – dort dient die UUID selbst als analysisId.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SavedAnalysis } from '@/lib/storage';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (v: string) => UUID_RE.test(v);

/** Minimale Form eines Supabase/PostgREST-Fehlers. */
export type DbError = { code?: string; message?: string; details?: string | null; hint?: string | null };

/** Fehler, weil eine Spalte in der Tabelle fehlt (Migration noch nicht gelaufen). */
export function isMissingColumnError(error: DbError | null): boolean {
  if (!error) return false;
  // PGRST204: Spalte nicht im Schema-Cache (Insert/Update), 42703: Spalte existiert nicht (Select/Filter)
  return error.code === 'PGRST204' || error.code === '42703';
}

/** Name der fehlenden Spalte aus der Fehlermeldung, falls erkennbar. */
export function missingColumnName(error: DbError): string | null {
  const m = error.message ?? '';
  const treffer =
    /Could not find the '([^']+)' column/i.exec(m) ??
    /column "?(?:[a-z_]+\.)?([a-z_0-9]+)"? (?:of relation "[^"]+" )?does not exist/i.exec(m);
  return treffer ? treffer[1] : null;
}

/** Wert passt nicht zum Spaltentyp (z. B. 76.5 in einer INTEGER-Spalte) oder ist zu groß. */
export function isTypeMismatchError(error: DbError | null): boolean {
  return !!error && (error.code === '22P02' || error.code === '22003');
}

/** Findet die DB-Zeile (id) zu einer Client-analysisId oder einer UUID. */
export async function resolveAnalysisRowId(
  supabase: SupabaseClient,
  userId: string,
  analysisId: string
): Promise<string | null> {
  const byClient = await supabase
    .from('analyses')
    .select('id')
    .eq('user_id', userId)
    .eq('client_id', analysisId)
    .order('updated_at', { ascending: false })
    .limit(1);
  if (!byClient.error && byClient.data?.length) return byClient.data[0].id as string;

  if (isUuid(analysisId)) {
    const byId = await supabase
      .from('analyses')
      .select('id')
      .eq('user_id', userId)
      .eq('id', analysisId)
      .limit(1);
    if (!byId.error && byId.data?.length) return byId.data[0].id as string;
  }
  return null;
}

type Row = Record<string, unknown>;

const num = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0);

/** Zeile → Listeneintrag für die Profilseite. */
export function rowToListItem(row: Row): SavedAnalysis & { legacy: boolean } {
  return {
    analysisId: (row.client_id as string) || (row.id as string),
    analysisName: (row.analysis_name as string) || '',
    createdAt: (row.created_at as string) || '',
    updatedAt: (row.updated_at as string) || (row.created_at as string) || '',
    kaufpreis: num(row.kaufpreis),
    adresse: (row.adresse as string) || '',
    flaeche: num(row.flaeche),
    zimmer: num(row.zimmer),
    nettorendite: num(row.nettorendite),
    cashflow_operativ: num(row.cashflow_operativ),
    legacy: !row.client_id,
  };
}

export const duplicateKey = (a: { adresse?: unknown; kaufpreis?: unknown }) =>
  `${String(a.adresse ?? '').trim().toLowerCase()}|${num(a.kaufpreis)}`;

/**
 * Neueste Zeile je Analyse. Alte Zeilen ohne client_id (früher entstand pro Speichern eine neue)
 * werden über Adresse + Kaufpreis zusammengefasst und ausgeblendet, wenn es schon einen neueren
 * Eintrag für dasselbe Objekt gibt.
 */
export function dedupeRows(rows: Row[]): Row[] {
  const sorted = [...rows].sort((a, b) =>
    String(b.updated_at ?? b.created_at ?? '').localeCompare(String(a.updated_at ?? a.created_at ?? ''))
  );
  const seenClient = new Set<string>();
  const seenObject = new Set<string>();
  const result: Row[] = [];
  for (const row of sorted) {
    const key = duplicateKey(row);
    if (row.client_id) {
      if (seenClient.has(row.client_id as string)) continue;
      seenClient.add(row.client_id as string);
    } else if (seenObject.has(key)) {
      continue;
    }
    seenObject.add(key);
    result.push(row);
  }
  return result;
}

/** Zeile → Store-Daten (für importData). Neue Zeilen haben den kompletten Zustand in `state`. */
export function rowToState(row: Row): Record<string, unknown> {
  const analysisId = (row.client_id as string) || (row.id as string);
  const markt = (row.markt_facts ?? null) as { facts?: unknown; mietDelta?: number | null; kaufDelta?: number | null } | null;

  if (row.state && typeof row.state === 'object') {
    return { ...(row.state as Row), analysisId };
  }

  // Ältere Zeilen: nur die einzelnen Spalten vorhanden
  return {
    analysisId,
    analysisName: row.analysis_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    kaufpreis: num(row.kaufpreis),
    adresse: row.adresse ?? '',
    flaeche: num(row.flaeche),
    zimmer: num(row.zimmer),
    baujahr: num(row.baujahr),
    miete: num(row.miete),
    hausgeld: num(row.hausgeld),
    hausgeld_umlegbar: num(row.hausgeld_umlegbar),
    ek: num(row.ek),
    zins: num(row.zins),
    tilgung: num(row.tilgung),
    grunderwerbsteuer_pct: num(row.grunderwerbsteuer_pct),
    notar_pct: num(row.notar_pct),
    makler_pct: num(row.makler_pct),
    mietausfall_pct: num(row.mietausfall_pct),
    instandhaltungskosten_pro_qm: num(row.instandhaltungskosten_pro_qm),
    steuer: num(row.steuer),
    afa: num(row.afa),
    ruecklagen: num(row.ruecklagen),
    persoenlicher_steuersatz: num(row.persoenlicher_steuersatz),
    generatedComment: row.generated_comment ?? '',
    lageComment: row.lage_comment ?? '',
    mietpreisComment: row.mietpreis_comment ?? '',
    qmPreisComment: row.qm_preis_comment ?? '',
    investComment: row.invest_comment ?? '',
    marktFacts: markt?.facts ?? null,
    mietMarktDelta: markt?.mietDelta ?? null,
    kaufMarktDelta: markt?.kaufDelta ?? null,
  };
}

// ---------------------------------------------------------------------------------------------
// Speichern
//
// Die Wahrheit liegt in `state` (kompletter Store-Zustand als JSONB). Neue Felder im Store brauchen
// deshalb keine Schema-Änderung. Die einzelnen Spalten sind nur eine Kopie für Liste, Suche und
// Sortierung. Weicht die Live-Tabelle vom erwarteten Schema ab (fehlende Spalte, INTEGER statt
// NUMERIC), wird trotzdem gespeichert, statt mit HTTP 500 zu scheitern.
// ---------------------------------------------------------------------------------------------

/** Endliche Zahl oder Standardwert (NaN, Infinity, null und leere Strings führen zum Standardwert). */
function zahl(v: unknown, fallback = 0): number {
  if (v === null || v === undefined || v === '') return fallback;
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
}

const text = (v: unknown) => (typeof v === 'string' ? v : '');

/** Postgres lehnt \u0000 in TEXT und JSONB ab – kann in gescrapten Texten vorkommen. */
function ohneNullBytes<T>(v: T): T {
  if (typeof v === 'string') return v.replace(/\u0000/g, '') as T;
  if (Array.isArray(v)) return v.map(ohneNullBytes) as T;
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.entries(v as Row).map(([k, w]) => [k, ohneNullBytes(w)])) as T;
  }
  return v;
}

const neueClientId = () => `analysis_${Date.now()}_${Math.random().toString(36).substring(7)}`;

/** Ohne diese Spalten ist eine Zeile nicht brauchbar – sie werden nie weggelassen. */
const PFLICHT_SPALTEN = new Set(['user_id', 'analysis_name']);

/** Store-Zustand (exportState) → Zeile für die analyses-Tabelle. */
export function buildAnalysisRow(userId: string, payload: Row): { clientId: string; row: Row } {
  const data = ohneNullBytes(payload);
  const clientId = typeof data.analysisId === 'string' && data.analysisId ? data.analysisId : neueClientId();

  const row: Row = {
    user_id: userId,
    analysis_name: text(data.analysisName).trim() || text(data.adresse).trim() || 'Unbenannt',

    // Objekt
    kaufpreis: zahl(data.kaufpreis),
    adresse: text(data.adresse),
    flaeche: zahl(data.flaeche),
    zimmer: zahl(data.zimmer),
    baujahr: Math.round(zahl(data.baujahr, new Date().getFullYear())),

    // Finanzierung
    miete: zahl(data.miete),
    hausgeld: zahl(data.hausgeld),
    hausgeld_umlegbar: zahl(data.hausgeld_umlegbar),
    ek: zahl(data.ek),
    zins: zahl(data.zins, 3.5),
    tilgung: zahl(data.tilgung, 2),

    // Kosten und Steuern
    grunderwerbsteuer_pct: zahl(data.grunderwerbsteuer_pct, 6.5),
    notar_pct: zahl(data.notar_pct, 2),
    makler_pct: zahl(data.makler_pct, 3.57),
    mietausfall_pct: zahl(data.mietausfall_pct),
    instandhaltungskosten_pro_qm: zahl(data.instandhaltungskosten_pro_qm),
    steuer: zahl(data.steuer),
    afa: zahl(data.afa, 2),
    ruecklagen: zahl(data.ruecklagen),
    persoenlicher_steuersatz: zahl(data.persoenlicher_steuersatz, 40),

    // Ergebnisse
    cashflow_operativ: zahl(data.cashflow_operativ),
    nettorendite: zahl(data.nettorendite),
    score: zahl(data.score),
    anschaffungskosten: zahl(data.anschaffungskosten),

    // KI-Kommentare
    generated_comment: text(data.generatedComment),
    lage_comment: text(data.lageComment),
    mietpreis_comment: text(data.mietpreisComment),
    qm_preis_comment: text(data.qmPreisComment),
    invest_comment: text(data.investComment),

    client_id: clientId,
    // Kompletter Store-Zustand – auch Felder, die es heute noch nicht gibt
    state: { ...data, analysisId: clientId },
    markt_facts: data.marktFacts
      ? { facts: data.marktFacts, mietDelta: data.mietMarktDelta ?? null, kaufDelta: data.kaufMarktDelta ?? null }
      : null,
  };
  return { clientId, row };
}

export type SaveAnalysisResult =
  | { ok: true; clientId: string; dbId: string; hinweise: string[] }
  | { ok: false; clientId: string; error: DbError | null; hinweise: string[] };

/**
 * Speichert die Analyse (aktualisiert die vorhandene Zeile derselben client_id, sonst neue Zeile).
 * Jeder Datenbankfehler wird mit Code, Meldung, Details und Hinweis ins Server-Log geschrieben.
 */
export async function saveAnalysisRow(
  supabase: SupabaseClient,
  userId: string,
  payload: Row
): Promise<SaveAnalysisResult> {
  const { clientId, row: vollstaendig } = buildAnalysisRow(userId, payload);
  let row = vollstaendig;
  const hinweise: string[] = [];
  let gerundetAlle = false;

  const existingId = await resolveAnalysisRowId(supabase, userId, clientId);
  const schreiben = (r: Row) =>
    existingId
      ? supabase.from('analyses').update(r).eq('id', existingId).eq('user_id', userId).select('id').single()
      : supabase.from('analyses').insert(r).select('id').single();

  // Höchstens ein Versuch je Spalte plus Reserve – endet sicher
  for (let versuch = 0; versuch <= Object.keys(vollstaendig).length + 2; versuch++) {
    const { data, error } = await schreiben(row);
    if (!error && data) {
      if (hinweise.length) {
        console.warn(
          `[ANALYSIS] Gespeichert mit Abweichungen vom Schema (${hinweise.join('; ')}). ` +
            'Bitte supabase/migrations/2026-11-14_analyses_speichern.sql ausführen.'
        );
      }
      return { ok: true, clientId, dbId: (data as { id: string }).id, hinweise };
    }

    console.error('❌ [ANALYSIS] Datenbankfehler beim Speichern:', {
      code: error?.code, message: error?.message, details: error?.details, hint: error?.hint,
      versuch, spalten: Object.keys(row).length, userId, clientId,
    });
    if (!error) return { ok: false, clientId, error: null, hinweise };

    // 1) Spalte fehlt in der Live-Tabelle → ohne sie speichern
    if (isMissingColumnError(error)) {
      const spalte = missingColumnName(error);
      const weg = spalte && spalte in row
        ? [spalte]
        : ['client_id', 'state', 'markt_facts'].filter(s => s in row); // Name nicht erkennbar → wie vor der Migration
      if (!weg.length || weg.some(s => PFLICHT_SPALTEN.has(s))) return { ok: false, clientId, error, hinweise };
      row = Object.fromEntries(Object.entries(row).filter(([k]) => !weg.includes(k)));
      hinweise.push(`Spalte fehlt: ${weg.join(', ')}`);
      continue;
    }

    // 2) Dezimalwert in Ganzzahl-Spalte → Spaltenkopie runden. Nur wenn `state` die exakten Werte hält.
    //    Postgres nennt den Wert, nicht die Spalte: invalid input syntax for type integer: "76.5"
    if (isTypeMismatchError(error) && 'state' in row) {
      const wert = /: "([^"]+)"/.exec(error.message ?? '')?.[1];
      const betroffen = Object.entries(row).filter(
        ([, v]) => typeof v === 'number' && !Number.isInteger(v) && (gerundetAlle || !wert || String(v) === wert)
      );
      // Wert nicht zuordenbar → beim nächsten Mal alle Dezimalwerte runden
      const ziel = betroffen.length ? betroffen : Object.entries(row).filter(([, v]) => typeof v === 'number' && !Number.isInteger(v));
      if (ziel.length) {
        if (!betroffen.length || !wert) gerundetAlle = true;
        const namen = new Set(ziel.map(([k]) => k));
        row = Object.fromEntries(Object.entries(row).map(([k, v]) => [k, namen.has(k) ? Math.round(v as number) : v]));
        hinweise.push(`Ganzzahl-Spalte, Wert gerundet (exakt in state): ${[...namen].join(', ')}`);
        continue;
      }
    }

    return { ok: false, clientId, error, hinweise };
  }
  return { ok: false, clientId, error: { message: 'Zu viele Versuche' }, hinweise };
}
