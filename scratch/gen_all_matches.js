const fs = require('fs');
const { randomUUID } = require('crypto');

const seedContent = fs.readFileSync('c:/Users/belen/Desktop/Consultora/proyectos/campeonato-estrella/supabase/seed.sql', 'utf8');

const teamRegex = /\('([a-f0-9\-]+)', '11111111-1111-1111-1111-111111111111', '([^']+)', '([A-C])'/g;
let match;
const teams = {};
const teamZones = {};
while ((match = teamRegex.exec(seedContent)) !== null) {
  teams[match[2]] = match[1]; // name -> id
  teamZones[match[1]] = match[3]; // id -> zone
}

const roundsRaw = {
  1: `JARDIN AMERICA (1) vs (3) PA LA BIRRA
LOS PUMAS 2.0 (1) vs (2) D.C LOS PUMAS
CASITA NUEVA F.C (3) vs (0) DEPORTIVO ENTUSIASMO
ALMIRANTE (1) vs (3) INTER
SUDAKAS FC (0) vs (7) VICIOS FC
GÜEMES SFI (1) vs (3) ROSARIO de la FRONTERA
TORNADO (1) vs (0) TERCER TIEMPO
CALLE 10 (1) vs (2) SABUESOS
PROGRESO (0) vs (0) FORESTAL
SECTOR 32 (0) vs (2) ATLETICO LUGANO
LA RESAKA FC (0) vs (2) MANCHESTER BOYS
420 F.C (1) vs (5) FALSO FUTBOL`,
  2: `LA RESAKA FC (0) vs (2) SABUESOS
TORNADO (2) vs (1) PA LA BIRRA
PROGRESO (3) vs (0) SUDAKAS FC
ROSARIO de la FRONTERA (0) vs (8) FALSO FUTBOL
ALMIRANTE (1) vs (3) SECTOR 32
GÜEMES SFI (3) vs (1) D.C LOS PUMAS
LOS PUMAS 2.0 (2) vs (2) DEPORTIVO ENTUSIASMO
TERCER TIEMPO (2) vs (5) INTER
MANCHESTER BOYS (0) vs (1) FORESTAL
420 F.C (0) vs (1) CASITA NUEVA F.C
JARDIN AMERICA (0) vs (4) ATLETICO LUGANO
CALLE 10 (1) vs (0) VICIOS FC`,
  3: `LA RESAKA FC (0) vs (2) FORESTAL
LOS PUMAS 2.0 (1) vs (3) 420 F.C
PA LA BIRRA (2) vs (6) ATLETICO LUGANO
MANCHESTER BOYS (1) vs (0) SUDAKAS FC
GÜEMES SFI (1) vs (7) FALSO FUTBOL
JARDIN AMERICA (1) vs (1) ALMIRANTE
D.C LOS PUMAS (0) vs (4) DEPORTIVO ENTUSIASMO
TORNADO (1) vs (4) INTER
SABUESOS (3) vs (4) VICIOS FC
CALLE 10 (3) vs (0) PROGRESO
TERCER TIEMPO (0) vs (3) SECTOR 32
ROSARIO de la FRONTERA (0) vs (6) CASITA NUEVA F.C`,
  4: `LA RESAKA FC (0) vs (2) SUDAKAS FC
ATLETICO LUGANO (7) vs (0) ALMIRANTE
VICIOS FC (4) vs (0) PROGRESO
GÜEMES SFI (1) vs (3) CASITA NUEVA F.C
INTER (6) vs (1) JARDIN AMERICA
DEPORTIVO ENTUSIASMO (1) vs (1) 420 F.C
D.C LOS PUMAS (0) vs (2) ROSARIO de la FRONTERA
TORNADO (1) vs (2) SECTOR 32
FALSO FUTBOL (6) vs (2) LOS PUMAS 2.0
PA LA BIRRA (2) vs (0) TERCER TIEMPO
FORESTAL (0) vs (6) CALLE 10
SABUESOS (3) vs (0) MANCHESTER BOYS`,
  5: `LA RESAKA FC (0) vs (2) PROGRESO
TORNADO (1) vs (2) ALMIRANTE
SUDAKAS FC (0) vs (4) CALLE 10
GÜEMES SFI (1) vs (5) 420 F.C
INTER (1) vs (2) PA LA BIRRA
VICIOS FC (5) vs (2) MANCHESTER BOYS
CASITA NUEVA F.C (5) vs (1) LOS PUMAS 2.0
ATLETICO LUGANO (0) vs (1) TERCER TIEMPO
DEPORTIVO ENTUSIASMO (2) vs (1) ROSARIO de la FRONTERA
FALSO FUTBOL (6) vs (0) D.C LOS PUMAS
SECTOR 32 (2) vs (0) JARDIN AMERICA
FORESTAL (1) vs (1) SABUESOS`,
  6: `LA RESAKA FC (0) vs (2) VICIOS FC
PA LA BIRRA (0) vs (2) ALMIRANTE
FORESTAL (0) vs (2) SUDAKAS FC
GÜEMES SFI (0) vs (2) DEPORTIVO ENTUSIASMO
INTER (0) vs (0) SECTOR 32
MANCHESTER BOYS (1) vs (7) CALLE 10
ROSARIO de la FRONTERA (4) vs (2) LOS PUMAS 2.0
TERCER TIEMPO (2) vs (3) JARDIN AMERICA
FALSO FUTBOL (0) vs (1) CASITA NUEVA F.C
D.C LOS PUMAS (0) vs (2) 420 F.C
TORNADO (3) vs (0) ATLETICO LUGANO
SABUESOS (1) vs (1) PROGRESO`,
  7: `LA RESAKA FC (0) vs (2) CALLE 10
ALMIRANTE (7) vs (2) TERCER TIEMPO
SUDAKAS FC (0) vs (3) SABUESOS
420 F.C (2) vs (0) ROSARIO de la FRONTERA
SECTOR 32 (5) vs (0) PA LA BIRRA
GÜEMES SFI (1) vs (1) LOS PUMAS 2.0
DEPORTIVO ENTUSIASMO (0) vs (1) FALSO FUTBOL
ATLETICO LUGANO (1) vs (2) INTER
VICIOS FC (0) vs (4) FORESTAL
CASITA NUEVA F.C (5) vs (0) D.C LOS PUMAS
TORNADO (3) vs (3) JARDIN AMERICA
PROGRESO (3) vs (0) MANCHESTER BOYS`
};

