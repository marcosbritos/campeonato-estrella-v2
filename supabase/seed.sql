-- ============================================================
-- CAMPEONATO ESTRELLA — Seed Data (PWA v2)
-- Ejecutar después del schema.sql
-- ============================================================

-- 1. Crear el torneo inicial
INSERT INTO tournaments (id, name) 
VALUES ('11111111-1111-1111-1111-111111111111', 'Campeonato Estrella 2026');

-- 2. Configurar reglas de Fair Play
INSERT INTO fair_play_rules (tournament_id, yellow_card_points, red_card_points)
VALUES ('11111111-1111-1111-1111-111111111111', 1, 3);

-- 3. Crear equipos (Asignados al torneo)
INSERT INTO teams (id, tournament_id, name, zone) VALUES
-- Zona A
('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'ATLETICO LUGANO', 'A'),
('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'INTER', 'A'),
('a3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'SECTOR 32', 'A'),
('a4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'PA LA BIRRA', 'A');

-- 4. Crear jugadores (Listas de Buena Fe)
-- Llenamos algunos jugadores de prueba para ATLETICO LUGANO
INSERT INTO players (team_id, first_name, last_name, dni, birth_date) VALUES
('a1111111-1111-1111-1111-111111111111', 'Juan', 'Pérez', '35000000', '1990-01-01'),
('a1111111-1111-1111-1111-111111111111', 'Carlos', 'Gómez', '36000000', '1991-05-10'),
('a1111111-1111-1111-1111-111111111111', 'Martín', 'Rossi', '37000000', '1992-08-20'),
('a1111111-1111-1111-1111-111111111111', 'Lucas', 'Fernández', '38000000', '1993-11-15');

-- Llenamos algunos para INTER
INSERT INTO players (team_id, first_name, last_name, dni, birth_date) VALUES
('a2222222-2222-2222-2222-222222222222', 'Diego', 'Maradona', '14000000', '1960-10-30'),
('a2222222-2222-2222-2222-222222222222', 'Lionel', 'Messi', '32000000', '1987-06-24');

-- 5. Crear un partido de ejemplo
INSERT INTO matches (id, tournament_id, zone, round, home_team_id, away_team_id, status) VALUES
('d1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'A', 1, 'a1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'pending');
