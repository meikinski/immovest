-- Migration: Speichern von Analysen reparieren (POST /api/analysis → HTTP 500)
--
-- Ausführen: Supabase Dashboard → SQL Editor → New query → komplett einfügen → Run.
-- Kann beliebig oft ausgeführt werden. Bestehende Zeilen werden weder gelöscht noch inhaltlich geändert:
-- es kommen nur Spalten dazu, Ganzzahl-Spalten werden zu NUMERIC und VARCHAR-Spalten zu TEXT erweitert (Werte bleiben gleich)
-- und NOT NULL fällt bei Spalten weg, die die App gar nicht schreibt.

BEGIN;

-- 1) Alle Spalten, die die App schreibt. Fehlt eine, wird sie mit Standardwert ergänzt.
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS analysis_name TEXT NOT NULL DEFAULT 'Unbenannt';
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS kaufpreis NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS adresse TEXT NOT NULL DEFAULT '';
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS flaeche NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS zimmer NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS baujahr INTEGER NOT NULL DEFAULT 2024;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS miete NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS hausgeld NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS hausgeld_umlegbar NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS ek NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS zins NUMERIC NOT NULL DEFAULT 3.5;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS tilgung NUMERIC NOT NULL DEFAULT 2;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS grunderwerbsteuer_pct NUMERIC NOT NULL DEFAULT 6.5;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS notar_pct NUMERIC NOT NULL DEFAULT 2;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS makler_pct NUMERIC NOT NULL DEFAULT 3.57;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS mietausfall_pct NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS instandhaltungskosten_pro_qm NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS steuer NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS afa NUMERIC NOT NULL DEFAULT 2;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS ruecklagen NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS persoenlicher_steuersatz NUMERIC NOT NULL DEFAULT 40;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS cashflow_operativ NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS nettorendite NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS score NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS anschaffungskosten NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS generated_comment TEXT DEFAULT '';
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS lage_comment TEXT DEFAULT '';
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS mietpreis_comment TEXT DEFAULT '';
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS qm_preis_comment TEXT DEFAULT '';
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS invest_comment TEXT DEFAULT '';
-- Seit PR #462: stabile Client-ID, kompletter Store-Zustand, Markt-Recherche
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS markt_facts JSONB DEFAULT NULL;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS client_id TEXT DEFAULT NULL;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS state JSONB DEFAULT NULL;

-- 2) Zahlenspalten, die als Ganzzahl (oder mit fester Stellenzahl) angelegt sind, auf NUMERIC erweitern.
--    Damit passen Dezimalwerte wie 76,5 m², 468,33 € oder 2,5 Zimmer. Vorhandene Werte bleiben unverändert.
DO $$
DECLARE
  c RECORD;
BEGIN
  FOR c IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'analyses'
      AND column_name IN (
        'kaufpreis', 'flaeche', 'zimmer', 'miete', 'hausgeld', 'hausgeld_umlegbar', 'ek', 'zins', 'tilgung',
        'grunderwerbsteuer_pct', 'notar_pct', 'makler_pct', 'mietausfall_pct', 'instandhaltungskosten_pro_qm',
        'steuer', 'afa', 'ruecklagen', 'persoenlicher_steuersatz', 'cashflow_operativ', 'nettorendite',
        'score', 'anschaffungskosten'
      )
      AND (
        data_type IN ('smallint', 'integer', 'bigint', 'real', 'double precision')
        OR (data_type = 'numeric' AND numeric_precision IS NOT NULL)
      )
  LOOP
    EXECUTE format('ALTER TABLE analyses ALTER COLUMN %I TYPE NUMERIC USING %I::numeric', c.column_name, c.column_name);
    RAISE NOTICE 'Spalte % auf NUMERIC erweitert', c.column_name;
  END LOOP;
END $$;

-- 2b) Textspalten mit Längenbegrenzung (VARCHAR(n), CHAR(n)) auf TEXT erweitern.
--     Lange KI-Kommentare und Adressen passen sonst nicht. Vorhandene Werte bleiben unverändert.
DO $$
DECLARE
  c RECORD;
BEGIN
  FOR c IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'analyses'
      AND column_name IN (
        'analysis_name', 'adresse', 'client_id',
        'generated_comment', 'lage_comment', 'mietpreis_comment', 'qm_preis_comment', 'invest_comment'
      )
      AND data_type IN ('character varying', 'character')
  LOOP
    EXECUTE format('ALTER TABLE analyses ALTER COLUMN %I TYPE TEXT', c.column_name);
    RAISE NOTICE 'Spalte % auf TEXT erweitert', c.column_name;
  END LOOP;
END $$;

-- 3) Spalten, die die App nicht schreibt, dürfen das Speichern nicht blockieren:
--    NOT NULL ohne Standardwert entfernen (betrifft nur Spalten außerhalb der Liste aus Schritt 1).
DO $$
DECLARE
  c RECORD;
BEGIN
  FOR c IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'analyses'
      AND is_nullable = 'NO' AND column_default IS NULL AND is_identity = 'NO'
      AND column_name NOT IN (
        'id', 'user_id', 'analysis_name', 'created_at', 'updated_at',
        'kaufpreis', 'adresse', 'flaeche', 'zimmer', 'baujahr', 'miete', 'hausgeld', 'hausgeld_umlegbar', 'ek',
        'zins', 'tilgung', 'grunderwerbsteuer_pct', 'notar_pct', 'makler_pct', 'mietausfall_pct',
        'instandhaltungskosten_pro_qm', 'steuer', 'afa', 'ruecklagen', 'persoenlicher_steuersatz',
        'cashflow_operativ', 'nettorendite', 'score', 'anschaffungskosten',
        'generated_comment', 'lage_comment', 'mietpreis_comment', 'qm_preis_comment', 'invest_comment',
        'markt_facts', 'client_id', 'state'
      )
  LOOP
    EXECUTE format('ALTER TABLE analyses ALTER COLUMN %I DROP NOT NULL', c.column_name);
    RAISE NOTICE 'NOT NULL entfernt bei Spalte %', c.column_name;
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS idx_analyses_user_client ON analyses(user_id, client_id);

COMMIT;

-- 4) API-Schema-Cache neu laden, damit die neuen Spalten sofort bekannt sind
NOTIFY pgrst, 'reload schema';

-- 5) Kontrolle: so sieht die Tabelle jetzt aus (Ergebnis erscheint unter „Results“)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = current_schema() AND table_name = 'analyses'
ORDER BY ordinal_position;
