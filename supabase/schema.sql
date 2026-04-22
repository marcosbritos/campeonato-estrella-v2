-- ============================================================
-- CAMPEONATO DE LA ESTRELLA — Schema Supabase
-- Ejecutar en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- Teams
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  zone CHAR(1) NOT NULL CHECK (zone IN ('A', 'B', 'C')),
  logo_url TEXT,
  pin TEXT NOT NULL DEFAULT '1234',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players
CREATE TABLE IF NOT EXISTS players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  shirt_number INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (team_id, shirt_number)
);

-- Matches
CREATE TABLE IF NOT EXISTS matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  zone CHAR(1) NOT NULL CHECK (zone IN ('A', 'B', 'C')),
  round INT NOT NULL DEFAULT 1,
  match_date TIMESTAMPTZ,
  home_team_id UUID NOT NULL REFERENCES teams(id),
  away_team_id UUID NOT NULL REFERENCES teams(id),
  home_score INT NOT NULL DEFAULT 0,
  away_score INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'live', 'finished')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (home_team_id <> away_team_id)
);

-- Goals
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  team_id UUID NOT NULL REFERENCES teams(id),
  minute INT,
  is_own_goal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cards
CREATE TABLE IF NOT EXISTS cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  team_id UUID NOT NULL REFERENCES teams(id),
  card_type TEXT NOT NULL CHECK (card_type IN ('yellow', 'red')),
  minute INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VIEW: standings (posiciones por zona con goleador y tarjetas)
-- ============================================================
CREATE OR REPLACE VIEW standings AS
WITH match_stats AS (
  SELECT
    t.id   AS team_id,
    t.name,
    t.zone,
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
),
team_totals AS (
  SELECT
    team_id, name, zone, logo_url,
    SUM(played)        AS played,
    SUM(won)           AS won,
    SUM(drawn)         AS drawn,
    SUM(lost)          AS lost,
    SUM(goals_for)     AS goals_for,
    SUM(goals_against) AS goals_against,
    SUM(goals_for) - SUM(goals_against) AS goal_diff,
    SUM(points)        AS points
  FROM match_stats
  GROUP BY team_id, name, zone, logo_url
),
top_scorer_per_team AS (
  SELECT DISTINCT ON (g.team_id)
    g.team_id,
    p.name || ' (' || COUNT(*) OVER (PARTITION BY g.team_id, g.player_id) || ')' AS top_scorer
  FROM goals g
  JOIN players p ON g.player_id = p.id
  WHERE g.is_own_goal = FALSE AND g.player_id IS NOT NULL
  ORDER BY g.team_id, COUNT(*) OVER (PARTITION BY g.team_id, g.player_id) DESC
),
card_totals AS (
  SELECT
    team_id,
    SUM(CASE WHEN card_type = 'yellow' THEN 1 ELSE 0 END) AS yellow_cards,
    SUM(CASE WHEN card_type = 'red'    THEN 1 ELSE 0 END) AS red_cards
  FROM cards
  GROUP BY team_id
)
SELECT
  tt.team_id,
  tt.name,
  tt.zone,
  tt.logo_url,
  tt.played,
  tt.won,
  tt.drawn,
  tt.lost,
  tt.goals_for,
  tt.goals_against,
  tt.goal_diff,
  tt.points,
  ts.top_scorer,
  COALESCE(ct.yellow_cards, 0) AS yellow_cards,
  COALESCE(ct.red_cards,    0) AS red_cards
FROM team_totals tt
LEFT JOIN top_scorer_per_team ts ON ts.team_id = tt.team_id
LEFT JOIN card_totals         ct ON ct.team_id = tt.team_id
ORDER BY tt.zone, tt.points DESC, tt.goal_diff DESC, tt.goals_for DESC;

-- ============================================================
-- RLS: habilitar acceso público de lectura
-- ============================================================
ALTER TABLE teams   ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals   ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_teams"   ON teams   FOR SELECT USING (true);
CREATE POLICY "public_read_players" ON players FOR SELECT USING (true);
CREATE POLICY "public_read_matches" ON matches FOR SELECT USING (true);
CREATE POLICY "public_read_goals"   ON goals   FOR SELECT USING (true);
CREATE POLICY "public_read_cards"   ON cards   FOR SELECT USING (true);

CREATE POLICY "public_insert_goals"   ON goals   FOR INSERT WITH CHECK (true);
CREATE POLICY "public_delete_goals"   ON goals   FOR DELETE USING (true);
CREATE POLICY "public_insert_cards"   ON cards   FOR INSERT WITH CHECK (true);
CREATE POLICY "public_delete_cards"   ON cards   FOR DELETE USING (true);
CREATE POLICY "public_update_matches" ON matches FOR UPDATE USING (true);
CREATE POLICY "public_insert_players" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_players" ON players FOR UPDATE USING (true);
CREATE POLICY "public_delete_players" ON players FOR DELETE USING (true);
