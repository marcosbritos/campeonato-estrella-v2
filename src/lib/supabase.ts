import { createClient } from '@supabase/supabase-js'
import type { Standing, TopScorer, FairPlayEntry, Player, MatchRoster } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: { params: { eventsPerSecond: 10 } },
})

export const isConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'

// --- Auth / Profiles ---
export async function getProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error) return null
  return data
}

// --- Standings ---
export async function getStandings(tournamentId: string, zone?: string): Promise<Standing[]> {
  let q = supabase.from('standings').select('*').eq('tournament_id', tournamentId)
  if (zone) q = q.eq('zone', zone)
  const { data, error } = await q.order('points', { ascending: false })
  if (error) throw error
  return data ?? []
}

// --- Matches ---
export async function getMatches(tournamentId: string, zone?: string, round?: number) {
  let q = supabase
    .from('matches')
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(id, name, zone, logo_url),
      away_team:teams!matches_away_team_id_fkey(id, name, zone, logo_url)
    `)
    .eq('tournament_id', tournamentId)
  if (zone) q = q.eq('zone', zone)
  if (round) q = q.eq('round', round)
  const { data, error } = await q.order('match_date', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getLiveMatches(tournamentId: string) {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(id, name, zone, logo_url),
      away_team:teams!matches_away_team_id_fkey(id, name, zone, logo_url)
    `)
    .eq('tournament_id', tournamentId)
    .eq('status', 'live')
  if (error) throw error
  return data ?? []
}

export async function updateMatchStatus(
  matchId: string,
  status: string,
  homeScore: number,
  awayScore: number,
  observations?: string
) {
  const payload: any = { status, home_score: homeScore, away_score: awayScore }
  if (observations !== undefined) payload.observations = observations
  const { error } = await supabase
    .from('matches')
    .update(payload)
    .eq('id', matchId)
  if (error) throw error
}

export async function updateMatchPhoto(matchId: string, sheetPhotoUrl: string) {
  await supabase.from('matches').update({ sheet_photo_url: sheetPhotoUrl }).eq('id', matchId)
}

// --- Rosters ---
export async function getMatchRoster(matchId: string, teamId: string): Promise<MatchRoster[]> {
  const { data, error } = await supabase
    .from('match_rosters')
    .select(`*, player:players(*)`)
    .eq('match_id', matchId)
    .eq('team_id', teamId)
    .order('shirt_number')
  if (error) throw error
  return data ?? []
}

export async function upsertMatchRoster(matchId: string, teamId: string, rosters: { player_id: string, shirt_number: number }[]) {
  // First clear existing roster for this team and match
  await supabase.from('match_rosters').delete().match({ match_id: matchId, team_id: teamId })
  
  if (rosters.length === 0) return

  // Insert new roster
  const inserts = rosters.map(r => ({
    match_id: matchId,
    team_id: teamId,
    player_id: r.player_id,
    shirt_number: r.shirt_number
  }))
  const { error } = await supabase.from('match_rosters').insert(inserts)
  if (error) throw error
}


// --- Goals ---
export async function addGoal(
  matchId: string,
  teamId: string,
  playerId: string | null,
  rosterId: string | null,
  minute: number | null,
  isOwnGoal = false
) {
  const { error } = await supabase
    .from('goals')
    .insert({ match_id: matchId, team_id: teamId, player_id: playerId, roster_id: rosterId, minute, is_own_goal: isOwnGoal })
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
  rosterId: string | null,
  cardType: 'yellow' | 'red',
  minute: number | null
) {
  const { error } = await supabase
    .from('cards')
    .insert({ match_id: matchId, team_id: teamId, player_id: playerId, roster_id: rosterId, card_type: cardType, minute })
  if (error) throw error
}

export async function removeCard(cardId: string) {
  const { error } = await supabase.from('cards').delete().eq('id', cardId)
  if (error) throw error
}

// --- Players ---
export async function getPlayers(teamId: string): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', teamId)
    .order('last_name')
  if (error) throw error
  return data ?? []
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
export async function getTopScorers(tournamentId: string, zone?: string): Promise<TopScorer[]> {
  let q = supabase
    .from('goals')
    .select(`
      player_id,
      player:players(id, first_name, last_name),
      team:teams(id, name, zone, tournament_id)
    `)
    .eq('is_own_goal', false)
  const { data, error } = await q
  if (error) throw error

  const counts: Record<string, TopScorer> = {}
  for (const g of data ?? []) {
    if (!g.player_id) continue
    const player = Array.isArray(g.player) ? g.player[0] : g.player
    const team = Array.isArray(g.team) ? g.team[0] : g.team
    if (!player || !team || team.tournament_id !== tournamentId) continue
    if (zone && team.zone !== zone) continue
    if (!counts[g.player_id]) {
      counts[g.player_id] = {
        player_id: g.player_id,
        player_name: `${player.first_name} ${player.last_name}`,
        team_id: team.id,
        team_name: team.name,
        zone: team.zone,
        goals: 0,
      }
    }
    counts[g.player_id].goals++
  }
  return Object.values(counts).sort((a, b) => b.goals - a.goals)
}

// --- Team Matches ---
export async function getTeamMatches(teamId: string) {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(id, name, zone, logo_url),
      away_team:teams!matches_away_team_id_fkey(id, name, zone, logo_url)
    `)
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    .order('round', { ascending: true })
  if (error) throw error
  return data ?? []
}

// --- Team by ID ---
export async function getTeamById(teamId: string) {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .single()
  if (error) return null
  return data
}

// --- Fair Play ---
export async function getFairPlay(tournamentId: string): Promise<FairPlayEntry[]> {
  const { data, error } = await supabase
    .from('fair_play_standings')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('fair_play_points', { ascending: true })
  if (error) throw error
  return data ?? []
}
