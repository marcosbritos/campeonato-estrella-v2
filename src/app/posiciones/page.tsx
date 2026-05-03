'use client'
import { useEffect, useState, useCallback } from 'react'
import Header from '@/components/Header'
import { supabase, getStandings, getMatches, getTopScorers } from '@/lib/supabase'
import type { Standing, Match, TopScorer, Zone } from '@/lib/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

const TOURNAMENT_ID = '11111111-1111-1111-1111-111111111111'
const ZONES: Zone[] = ['A', 'B', 'C']

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
const MEDAL_COLOR = ['#5ffbff', '#00f0ff', '#00b8cc']

/* ─── STANDINGS ROW ─── */
function StandingRow({ s, pos }: { s: Standing; pos: number }) {
  const isClassif = pos <= 2
  const isTop3 = pos <= 3
  const posColors: Record<number, string> = { 1: '#5ffbff', 2: '#00f0ff', 3: '#00b8cc' }
  const c = posColors[pos]
  const initials = s.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  return (
    <tr style={{
      borderBottom: '1px solid var(--ce-divider)',
      borderLeft: isClassif ? '2px solid rgba(0,240,255,.35)' : '2px solid transparent',
    }}>
      <td style={{ width: 36, padding: '9px 4px 9px 10px', textAlign: 'center' }}>
        <span style={c ? { fontSize: 13, fontWeight: 900, color: c, textShadow: `0 0 10px ${c}88` } : { fontSize: 12, fontWeight: 700, color: 'var(--ce-fg-4)' }}>{pos}</span>
      </td>
      <td style={{ padding: '7px 6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 8, fontWeight: 900, letterSpacing: '.04em',
            color: isTop3 ? '#00f0ff' : 'var(--ce-fg-4)',
            background: isTop3 ? 'rgba(0,240,255,.1)' : 'var(--ce-bg-3)',
            border: isTop3 ? '1px solid rgba(0,240,255,.25)' : '1px solid var(--ce-border)',
          }}>{initials}</div>
          <Link href={`/equipo/${s.team_id}`} style={{ margin: 0, fontSize: 12, fontWeight: isTop3 ? 900 : 600, color: isTop3 ? 'var(--ce-fg)' : 'var(--ce-fg-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110, textDecoration: 'none' }}>{s.name}</Link>
        </div>
      </td>
      <td style={{ padding: '9px 4px', textAlign: 'center', width: 36 }}>
        <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--ce-fg)' }}>{s.points}</span>
      </td>
      <td style={{ padding: '9px 3px', textAlign: 'center', width: 26, fontSize: 11, color: 'var(--ce-fg-3)', fontWeight: 600 }}>{s.played}</td>
      <td style={{ padding: '9px 3px', textAlign: 'center', width: 22, fontSize: 11, color: 'var(--ce-win)', fontWeight: 700 }}>{s.won}</td>
      <td style={{ padding: '9px 3px', textAlign: 'center', width: 22, fontSize: 11, color: 'var(--ce-fg-3)', fontWeight: 600 }}>{s.drawn}</td>
      <td style={{ padding: '9px 3px', textAlign: 'center', width: 22, fontSize: 11, color: 'var(--ce-loss)', fontWeight: 700 }}>{s.lost}</td>
      <td style={{ padding: '9px 8px 9px 3px', textAlign: 'center', width: 32 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: s.goal_diff > 0 ? 'var(--ce-win)' : s.goal_diff < 0 ? 'var(--ce-loss)' : 'var(--ce-fg-4)' }}>
          {s.goal_diff > 0 ? `+${s.goal_diff}` : s.goal_diff}
        </span>
      </td>
    </tr>
  )
}

/* ─── MATCH CARD ─── */
function MatchRow({ m }: { m: Match }) {
  const isLive = m.status === 'live'
  const isFinished = m.status === 'finished'
  const dateLabel = m.match_date
    ? format(new Date(m.match_date), "EEE d MMM · HH:mm", { locale: es })
    : 'A confirmar'
  return (
    <div className="glass" style={{
      borderRadius: 12, overflow: 'hidden', marginBottom: 8,
      border: isLive ? '1px solid rgba(255,51,102,.45)' : '1px solid var(--ce-border)',
      boxShadow: isLive ? '0 0 16px rgba(255,51,102,.15)' : 'none',
    }}>
      {isLive && <div style={{ height: 2, background: 'linear-gradient(90deg,var(--ce-cyan-3),var(--ce-cyan),var(--ce-loss))' }} />}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px solid var(--ce-divider)', background: 'rgba(0,0,0,.2)' }}>
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.2em', color: 'var(--ce-fg-4)', textTransform: 'uppercase' }}>{getMatchStageLabel(m)}</span>
        {isLive
          ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 900, color: 'var(--ce-loss)', textTransform: 'uppercase' }}><span className="live-dot" style={{ width: 6, height: 6 }} />EN VIVO</span>
          : isFinished
            ? <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--ce-fg-4)' }}>Finalizado</span>
            : <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--ce-fg-4)', textTransform: 'uppercase' }}>{dateLabel}</span>
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

