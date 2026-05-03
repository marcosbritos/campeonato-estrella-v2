export type Zone = 'A' | 'B' | 'C' | 'P' | 'R' | 'F'
export type CardType = 'yellow' | 'red'
export type MatchStatus = 'pending' | 'live' | 'finished'

export interface Tournament {
  id: string
  name: string
  created_at?: string
}

export interface Team {
  id: string
  tournament_id: string
  name: string
  zone: Zone
  logo_url?: string | null
  pin?: string
  created_at?: string
}

export interface Player {
  id: string
  team_id: string
  first_name: string
  last_name: string
  dni?: string
  birth_date?: string
  created_at?: string
  team?: Team
}

export interface MatchRoster {
  id: string
  match_id: string
  team_id: string
  player_id: string
  shirt_number: number
  player?: Player
}

export interface Match {
  id: string
  tournament_id: string
  zone: Zone
  round: number
  match_date: string | null
  home_team_id: string
  away_team_id: string
  home_score: number
  away_score: number
  status: MatchStatus
  observations?: string | null
  created_at?: string
  home_team?: Team
  away_team?: Team
  rosters?: MatchRoster[]
}

export interface Goal {
  id: string
  match_id: string
  team_id: string
  player_id: string | null
  roster_id: string | null
  minute: number | null
  is_own_goal: boolean
  created_at?: string
  roster?: MatchRoster
  player?: Player
}

export interface Card {
  id: string
  match_id: string
  team_id: string
  player_id: string | null
  roster_id: string | null
  card_type: CardType
  minute: number | null
  created_at?: string
  roster?: MatchRoster
  player?: Player
}

export interface Standing {
  team_id: string
  tournament_id: string
  name: string
  zone: Zone
  logo_url?: string | null
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  goal_diff: number
  points: number
}

export interface TopScorer {
  player_id: string
  player_name: string
  team_id: string
  team_name: string
  zone: Zone
  goals: number
}

export interface FairPlayEntry {
  team_id: string
  tournament_id: string
  name: string
  zone: Zone
  yellow_cards: number
  red_cards: number
  fair_play_points: number
}
