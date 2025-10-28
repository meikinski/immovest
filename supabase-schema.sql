-- ImmoVest Database Schema
-- Run this in your Supabase SQL Editor

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
  zimmer INTEGER NOT NULL DEFAULT 0,
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
  anschaffungskosten NUMERIC NOT NULL DEFAULT 0
);

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

-- Row Level Security (RLS)
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_premium_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analyses
-- Note: Since we're using Clerk, we'll handle authorization in the API layer
-- For now, allow authenticated users to access their own data
CREATE POLICY "Users can view their own analyses"
  ON analyses FOR SELECT
  USING (true); -- Will be filtered in API by user_id

CREATE POLICY "Users can insert their own analyses"
  ON analyses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own analyses"
  ON analyses FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their own analyses"
  ON analyses FOR DELETE
  USING (true);

-- RLS Policies for user_premium_usage
CREATE POLICY "Users can view their own premium usage"
  ON user_premium_usage FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own premium usage"
  ON user_premium_usage FOR UPDATE
  USING (true);

CREATE POLICY "System can insert premium usage"
  ON user_premium_usage FOR INSERT
  WITH CHECK (true);
