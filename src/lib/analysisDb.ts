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

/** Fehler, weil eine neue Spalte (client_id/state/markt_facts) noch nicht migriert ist. */
export function isMissingColumnError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === 'PGRST204' || error.code === '42703' || /client_id|markt_facts|'state'|column/i.test(error.message ?? '');
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
