'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getTeamById, getTeamMatches, getTopScorers } from '@/lib/supabase'
import type { Team, Match, TopScorer } from '@/lib/types'
import TeamLogo from '@/components/TeamLogo'

const TOURNAMENT_ID = '11111111-1111-1111-1111-111111111111'

function TeamDetailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const teamId = searchParams.get('id') || ''

  const [team, setTeam] = useState<Team | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [scorers, setScorers] = useState<TopScorer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!teamId) return
    Promise.all([
      getTeamById(teamId),
      getTeamMatches(teamId),
      getTopScorers(TOURNAMENT_ID),
    ]).then(([t, m, s]) => {
      setTeam(t)
      setMatches(m as Match[])
      setScorers(s.filter(sc => sc.team_id === teamId))
    }).finally(() => setLoading(false))
  }, [teamId])

  if (loading) return (
    <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(0,240,255,0.15)', borderTopColor: '#00f0ff', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  )

  if (!team) return (
    <main style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', gap: 16 }}>
      <p style={{ color: 'var(--ce-fg-4)', fontSize: 14 }}>Equipo no encontrado</p>
      <button onClick={() => router.back()} style={{ background: 'var(--ce-cyan)', color: '#000', border: 'none', padding: '10px 24px', borderRadius: 100, fontWeight: 900, fontSize: 13, cursor: 'pointer' }}>Volver</button>
    </main>
  )

  const finished = matches.filter(m => m.status === 'finished')
  const wins = finished.filter(m =>
    (m.home_team_id === teamId && m.home_score > m.away_score) ||
    (m.away_team_id === teamId && m.away_score > m.home_score)
  ).length
  const draws = finished.filter(m => m.home_score === m.away_score).length
  const losses = finished.length - wins - draws
  const gf = finished.reduce((s, m) => s + (m.home_team_id === teamId ? m.home_score : m.away_score), 0)
  const ga = finished.reduce((s, m) => s + (m.home_team_id === teamId ? m.away_score : m.home_score), 0)
  const points = wins * 3 + draws

  return (
    <main style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px 0' }}>
        <button onClick={() => router.back()} className="tap" style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ce-fg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: 'var(--ce-fg)', letterSpacing: '.04em' }}>Ficha del equipo</p>
      </div>

      {/* Team card */}
      <div className="glass" style={{ margin: '16px 16px 0', borderRadius: 16, padding: '24px 20px', display: 'flex', alignItems: 'center', gap: 16, borderLeft: '3px solid var(--ce-cyan)' }}>
        <TeamLogo url={team.logo_url} name={team.name} size={56} />
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: 'var(--ce-fg)', lineHeight: 1.1 }}>{team.name}</p>
          <p style={{ margin: '6px 0 0' }}>
            <span style={{ fontSize: 10, fontWeight: 900, padding: '3px 8px', borderRadius: 6, background: 'rgba(0,240,255,.1)', color: 'var(--ce-cyan)', border: '1px solid rgba(0,240,255,.2)', letterSpacing: '.1em' }}>ZONA {team.zone}</span>
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, margin: '16px 16px 0', background: 'var(--ce-border)', borderRadius: 14, overflow: 'hidden' }}>
        {[
          { value: String(points), label: 'Puntos', color: 'var(--ce-cyan)' },
          { value: `${wins}V ${draws}E ${losses}D`, label: 'Resultados', color: 'var(--ce-fg)' },
          { value: `${gf}-${ga}`, label: 'GF-GC', color: gf - ga > 0 ? 'var(--ce-win)' : gf - ga < 0 ? 'var(--ce-loss)' : 'var(--ce-fg)' },
        ].map(s => (
          <div key={s.label} className="glass" style={{ padding: '14px 6px', textAlign: 'center', borderRadius: 0, border: 'none' }}>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</p>
            <p style={{ margin: '4px 0 0', fontSize: 8, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ce-fg-4)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Goleadores del equipo */}
      {scorers.length > 0 && (
        <div style={{ padding: '20px 16px 0' }}>
          <p style={{ margin: '0 0 10px', fontSize: 9, fontWeight: 800, letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--ce-cyan)' }}>
            Goleadores
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {scorers.map((s, i) => (
              <div key={s.player_id} className="glass" style={{ borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: i === 0 ? 'var(--ce-cyan)' : 'var(--ce-fg-4)', width: 22, textAlign: 'center' }}>{i + 1}</span>
                <p style={{ margin: 0, flex: 1, fontSize: 13, fontWeight: 700, color: 'var(--ce-fg)' }}>{s.player_name}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: i === 0 ? 'var(--ce-cyan)' : 'var(--ce-fg)' }}>{s.goals}</span>
                  <span style={{ fontSize: 10 }}>⚽</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial de partidos */}
      <div style={{ padding: '20px 16px 0' }}>
        <p style={{ margin: '0 0 10px', fontSize: 9, fontWeight: 800, letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--ce-cyan)' }}>
          Partidos ({finished.length} jugados)
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {matches.map(m => {
            const isHome = m.home_team_id === teamId
            const isFinished = m.status === 'finished'
            const won = isFinished && (
              (isHome && m.home_score > m.away_score) ||
              (!isHome && m.away_score > m.home_score)
            )
            const draw = isFinished && m.home_score === m.away_score
            const lost = isFinished && !won && !draw

            return (
              <div key={m.id} className="glass" style={{
                borderRadius: 12, padding: '12px 14px',
                borderLeft: `2px solid ${won ? 'var(--ce-win)' : draw ? 'var(--ce-warn)' : lost ? 'var(--ce-loss)' : 'var(--ce-border)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.15em', color: 'var(--ce-fg-4)', textTransform: 'uppercase' }}>Fecha {m.round}</span>
                  <span style={{
                    fontSize: 8, fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase',
                    padding: '2px 6px', borderRadius: 4,
                    background: won ? 'rgba(0,255,157,.1)' : draw ? 'rgba(245,197,24,.1)' : lost ? 'rgba(255,51,102,.1)' : 'rgba(255,255,255,.05)',
                    color: won ? 'var(--ce-win)' : draw ? 'var(--ce-warn)' : lost ? 'var(--ce-loss)' : 'var(--ce-fg-4)',
                  }}>
                    {won ? 'Victoria' : draw ? 'Empate' : lost ? 'Derrota' : 'Pendiente'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ flex: 1, textAlign: 'right', paddingRight: 8 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: m.home_team_id === teamId ? 'var(--ce-cyan)' : 'var(--ce-fg)' }}>
                      {m.home_team?.name}
                    </p>
                  </div>
                  {isFinished ? (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '4px 8px' }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--ce-fg)', minWidth: 16, textAlign: 'center' }}>{m.home_score}</span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,.15)' }}>—</span>
                      <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--ce-fg)', minWidth: 16, textAlign: 'center' }}>{m.away_score}</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--ce-fg-4)', fontWeight: 700, padding: '4px 8px' }}>VS</span>
                  )}
                  <div style={{ flex: 1, textAlign: 'left', paddingLeft: 8 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: m.away_team_id === teamId ? 'var(--ce-cyan)' : 'var(--ce-fg)' }}>
                      {m.away_team?.name}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}

export default function TeamDetailPage() {
  return (
    <Suspense fallback={
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(0,240,255,0.15)', borderTopColor: '#00f0ff', animation: 'spin 0.8s linear infinite' }} />
      </main>
    }>
      <TeamDetailContent />
    </Suspense>
  )
}
