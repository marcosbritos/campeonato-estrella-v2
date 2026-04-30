'use client'
import { useEffect, useState, useCallback } from 'react'
import { getMatches } from '@/lib/supabase'
import type { Match } from '@/lib/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const ZONES = ['Todos', 'A', 'B', 'C'] as const
type ZoneFilter = (typeof ZONES)[number]

function MatchCard({ match, index }: { match: Match; index: number }) {
  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished'
  const dateLabel = match.match_date
    ? format(new Date(match.match_date), "EEE d MMM · HH:mm", { locale: es })
    : 'Fecha a confirmar'

  return (
    <div
      className="anim-slide-up"
      style={{
        margin: '0 16px 12px',
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        animationDelay: `${index * 60}ms`,
        background: isLive
          ? 'linear-gradient(135deg, rgba(192,57,43,0.2) 0%, rgba(8,8,20,0.9) 60%)'
          : 'rgba(10,10,22,0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: isLive
          ? '1px solid rgba(231,76,60,0.5)'
          : '1px solid rgba(255,255,255,0.06)',
        boxShadow: isLive
          ? '0 8px 40px rgba(192,57,43,0.25), inset 0 1px 0 rgba(255,255,255,0.08)'
          : '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Live animated top border */}
      {isLive && (
        <div
          className="live-card-border"
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, #c0392b, #f5c518, #e74c3c)',
          }}
        />
      )}

      {/* Header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px',
        background: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>
          ZONA {match.zone} · FECHA {match.round}
        </span>
        {isLive ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 900, color: '#e74c3c', letterSpacing: '0.1em' }}>
            <span className="live-dot" />
            EN VIVO
          </span>
        ) : isFinished ? (
          <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Finalizado
          </span>
        ) : (
          <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(0,240,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {dateLabel}
          </span>
        )}
      </div>

      {/* Match row */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '18px 16px' }}>
        {/* Home */}
        <div style={{ flex: 1, textAlign: 'right', paddingRight: 12 }}>
          <p className="font-display" style={{
            fontSize: 15, lineHeight: 1.1, letterSpacing: '0.04em',
            color: isFinished && match.home_score > match.away_score ? '#00f0ff' : '#ffffff',
            textShadow: isFinished && match.home_score > match.away_score ? '0 0 20px rgba(0,240,255,0.45)' : 'none',
          }}>
            {match.home_team?.name}
          </p>
        </div>

        {/* Score or VS */}
        {(isFinished || isLive) ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, padding: '8px 16px',
          }}>
            <span className={isLive ? 'score-glow font-display' : 'font-display'} style={{
              fontSize: 28, lineHeight: 1,
              color: isLive ? '#ffffff' : 'rgba(255,255,255,0.9)',
              minWidth: 24, textAlign: 'center',
            }}>
              {match.home_score}
            </span>
            <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.15)', fontWeight: 300, margin: '0 2px' }}>—</span>
            <span className={isLive ? 'score-glow font-display' : 'font-display'} style={{
              fontSize: 28, lineHeight: 1,
              color: isLive ? '#ffffff' : 'rgba(255,255,255,0.9)',
              minWidth: 24, textAlign: 'center',
            }}>
              {match.away_score}
            </span>
          </div>
        ) : (
          <div style={{
            padding: '8px 14px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 10,
          }}>
            <span className="font-display" style={{ fontSize: 14, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>VS</span>
          </div>
        )}

        {/* Away */}
        <div style={{ flex: 1, textAlign: 'left', paddingLeft: 12 }}>
          <p className="font-display" style={{
            fontSize: 15, lineHeight: 1.1, letterSpacing: '0.04em',
            color: isFinished && match.away_score > match.home_score ? '#f5c518' : '#ffffff',
            textShadow: isFinished && match.away_score > match.home_score ? '0 0 20px rgba(245,197,24,0.4)' : 'none',
          }}>
            {match.away_team?.name}
          </p>
        </div>
      </div>

      {/* Pending date footer */}
      {!isFinished && !isLive && match.match_date && (
        <div style={{ textAlign: 'center', paddingBottom: 12 }}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            {dateLabel}
          </span>
        </div>
      )}
    </div>
  )
}

function groupByRound(matches: Match[]) {
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
  const [activeRound, setActiveRound] = useState<number | null>(null)

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

  useEffect(() => {
    if (matches.length > 0) {
      const g = groupByRound(matches)
      const r = Object.keys(g).map(Number).sort((a, b) => a - b)
      
      setActiveRound(current => {
        if (current !== null && r.includes(current)) return current
        
        // Find latest round with finished matches
        const latestFinished = r.slice().reverse().find(rnd => 
          g[rnd].some(m => m.status === 'finished')
        )
        return latestFinished ?? r[0]
      })
    } else {
      setActiveRound(null)
    }
  }, [matches])

  const grouped = groupByRound(matches)
  const rounds = Object.keys(grouped).map(Number).sort((a, b) => a - b)

  return (
    <div>
      {/* Zone filter pills */}
      <div
        className="no-scrollbar"
        style={{ display: 'flex', gap: 8, padding: '12px 16px', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      >
        {ZONES.map((z) => {
          const active = zone === z
          return (
            <button
              key={z}
              onClick={() => setZone(z)}
              className={active ? 'btn-pulse-red' : ''}
              style={{
                flexShrink: 0, padding: '8px 20px', borderRadius: 100,
                border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-bebas, system-ui)',
                fontSize: 13, letterSpacing: '0.1em',
                transition: 'all 0.2s ease',
                ...(active ? {
                  background: 'linear-gradient(135deg, #00b8cc, #00f0ff)',
                  color: '#000000',
                } : {
                  background: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }),
              }}
            >
              {z === 'Todos' ? 'TODOS' : `ZONA ${z}`}
            </button>
          )
        })}
      </div>

      {/* Round filter pills */}
      {rounds.length > 0 && (
        <div
          className="no-scrollbar"
          style={{ display: 'flex', gap: 8, padding: '12px 16px', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
        >
          {rounds.map((r) => {
            const active = activeRound === r
            return (
              <button
                key={r}
                onClick={() => setActiveRound(r)}
                style={{
                  flexShrink: 0, padding: '6px 16px', borderRadius: 100,
                  border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-bebas, system-ui)',
                  fontSize: 12, letterSpacing: '0.1em',
                  transition: 'all 0.2s ease',
                  ...(active ? {
                    background: 'rgba(255,255,255,0.9)',
                    color: '#000000',
                  } : {
                    background: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.4)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }),
                }}
              >
                FECHA {r}
              </button>
            )
          })}
        </div>
      )}

      {/* Content */}
      <div style={{ paddingTop: 16, paddingBottom: 8 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '2px solid rgba(0,240,255,0.15)',
              borderTopColor: '#00f0ff',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        ) : rounds.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.15)' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📅</div>
            <p style={{ fontSize: 13 }}>No hay partidos cargados aún</p>
          </div>
        ) : activeRound !== null && grouped[activeRound] ? (
          <div>
            {/* Round separator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 20px 12px' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
              <span style={{
                fontSize: 10, fontWeight: 900, letterSpacing: '0.2em',
                color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase',
                fontFamily: 'var(--font-bebas, system-ui)',
              }}>
                FECHA {activeRound}
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
            </div>

            {grouped[activeRound].map((m, i) => (
              <MatchCard key={m.id} match={m} index={i} />
            ))}
          </div>
        ) : null}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
