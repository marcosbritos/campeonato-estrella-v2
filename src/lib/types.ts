export type Zone = 'A' | 'B' | 'C'
export type CardType = 'yellow' | 'red'
export type MatchStatus = 'pending' | 'live' | 'finished'

export interface Team {
  id: string
  name: string
  zone: Zone
  logo_url?: string | null
  pin: string
  created_at?: string
}

export interface Player {
  id: string
  team_id: string
  name: string
  shirt_number: number
  created_at?: string
  team?: Team
}

export interface Match {
  id: string
  zone: Zone
  round: number
  match_date: string | null
  home_team_id: string
  away_team_id: string
  home_score: number
  away_score: number
  status: MatchStatus
  created_at?: string
  home_team?: Team
  away_team?: Team
  goals?: Goal[]
  cards?: Card[]
}

export interface Goal {
  id: string
  match_id: string
  player_id: string | null
  team_id: string
  minute: number | null
  is_own_goal: boolean
  created_at?: string
  player?: Player
  team?: Team
}

export interface Card {
  id: string
  match_id: string
  player_id: string | null
  team_id: string
  card_type: CardType
  minute: number | null
  created_at?: string
  player?: Player
  team?: Team
}

export interface Standing {
  team_id: string
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
  top_scorer: string | null
  yellow_cards: number
  red_cards: number
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
  team_name: string
  zone: Zone
  yellow_cards: number
  red_cards: number
  score: number
}
