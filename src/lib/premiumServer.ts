import { getSupabaseServerClient } from '@/lib/supabase';
import { GRATIS_ANALYSEN } from '@/lib/preise';

/**
 * Prüft serverseitig, ob der Nutzer Premium hat oder noch in seiner kostenlosen Analyse ist.
 * Welche Wohnung die kostenlose ist, merkt sich der Client; hier zählt nur das Kontingent.
 */
export async function darfVollanalyse(userId: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from('user_premium_usage')
    .select('is_premium, premium_until, usage_count')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return false;
  if (!data) return true; // neuer Nutzer, Kontingent noch frei
  const premium = !!data.is_premium && !!data.premium_until && new Date(data.premium_until) > new Date();
  return premium || (data.usage_count || 0) <= GRATIS_ANALYSEN;
}
