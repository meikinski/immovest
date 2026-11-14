-- Offene RLS-Policies entfernen (analyses, user_premium_usage, scenarios)
--
-- Hintergrund: supabase-schema.sql hat bisher Policies mit USING (true) /
-- WITH CHECK (true) ohne Rollen-Einschränkung angelegt. Solche Policies gelten
-- auch für die Rolle "anon". Da der Anon-Key öffentlich im Browser-Bundle
-- liegt, konnte damit jeder über die Supabase-REST-API die Zeilen aller Nutzer
-- lesen, ändern und löschen (inkl. is_premium in user_premium_usage).
--
-- Die App greift ausschließlich serverseitig mit dem Service-Role-Key zu.
-- Dieser umgeht RLS und funktioniert ohne Policies unverändert weiter.
--
-- Diese Migration
--   * verändert keine Zeilen und keine Tabellenstruktur,
--   * ist wiederholbar (kann beliebig oft ausgeführt werden),
--   * lässt RLS aktiviert bzw. aktiviert es wieder, falls es deaktiviert wurde.
--
-- Ausführen: Supabase Dashboard -> SQL Editor -> gesamten Inhalt einfügen -> Run.

BEGIN;

-- 1) RLS sicherstellen. Ohne Policy bedeutet aktiviertes RLS: kein Zugriff für
--    anon/authenticated. (Falls RLS z. B. zum Debuggen deaktiviert wurde, wäre
--    die Tabelle sonst komplett offen.)
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_premium_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;

-- 2) Die bekannten offenen Policies aus supabase-schema.sql entfernen.
DROP POLICY IF EXISTS "Users can view their own analyses" ON public.analyses;
DROP POLICY IF EXISTS "Users can insert their own analyses" ON public.analyses;
DROP POLICY IF EXISTS "Users can update their own analyses" ON public.analyses;
DROP POLICY IF EXISTS "Users can delete their own analyses" ON public.analyses;

DROP POLICY IF EXISTS "Users can view their own premium usage" ON public.user_premium_usage;
DROP POLICY IF EXISTS "Users can update their own premium usage" ON public.user_premium_usage;
DROP POLICY IF EXISTS "System can insert premium usage" ON public.user_premium_usage;

DROP POLICY IF EXISTS "Users can view their own scenarios" ON public.scenarios;
DROP POLICY IF EXISTS "Users can insert their own scenarios" ON public.scenarios;
DROP POLICY IF EXISTS "Users can update their own scenarios" ON public.scenarios;
DROP POLICY IF EXISTS "Users can delete their own scenarios" ON public.scenarios;

-- 3) Sicherheitsnetz: alle übrigen Policies auf diesen drei Tabellen entfernen
--    (z. B. im Dashboard unter anderem Namen angelegte). Die App braucht keine,
--    da sie nur den Service-Role-Key verwendet.
DO $$
DECLARE
  p RECORD;
BEGIN
  FOR p IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('analyses', 'user_premium_usage', 'scenarios')
  LOOP
    RAISE NOTICE 'Entferne zusätzliche Policy "%" auf %', p.policyname, p.tablename;
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END
$$;

COMMIT;

-- 4) Kontrolle. Erwartet: 0 Zeilen bei der ersten Abfrage,
--    rls_aktiv = true für alle drei Tabellen bei der zweiten.
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('analyses', 'scenarios', 'user_premium_usage');

SELECT relname AS tabelle, relrowsecurity AS rls_aktiv
FROM pg_class
WHERE oid IN (
  'public.analyses'::regclass,
  'public.scenarios'::regclass,
  'public.user_premium_usage'::regclass
);
