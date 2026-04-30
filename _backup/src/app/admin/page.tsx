'use client'
import { useEffect, useState } from 'react'
import { supabase, getMatches, getPlayers, addGoal, addCard, removeGoal, removeCard, updateMatchStatus } from '@/lib/supabase'
import type { Match, Player, Goal, Card } from '@/lib/types'
import Image from 'next/image'

const ADMIN_PIN = '2204'

type Step = 'pin' | 'select-match' | 'live'

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [val, setVal] = useState('')
  const [err, setErr] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.replace(/\D/g, '').slice(0, 4)
    setVal(v)
    setErr(false)
    if (v.length === 4) {
      if (v === ADMIN_PIN) {
        onUnlock()
      } else {
        setErr(true)
        setVal('')
      }
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ce-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '0 32px' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(0,240,255,.7)', boxShadow: '0 0 24px rgba(0,240,255,.4)', position: 'relative' }}>
        <Image src="/logo.png" alt="Estrella" fill unoptimized style={{ objectFit: 'cover', filter: 'hue-rotate(168deg) saturate(1.8) brightness(1.15)' }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: 'var(--ce-fg)' }}>Panel Admin</h1>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--ce-fg-4)' }}>Ingresá el PIN de 4 dígitos</p>
      </div>
      <input
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={4}
        value={val}
        onChange={handleChange}
        autoFocus
        placeholder="••••"
        style={{
          width: '100%', maxWidth: 200, background: 'var(--ce-card)', border: `1px solid ${err ? 'var(--ce-loss)' : 'var(--ce-border)'}`,
          borderRadius: 12, textAlign: 'center', fontSize: 24, fontWeight: 900, color: 'var(--ce-fg)',
          padding: '16px', letterSpacing: '.4em', outline: 'none',
        }}
      />
      {err && <p style={{ margin: 0, fontSize: 12, color: 'var(--ce-loss)' }}>PIN incorrecto</p>}
    </div>
  )
}

function EventButton({ label, color, onClick }: { label: string; color: 'yellow' | 'red' | 'green'; onClick: () => void }) {
  const bg = color === 'yellow' ? 'var(--ce-warn)' : color === 'red' ? 'var(--ce-loss)' : 'var(--ce-win)'
  const fg = color === 'yellow' ? '#000' : '#fff'
  return (
    <button onClick={onClick} className="tap" style={{
      background: bg, color: fg, fontWeight: 900, fontSize: 13, padding: '16px 8px',
      borderRadius: 12, border: 'none', cursor: 'pointer', textAlign: 'center', lineHeight: 1.2,
    }}>{label}</button>
  )
}

type EventAction = { type: 'goal' | 'yellow' | 'red'; teamId: string; teamName: string }

