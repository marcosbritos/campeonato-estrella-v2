'use client'
import { useEffect, useState, useCallback } from 'react'
import { getMatches } from '@/lib/supabase'
const TOURNAMENT_ID = '11111111-1111-1111-1111-111111111111'

import type { Match } from '@/lib/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const ZONES = ['Todos', 'A', 'B', 'C'] as const
type ZoneFilter = (typeof ZONES)[number]

function getRoundLabel(round: number): string {
  if (round === 8) return 'Zona Campeonato'
  if (round === 9) return 'Zona Repechaje'
  if (round >= 10) return 'Amistosos'
  return `Fecha ${round}`
}

function getMatchStageLabel(m: Match): string {
  if (m.round === 8) return 'CUARTOS · CAMPEONATO'
  if (m.round === 9) return 'CUARTOS · REPECHAJE'
  if (m.round >= 10) return 'AMISTOSO'
  return `ZONA ${m.zone} · F${m.round}`
}

function MatchCard({ match: m, index }: { match: Match; index: number }) {
  const isLive = m.status === 'live'
  const isFinished = m.status === 'finished'
  const dateLabel = m.match_date
    ? format(new Date(m.match_date), "EEE d MMM · HH:mm", { locale: es })
    : 'A confirmar'
  return (
    <div className="glass anim-fade" style={{
      borderRadius: 12, overflow: 'hidden', marginBottom: 8, margin: '0 16px 12px',
      border: isLive ? '1px solid rgba(255,51,102,.45)' : '1px solid var(--ce-border)',
      boxShadow: isLive ? '0 0 16px rgba(255,51,102,.15)' : 'none',
      animationDelay: `${index * 60}ms`,
    }}>
      {isLive && <div style={{ height: 2, background: 'linear-gradient(90deg,var(--ce-cyan-3),var(--ce-cyan),var(--ce-loss))' }} />}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px solid var(--ce-divider)', background: 'rgba(0,0,0,.05)' }}>
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.2em', color: 'var(--ce-fg-4)', textTransform: 'uppercase' }}>{getMatchStageLabel(m)}</span>
        {isLive
          ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 900, color: 'var(--ce-loss)', textTransform: 'uppercase' }}><span className="live-dot" style={{ width: 6, height: 6 }} />EN VIVO</span>
          : isFinished
            ? <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--ce-fg-4)' }}>Finalizado</span>
            : <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--ce-cyan)', textTransform: 'uppercase' }}>{dateLabel}</span>
        }
      </div>
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 12px' }}>
        <p style={{ flex: 1, margin: 0, fontSize: 12, fontWeight: 900, color: 'var(--ce-fg)', textAlign: 'right', lineHeight: 1.2 }}>{m.home_team?.name}</p>
        {(isLive || isFinished)
          ? <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px' }}>
              <span className={isLive ? 'score-glow' : ''} style={{ fontSize: 22, fontWeight: 900, color: 'var(--ce-fg)', minWidth: 20, textAlign: 'center' }}>{m.home_score}</span>
              <span style={{ color: 'var(--ce-fg-4)', fontSize: 14, fontWeight: 300 }}>—</span>
              <span className={isLive ? 'score-glow' : ''} style={{ fontSize: 22, fontWeight: 900, color: 'var(--ce-fg)', minWidth: 20, textAlign: 'center' }}>{m.away_score}</span>
            </div>
          : <span style={{ padding: '0 14px', fontSize: 11, color: 'var(--ce-fg-4)', fontWeight: 700 }}>VS</span>
        }
        <p style={{ flex: 1, margin: 0, fontSize: 12, fontWeight: 900, color: 'var(--ce-fg)', lineHeight: 1.2 }}>{m.away_team?.name}</p>
      </div>
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
      const data = await getMatches(TOURNAMENT_ID, zone === 'Todos' ? undefined : zone)
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

        // If playoffs exist, default to Zona Campeonato (round 8)
        const hasPlayoffs = r.some(rnd => rnd >= 8)
        if (hasPlayoffs) return r.find(rnd => rnd >= 8) ?? r[0]

        // Otherwise show latest round with finished matches
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
      {/* Zone filter pills — hidden during playoffs */}
      <div
        className="no-scrollbar"
        style={{ display: activeRound !== null && activeRound >= 8 ? 'none' : 'flex', gap: 8, padding: '12px 16px', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
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
                  background: 'linear-gradient(135deg, var(--ce-cyan-3), var(--ce-cyan))',
                  color: 'var(--ce-bg-2)',
                } : {
                  background: 'var(--ce-card)',
                  color: 'var(--ce-fg-4)',
                  border: '1px solid var(--ce-border)',
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
                onClick={() => { if (r >= 8 && zone !== 'Todos') setZone('Todos'); setActiveRound(r) }}
                style={{
                  flexShrink: 0, padding: '6px 16px', borderRadius: 100,
                  border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-bebas, system-ui)',
                  fontSize: 12, letterSpacing: '0.1em',
                  transition: 'all 0.2s ease',
                  ...(active ? {
                    background: 'var(--ce-fg)',
                    color: 'var(--ce-bg-2)',
                  } : {
                    background: 'var(--ce-card)',
                    color: 'var(--ce-fg-4)',
                    border: '1px solid var(--ce-border)',
                  }),
                }}
              >
                {r >= 8 ? (
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.25, gap: 0 }}>
                    <span style={{ fontSize: 10 }}>{r === 10 ? 'AMISTOSOS' : 'ZONA'}</span>
                    {r !== 10 && <span style={{ fontSize: 11 }}>{r === 8 ? 'CAMPEONATO' : 'REPECHAJE'}</span>}
                  </span>
                ) : getRoundLabel(r).toUpperCase()}
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
                {getRoundLabel(activeRound).toUpperCase()}
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