let sql = `
-- ==========================================
-- SCRIPT DE MIGRACIÓN: PARTIDOS REALES (FECHA 1 A 7)
-- ==========================================

DELETE FROM matches;

INSERT INTO matches (id, tournament_id, zone, round, home_team_id, away_team_id, home_score, away_score, status) VALUES
`;

const linesInsert = [];
for (let r = 1; r <= 7; r++) {
  const roundText = roundsRaw[r];
  const rows = roundText.trim().split('\n');
  for (const row of rows) {
    // "JARDIN AMERICA (1) vs (3) PA LA BIRRA"
    const parsed = row.match(/(.+?)\s+\((\d+)\)\s+vs\s+\((\d+)\)\s+(.+)/);
    if (!parsed) {
      console.log("Failed to parse row:", row);
      continue;
    }
    const hName = parsed[1].trim();
    const hScore = parsed[2];
    const aScore = parsed[3];
    const aName = parsed[4].trim();

    const hId = teams[hName];
    const aId = teams[aName];

    if (!hId) console.log("Missing Team ID for Home:", hName);
    if (!aId) console.log("Missing Team ID for Away:", aName);

    const zone = teamZones[hId];
    
    linesInsert.push(`  ('${randomUUID()}', '11111111-1111-1111-1111-111111111111', '${zone}', ${r}, '${hId}', '${aId}', ${hScore}, ${aScore}, 'finished')`);
  }
}

sql += linesInsert.join(',\n') + ';\n';

fs.writeFileSync('c:/Users/belen/Desktop/Consultora/proyectos/campeonato-estrella/supabase/seed_real_matches.sql', sql);
console.log("Generated seed_real_matches.sql");
