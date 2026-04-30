'use client'
import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import { getFairPlay } from '@/lib/supabase'
import type { FairPlayEntry } from '@/lib/types'

const SANCTIONS = [
  { rule: '3 tarjetas amarillas', sanction: '1 fecha de suspensión', icon: '🟨' },
  { rule: '5 tarjetas amarillas', sanction: '2 fechas de suspensión', icon: '🟨🟨' },
  { rule: 'Tarjeta roja directa', sanction: '2 fechas de suspensión', icon: '🟥' },
  { rule: 'Roja por agresión física', sanction: '4 a 8 fechas (a criterio)', icon: '🟥⚠️' },
  { rule: 'Agresión a árbitro', sanction: 'Suspensión por el resto del torneo', icon: '🚫' },
]

const TOURNAMENT_ID = '11111111-1111-1111-1111-111111111111'

export default function FairPlayPage() {
  const [data, setData] = useState<FairPlayEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'ranking' | 'sanciones'>('ranking')

  useEffect(() => {
    getFairPlay(TOURNAMENT_ID).then(setData).finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Header />
      <main style={{ paddingBottom: 24 }}>
        <div style={{ padding: '20px 16px 0' }}>
          <p style={{ margin: '0 0 4px', fontSize: 9, fontWeight: 800, letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--ce-win)' }}>
            Conducta deportiva
          </p>
          <h2 style={{ margin: '0 0 16px', fontSize: 24, fontWeight: 900, color: 'var(--ce-fg)', lineHeight: 1 }}>
            Fair Play
          </h2>

          {/* Tabs */}
          <div style={{ display: 'flex', background: 'var(--ce-card)', borderRadius: 100, padding: 4, border: '1px solid var(--ce-border)', marginBottom: 20 }}>
            {[
              { key: 'ranking', label: 'Ranking' },
              { key: 'sanciones', label: 'Sanciones' },
            ].map(t => {
              const active = tab === t.key
              return (
                <button key={t.key} onClick={() => setTab(t.key as typeof tab)} className="tap" style={{
                  flex: 1, padding: '10px 4px', border: 0, borderRadius: 100,
                  background: active ? 'linear-gradient(135deg, var(--ce-cyan-3), var(--ce-cyan))' : 'transparent',
                  color: active ? '#000' : 'var(--ce-fg-3)',
                  fontSize: 13, fontWeight: 900, letterSpacing: '.04em', cursor: 'pointer',
                  boxShadow: active ? '0 4px 14px rgba(0,240,255,.3)' : 'none',
                  transition: 'all .2s',
                }}>{t.label}</button>
              )
            })}
          </div>
        </div>

        {/* ── RANKING TAB ── */}
        {tab === 'ranking' && (
          <>
            <div style={{ padding: '0 16px 12px', fontSize: 10, color: 'var(--ce-fg-4)', letterSpacing: '.06em' }}>
              🟨 Amarilla = 1 pt · 🟥 Roja = 3 pts · <strong style={{ color: 'var(--ce-win)' }}>Menor puntaje = mejor Fair Play</strong>
            </div>
            <div style={{ padding: '0 16px' }}>
              {loading
                ? <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid rgba(0,240,255,.2)', borderTopColor: 'var(--ce-cyan)', animation: 'spin .8s linear infinite' }} />
                  </div>
                : data.length === 0
                  ? <p style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ce-fg-4)', fontSize: 13 }}>Sin tarjetas registradas aún</p>
                  : (
                    <div className="glass" style={{ borderRadius: 14, overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--ce-border)', background: 'var(--ce-bg-3)' }}>
                            {['#', 'EQUIPO', 'ZONA', '🟨', '🟥', 'PTS'].map((h, i) => (
                              <th key={i} style={{
                                padding: '10px 8px', fontSize: 9, fontWeight: 800, letterSpacing: '.15em',
                                textTransform: 'uppercase', textAlign: i === 1 ? 'left' : 'center',
                                color: h === 'PTS' ? 'rgba(0,255,157,.75)' : h === '🟨' ? 'var(--ce-warn)' : h === '🟥' ? 'var(--ce-loss)' : 'var(--ce-fg-4)',
                              }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {data.map((row, i) => (
                            <tr key={row.team_id} style={{
                              borderBottom: '1px solid var(--ce-divider)',
                              borderLeft: i < 3 ? '2px solid rgba(0,255,157,.4)' : '2px solid transparent',
                            }}>
                              <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: 12, fontWeight: 900, color: i < 3 ? 'var(--ce-win)' : 'var(--ce-fg-4)' }}>{i + 1}</td>
                              <td style={{ padding: '12px 8px', fontSize: 12, fontWeight: 700, color: 'var(--ce-fg)' }}>{row.team_name}</td>
                              <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                <span style={{ fontSize: 9, fontWeight: 900, padding: '2px 6px', borderRadius: 4, background: 'rgba(0,240,255,.08)', color: 'var(--ce-cyan)', border: '1px solid rgba(0,240,255,.18)' }}>{row.zone}</span>
                              </td>
                              <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: 13, fontWeight: 900, color: 'var(--ce-warn)' }}>{row.yellow_cards}</td>
                              <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: 13, fontWeight: 900, color: 'var(--ce-loss)' }}>{row.red_cards}</td>
                              <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: 15, fontWeight: 900, color: row.score === 0 ? 'var(--ce-win)' : 'var(--ce-fg)' }}>{row.score}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
              }
            </div>
          </>
        )}

        {/* ── SANCIONES TAB ── */}
        {tab === 'sanciones' && (
          <div style={{ padding: '0 16px' }}>
            <div className="glass" style={{ borderRadius: 14, padding: '6px 0', marginBottom: 16 }}>
              <div style={{ padding: '10px 14px 6px', borderBottom: '1px solid var(--ce-divider)' }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: 'var(--ce-warn)', letterSpacing: '.08em' }}>RÉGIMEN DISCIPLINARIO</p>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--ce-fg-3)', lineHeight: 1.5 }}>
                  Las suspensiones se aplican automáticamente al acumularse las tarjetas. La organización se reserva el derecho de aumentar la sanción según la gravedad del hecho.
                </p>
              </div>
              {SANCTIONS.map((s, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '2rem 1fr 1fr', gap: 10, alignItems: 'center',
                  padding: '12px 14px', borderBottom: i < SANCTIONS.length - 1 ? '1px solid var(--ce-divider)' : 'none',
                }}>
                  <span style={{ fontSize: 16, textAlign: 'center' }}>{s.icon}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--ce-fg)' }}>{s.rule}</p>
                  </div>
                  <div style={{ background: 'rgba(255,51,102,.08)', border: '1px solid rgba(255,51,102,.2)', borderRadius: 8, padding: '6px 8px' }}>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: 'var(--ce-loss)', lineHeight: 1.3 }}>{s.sanction}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="glass" style={{ borderRadius: 14, padding: '14px 16px' }}>
              <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 900, color: 'var(--ce-cyan)', letterSpacing: '.08em' }}>SUSPENSIONES VIGENTES</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--ce-fg-3)', lineHeight: 1.5 }}>
                Las suspensiones activas se publicarán aquí una vez que la organización las informe. El jugador suspendido <strong style={{ color: 'var(--ce-fg)' }}>no puede participar</strong> del partido siguiente bajo ninguna circunstancia.
              </p>
              <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(0,240,255,.04)', border: '1px solid var(--ce-border)', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--ce-fg-4)' }}>Sin suspensiones activas</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