/* ─── MAIN PAGE ─── */
export default function PosicionesPage() {
  const [zone, setZone] = useState<Zone>('A')
  const [zoneStandings, setZoneStandings] = useState<Standing[]>([])
  const [zoneMatches, setZoneMatches] = useState<Match[]>([])
  const [selectedRound, setSelectedRound] = useState<number | null>(null)
  const [generalStandings, setGeneralStandings] = useState<Standing[]>([])
  const [loadingZone, setLoadingZone] = useState(true)
  const [loadingGeneral, setLoadingGeneral] = useState(true)

  // Load zone data
  const loadZone = useCallback(async (z: Zone) => {
    setLoadingZone(true)
    const [st, mt] = await Promise.all([getStandings(TOURNAMENT_ID, z), getMatches(TOURNAMENT_ID, z)])
    setZoneStandings(st)
    const matches = mt as Match[]
    setZoneMatches(matches)
    // default to last round with live/pending, else last round
    const rounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b)
    const liveRound = rounds.find(r => matches.filter(m => m.round === r).some(m => m.status !== 'finished'))
    setSelectedRound(liveRound ?? rounds[rounds.length - 1] ?? null)
    setLoadingZone(false)
  }, [])

  // Load general + scorers once + realtime
  useEffect(() => {
    getStandings(TOURNAMENT_ID).then(d => { setGeneralStandings(d); setLoadingGeneral(false) })

    const ch = supabase.channel('pos-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goals' }, () => {
        getStandings(TOURNAMENT_ID).then(setGeneralStandings)
        loadZone(zone)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, () => {
        getStandings(TOURNAMENT_ID).then(setGeneralStandings)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        getStandings(TOURNAMENT_ID).then(setGeneralStandings)
        loadZone(zone)
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { loadZone(zone) }, [zone, loadZone])

  const Spinner = () => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '36px 0' }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid rgba(0,240,255,.2)', borderTopColor: 'var(--ce-cyan)', animation: 'spin .8s linear infinite' }} />
    </div>
  )

  const SectionLabel = ({ eyebrow, title }: { eyebrow: string; title: string }) => (
    <div style={{ padding: '20px 16px 10px' }}>
      <p style={{ margin: 0, fontSize: 9, fontWeight: 800, letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--ce-cyan)' }}>{eyebrow}</p>
      <h2 style={{ margin: '3px 0 0', fontSize: 22, fontWeight: 900, color: 'var(--ce-fg)', lineHeight: 1 }}>{title}</h2>
    </div>
  )

  return (
    <>
      <Header />
      <main style={{ paddingBottom: 24 }}>

        {/* ── ZONE TABS ── */}
        <div style={{ position: 'sticky', top: 57, zIndex: 30, background: 'var(--ce-bg)', borderBottom: '1px solid var(--ce-border)' }}>
          <div style={{ display: 'flex' }}>
            {ZONES.map(z => {
              const active = zone === z
              return (
                <button key={z} onClick={() => setZone(z)} style={{
                  flex: 1, padding: '14px 4px', border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: 15, fontWeight: 900, letterSpacing: '.08em',
                  color: active ? 'var(--ce-cyan)' : 'var(--ce-fg-4)',
                  position: 'relative', transition: 'color .2s',
                }}>
                  {active && (
                    <>
                      <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,240,255,.06), transparent)' }} />
                      <span style={{ position: 'absolute', bottom: -1, left: '50%', transform: 'translateX(-50%)', height: 2, width: '2rem', borderRadius: '2px 2px 0 0', background: 'linear-gradient(90deg, var(--ce-cyan-3), var(--ce-cyan))', boxShadow: '0 0 8px var(--ce-cyan)' }} />
                    </>
                  )}
                  <span style={{ position: 'relative' }}>ZONA {z}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── ZONE STANDINGS ── */}
        <SectionLabel eyebrow={`Zona ${zone}`} title="Tabla de posiciones" />
        <div style={{ padding: '0 12px' }}>
          <div className="glass" style={{ borderRadius: 14, overflowX: 'auto' }}>
            {loadingZone ? <Spinner /> : (
              <div>
                <table style={{ width: '100%', minWidth: 320, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--ce-border)', background: 'var(--ce-bg-3)' }}>
                      {['#', 'EQUIPO', 'PTS', 'PJ', 'G', 'E', 'P', '+/-'].map((h, i) => (
                        <th key={i} style={{
                          padding: i === 1 ? '8px 6px' : '8px 4px', fontSize: 9, fontWeight: 800,
                          letterSpacing: '.15em', textTransform: 'uppercase',
                          color: 'var(--ce-fg-4)',
                          textAlign: i === 1 ? 'left' : 'center',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {zoneStandings.map((s, i) => <StandingRow key={s.team_id} s={s} pos={i + 1} />)}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12, padding: '8px 2px', fontSize: 9, fontWeight: 800, letterSpacing: '.12em', color: 'var(--ce-fg-4)', textTransform: 'uppercase' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ display: 'inline-block', width: 2, height: 12, borderRadius: 2, background: 'rgba(0,240,255,.5)' }} />
              Top 2 clasifica a semis
            </span>
          </div>
        </div>

        {/* ── ZONE FIXTURE ── */}
        <SectionLabel eyebrow={`Zona ${zone} · Partidos`} title="Fixture" />
        {!loadingZone && zoneMatches.length > 0 && (() => {
          const rounds = Array.from(new Set(zoneMatches.map(m => m.round))).sort((a, b) => a - b)
          return (
            <div style={{ padding: '0 16px 12px', overflowX: 'auto' }} className="no-scrollbar">
              <div style={{ display: 'flex', gap: 6, width: 'max-content' }}>
                {rounds.map(r => {
                  const active = selectedRound === r
                  const hasLive = zoneMatches.filter(m => m.round === r).some(m => m.status === 'live')
                  return (
                    <button key={r} onClick={() => setSelectedRound(r)} className="tap" style={{
                      padding: '7px 14px', borderRadius: 100, cursor: 'pointer', fontSize: 11, fontWeight: 900,
                      background: active ? 'linear-gradient(135deg, var(--ce-cyan-3), var(--ce-cyan))' : 'var(--ce-card)',
                      color: active ? '#000' : hasLive ? 'var(--ce-loss)' : 'var(--ce-fg-3)',
                      border: active ? '1px solid transparent' : `1px solid ${hasLive ? 'rgba(255,51,102,.4)' : 'var(--ce-border)'}`,
                      boxShadow: active ? '0 2px 10px rgba(0,240,255,.3)' : 'none',
                      whiteSpace: 'nowrap',
                    }}>
                      {hasLive && !active && <span style={{ marginRight: 4 }}>●</span>}
                      {r >= 8 ? (
                        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.25 }}>
                          <span style={{ fontSize: 9 }}>{r === 10 ? 'AMISTOSOS' : 'ZONA'}</span>
                          {r !== 10 && <span style={{ fontSize: 10 }}>{r === 8 ? 'CAMPEONATO' : 'REPECHAJE'}</span>}
                        </span>
                      ) : getRoundLabel(r).toUpperCase()}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })()}
        <div style={{ padding: '0 16px' }}>
          {loadingZone ? <Spinner /> : zoneMatches.length === 0
            ? <p style={{ textAlign: 'center', padding: '24px 0', color: 'var(--ce-fg-4)', fontSize: 13 }}>Sin partidos cargados</p>
            : (() => {
              const roundMatches = zoneMatches.filter(m => m.round === selectedRound)
              return roundMatches.map(m => <MatchRow key={m.id} m={m} />)
            })()
          }
        </div>

        {/* ── GENERAL STANDINGS ── */}
        <SectionLabel eyebrow="Todos los equipos" title="Tabla general" />
        <div style={{ padding: '0 12px' }}>
          <div className="glass" style={{ borderRadius: 14, overflowX: 'auto' }}>
            {loadingGeneral ? <Spinner /> : (
              <div>
                <table style={{ width: '100%', minWidth: 310, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--ce-border)', background: 'var(--ce-bg-3)' }}>
                      {['#', 'EQUIPO', 'ZONA', 'PTS', 'PJ', 'G', 'E', 'P', '+/-'].map((h, i) => (
                        <th key={i} style={{
                          padding: i === 1 ? '8px 6px' : '8px 4px', fontSize: 9, fontWeight: 800,
                          letterSpacing: '.15em', textTransform: 'uppercase',
                          color: 'var(--ce-fg-4)',
                          textAlign: i === 1 ? 'left' : 'center',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {generalStandings.map((s, i) => (
                      <tr key={s.team_id} style={{ borderBottom: '1px solid var(--ce-divider)', borderLeft: i < 6 ? '2px solid rgba(0,240,255,.25)' : '2px solid transparent' }}>
                        <td style={{ width: 36, padding: '9px 4px 9px 10px', textAlign: 'center', fontSize: 12, fontWeight: 900, color: i < 6 ? 'var(--ce-cyan)' : 'var(--ce-fg-4)' }}>{i + 1}</td>
                        <td style={{ padding: '7px 6px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <Link href={`/equipo/${s.team_id}`} style={{ color: 'var(--ce-fg)', textDecoration: 'none' }}>{s.name}</Link>
                        </td>
                        <td style={{ padding: '9px 4px', textAlign: 'center', width: 32 }}>
                          <span style={{ fontSize: 9, fontWeight: 900, padding: '2px 6px', borderRadius: 4, background: 'rgba(0,240,255,.1)', color: 'var(--ce-cyan)', border: '1px solid rgba(0,240,255,.2)' }}>{s.zone}</span>
                        </td>
                        <td style={{ padding: '9px 4px', textAlign: 'center', width: 36, fontSize: 15, fontWeight: 900, color: 'var(--ce-fg)' }}>{s.points}</td>
                        <td style={{ padding: '9px 3px', textAlign: 'center', width: 26, fontSize: 11, color: 'var(--ce-fg-3)' }}>{s.played}</td>
                        <td style={{ padding: '9px 3px', textAlign: 'center', width: 22, fontSize: 11, color: 'var(--ce-win)', fontWeight: 700 }}>{s.won}</td>
                        <td style={{ padding: '9px 3px', textAlign: 'center', width: 22, fontSize: 11, color: 'var(--ce-fg-3)' }}>{s.drawn}</td>
                        <td style={{ padding: '9px 3px', textAlign: 'center', width: 22, fontSize: 11, color: 'var(--ce-loss)', fontWeight: 700 }}>{s.lost}</td>
                        <td style={{ padding: '9px 8px 9px 3px', textAlign: 'center', width: 32, fontSize: 11, fontWeight: 800, color: s.goal_diff > 0 ? 'var(--ce-win)' : s.goal_diff < 0 ? 'var(--ce-loss)' : 'var(--ce-fg-4)' }}>
                          {s.goal_diff > 0 ? `+${s.goal_diff}` : s.goal_diff}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>


      </main>
    </>
  )
}
