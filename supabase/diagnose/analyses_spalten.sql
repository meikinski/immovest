-- Diagnose: Wie sieht die Live-Tabelle "analyses" wirklich aus?
-- Supabase Dashboard → SQL Editor → New query → einfügen → Run. Liest nur, ändert nichts.
--
-- Vergleichen mit supabase-schema.sql:
--   passt = 'ok'      → Spalte entspricht dem Schema
--   passt = 'TYP'     → anderer Typ (z. B. integer statt numeric, character varying statt text)
--   passt = 'FEHLT'   → Spalte fehlt in der Live-Tabelle
--   passt = 'FREMD'   → Spalte, die die App nicht kennt; kritisch, wenn pflicht_ohne_standard = true

WITH erwartet(spalte, typ) AS (VALUES
  ('id', 'uuid'), ('user_id', 'text'), ('analysis_name', 'text'),
  ('created_at', 'timestamp with time zone'), ('updated_at', 'timestamp with time zone'),
  ('kaufpreis', 'numeric'), ('adresse', 'text'), ('flaeche', 'numeric'), ('zimmer', 'numeric'), ('baujahr', 'integer'),
  ('miete', 'numeric'), ('hausgeld', 'numeric'), ('hausgeld_umlegbar', 'numeric'), ('ek', 'numeric'),
  ('zins', 'numeric'), ('tilgung', 'numeric'), ('grunderwerbsteuer_pct', 'numeric'), ('notar_pct', 'numeric'),
  ('makler_pct', 'numeric'), ('mietausfall_pct', 'numeric'), ('instandhaltungskosten_pro_qm', 'numeric'),
  ('steuer', 'numeric'), ('afa', 'numeric'), ('ruecklagen', 'numeric'), ('persoenlicher_steuersatz', 'numeric'),
  ('cashflow_operativ', 'numeric'), ('nettorendite', 'numeric'), ('score', 'numeric'), ('anschaffungskosten', 'numeric'),
  ('generated_comment', 'text'), ('lage_comment', 'text'), ('mietpreis_comment', 'text'),
  ('qm_preis_comment', 'text'), ('invest_comment', 'text'),
  ('markt_facts', 'jsonb'), ('client_id', 'text'), ('state', 'jsonb')
)
SELECT
  COALESCE(c.column_name, e.spalte) AS spalte,
  e.typ AS typ_laut_schema,
  c.data_type AS typ_live,
  c.character_maximum_length AS max_laenge,
  c.numeric_precision AS stellen,
  c.numeric_scale AS nachkommastellen,
  c.is_nullable,
  c.column_default,
  (c.is_nullable = 'NO' AND c.column_default IS NULL AND c.is_identity = 'NO') AS pflicht_ohne_standard,
  CASE
    WHEN c.column_name IS NULL THEN 'FEHLT'
    WHEN e.spalte IS NULL THEN 'FREMD'
    WHEN c.data_type <> e.typ THEN 'TYP'
    WHEN c.data_type = 'numeric' AND c.numeric_precision IS NOT NULL THEN 'TYP'
    ELSE 'ok'
  END AS passt
FROM (
  SELECT * FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'analyses'
) c
FULL OUTER JOIN erwartet e ON e.spalte = c.column_name
ORDER BY (CASE WHEN c.column_name IS NULL THEN 0 WHEN e.spalte IS NULL THEN 1 ELSE 2 END), c.ordinal_position;

-- Zusätzliche Regeln, die ein INSERT ablehnen können: CHECK-, UNIQUE- und Fremdschlüssel-Constraints.
-- Laut Schema gibt es nur den Primärschlüssel (contype = 'p').
SELECT conname AS name, contype AS art, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.analyses'::regclass
ORDER BY contype, conname;

-- Trigger. Laut Schema nur update_analyses_updated_at.
SELECT tgname AS name, pg_get_triggerdef(oid) AS definition
FROM pg_trigger
WHERE tgrelid = 'public.analyses'::regclass AND NOT tgisinternal;
