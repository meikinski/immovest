/**
 * Serverseitige Plan-Prüfung für die vollständige Analyse (einzige Quelle der Wahrheit).
 *
 * - Premium (is_premium und premium_until in der Zukunft): immer erlaubt.
 * - Kostenloses Konto: GRATIS_ANALYSEN Wohnungen. Welche das sind, steht in
 *   user_premium_usage.free_analyses (Liste aus { analysis_id, adresse, at }).
 *   Entscheidend ist die normalisierte Adresse, wie im Client (gratisSchluessel):
 *   Wiederholungen für dieselbe Adresse zählen nicht erneut, egal mit welcher analysisId.
 *   Dieselbe analysisId mit einer anderen Adresse ist eine neue Wohnung.
 * - usage_count wird nur in /api/agent/run hochgezählt, und zwar erst nach einer erfolgreichen Analyse,
 *   per Compare-and-Swap auf usage_count (parallele Aufrufe können das Kontingent nicht doppelt nutzen).
 */
import { GRATIS_ANALYSEN } from '@/lib/preise';
import { getSupabaseServerClient } from '@/lib/supabase';

export interface GratisEintrag {
  analysis_id: string | null;
  adresse: string;
  at: string;
}

export interface PlanZeile {
  is_premium: boolean | null;
  premium_until: string | null;
  usage_count: number | null;
  free_analyses: GratisEintrag[] | null;
}

export interface PlanStore {
  /** Zeile des Nutzers oder null. Wirft bei Datenbankfehlern. */
  lese(userId: string): Promise<PlanZeile | null>;
  /** Legt eine leere Zeile an, falls keine existiert (bestehende bleibt unverändert). */
  legeAn(userId: string): Promise<void>;
  /**
   * Setzt usage_count und free_analyses nur, wenn usage_count noch erwarteterZaehler ist.
   * true = geschrieben, false = jemand anderes war schneller.
   */
  verbuche(userId: string, erwarteterZaehler: number, neu: { usage_count: number; free_analyses: GratisEintrag[] }): Promise<boolean>;
}

/**
 * Adresse wie im Client (gratisSchluessel): klein, ohne Rand- und doppelte Leerzeichen.
 * Kommas werden vereinheitlicht ("A ,B" → "a, b"), damit die im PDF-Report aufgeteilte Adresse
 * (Titel + Ort) wieder auf denselben Schlüssel kommt.
 */
export function normalisiereAdresse(adresse: unknown): string {
  if (typeof adresse !== 'string') return '';
  return adresse
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)
    .join(', ')
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function istPremiumAktiv(zeile: PlanZeile | null, jetzt = new Date()): boolean {
  return !!zeile?.is_premium && !!zeile.premium_until && new Date(zeile.premium_until) > jetzt;
}

function eintraege(zeile: PlanZeile | null): GratisEintrag[] {
  return Array.isArray(zeile?.free_analyses) ? zeile.free_analyses : [];
}

export type PlanEntscheidung =
  | { erlaubt: true; art: 'premium' | 'gratis_wiederholung' | 'gratis_neu' }
  | { erlaubt: false; art: 'limit' };

/** Reine Entscheidung aus der Datenbankzeile, ohne zu schreiben. */
export function entscheidePlan(zeile: PlanZeile | null, adresseNorm: string, jetzt = new Date()): PlanEntscheidung {
  if (istPremiumAktiv(zeile, jetzt)) return { erlaubt: true, art: 'premium' };
  if (adresseNorm && eintraege(zeile).some(e => e.adresse === adresseNorm)) {
    return { erlaubt: true, art: 'gratis_wiederholung' };
  }
  if ((zeile?.usage_count ?? 0) < GRATIS_ANALYSEN) return { erlaubt: true, art: 'gratis_neu' };
  return { erlaubt: false, art: 'limit' };
}

export async function pruefePlan(store: PlanStore, userId: string, adresseNorm: string): Promise<PlanEntscheidung> {
  return entscheidePlan(await store.lese(userId), adresseNorm);
}

/**
 * Verbucht die kostenlose Analyse nach einem erfolgreichen Lauf.
 * 'ok' = verbucht oder nicht nötig (Premium, gleiche Adresse), 'limit' = Kontingent inzwischen aufgebraucht.
 */
export async function verbucheGratisAnalyse(
  store: PlanStore,
  userId: string,
  analysisId: string | null,
  adresseNorm: string,
  jetzt = new Date(),
): Promise<'ok' | 'limit'> {
  for (let versuch = 0; versuch < 3; versuch++) {
    let zeile = await store.lese(userId);
    if (!zeile) {
      await store.legeAn(userId);
      zeile = await store.lese(userId);
      if (!zeile) throw new Error('user_premium_usage-Zeile konnte nicht angelegt werden');
    }
    const entscheidung = entscheidePlan(zeile, adresseNorm, jetzt);
    if (!entscheidung.erlaubt) return 'limit';
    if (entscheidung.art !== 'gratis_neu') return 'ok';

    const zaehler = zeile.usage_count ?? 0;
    const geschrieben = await store.verbuche(userId, zaehler, {
      usage_count: zaehler + 1,
      free_analyses: [...eintraege(zeile), { analysis_id: analysisId, adresse: adresseNorm, at: jetzt.toISOString() }],
    });
    if (geschrieben) return 'ok';
    // Ein paralleler Aufruf hat usage_count geändert: neu lesen und neu entscheiden
  }
  return 'limit';
}

/** PlanStore auf user_premium_usage. null, wenn Supabase nicht konfiguriert ist. */
export function supabasePlanStore(): PlanStore | null {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  return {
    async lese(userId) {
      const { data, error } = await supabase
        .from('user_premium_usage')
        .select('is_premium, premium_until, usage_count, free_analyses')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw new Error(`user_premium_usage lesen fehlgeschlagen: ${error.message}`);
      return (data as PlanZeile | null) ?? null;
    },
    async legeAn(userId) {
      const { error } = await supabase
        .from('user_premium_usage')
        .upsert({ user_id: userId, usage_count: 0, is_premium: false }, { onConflict: 'user_id', ignoreDuplicates: true });
      if (error) throw new Error(`user_premium_usage anlegen fehlgeschlagen: ${error.message}`);
    },
    async verbuche(userId, erwarteterZaehler, neu) {
      const { data, error } = await supabase
        .from('user_premium_usage')
        .update({ ...neu, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('usage_count', erwarteterZaehler)
        .select('user_id');
      if (error) throw new Error(`user_premium_usage verbuchen fehlgeschlagen: ${error.message}`);
      return Array.isArray(data) && data.length > 0;
    },
  };
}

/**
 * Für PDF-Report und KI-Einschätzung: Hat der Nutzer Zugriff auf die vollständige Analyse dieser Wohnung?
 * Premium, noch freies Kontingent oder genau die Wohnung, für die die Gratis-Analyse vergeben ist.
 * Verbraucht nichts.
 */
export async function darfVollanalyse(userId: string, adresse: unknown, store = supabasePlanStore()): Promise<boolean> {
  if (!store) return false;
  try {
    return (await pruefePlan(store, userId, normalisiereAdresse(adresse))).erlaubt;
  } catch (e) {
    console.error('[Plan] Prüfung fehlgeschlagen, verweigere Zugriff', e);
    return false;
  }
}