function EventModal({ action, players, onConfirm, onCancel }: {
  action: EventAction; players: Player[];
  onConfirm: (playerId: string | null, minute: number | null) => void;
  onCancel: () => void;
}) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [minute, setMinute] = useState('')

  const label = action.type === 'goal' ? '⚽ Gol' : action.type === 'yellow' ? '🟨 Amarilla' : '🟥 Roja'
  const accentColor = action.type === 'goal' ? 'var(--ce-win)' : action.type === 'yellow' ? 'var(--ce-warn)' : 'var(--ce-loss)'

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 50, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'var(--ce-bg-2)', borderBottom: '1px solid var(--ce-border)', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: accentColor }}>{label}</p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ce-fg-3)' }}>{action.teamName}</p>
        </div>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--ce-fg-3)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 800, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--ce-fg-4)' }}>Jugador (opcional)</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
          <button onClick={() => setSelectedPlayer(null)} style={{
            padding: '12px 8px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            background: selectedPlayer === null ? 'rgba(0,240,255,.08)' : 'var(--ce-card)',
            border: `1px solid ${selectedPlayer === null ? 'var(--ce-cyan)' : 'var(--ce-border)'}`,
            color: selectedPlayer === null ? 'var(--ce-cyan)' : 'var(--ce-fg-3)',
          }}>Sin asignar</button>
          {players.map(p => (
            <button key={p.id} onClick={() => setSelectedPlayer(p.id)} style={{
              padding: '12px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', textAlign: 'left',
              background: selectedPlayer === p.id ? 'rgba(0,240,255,.08)' : 'var(--ce-card)',
              border: `1px solid ${selectedPlayer === p.id ? 'var(--ce-cyan)' : 'var(--ce-border)'}`,
              color: selectedPlayer === p.id ? 'var(--ce-cyan)' : 'var(--ce-fg-3)',
            }}>
              <span style={{ fontSize: 14, fontWeight: 900, marginRight: 4 }}>#{p.shirt_number}</span>{p.name}
            </button>
          ))}
        </div>

        <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 800, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--ce-fg-4)' }}>Minuto (opcional)</p>
        <input type="number" inputMode="numeric" value={minute} onChange={e => setMinute(e.target.value)} placeholder="Ej: 23"
          style={{ width: '100%', background: 'var(--ce-card)', border: '1px solid var(--ce-border)', borderRadius: 10, padding: '12px 16px', color: 'var(--ce-fg)', fontSize: 16, outline: 'none' }} />
      </div>

      <div style={{ padding: 16, borderTop: '1px solid var(--ce-border)' }}>
        <button onClick={() => onConfirm(selectedPlayer, minute ? parseInt(minute) : null)} className="tap" style={{
          width: '100%', padding: 16, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, var(--ce-cyan-3), var(--ce-cyan))',
          color: '#000', fontWeight: 900, fontSize: 15, letterSpacing: '.06em',
        }}>CONFIRMAR {label}</button>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [step, setStep] = useState<Step>('pin')
  const [matches, setMatches] = useState<Match[]>([])
  const [activeMatch, setActiveMatch] = useState<Match | null>(null)
  const [homePlayers, setHomePlayers] = useState<Player[]>([])
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [eventAction, setEventAction] = useState<EventAction | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (step !== 'select-match') return
    setLoading(true)
    getMatches()
      .then(data => { setMatches((data as Match[]).filter(m => m.status !== 'finished')) })
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

  if (step === 'pin') return <PinGate onUnlock={() => setStep('select-match')} />

  if (step === 'select-match') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--ce-bg)', padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(0,240,255,.5)', position: 'relative', flexShrink: 0 }}>
            <Image src="/logo.png" alt="Estrella" fill unoptimized style={{ objectFit: 'cover', filter: 'hue-rotate(168deg) saturate(1.8) brightness(1.15)' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: 'var(--ce-fg)' }}>Administración</h1>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--ce-fg-4)' }}>Seleccioná el partido a cargar</p>
          </div>
        </div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid rgba(0,240,255,.2)', borderTopColor: 'var(--ce-cyan)', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : matches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ce-fg-4)', fontSize: 14 }}>No hay partidos pendientes</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {matches.map(m => (
              <button key={m.id} onClick={() => selectMatch(m)} className="tap glass" style={{
                width: '100%', borderRadius: 14, padding: 16, textAlign: 'left', cursor: 'pointer', border: '1px solid var(--ce-border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.15em', color: 'var(--ce-fg-4)', textTransform: 'uppercase' }}>Zona {m.zone} · Fecha {m.round}</span>
                  {m.status === 'live' && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 900, color: 'var(--ce-loss)', textTransform: 'uppercase' }}>
                      <span className="live-dot" style={{ width: 6, height: 6 }} /> En vivo
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 900, color: 'var(--ce-fg)', textAlign: 'right' }}>{m.home_team?.name}</span>
                  <span style={{ color: 'var(--ce-fg-4)', fontSize: 12 }}>vs</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 900, color: 'var(--ce-fg)' }}>{m.away_team?.name}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (!activeMatch) return null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ce-bg)', display: 'flex', flexDirection: 'column' }}>
      {eventAction && (
        <EventModal
          action={eventAction}
          players={eventAction.teamId === activeMatch.home_team_id ? homePlayers : awayPlayers}
          onConfirm={handleConfirmEvent}
          onCancel={() => setEventAction(null)}
        />
      )}

      {/* Scoreboard */}
      <div className="glass" style={{ borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none', padding: '16px', borderBottom: '1px solid var(--ce-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.15em', color: 'var(--ce-fg-4)', textTransform: 'uppercase' }}>Zona {activeMatch.zone} · Fecha {activeMatch.round}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 900, color: 'var(--ce-loss)', textTransform: 'uppercase' }}>
            <span className="live-dot" style={{ width: 6, height: 6 }} /> EN VIVO
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <p style={{ flex: 1, margin: 0, fontSize: 14, fontWeight: 900, color: 'var(--ce-fg)', textAlign: 'right', lineHeight: 1.2 }}>{activeMatch.home_team?.name}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px' }}>
            <span className="score-glow" style={{ fontSize: 40, fontWeight: 900, color: 'var(--ce-fg)' }}>{activeMatch.home_score}</span>
            <span style={{ color: 'var(--ce-fg-4)', fontSize: 22, fontWeight: 300 }}>—</span>
            <span className="score-glow" style={{ fontSize: 40, fontWeight: 900, color: 'var(--ce-fg)' }}>{activeMatch.away_score}</span>
          </div>
          <p style={{ flex: 1, margin: 0, fontSize: 14, fontWeight: 900, color: 'var(--ce-fg)', lineHeight: 1.2 }}>{activeMatch.away_team?.name}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ padding: 16, flex: 1 }}>
        <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 800, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--ce-cyan)' }}>{activeMatch.home_team?.name}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          <EventButton label="⚽ Gol" color="green" onClick={() => setEventAction({ type: 'goal', teamId: activeMatch.home_team_id, teamName: activeMatch.home_team?.name ?? '' })} />
          <EventButton label="🟨 Amarilla" color="yellow" onClick={() => setEventAction({ type: 'yellow', teamId: activeMatch.home_team_id, teamName: activeMatch.home_team?.name ?? '' })} />
          <EventButton label="🟥 Roja" color="red" onClick={() => setEventAction({ type: 'red', teamId: activeMatch.home_team_id, teamName: activeMatch.home_team?.name ?? '' })} />
        </div>

        <div style={{ borderTop: '1px solid var(--ce-divider)', marginBottom: 16 }} />

        <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 800, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--ce-cyan)' }}>{activeMatch.away_team?.name}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <EventButton label="⚽ Gol" color="green" onClick={() => setEventAction({ type: 'goal', teamId: activeMatch.away_team_id, teamName: activeMatch.away_team?.name ?? '' })} />
          <EventButton label="🟨 Amarilla" color="yellow" onClick={() => setEventAction({ type: 'yellow', teamId: activeMatch.away_team_id, teamName: activeMatch.away_team?.name ?? '' })} />
          <EventButton label="🟥 Roja" color="red" onClick={() => setEventAction({ type: 'red', teamId: activeMatch.away_team_id, teamName: activeMatch.away_team?.name ?? '' })} />
        </div>

        {(goals.length > 0 || cards.length > 0) && (
          <div className="glass" style={{ marginTop: 16, borderRadius: 12, padding: 12 }}>
            <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 800, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--ce-fg-4)' }}>Eventos</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 120, overflowY: 'auto' }}>
              {goals.map(g => (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--ce-win)' }}>⚽ {(g.player as unknown as Player)?.name ?? 'Sin nombre'}{g.minute ? ` (${g.minute}')` : ''}</span>
                  <button onClick={() => removeGoal(g.id).then(() => setGoals(prev => prev.filter(x => x.id !== g.id)))} style={{ background: 'none', border: 'none', color: 'var(--ce-fg-4)', cursor: 'pointer', fontSize: 14 }}>✕</button>
                </div>
              ))}
              {cards.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: c.card_type === 'yellow' ? 'var(--ce-warn)' : 'var(--ce-loss)' }}>
                    {c.card_type === 'yellow' ? '🟨' : '🟥'} {(c.player as unknown as Player)?.name ?? 'Sin nombre'}{c.minute ? ` (${c.minute}')` : ''}
                  </span>
                  <button onClick={() => removeCard(c.id).then(() => setCards(prev => prev.filter(x => x.id !== c.id)))} style={{ background: 'none', border: 'none', color: 'var(--ce-fg-4)', cursor: 'pointer', fontSize: 14 }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '16px 16px 80px', borderTop: '1px solid var(--ce-border)' }}>
        <button onClick={closeMatch} disabled={loading} className="tap" style={{
          width: '100%', padding: 16, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: 'var(--ce-loss)', color: '#fff', fontWeight: 900, fontSize: 15, letterSpacing: '.06em',
          opacity: loading ? .5 : 1,
        }}>
          CERRAR PARTIDO ({activeMatch.home_score} - {activeMatch.away_score})
        </button>
      </div>
    </div>
  )
}
