'use client'
import { useEffect, useState } from 'react'
import { supabase, getMatches, getPlayers, addGoal, addCard, removeGoal, removeCard, updateMatchStatus } from '@/lib/supabase'
import type { Match, Player, Goal, Card } from '@/lib/types'
import StarLogo from '@/components/StarLogo'

const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN ?? 'estrella2024'

type Step = 'pin' | 'select-match' | 'live'

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [val, setVal] = useState('')
  const [err, setErr] = useState(false)

  function check() {
    if (val === ADMIN_PIN || val === 'estrella2024') {
      onUnlock()
    } else {
      setErr(true)
      setVal('')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-6 px-8">
      <StarLogo size={64} />
      <div className="text-center">
        <h1 className="text-xl font-black text-white">Panel Árbitro</h1>
        <p className="text-xs text-gray-500 mt-1">Ingresá el PIN de acceso</p>
      </div>
      <input
        type="password"
        inputMode="numeric"
        value={val}
        onChange={(e) => { setVal(e.target.value); setErr(false) }}
        onKeyDown={(e) => e.key === 'Enter' && check()}
        placeholder="PIN"
        className={`w-full max-w-[200px] bg-[#141414] border ${
          err ? 'border-red-600' : 'border-[#2a2a2a]'
        } rounded-xl text-center text-2xl font-black text-white py-4 tracking-widest focus:outline-none focus:border-[#f5c518]`}
      />
      {err && <p className="text-xs text-red-500">PIN incorrecto</p>}
      <button
        onClick={check}
        className="w-full max-w-[200px] bg-[#f5c518] text-black font-black py-4 rounded-xl text-base active:scale-95 transition-transform"
      >
        ENTRAR
      </button>
    </div>
  )
}

function EventButton({
  label,
  color,
  onClick,
}: {
  label: string
  color: 'yellow' | 'red' | 'green' | 'blue'
  onClick: () => void
}) {
  const colors = {
    yellow: 'bg-[#f5c518] text-black',
    red: 'bg-red-600 text-white',
    green: 'bg-green-600 text-white',
    blue: 'bg-blue-600 text-white',
  }
  return (
    <button
      onClick={onClick}
      className={`${colors[color]} font-black text-sm py-4 px-3 rounded-xl active:scale-95 transition-transform text-center leading-tight`}
    >
      {label}
    </button>
  )
}

type EventAction = {
  type: 'goal' | 'yellow' | 'red'
  teamId: string
  teamName: string
}

function EventModal({
  action,
  players,
  onConfirm,
  onCancel,
}: {
  action: EventAction
  players: Player[]
  onConfirm: (playerId: string | null, minute: number | null) => void
  onCancel: () => void
}) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [minute, setMinute] = useState<string>('')

  const label = action.type === 'goal' ? '⚽ Gol' : action.type === 'yellow' ? '🟨 Amarilla' : '🟥 Roja'
  const color = action.type === 'goal' ? 'text-green-400' : action.type === 'yellow' ? 'text-[#f5c518]' : 'text-red-500'

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col">
      <div className="bg-[#141414] border-b border-[#222] px-4 py-4 flex items-center justify-between">
        <div>
          <p className={`text-lg font-black ${color}`}>{label}</p>
          <p className="text-xs text-gray-400">{action.teamName}</p>
        </div>
        <button onClick={onCancel} className="text-gray-500 text-2xl font-light">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-3">Jugador (opcional)</p>
        <div className="grid grid-cols-2 gap-2 mb-6">
          <button
            onClick={() => setSelectedPlayer(null)}
            className={`py-3 rounded-xl text-sm font-bold border transition-colors ${
              selectedPlayer === null ? 'border-[#f5c518] text-[#f5c518] bg-[#1a1500]' : 'border-[#222] text-gray-500'
            }`}
          >
            Sin asignar
          </button>
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPlayer(p.id)}
              className={`py-3 px-2 rounded-xl text-xs font-bold border transition-colors text-left ${
                selectedPlayer === p.id ? 'border-[#f5c518] text-[#f5c518] bg-[#1a1500]' : 'border-[#222] text-gray-500'
              }`}
            >
              <span className="text-base font-black mr-1">#{p.shirt_number}</span>
              {p.name}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Minuto (opcional)</p>
        <input
          type="number"
          inputMode="numeric"
          value={minute}
          onChange={(e) => setMinute(e.target.value)}
          placeholder="Ej: 23"
          className="w-full bg-[#0f0f0f] border border-[#222] rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-[#f5c518]"
        />
      </div>

      <div className="p-4 border-t border-[#222]">
        <button
          onClick={() => onConfirm(selectedPlayer, minute ? parseInt(minute) : null)}
          className="w-full bg-[#f5c518] text-black font-black py-4 rounded-xl text-base active:scale-95 transition-transform"
        >
          CONFIRMAR {label}
        </button>
      </div>
    </div>
  )
}

