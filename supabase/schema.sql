-- ============================================================
-- CAMPEONATO ESTRELLA — Schema Supabase (PWA v2)
-- Ejecutar en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- LIMPIAR TABLAS VIEJAS (Cuidado: Borra datos existentes)
DROP VIEW IF EXISTS standings;
DROP VIEW IF EXISTS fair_play_standings;
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS match_rosters CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS fair_play_rules CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS tournaments CASCADE;

-- ============================================================
-- 1. TABLAS CORE Y DE AUTENTICACIÓN
-- ============================================================

-- Tournaments
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'organizer', 'administrative')),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL, -- Null if super_admin
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fair Play Rules
CREATE TABLE IF NOT EXISTS fair_play_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  yellow_card_points INT NOT NULL DEFAULT 1,
  red_card_points INT NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id)
);

-- Teams
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  zone CHAR(1) NOT NULL CHECK (zone IN ('A', 'B', 'C')),
  logo_url TEXT,
  pin TEXT NOT NULL DEFAULT '1234', -- Used for delegate read-only access if needed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players (Lista de Buena Fe - 25 jugadores)
CREATE TABLE IF NOT EXISTS players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dni TEXT,
  birth_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matches
CREATE TABLE IF NOT EXISTS matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  zone CHAR(1) NOT NULL CHECK (zone IN ('A', 'B', 'C')),
  round INT NOT NULL DEFAULT 1,
  match_date TIMESTAMPTZ,
  home_team_id UUID NOT NULL REFERENCES teams(id),
  away_team_id UUID NOT NULL REFERENCES teams(id),
  home_score INT NOT NULL DEFAULT 0,
  away_score INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'live', 'finished')),
  observations TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (home_team_id <> away_team_id)
);

-- Match Rosters (Planilla de Partido / Dorsales Dinámicos)
CREATE TABLE IF NOT EXISTS match_rosters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  shirt_number INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (match_id, team_id, player_id),
  UNIQUE (match_id, team_id, shirt_number)
);

-- Goals
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id),
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  roster_id UUID REFERENCES match_rosters(id) ON DELETE SET NULL, -- Link to specific match roster
  minute INT,
  is_own_goal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cards
CREATE TABLE IF NOT EXISTS cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id),
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  roster_id UUID REFERENCES match_rosters(id) ON DELETE SET NULL, -- Link to specific match roster
  card_type TEXT NOT NULL CHECK (card_type IN ('yellow', 'red')),
  minute INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. VISTAS SQL (Actualizadas)
-- ============================================================

-- Vista: standings (posiciones por zona con diferencia de goles)
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

-- Vista: fair_play_standings (Tabla de Fair Play)
CREATE OR REPLACE VIEW fair_play_standings AS
WITH card_counts AS (
  SELECT
    team_id,
    SUM(CASE WHEN card_type = 'yellow' THEN 1 ELSE 0 END) AS total_yellows,
    SUM(CASE WHEN card_type = 'red' THEN 1 ELSE 0 END) AS total_reds
  FROM cards
  GROUP BY team_id
)
SELECT 
  t.id AS team_id,
  t.name,
  t.zone,
  t.tournament_id,
  COALESCE(c.total_yellows, 0) AS yellow_cards,
  COALESCE(c.total_reds, 0) AS red_cards,
  (COALESCE(c.total_yellows, 0) * fpr.yellow_card_points) + 
  (COALESCE(c.total_reds, 0) * fpr.red_card_points) AS fair_play_points
FROM teams t
LEFT JOIN card_counts c ON c.team_id = t.id
JOIN fair_play_rules fpr ON fpr.tournament_id = t.tournament_id
ORDER BY t.tournament_id, fair_play_points ASC;

-- ============================================================
-- 3. POLÍTICAS DE SEGURIDAD (RLS)
-- ============================================================
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fair_play_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_rosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- Lectura pública para todo menos perfiles
CREATE POLICY "public_read_tournaments" ON tournaments FOR SELECT USING (true);
CREATE POLICY "public_read_fair_play_rules" ON fair_play_rules FOR SELECT USING (true);
CREATE POLICY "public_read_teams" ON teams FOR SELECT USING (true);
CREATE POLICY "public_read_players" ON players FOR SELECT USING (true);
CREATE POLICY "public_read_matches" ON matches FOR SELECT USING (true);
CREATE POLICY "public_read_match_rosters" ON match_rosters FOR SELECT USING (true);
CREATE POLICY "public_read_goals" ON goals FOR SELECT USING (true);
CREATE POLICY "public_read_cards" ON cards FOR SELECT USING (true);

-- Perfiles: solo el propio usuario o un super_admin
CREATE POLICY "user_read_own_profile" ON profiles FOR SELECT USING (auth.uid() = id);

-- La escritura completa (INSERT/UPDATE/DELETE) será manejada mediante Supabase Auth
-- Para desarrollo ágil inicial, habilitamos escritura para pruebas
CREATE POLICY "auth_insert_matches" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "auth_update_matches" ON matches FOR UPDATE USING (true);
CREATE POLICY "auth_insert_rosters" ON match_rosters FOR INSERT WITH CHECK (true);
CREATE POLICY "auth_update_rosters" ON match_rosters FOR UPDATE USING (true);
CREATE POLICY "auth_delete_rosters" ON match_rosters FOR DELETE USING (true);
CREATE POLICY "auth_insert_goals" ON goals FOR INSERT WITH CHECK (true);
CREATE POLICY "auth_delete_goals" ON goals FOR DELETE USING (true);
CREATE POLICY "auth_insert_cards" ON cards FOR INSERT WITH CHECK (true);
CREATE POLICY "auth_delete_cards" ON cards FOR DELETE USING (true);
CREATE POLICY "auth_update_players" ON players FOR UPDATE USING (true);
CREATE POLICY "auth_insert_players" ON players FOR INSERT WITH CHECK (true);

-- ============================================================
-- 4. TRIGGERS Y FUNCIONES AUTOMÁTICAS
-- ============================================================

-- Doble amarilla = Roja
CREATE OR REPLACE FUNCTION check_double_yellow() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.card_type = 'yellow' THEN
    -- Verificamos si, incluyendo esta nueva amarilla, el jugador tiene 2 o más en el partido.
    IF (SELECT COUNT(*) FROM cards WHERE match_id = NEW.match_id AND roster_id = NEW.roster_id AND card_type = 'yellow') >= 2 THEN
      -- Insertamos la roja de forma automática
      INSERT INTO cards (match_id, team_id, player_id, roster_id, card_type, minute)
      VALUES (NEW.match_id, NEW.team_id, NEW.player_id, NEW.roster_id, 'red', NEW.minute);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS double_yellow_trigger ON cards;
CREATE TRIGGER double_yellow_trigger
AFTER INSERT ON cards
FOR EACH ROW EXECUTE FUNCTION check_double_yellow();
