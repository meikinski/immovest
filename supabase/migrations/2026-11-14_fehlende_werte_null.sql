-- Migration: Fehlende Angaben als NULL speichern statt als 0 oder pauschal 6,5 % Grunderwerbsteuer
--
-- Ausführen: Supabase Dashboard → SQL Editor → New query → komplett einfügen → Run.
-- Kann beliebig oft ausgeführt werden. Bestehende Zeilen werden nicht geändert.
-- Hintergrund: Ein Inserat mit "Preis auf Anfrage" hat keinen Kaufpreis. In der Spaltenkopie stand dann 0 und
-- beim Grunderwerbsteuersatz pauschal 6,5 %. Bis diese Migration läuft, lässt die App solche Spalten beim Speichern
-- weg (exakter Wert null steht in state), danach schreibt sie NULL.

BEGIN;

ALTER TABLE analyses ALTER COLUMN kaufpreis DROP NOT NULL;
ALTER TABLE analyses ALTER COLUMN kaufpreis DROP DEFAULT;
ALTER TABLE analyses ALTER COLUMN flaeche DROP NOT NULL;
ALTER TABLE analyses ALTER COLUMN flaeche DROP DEFAULT;
ALTER TABLE analyses ALTER COLUMN miete DROP NOT NULL;
ALTER TABLE analyses ALTER COLUMN miete DROP DEFAULT;
ALTER TABLE analyses ALTER COLUMN hausgeld DROP NOT NULL;
ALTER TABLE analyses ALTER COLUMN hausgeld DROP DEFAULT;
ALTER TABLE analyses ALTER COLUMN hausgeld_umlegbar DROP NOT NULL;
ALTER TABLE analyses ALTER COLUMN hausgeld_umlegbar DROP DEFAULT;
-- Kein pauschaler Satz mehr: ohne Bundesland bleibt der Satz leer
ALTER TABLE analyses ALTER COLUMN grunderwerbsteuer_pct DROP NOT NULL;
ALTER TABLE analyses ALTER COLUMN grunderwerbsteuer_pct DROP DEFAULT;

COMMIT;

NOTIFY pgrst, 'reload schema';

-- Kontrolle
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = current_schema() AND table_name = 'analyses'
  AND column_name IN ('kaufpreis', 'flaeche', 'miete', 'hausgeld', 'hausgeld_umlegbar', 'grunderwerbsteuer_pct')
ORDER BY column_name;
