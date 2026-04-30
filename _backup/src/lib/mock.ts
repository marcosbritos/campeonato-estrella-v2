// Mock data que reemplaza la fetch de Supabase en dev.
// En producción, reemplazar cada función con una query real usando tu cliente Supabase.

export type Standing = { n: string; pts: number; pj: number; g: number; e: number; p: number; gd: number }
export type Scorer = { name: string; team: string; goals: number; pj: number }
export type FairPlay = { team: string; amarillas: number; rojas: number; pts: number }

export const ZONE_A: Standing[] = [
  { n: 'ATLETICO LUGANO', pts: 18, pj: 6, g: 6, e: 0, p: 0, gd: 12 },
  { n: 'INTER',           pts: 15, pj: 6, g: 5, e: 0, p: 1, gd: 8 },
  { n: 'SECTOR 32',       pts: 12, pj: 6, g: 4, e: 0, p: 2, gd: 5 },
  { n: 'PA LA BIRRA',     pts: 10, pj: 6, g: 3, e: 1, p: 2, gd: 2 },
  { n: 'TORNADO',         pts: 7,  pj: 6, g: 2, e: 1, p: 3, gd: -2 },
  { n: 'JARDIN AMERICA',  pts: 5,  pj: 6, g: 1, e: 2, p: 3, gd: -4 },
  { n: 'ALMIRANTE',       pts: 4,  pj: 6, g: 1, e: 1, p: 4, gd: -8 },
  { n: 'TERCER TIEMPO',   pts: 1,  pj: 6, g: 0, e: 1, p: 5, gd: -13 },
]

export const ZONE_B: Standing[] = [
  { n: 'VICIOS FC',       pts: 18, pj: 6, g: 6, e: 0, p: 0, gd: 14 },
  { n: 'CALLE 10',        pts: 15, pj: 6, g: 5, e: 0, p: 1, gd: 9 },
  { n: 'SABUESOS',        pts: 11, pj: 6, g: 3, e: 2, p: 1, gd: 4 },
  { n: 'FORESTAL',        pts: 9,  pj: 6, g: 3, e: 0, p: 3, gd: 1 },
  { n: 'PROGRESO',        pts: 7,  pj: 6, g: 2, e: 1, p: 3, gd: -1 },
  { n: 'MANCHESTER BOYS', pts: 6,  pj: 6, g: 2, e: 0, p: 4, gd: -3 },
  { n: 'SUDAKAS FC',      pts: 4,  pj: 6, g: 1, e: 1, p: 4, gd: -9 },
  { n: 'LA RESAKA FC',    pts: 2,  pj: 6, g: 0, e: 2, p: 4, gd: -15 },
]

export const ZONE_C: Standing[] = [
  { n: 'GARRA FC',        pts: 16, pj: 6, g: 5, e: 1, p: 0, gd: 10 },
  { n: 'EL DORADO',       pts: 14, pj: 6, g: 4, e: 2, p: 0, gd: 8 },
  { n: 'LOS PIBES',       pts: 10, pj: 6, g: 3, e: 1, p: 2, gd: 3 },
  { n: 'RIVER PLATENSE',  pts: 9,  pj: 6, g: 3, e: 0, p: 3, gd: 0 },
  { n: 'BOKITAS',         pts: 7,  pj: 6, g: 2, e: 1, p: 3, gd: -2 },
  { n: 'MATADORES',       pts: 5,  pj: 6, g: 1, e: 2, p: 3, gd: -5 },
  { n: 'LA 12',           pts: 3,  pj: 6, g: 1, e: 0, p: 5, gd: -6 },
  { n: 'AMIGOS FC',       pts: 2,  pj: 6, g: 0, e: 2, p: 4, gd: -8 },
]

export const LIVE_MATCHES = [
  { zone: 'B', home: 'VICIOS FC', away: 'LA RESAKA FC', hs: 2, as: 1, min: 67, fecha: 7, scorers: ['G. ROSSI ⚽', 'M. GOMEZ ⚽', 'L. SOSA ⚽'] },
  { zone: 'A', home: 'INTER', away: 'TORNADO', hs: 0, as: 0, min: 12, fecha: 7, scorers: [] },
  { zone: 'C', home: 'SABUESOS', away: 'PROGRESO', hs: 1, as: 1, min: 45, fecha: 7, scorers: ['D. LÓPEZ ⚽', 'F. RUIZ ⚽'] },
]

export const UPCOMING_MATCHES = [
  { zone: 'A', home: 'ATLETICO LUGANO', away: 'SECTOR 32', when: 'HOY · 18:00', field: 'PINTITA · C2' },
  { zone: 'B', home: 'CALLE 10', away: 'SUDAKAS FC', when: 'HOY · 19:30', field: 'CIRCULO POLICIAL' },
  { zone: 'C', home: 'GARRA FC', away: 'AMIGOS FC', when: 'MAÑ · 20:00', field: 'PINTITA · C1' },
]

export const SCORERS: Scorer[] = [
  { name: 'G. ROSSI',   team: 'VICIOS FC',       goals: 12, pj: 6 },
  { name: 'M. GOMEZ',   team: 'ATLETICO LUGANO', goals: 10, pj: 6 },
  { name: 'L. SOSA',    team: 'INTER',           goals: 9,  pj: 6 },
  { name: 'D. LÓPEZ',   team: 'SABUESOS',        goals: 8,  pj: 6 },
  { name: 'F. RUIZ',    team: 'PROGRESO',        goals: 7,  pj: 5 },
  { name: 'J. PÉREZ',   team: 'CALLE 10',        goals: 7,  pj: 6 },
  { name: 'M. NÚÑEZ',   team: 'GARRA FC',        goals: 6,  pj: 6 },
  { name: 'A. TORRES',  team: 'EL DORADO',       goals: 6,  pj: 6 },
  { name: 'R. SILVA',   team: 'SECTOR 32',       goals: 5,  pj: 6 },
  { name: 'E. DÍAZ',    team: 'PA LA BIRRA',     goals: 5,  pj: 6 },
]

export const FAIRPLAY: FairPlay[] = [
  { team: 'ATLETICO LUGANO', amarillas: 2,  rojas: 0, pts: 2 },
  { team: 'GARRA FC',        amarillas: 3,  rojas: 0, pts: 3 },
  { team: 'INTER',           amarillas: 4,  rojas: 0, pts: 4 },
  { team: 'VICIOS FC',       amarillas: 5,  rojas: 0, pts: 5 },
  { team: 'EL DORADO',       amarillas: 4,  rojas: 1, pts: 7 },
  { team: 'CALLE 10',        amarillas: 6,  rojas: 0, pts: 6 },
  { team: 'SABUESOS',        amarillas: 5,  rojas: 1, pts: 8 },
  { team: 'LOS PIBES',       amarillas: 7,  rojas: 0, pts: 7 },
  { team: 'SECTOR 32',       amarillas: 6,  rojas: 1, pts: 9 },
  { team: 'PROGRESO',        amarillas: 8,  rojas: 0, pts: 8 },
  { team: 'LA RESAKA FC',    amarillas: 9,  rojas: 2, pts: 15 },
  { team: 'TERCER TIEMPO',   amarillas: 10, rojas: 3, pts: 19 },
]
