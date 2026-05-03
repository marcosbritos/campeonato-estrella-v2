-- ============================================================
-- PLAYOFFS + AMISTOSOS - Campeonato Estrella
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================
-- NOTA: Se usan zone='A'/'B'/'C' por compatibilidad con el constraint existente.
-- La UI usa el campo `round` para los labels (no zone).

-- ============================================================
-- EQUIPO NUEVO: Deportivo Avellaneda
-- (Requiere service role — correr en Supabase Dashboard SQL Editor)
-- ============================================================
INSERT INTO teams (id, tournament_id, name, zone, logo_url, pin) VALUES
  ('eeee1111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111111', 'DEPORTIVO AVELLANEDA', 'C', '', '1234')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ZONA CAMPEONATO — Cuartos de Final (round = 8)
-- 03/05/2026
-- ============================================================
INSERT INTO matches (id, tournament_id, zone, round, match_date, home_team_id, away_team_id, home_score, away_score, status) VALUES
  ('cccc8001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'A', 8, '2026-05-03 09:30:00-03', 'd51e2ce8-9bee-4791-b75a-d8b29614cf7e', '5a0b99d7-f5f8-414a-b99a-62ebd4e3eeb6', 0, 0, 'pending'),
  ('cccc8002-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'A', 8, '2026-05-03 11:00:00-03', '253575ab-e346-4b80-87fc-17b367fe4d98', '4c5a7448-9bce-4d52-8f26-c0c5f73c220d', 0, 0, 'pending'),
  ('cccc8003-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'A', 8, '2026-05-03 12:30:00-03', 'd7e6844d-bdf2-4e04-9dee-282f9edda130', '74ccab84-95f0-4543-aceb-68cc07368d41', 0, 0, 'pending'),
  ('cccc8004-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'A', 8, '2026-05-03 14:00:00-03', '3d284aae-da0f-4467-b5b0-b18501d21009', '4503910e-9f7d-41e0-ae04-486e44d004ac', 0, 0, 'pending')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ZONA REPECHAJE — Cuartos de Final (round = 9)
-- 03/05/2026
-- ============================================================
INSERT INTO matches (id, tournament_id, zone, round, match_date, home_team_id, away_team_id, home_score, away_score, status) VALUES
  ('cccc9001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'B', 9, '2026-05-03 09:30:00-03', '2f77ad92-a044-4f36-9fc5-fbd1b4310d3f', '517228d7-c3d3-44c2-8ff7-7e5c28abfd92', 0, 0, 'pending'),
  ('cccc9002-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'B', 9, '2026-05-03 11:00:00-03', '42123030-d860-4580-85ed-e56673c01b6f', 'a85d8e9a-0665-44c8-9bc3-a7c6ef5b9ef9', 0, 0, 'pending'),
  ('cccc9003-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'B', 9, '2026-05-03 12:30:00-03', '8926cb00-1ccd-431a-9e34-0de7c39b9d0a', '0624d5bd-1346-45d3-a1e8-9880a4781c6e', 0, 0, 'pending'),
  ('cccc9004-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'B', 9, '2026-05-03 14:00:00-03', '816e3c59-8381-4867-a878-3b3f8333e8eb', '2d20020a-8ecc-4397-a0a6-027476bd268e', 0, 0, 'pending')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- AMISTOSOS (round = 10)
-- 03/05/2026
-- ============================================================
INSERT INTO matches (id, tournament_id, zone, round, match_date, home_team_id, away_team_id, home_score, away_score, status) VALUES
  -- Guemes vs Jardin de America
  ('cccca001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'C', 10, '2026-05-03 09:30:00-03', 'f1c55483-b1ca-45dd-9bf3-f496737aed36', '24b13802-59ff-4fd1-bd78-6bf82f9c9eb6', 0, 0, 'pending'),
  -- Pumas 2.0 vs Deportivo Avellaneda (requiere que el equipo exista primero)
  ('cccca002-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'C', 10, '2026-05-03 11:30:00-03', '5e2ec4da-8b51-4a7a-bd57-96de3613e1cc', 'eeee1111-1111-1111-1111-111111111101', 0, 0, 'pending')
ON CONFLICT (id) DO NOTHING;
