import { createClient } from '@supabase/supabase-js'
import type { Standing, TopScorer, FairPlayEntry } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: { params: { eventsPerSecond: 10 } },
})

export const isConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'

// --- Standings ---
export async function getStandings(zone?: string): Promise<Standing[]> {
  let q = supabase.from('standings').select('*')
  if (zone) q = q.eq('zone', zone)
  const { data, error } = await q.order('points', { ascending: false })
  if (error) throw error
  return data ?? []
}

// --- Matches ---
export async function getMatches(zone?: string, round?: number) {
  let q = supabase
    .from('matches')
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(id, name, zone, logo_url),
      away_team:teams!matches_away_team_id_fkey(id, name, zone, logo_url)
    `)
  if (zone) q = q.eq('zone', zone)
  if (round) q = q.eq('round', round)
  const { data, error } = await q.order('match_date', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getLiveMatches() {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(id, name, zone, logo_url),
      away_team:teams!matches_away_team_id_fkey(id, name, zone, logo_url)
    `)
    .eq('status', 'live')
  if (error) throw error
  return data ?? []
}

export async function updateMatchStatus(
  matchId: string,
  status: string,
  homeScore: number,
  awayScore: number
) {
  const { error } = await supabase
    .from('matches')
    .update({ status, home_score: homeScore, away_score: awayScore })
    .eq('id', matchId)
  if (error) throw error
}

// --- Goals ---
export async function addGoal(
  matchId: string,
  teamId: string,
  playerId: string | null,
  minute: number | null,
  isOwnGoal = false
) {
  const { error } = await supabase
    .from('goals')
    .insert({ match_id: matchId, team_id: teamId, player_id: playerId, minute, is_own_goal: isOwnGoal })
  if (error) throw error
}

export async function removeGoal(goalId: string) {
  const { error } = await supabase.from('goals').delete().eq('id', goalId)
  if (error) throw error
}

// --- Cards ---
export async function addCard(
  matchId: string,
  teamId: string,
  playerId: string | null,
  cardType: 'yellow' | 'red',
  minute: number | null
) {
  const { error } = await supabase
    .from('cards')
    .insert({ match_id: matchId, team_id: teamId, player_id: playerId, card_type: cardType, minute })
  if (error) throw error
}

export async function removeCard(cardId: string) {
  const { error } = await supabase.from('cards').delete().eq('id', cardId)
  if (error) throw error
}

// --- Players ---
export async function getPlayers(teamId: string) {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', teamId)
    .order('shirt_number')
  if (error) throw error
  return data ?? []
}

export async function upsertPlayer(
  teamId: string,
  name: string,
  shirtNumber: number,
  playerId?: string
) {
  if (playerId) {
    const { error } = await supabase
      .from('players')
      .update({ name, shirt_number: shirtNumber })
      .eq('id', playerId)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('players')
      .insert({ team_id: teamId, name, shirt_number: shirtNumber })
    if (error) throw error
  }
}

export async function deletePlayer(playerId: string) {
  const { error } = await supabase.from('players').delete().eq('id', playerId)
  if (error) throw error
}

// --- Teams ---
export async function getTeamByPin(pin: string) {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('pin', pin)
    .single()
  if (error) return null
  return data
}

// --- Top Scorers ---
export async function getTopScorers(zone?: string): Promise<TopScorer[]> {
  let q = supabase
    .from('goals')
    .select(`
      player_id,
      player:players(id, name, shirt_number),
      team:teams(id, name, zone)
    `)
    .eq('is_own_goal', false)
  const { data, error } = await q
  if (error) throw error

  const counts: Record<string, { player_id: string; player_name: string; team_id: string; team_name: string; zone: string; goals: number }> = {}
  for (const g of data ?? []) {
    if (!g.player_id) continue
    const player = Array.isArray(g.player) ? g.player[0] : g.player
    const team = Array.isArray(g.team) ? g.team[0] : g.team
    if (!player || !team) continue
    if (zone && team.zone !== zone) continue
    if (!counts[g.player_id]) {
      counts[g.player_id] = {
        player_id: g.player_id,
        player_name: player.name,
        team_id: team.id,
        team_name: team.name,
        zone: team.zone,
        goals: 0,
      }
    }
    counts[g.player_id].goals++
  }
  return Object.values(counts).sort((a, b) => b.goals - a.goals) as TopScorer[]
}

// --- Fair Play ---
export async function getFairPlay(): Promise<FairPlayEntry[]> {
  const { data, error } = await supabase
    .from('cards')
    .select(`team:teams(id, name, zone), card_type`)
  if (error) throw error

  const map: Record<string, FairPlayEntry> = {}
  for (const c of data ?? []) {
    const team = Array.isArray(c.team) ? c.team[0] : c.team
    if (!team) continue
    if (!map[team.id]) {
      map[team.id] = { team_id: team.id, team_name: team.name, zone: team.zone, yellow_cards: 0, red_cards: 0, score: 0 }
    }
    if (c.card_type === 'yellow') map[team.id].yellow_cards++
    if (c.card_type === 'red') map[team.id].red_cards++
  }
  return Object.values(map).map((e) => ({
    ...e,
    score: e.yellow_cards * 1 + e.red_cards * 3,
  })).sort((a, b) => a.score - b.score) as FairPlayEntry[]
}
