'use client'
import { useEffect, useState, useCallback } from 'react'
import { getMatches } from '@/lib/supabase'
import type { Match } from '@/lib/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const ZONES = ['Todos', 'A', 'B', 'C'] as const
type ZoneFilter = (typeof ZONES)[number]

function MatchCard({ match }: { match: Match }) {
  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished'

  const dateLabel = match.match_date
    ? format(new Date(match.match_date), "EEEE d MMM · HH:mm", { locale: es })
    : 'Fecha a confirmar'

  return (
    <div
      className={`mx-4 mb-3 rounded-xl border overflow-hidden ${
        isLive ? 'border-red-600 shadow-lg shadow-red-900/30' : 'border-[#1e1e1e]'
      } bg-[#141414]`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#111]">
        <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
          Zona {match.zone} · Fecha {match.round}
        </span>
        {isLive ? (
          <span className="flex items-center gap-1 text-[10px] font-black text-red-500 uppercase">
            <span className="live-dot w-1.5 h-1.5 rounded-full bg-red-500" />
            EN VIVO
          </span>
        ) : (
          <span className={`text-[10px] font-medium ${isFinished ? 'text-gray-500' : 'text-[#f5c518]'}`}>
            {isFinished ? 'Finalizado' : dateLabel}
          </span>
        )}
      </div>

      {/* Score row */}
      <div className="flex items-center justify-between px-4 py-4">
        {/* Home team */}
        <div className="flex-1 text-right">
          <p className="text-sm font-black text-white leading-tight">{match.home_team?.name ?? '—'}</p>
        </div>

        {/* Score */}
        <div className="flex items-center gap-1 px-4">
          {isFinished || isLive ? (
            <>
              <span className="text-2xl font-black text-white w-7 text-center">{match.home_score}</span>
              <span className="text-lg text-gray-600 font-light">—</span>
              <span className="text-2xl font-black text-white w-7 text-center">{match.away_score}</span>
            </>
          ) : (
            <span className="text-sm text-gray-600 font-bold px-2">vs</span>
          )}
        </div>

        {/* Away team */}
        <div className="flex-1 text-left">
          <p className="text-sm font-black text-white leading-tight">{match.away_team?.name ?? '—'}</p>
        </div>
      </div>

      {/* Pending date */}
      {!isFinished && !isLive && match.match_date && (
        <div className="px-3 pb-2 text-center text-[10px] text-gray-600">
          {dateLabel}
        </div>
      )}
    </div>
  )
}

// Group matches by round
function groupByRound(matches: Match[]): Record<number, Match[]> {
  return matches.reduce<Record<number, Match[]>>((acc, m) => {
    if (!acc[m.round]) acc[m.round] = []
    acc[m.round].push(m)
    return acc
  }, {})
}

export default function FixtureScroll() {
  const [zone, setZone] = useState<ZoneFilter>('Todos')
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getMatches(zone === 'Todos' ? undefined : zone)
      setMatches(data as Match[])
    } finally {
      setLoading(false)
    }
  }, [zone])

  useEffect(() => { load() }, [load])

  const grouped = groupByRound(matches)
  const rounds = Object.keys(grouped).map(Number).sort((a, b) => a - b)

  return (
    <div>
      {/* Zone filter */}
      <div className="flex gap-2 px-4 py-3 no-scrollbar overflow-x-auto border-b border-[#1e1e1e]">
        {ZONES.map((z) => (
          <button
            key={z}
            onClick={() => setZone(z)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
              zone === z
                ? 'bg-[#f5c518] text-black'
                : 'bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a]'
            }`}
          >
            {z === 'Todos' ? 'Todos' : `Zona ${z}`}
          </button>
        ))}
      </div>

      {/* Matches */}
      <div className="pt-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-[#f5c518] border-t-transparent animate-spin" />
          </div>
        ) : rounds.length === 0 ? (
          <div className="text-center py-12 text-gray-600 text-sm">No hay partidos cargados aún</div>
        ) : (
          rounds.map((round) => (
            <div key={round}>
              <div className="px-4 py-2 mb-1">
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                  — Fecha {round} —
                </span>
              </div>
              {grouped[round].map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
