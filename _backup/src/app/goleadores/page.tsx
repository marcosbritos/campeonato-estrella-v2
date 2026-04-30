'use client'
import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import { getTopScorers } from '@/lib/supabase'
import type { TopScorer } from '@/lib/types'

const MEDAL = ['🥇', '🥈', '🥉']
const MEDAL_COLOR = ['var(--ce-cyan-2)', 'var(--ce-cyan)', 'var(--ce-cyan-3)']

export default function GoleadoresPage() {
  const [scorers, setScorers] = useState<TopScorer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTopScorers()
      .then(setScorers)
      .finally(() => setLoading(false))
  }, [])

  return (
    <main>
      <Header />
      <div style={{ padding: '20px 16px' }}>
        <div style={{ marginBottom: 20 }}>
          <p style={{ margin: 0, fontSize: 9, fontWeight: 800, letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--ce-cyan)' }}>
            Tabla de artilleros
          </p>
          <h2 style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 900, color: 'var(--ce-fg)', letterSpacing: '.02em' }}>
            Goleadores
          </h2>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--ce-cyan)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : scorers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ce-fg-4)', fontSize: 14 }}>
            No hay goles registrados aún
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {scorers.map((s, i) => (
              <div key={s.player_id} className="glass anim-rise" style={{
                animationDelay: `${i * 40}ms`,
                borderRadius: 14, padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 14,
                borderLeft: i < 3 ? `2px solid ${MEDAL_COLOR[i]}` : '2px solid var(--ce-border)',
                boxShadow: i === 0 ? '0 0 20px rgba(0,240,255,.08)' : 'none',
              }}>
                <span style={{ fontSize: i < 3 ? 22 : 13, width: 28, textAlign: 'center', fontWeight: i >= 3 ? 900 : undefined, color: i >= 3 ? 'var(--ce-fg-4)' : undefined }}>
                  {i < 3 ? MEDAL[i] : i + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: 'var(--ce-fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.player_name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--ce-fg-4)', letterSpacing: '.06em' }}>{s.team_name} · Zona {s.zone}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: i < 3 ? MEDAL_COLOR[i] : 'var(--ce-fg)', textShadow: i === 0 ? '0 0 12px rgba(0,240,255,.5)' : 'none' }}>{s.goals}</span>
                  <span style={{ fontSize: 11, color: 'var(--ce-fg-4)' }}>⚽</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
