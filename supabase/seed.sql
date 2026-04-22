-- ============================================================
-- SEED: Equipos reales del Campeonato de la Estrella
-- Ejecutar DESPUÉS del schema.sql
-- ============================================================

-- ZONA A
INSERT INTO teams (name, zone, pin) VALUES
  ('ATLETICO LUGANO',   'A', '1001'),
  ('INTER',             'A', '1002'),
  ('SECTOR 32',         'A', '1003'),
  ('PA LA BIRRA',       'A', '1004'),
  ('TORNADO',           'A', '1005'),
  ('JARDIN AMERICA',    'A', '1006'),
  ('ALMIRANTE',         'A', '1007'),
  ('TERCER TIEMPO',     'A', '1008');

-- ZONA B
INSERT INTO teams (name, zone, pin) VALUES
  ('VICIOS FC',         'B', '2001'),
  ('CALLE 10',          'B', '2002'),
  ('SABUESOS',          'B', '2003'),
  ('FORESTAL',          'B', '2004'),
  ('PROGRESO',          'B', '2005'),
  ('MANCHESTER BOYS',   'B', '2006'),
  ('SUDAKAS FC',        'B', '2007'),
  ('LA RESAKA FC',      'B', '2008');

-- ZONA C
INSERT INTO teams (name, zone, pin) VALUES
  ('FALSO FUTBOL',          'C', '3001'),
  ('CASITA NUEVA F.C',      'C', '3002'),
  ('ROSARIO DE LA FRONTERA','C', '3003'),
  ('D.C LOS PUMAS',         'C', '3004'),
  ('420 F.C',               'C', '3005'),
  ('GUEMES SFI',            'C', '3006'),
  ('LOS PUMAS 2.0',         'C', '3007'),
  ('DEPORTIVO ENTUSIASMO',  'C', '3008');

-- ============================================================
-- Fixture Fecha 1 — ejemplo (ajustar fechas/horas reales)
-- ============================================================
-- Zona B Fecha 1
WITH b AS (SELECT id, name FROM teams WHERE zone = 'B')
INSERT INTO matches (zone, round, match_date, home_team_id, away_team_id)
SELECT 'B', 1, '2025-11-03 10:00:00-03',
  (SELECT id FROM b WHERE name = 'VICIOS FC'),
  (SELECT id FROM b WHERE name = 'LA RESAKA FC');

WITH b AS (SELECT id, name FROM teams WHERE zone = 'B')
INSERT INTO matches (zone, round, match_date, home_team_id, away_team_id)
SELECT 'B', 1, '2025-11-03 11:00:00-03',
  (SELECT id FROM b WHERE name = 'CALLE 10'),
  (SELECT id FROM b WHERE name = 'SUDAKAS FC');

WITH b AS (SELECT id, name FROM teams WHERE zone = 'B')
INSERT INTO matches (zone, round, match_date, home_team_id, away_team_id)
SELECT 'B', 1, '2025-11-03 12:00:00-03',
  (SELECT id FROM b WHERE name = 'SABUESOS'),
  (SELECT id FROM b WHERE name = 'MANCHESTER BOYS');

WITH b AS (SELECT id, name FROM teams WHERE zone = 'B')
INSERT INTO matches (zone, round, match_date, home_team_id, away_team_id)
SELECT 'B', 1, '2025-11-03 13:00:00-03',
  (SELECT id FROM b WHERE name = 'FORESTAL'),
  (SELECT id FROM b WHERE name = 'PROGRESO');
