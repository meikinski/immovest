import { getSupabaseServerClient } from '@/lib/supabase';

/** Prüft serverseitig, ob der Nutzer ein aktives Premium-Abo hat */
export async function istPremiumAktiv(userId: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from('user_premium_usage')
    .select('is_premium, premium_until')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return false;
  return !!data.is_premium && !!data.premium_until && new Date(data.premium_until) > new Date();
}
