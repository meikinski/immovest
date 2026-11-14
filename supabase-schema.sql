-- ImmoVest Database Schema
-- Run this in your Supabase SQL Editor
-- Kann wiederholt ausgeführt werden (auch auf einer bestehenden Datenbank).
-- Bestehende Datenbank auf den aktuellen Stand bringen: supabase/migrations/*.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Analyses table
CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL, -- Clerk user ID
  analysis_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Property data
  kaufpreis NUMERIC NOT NULL DEFAULT 0,
  adresse TEXT NOT NULL DEFAULT '',
  flaeche NUMERIC NOT NULL DEFAULT 0,
  zimmer NUMERIC NOT NULL DEFAULT 0, -- auch 2,5 Zimmer
  baujahr INTEGER NOT NULL DEFAULT 2024,

  -- Financial data
  miete NUMERIC NOT NULL DEFAULT 0,
  hausgeld NUMERIC NOT NULL DEFAULT 0,
  hausgeld_umlegbar NUMERIC NOT NULL DEFAULT 0,
  ek NUMERIC NOT NULL DEFAULT 0,
  zins NUMERIC NOT NULL DEFAULT 3.5,
  tilgung NUMERIC NOT NULL DEFAULT 2,

  -- Costs and taxes
  grunderwerbsteuer_pct NUMERIC NOT NULL DEFAULT 6.5,
  notar_pct NUMERIC NOT NULL DEFAULT 2,
  makler_pct NUMERIC NOT NULL DEFAULT 3.57,
  mietausfall_pct NUMERIC NOT NULL DEFAULT 0,
  instandhaltungskosten_pro_qm NUMERIC NOT NULL DEFAULT 0,
  steuer NUMERIC NOT NULL DEFAULT 0,
  afa NUMERIC NOT NULL DEFAULT 2,
  ruecklagen NUMERIC NOT NULL DEFAULT 0,
  persoenlicher_steuersatz NUMERIC NOT NULL DEFAULT 40,

  -- Calculated values
  cashflow_operativ NUMERIC NOT NULL DEFAULT 0,
  nettorendite NUMERIC NOT NULL DEFAULT 0,
  score NUMERIC NOT NULL DEFAULT 0,
  anschaffungskosten NUMERIC NOT NULL DEFAULT 0,

  -- AI-generated comments
  generated_comment TEXT DEFAULT '',
  lage_comment TEXT DEFAULT '',
  mietpreis_comment TEXT DEFAULT '',
  qm_preis_comment TEXT DEFAULT '',
  invest_comment TEXT DEFAULT '',

  -- Markt-Recherche: { facts, mietDelta, kaufDelta } (Vergleichswerte, Lage-Fakten, Quellen)
  markt_facts JSONB DEFAULT NULL,

  -- Stabile ID aus dem Client (Store/localStorage), damit erneutes Speichern aktualisiert statt dupliziert
  client_id TEXT DEFAULT NULL,

  -- Kompletter Store-Zustand zum Laden auf anderen Geräten (enthält auch Felder ohne eigene Spalte)
  state JSONB DEFAULT NULL
);

-- Migration für bestehende Datenbanken (vollständig: supabase/migrations/2026-11-14_analyses_speichern.sql)
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS markt_facts JSONB DEFAULT NULL;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS client_id TEXT DEFAULT NULL;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS state JSONB DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_analyses_user_client ON analyses(user_id, client_id);

-- Bestehende Tabellen mit engeren Typen erweitern: Ganzzahl-Spalten → NUMERIC (76,5 m², 468,33 €),
-- VARCHAR(n) → TEXT (lange KI-Kommentare). Werte bleiben unverändert, wiederholbar.
DO $$
DECLARE
  c RECORD;
BEGIN
  FOR c IN
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'analyses'
  LOOP
    IF c.column_name IN (
         'kaufpreis', 'flaeche', 'zimmer', 'miete', 'hausgeld', 'hausgeld_umlegbar', 'ek', 'zins', 'tilgung',
         'grunderwerbsteuer_pct', 'notar_pct', 'makler_pct', 'mietausfall_pct', 'instandhaltungskosten_pro_qm',
         'steuer', 'afa', 'ruecklagen', 'persoenlicher_steuersatz', 'cashflow_operativ', 'nettorendite',
         'score', 'anschaffungskosten')
       AND c.data_type IN ('smallint', 'integer', 'bigint', 'real', 'double precision') THEN
      EXECUTE format('ALTER TABLE analyses ALTER COLUMN %I TYPE NUMERIC USING %I::numeric', c.column_name, c.column_name);
    ELSIF c.column_name IN (
         'analysis_name', 'adresse', 'client_id',
         'generated_comment', 'lage_comment', 'mietpreis_comment', 'qm_preis_comment', 'invest_comment')
       AND c.data_type IN ('character varying', 'character') THEN
      EXECUTE format('ALTER TABLE analyses ALTER COLUMN %I TYPE TEXT', c.column_name);
    END IF;
  END LOOP;
END $$;

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);

-- User premium usage tracking
CREATE TABLE IF NOT EXISTS user_premium_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL, -- Clerk user ID
  usage_count INTEGER NOT NULL DEFAULT 0,
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  premium_until TIMESTAMP WITH TIME ZONE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  -- Wohnung(en) der kostenlosen Analyse: [{ analysis_id, adresse, at }], nur /api/agent/run schreibt
  free_analyses JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_premium_usage_user_id ON user_premium_usage(user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_analyses_updated_at ON analyses;
CREATE TRIGGER update_analyses_updated_at BEFORE UPDATE ON analyses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_premium_usage_updated_at ON user_premium_usage;
CREATE TRIGGER update_premium_usage_updated_at BEFORE UPDATE ON user_premium_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Scenarios table
CREATE TABLE IF NOT EXISTS scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Clerk user ID (for direct queries)
  scenario_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Scenario deltas/adjustments
  miete_delta_pct NUMERIC NOT NULL DEFAULT 0,
  preis_delta_pct NUMERIC NOT NULL DEFAULT 0,
  zins_delta_pp NUMERIC NOT NULL DEFAULT 0,
  tilgung_delta_pp NUMERIC NOT NULL DEFAULT 0,
  ek_delta_pct NUMERIC NOT NULL DEFAULT 0,
  sondertilgung_jaehrlich NUMERIC NOT NULL DEFAULT 0,

  -- Scenario settings
  wertentwicklung_aktiv BOOLEAN NOT NULL DEFAULT false,
  wertentwicklung_pct NUMERIC NOT NULL DEFAULT 0,
  darlehens_typ TEXT NOT NULL DEFAULT 'annuitaet',
  miet_inflation_pct NUMERIC NOT NULL DEFAULT 0,
  kosten_inflation_pct NUMERIC NOT NULL DEFAULT 0,
  verkaufs_nebenkosten_pct NUMERIC NOT NULL DEFAULT 7,

  -- Calculated scenario results (cached for performance)
  scenario_kaufpreis NUMERIC NOT NULL DEFAULT 0,
  scenario_miete NUMERIC NOT NULL DEFAULT 0,
  scenario_zins NUMERIC NOT NULL DEFAULT 0,
  scenario_tilgung NUMERIC NOT NULL DEFAULT 0,
  scenario_ek NUMERIC NOT NULL DEFAULT 0,
  scenario_cashflow_vor_steuer NUMERIC NOT NULL DEFAULT 0,
  scenario_cashflow_nach_steuer NUMERIC NOT NULL DEFAULT 0,
  scenario_nettorendite NUMERIC NOT NULL DEFAULT 0,
  scenario_bruttorendite NUMERIC NOT NULL DEFAULT 0,
  scenario_ek_rendite NUMERIC NOT NULL DEFAULT 0,
  scenario_noi_monthly NUMERIC NOT NULL DEFAULT 0,
  scenario_dscr NUMERIC NOT NULL DEFAULT 0,
  scenario_rate_monat NUMERIC NOT NULL DEFAULT 0,
  scenario_abzahlungsjahr INTEGER NOT NULL DEFAULT 0
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_scenarios_analysis_id ON scenarios(analysis_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_user_id ON scenarios(user_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_created_at ON scenarios(created_at DESC);

-- Apply updated_at trigger to scenarios
DROP TRIGGER IF EXISTS update_scenarios_updated_at ON scenarios;
CREATE TRIGGER update_scenarios_updated_at BEFORE UPDATE ON scenarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
--
-- RLS ist auf allen Tabellen aktiviert, und es werden bewusst KEINE Policies
-- angelegt. Damit haben die Rollen "anon" und "authenticated" (also jeder mit
-- dem öffentlichen NEXT_PUBLIC_SUPABASE_ANON_KEY) keinerlei Zugriff.
--
-- Die App greift ausschließlich serverseitig über getSupabaseServerClient()
-- (Service-Role-Key) zu. Der Service-Role-Key umgeht RLS; die Autorisierung
-- pro Nutzer (Clerk user_id) passiert in den API-Routen.
--
-- NIEMALS Policies mit USING (true) / WITH CHECK (true) anlegen und RLS nicht
-- deaktivieren: Beides öffnet die Tabellen für jeden mit dem Anon-Key.
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_premium_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

-- Migration für bestehende Datenbanken: offene Policies aus früheren Versionen
-- dieses Schemas entfernen (siehe supabase/migrations/2026-11-14_drop_open_rls_policies.sql)
DROP POLICY IF EXISTS "Users can view their own analyses" ON analyses;
DROP POLICY IF EXISTS "Users can insert their own analyses" ON analyses;
DROP POLICY IF EXISTS "Users can update their own analyses" ON analyses;
DROP POLICY IF EXISTS "Users can delete their own analyses" ON analyses;

DROP POLICY IF EXISTS "Users can view their own premium usage" ON user_premium_usage;
DROP POLICY IF EXISTS "Users can update their own premium usage" ON user_premium_usage;
DROP POLICY IF EXISTS "System can insert premium usage" ON user_premium_usage;

DROP POLICY IF EXISTS "Users can view their own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can insert their own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can update their own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can delete their own scenarios" ON scenarios;

-- Rate Limits und KI-Tagesbudget: Tabelle rate_limit_counters und Funktion rate_limit_hit()
-- siehe supabase/migrations/2026-11-14_kosten_schutz.sql
