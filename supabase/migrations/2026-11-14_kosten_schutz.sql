-- Kostenschutz: Rate Limits, KI-Tagesbudget und serverseitiges Gratis-Kontingent
--
-- WICHTIG: VOR dem Deploy des zugehörigen Codes ausführen. Ohne diese Migration lehnen die KI-Routen
-- in Produktion mit HTTP 503 ab (fail closed), und /api/agent/run kann den Plan nicht prüfen.
--
-- Ausführen: Supabase Dashboard -> SQL Editor -> gesamten Inhalt einfügen -> Run.
-- Wiederholbar. Bestehende Zeilen werden nicht gelöscht; user_premium_usage bekommt nur eine Spalte dazu.
--
-- 1) rate_limit_counters + rate_limit_hit(): Zähler für Rate Limits pro IP-Hash/User und für das
--    globale KI-Tagesbudget (AI_DAILY_CALL_CAP). Wird nur mit dem Service-Role-Key aufgerufen.
-- 2) user_premium_usage.free_analyses: Für welche Wohnung(en) die kostenlose Analyse vergeben ist.
--    Wird ausschließlich von /api/agent/run geschrieben.

BEGIN;

-- ---------------------------------------------------------------------------------------------
-- 1) Zähler
-- ---------------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.rate_limit_counters (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_counters_expires ON public.rate_limit_counters(expires_at);

-- RLS an, keine Policies: anon/authenticated haben keinen Zugriff, der Service-Role-Key umgeht RLS
ALTER TABLE public.rate_limit_counters ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rate_limit_counters FROM anon, authenticated;

-- Zählt p_key atomar um p_cost hoch und liefert den neuen Stand.
-- Das Fenster beginnt beim ersten Treffer und läuft p_window_seconds; danach startet der Zähler neu.
CREATE OR REPLACE FUNCTION public.rate_limit_hit(p_key TEXT, p_window_seconds INTEGER, p_cost INTEGER DEFAULT 1)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO public.rate_limit_counters AS r (key, count, expires_at)
  VALUES (p_key, p_cost, NOW() + make_interval(secs => p_window_seconds))
  ON CONFLICT (key) DO UPDATE
    SET count = CASE WHEN r.expires_at <= NOW() THEN p_cost ELSE r.count + p_cost END,
        expires_at = CASE WHEN r.expires_at <= NOW() THEN NOW() + make_interval(secs => p_window_seconds) ELSE r.expires_at END
  RETURNING count INTO v_count;

  -- Gelegentlich abgelaufene Zeilen aufräumen (ca. jeder 200. Aufruf)
  IF random() < 0.005 THEN
    DELETE FROM public.rate_limit_counters WHERE expires_at < NOW() - INTERVAL '1 day';
  END IF;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.rate_limit_hit(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rate_limit_hit(TEXT, INTEGER, INTEGER) TO service_role;

-- ---------------------------------------------------------------------------------------------
-- 2) Gratis-Kontingent
-- ---------------------------------------------------------------------------------------------

ALTER TABLE public.user_premium_usage ADD COLUMN IF NOT EXISTS free_analyses JSONB NOT NULL DEFAULT '[]'::jsonb;
UPDATE public.user_premium_usage SET usage_count = 0 WHERE usage_count IS NULL;

-- Bestandsnutzer: Bisher hat der Browser usage_count hochgezählt, ohne die Wohnung zu speichern.
-- Damit diese Nutzer ihre bereits analysierte Gratis-Wohnung weiter öffnen können, wird die älteste
-- gespeicherte Analyse mit Marktdaten als Gratis-Wohnung eingetragen. Die Adresse wird wie im Code
-- normalisiert (src/lib/gratisAnalyse.ts: normalisiereAdresse).
WITH erste AS (
  SELECT DISTINCT ON (a.user_id)
    a.user_id,
    COALESCE(a.client_id, a.id::text) AS analysis_id,
    lower(regexp_replace(
      array_to_string(ARRAY(
        SELECT btrim(t) FROM unnest(string_to_array(a.adresse, ',')) AS t WHERE btrim(t) <> ''
      ), ', '),
      '\s+', ' ', 'g'
    )) AS adresse,
    a.created_at
  FROM public.analyses a
  WHERE a.markt_facts IS NOT NULL AND COALESCE(btrim(a.adresse), '') <> ''
  ORDER BY a.user_id, a.created_at ASC
)
UPDATE public.user_premium_usage u
SET free_analyses = jsonb_build_array(jsonb_build_object(
  'analysis_id', e.analysis_id,
  'adresse', e.adresse,
  'at', COALESCE(e.created_at, NOW())
))
FROM erste e
WHERE u.user_id = e.user_id
  AND u.usage_count >= 1
  AND u.free_analyses = '[]'::jsonb;

COMMIT;

-- API-Schema-Cache neu laden, damit Funktion und Spalte sofort bekannt sind
NOTIFY pgrst, 'reload schema';

-- Kontrolle
SELECT
  to_regclass('public.rate_limit_counters') IS NOT NULL AS zaehler_tabelle_da,
  EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rate_limit_hit') AS funktion_da,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_premium_usage' AND column_name = 'free_analyses'
  ) AS spalte_free_analyses_da,
  (SELECT count(*) FROM public.user_premium_usage WHERE free_analyses <> '[]'::jsonb) AS nutzer_mit_gratis_wohnung;