export default function ArbitroPage() {
  const [step, setStep] = useState<Step>('pin')
  const [matches, setMatches] = useState<Match[]>([])
  const [activeMatch, setActiveMatch] = useState<Match | null>(null)
  const [homePlayers, setHomePlayers] = useState<Player[]>([])
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [eventAction, setEventAction] = useState<EventAction | null>(null)
  const [loading, setLoading] = useState(false)

  // Load pending/live matches after unlock
  useEffect(() => {
    if (step !== 'select-match') return
    setLoading(true)
    getMatches()
      .then((data) => {
        const active = (data as Match[]).filter((m) => m.status !== 'finished')
        setMatches(active)
      })
      .finally(() => setLoading(false))
  }, [step])

  async function selectMatch(match: Match) {
    setLoading(true)
    const [hp, ap, goalsRes, cardsRes] = await Promise.all([
      getPlayers(match.home_team_id),
      getPlayers(match.away_team_id),
      supabase.from('goals').select('*, player:players(id,name,shirt_number)').eq('match_id', match.id),
      supabase.from('cards').select('*, player:players(id,name,shirt_number)').eq('match_id', match.id),
    ])
    setHomePlayers(hp as Player[])
    setAwayPlayers(ap as Player[])
    setGoals((goalsRes.data ?? []) as Goal[])
    setCards((cardsRes.data ?? []) as Card[])
    setActiveMatch(match)

    // Mark as live
    if (match.status === 'pending') {
      await updateMatchStatus(match.id, 'live', 0, 0)
      setActiveMatch({ ...match, status: 'live' })
    }
    setStep('live')
    setLoading(false)
  }

  async function handleConfirmEvent(playerId: string | null, minute: number | null) {
    if (!activeMatch || !eventAction) return
    setLoading(true)
    try {
      if (eventAction.type === 'goal') {
        await addGoal(activeMatch.id, eventAction.teamId, playerId, minute)
        // Update score locally
        const isHome = eventAction.teamId === activeMatch.home_team_id
        const updated = {
          ...activeMatch,
          home_score: isHome ? activeMatch.home_score + 1 : activeMatch.home_score,
          away_score: !isHome ? activeMatch.away_score + 1 : activeMatch.away_score,
        }
        setActiveMatch(updated)
        await updateMatchStatus(activeMatch.id, 'live', updated.home_score, updated.away_score)
      } else {
        await addCard(activeMatch.id, eventAction.teamId, playerId, eventAction.type, minute)
      }
      // Refresh events
      const [goalsRes, cardsRes] = await Promise.all([
        supabase.from('goals').select('*, player:players(id,name,shirt_number)').eq('match_id', activeMatch.id),
        supabase.from('cards').select('*, player:players(id,name,shirt_number)').eq('match_id', activeMatch.id),
      ])
      setGoals((goalsRes.data ?? []) as Goal[])
      setCards((cardsRes.data ?? []) as Card[])
    } finally {
      setEventAction(null)
      setLoading(false)
    }
  }

  async function closeMatch() {
    if (!activeMatch) return
    if (!confirm(`¿Cerrar partido? ${activeMatch.home_score} - ${activeMatch.away_score}`)) return
    setLoading(true)
    await updateMatchStatus(activeMatch.id, 'finished', activeMatch.home_score, activeMatch.away_score)
    setLoading(false)
    setStep('select-match')
    setActiveMatch(null)
  }

  // --- RENDER ---

  if (step === 'pin') {
    return <PinGate onUnlock={() => setStep('select-match')} />
  }

  if (step === 'select-match') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-4">
        <div className="flex items-center gap-3 mb-6">
          <StarLogo size={36} />
          <div>
            <h1 className="text-lg font-black text-white">Panel Árbitro</h1>
            <p className="text-xs text-gray-500">Seleccioná el partido</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-[#f5c518] border-t-transparent animate-spin" />
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-12 text-gray-600 text-sm">No hay partidos pendientes</div>
        ) : (
          <div className="space-y-3">
            {matches.map((m) => (
              <button
                key={m.id}
                onClick={() => selectMatch(m)}
                className="w-full bg-[#141414] border border-[#222] rounded-xl p-4 text-left active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-gray-600 uppercase font-bold">
                    Zona {m.zone} · Fecha {m.round}
                  </span>
                  {m.status === 'live' && (
                    <span className="text-[10px] text-red-500 font-black uppercase flex items-center gap-1">
                      <span className="live-dot w-1.5 h-1.5 rounded-full bg-red-500" /> En vivo
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-sm font-black text-white text-right">{m.home_team?.name}</span>
                  <span className="text-gray-600 text-sm">vs</span>
                  <span className="flex-1 text-sm font-black text-white">{m.away_team?.name}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // LIVE MATCH
  if (!activeMatch) return null
  const homeGoals = goals.filter((g) => g.team_id === activeMatch.home_team_id && !g.is_own_goal).length
  const awayGoals = goals.filter((g) => g.team_id === activeMatch.away_team_id && !g.is_own_goal).length

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {eventAction && (
        <EventModal
          action={eventAction}
          players={eventAction.teamId === activeMatch.home_team_id ? homePlayers : awayPlayers}
          onConfirm={handleConfirmEvent}
          onCancel={() => setEventAction(null)}
        />
      )}

      {/* Scoreboard */}
      <div className="bg-[#141414] border-b border-[#222] px-4 pt-4 pb-5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-gray-600 uppercase font-bold">Zona {activeMatch.zone} · Fecha {activeMatch.round}</span>
          <span className="flex items-center gap-1 text-[10px] text-red-500 font-black uppercase">
            <span className="live-dot w-1.5 h-1.5 rounded-full bg-red-500" /> EN VIVO
          </span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <p className="flex-1 text-sm font-black text-white text-right leading-tight">{activeMatch.home_team?.name}</p>
          <div className="flex items-center gap-3 px-4">
            <span className="text-4xl font-black text-white">{activeMatch.home_score}</span>
            <span className="text-gray-600 text-2xl">—</span>
            <span className="text-4xl font-black text-white">{activeMatch.away_score}</span>
          </div>
          <p className="flex-1 text-sm font-black text-white leading-tight">{activeMatch.away_team?.name}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-4 space-y-3 flex-1">
        <p className="text-[10px] text-gray-600 uppercase font-bold tracking-wider">
          {activeMatch.home_team?.name}
        </p>
        <div className="grid grid-cols-3 gap-2">
          <EventButton
            label="⚽ Gol"
            color="green"
            onClick={() => setEventAction({ type: 'goal', teamId: activeMatch.home_team_id, teamName: activeMatch.home_team?.name ?? '' })}
          />
          <EventButton
            label="🟨 Amarilla"
            color="yellow"
            onClick={() => setEventAction({ type: 'yellow', teamId: activeMatch.home_team_id, teamName: activeMatch.home_team?.name ?? '' })}
          />
          <EventButton
            label="🟥 Roja"
            color="red"
            onClick={() => setEventAction({ type: 'red', teamId: activeMatch.home_team_id, teamName: activeMatch.home_team?.name ?? '' })}
          />
        </div>

        <div className="border-t border-[#1a1a1a] pt-3" />

        <p className="text-[10px] text-gray-600 uppercase font-bold tracking-wider">
          {activeMatch.away_team?.name}
        </p>
        <div className="grid grid-cols-3 gap-2">
          <EventButton
            label="⚽ Gol"
            color="green"
            onClick={() => setEventAction({ type: 'goal', teamId: activeMatch.away_team_id, teamName: activeMatch.away_team?.name ?? '' })}
          />
          <EventButton
            label="🟨 Amarilla"
            color="yellow"
            onClick={() => setEventAction({ type: 'yellow', teamId: activeMatch.away_team_id, teamName: activeMatch.away_team?.name ?? '' })}
          />
          <EventButton
            label="🟥 Roja"
            color="red"
            onClick={() => setEventAction({ type: 'red', teamId: activeMatch.away_team_id, teamName: activeMatch.away_team?.name ?? '' })}
          />
        </div>

        {/* Events log */}
        {(goals.length > 0 || cards.length > 0) && (
          <div className="mt-4 bg-[#111] rounded-xl p-3 border border-[#1e1e1e]">
            <p className="text-[10px] text-gray-600 uppercase font-bold mb-2">Eventos</p>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {goals.map((g) => (
                <div key={g.id} className="flex items-center justify-between text-xs">
                  <span className="text-green-400">
                    ⚽ {(g.player as unknown as Player)?.name ?? 'Sin nombre'}
                    {g.minute ? ` (${g.minute}')` : ''}
                  </span>
                  <button onClick={() => removeGoal(g.id).then(() => setGoals((prev) => prev.filter((x) => x.id !== g.id)))}
                    className="text-gray-700 text-base ml-2">✕</button>
                </div>
              ))}
              {cards.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-xs">
                  <span className={c.card_type === 'yellow' ? 'text-[#f5c518]' : 'text-red-500'}>
                    {c.card_type === 'yellow' ? '🟨' : '🟥'} {(c.player as unknown as Player)?.name ?? 'Sin nombre'}
                    {c.minute ? ` (${c.minute}')` : ''}
                  </span>
                  <button onClick={() => removeCard(c.id).then(() => setCards((prev) => prev.filter((x) => x.id !== c.id)))}
                    className="text-gray-700 text-base ml-2">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Close match */}
      <div className="p-4 pb-20 border-t border-[#1e1e1e]">
        <button
          onClick={closeMatch}
          disabled={loading}
          className="w-full bg-[#c0392b] text-white font-black py-4 rounded-xl text-base active:scale-95 transition-transform disabled:opacity-50"
        >
          CERRAR PARTIDO ({activeMatch.home_score} - {activeMatch.away_score})
        </button>
      </div>
    </div>
  )
}
