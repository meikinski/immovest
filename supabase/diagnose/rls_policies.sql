-- Diagnose: Welche RLS-Policies und Rechte sind live? Liest nur, ändert nichts.
-- Supabase Dashboard -> SQL Editor -> New query -> einfügen -> Run.
--
-- Soll-Zustand (nach 2026-11-14_drop_open_rls_policies.sql und 2026-11-14_kosten_schutz.sql):
--   Abfrage 1: keine Zeilen für analyses, user_premium_usage, scenarios, rate_limit_counters
--   Abfrage 2: rls_aktiv = true für alle vier Tabellen
--   Abfrage 3: anon/authenticated dürfen rate_limit_hit nicht ausführen (false)

-- 1) Alle Policies im Schema public. Kritisch: qual oder with_check = 'true' mit Rolle {public} oder {anon}.
SELECT tablename, policyname, roles, cmd, qual, with_check,
       (qual = 'true' OR with_check = 'true') AS offen
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 2) Ist RLS auf den Tabellen aktiv? (relforcerowsecurity ist für den Service-Role-Key egal)
SELECT c.relname AS tabelle, c.relrowsecurity AS rls_aktiv
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('analyses', 'user_premium_usage', 'scenarios', 'rate_limit_counters')
ORDER BY c.relname;

-- 3) Darf die öffentliche Rolle die Zähler-Funktion aufrufen?
SELECT
  has_function_privilege('anon', 'public.rate_limit_hit(text, integer, integer)', 'EXECUTE') AS anon_darf,
  has_function_privilege('authenticated', 'public.rate_limit_hit(text, integer, integer)', 'EXECUTE') AS authenticated_darf;
