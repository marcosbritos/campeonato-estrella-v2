-- ============================================================
-- MIGRACIÓN PENDIENTE — Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Agregar columna para foto de planilla en matches
ALTER TABLE matches ADD COLUMN IF NOT EXISTS sheet_photo_url TEXT;

-- 2. Corregir vista standings para excluir rondas de playoffs/amistosos
--    (rounds >= 8 no deben afectar la tabla de posiciones de zona)
CREATE OR REPLACE VIEW standings AS
WITH match_stats AS (
  SELECT
    t.id   AS team_id,
    t.name,
    t.zone,
    t.tournament_id,
    t.logo_url,
    CASE WHEN m.status = 'finished' THEN 1 ELSE 0 END AS played,
    CASE
      WHEN m.status = 'finished' AND (
        (m.home_team_id = t.id AND m.home_score > m.away_score) OR
        (m.away_team_id = t.id AND m.away_score > m.home_score)
      ) THEN 1 ELSE 0
    END AS won,
    CASE WHEN m.status = 'finished' AND m.home_score = m.away_score THEN 1 ELSE 0 END AS drawn,
    CASE
      WHEN m.status = 'finished' AND (
        (m.home_team_id = t.id AND m.home_score < m.away_score) OR
        (m.away_team_id = t.id AND m.away_score < m.home_score)
      ) THEN 1 ELSE 0
    END AS lost,
    CASE
      WHEN m.status = 'finished' AND m.home_team_id = t.id THEN m.home_score
      WHEN m.status = 'finished' AND m.away_team_id = t.id THEN m.away_score
      ELSE 0
    END AS goals_for,
    CASE
      WHEN m.status = 'finished' AND m.home_team_id = t.id THEN m.away_score
      WHEN m.status = 'finished' AND m.away_team_id = t.id THEN m.home_score
      ELSE 0
    END AS goals_against,
    CASE
      WHEN m.status = 'finished' AND (
        (m.home_team_id = t.id AND m.home_score > m.away_score) OR
        (m.away_team_id = t.id AND m.away_score > m.home_score)
      ) THEN 3
      WHEN m.status = 'finished' AND m.home_score = m.away_score THEN 1
      ELSE 0
    END AS points
  FROM teams t
  LEFT JOIN matches m ON (m.home_team_id = t.id OR m.away_team_id = t.id)
    AND m.round < 8   -- excluir playoffs y amistosos
),
team_totals AS (
  SELECT
    team_id, name, zone, tournament_id, logo_url,
    SUM(played)        AS played,
    SUM(won)           AS won,
    SUM(drawn)         AS drawn,
    SUM(lost)          AS lost,
    SUM(goals_for)     AS goals_for,
    SUM(goals_against) AS goals_against,
    SUM(goals_for) - SUM(goals_against) AS goal_diff,
    SUM(points)        AS points
  FROM match_stats
  GROUP BY team_id, name, zone, tournament_id, logo_url
)
SELECT * FROM team_totals
ORDER BY tournament_id, zone, points DESC, goal_diff DESC, goals_for DESC;

-- 3. Storage: crear bucket 'planillas' si no existe (o hacerlo desde el Dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('planillas', 'planillas', true)
-- ON CONFLICT (id) DO NOTHING;

-- 4. Política de storage para subir desde el admin (anon key)
-- CREATE POLICY "admin can upload planillas" ON storage.objects
--   FOR INSERT TO anon WITH CHECK (bucket_id = 'planillas');
-- CREATE POLICY "public read planillas" ON storage.objects
--   FOR SELECT TO anon USING (bucket_id = 'planillas');
