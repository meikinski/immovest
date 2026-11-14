import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// Es gibt bewusst keinen Browser-Client mit dem Anon-Key: Alle Tabellen haben RLS ohne Policies
// (supabase/migrations/2026-11-14_drop_open_rls_policies.sql). Zugriff nur serverseitig über API-Routen.

// Server-side client with service role (for API routes)
export function getSupabaseServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Database schema types
 */
export type Database = {
  public: {
    Tables: {
      analyses: {
        Row: {
          id: string;
          user_id: string;
          analysis_name: string;
          created_at: string;
          updated_at: string;
          // Property data
          kaufpreis: number;
          adresse: string;
          flaeche: number;
          zimmer: number;
          baujahr: number;
          // Financial data
          miete: number;
          hausgeld: number;
          hausgeld_umlegbar: number;
          ek: number;
          zins: number;
          tilgung: number;
          // Costs
          grunderwerbsteuer_pct: number;
          notar_pct: number;
          makler_pct: number;
          mietausfall_pct: number;
          instandhaltungskosten_pro_qm: number;
          steuer: number;
          afa: number;
          ruecklagen: number;
          persoenlicher_steuersatz: number;
          // Calculated values
          cashflow_operativ: number;
          nettorendite: number;
          score: number;
          anschaffungskosten: number;
        };
        Insert: Omit<Database['public']['Tables']['analyses']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['analyses']['Insert']>;
      };
      user_premium_usage: {
        Row: {
          id: string;
          user_id: string;
          usage_count: number;
          is_premium: boolean;
          premium_until: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_premium_usage']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_premium_usage']['Insert']>;
      };
    };
  };
};
