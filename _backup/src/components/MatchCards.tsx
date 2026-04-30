'use client'
import { useEffect, useState } from 'react'
import { Monogram, LiveDot } from './UI'

export type LiveMatch = {
  zone: string
  home: string
  away: string
  hs: number
  as: number
  min: number
  fecha?: number
  scorers?: string[]
}

export function LiveCard({ m, i }: { m: LiveMatch; i: number }) {
  const [tick, setTick] = useState(m.min)
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 0.3), 2000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="anim-rise" style={{
      animationDelay: `${i * 80}ms`,
      minWidth: 300, scrollSnapAlign: 'center', flexShrink: 0, position: 'relative',
      background: 'linear-gradient(135deg, rgba(192,57,43,.28) 0%, var(--ce-card-2) 55%)',
      backdropFilter: 'var(--ce-blur)', WebkitBackdropFilter: 'var(--ce-blur)',
      border: '1px solid rgba(231,76,60,.45)', borderRadius: 18, overflow: 'hidden',
      boxShadow: '0 12px 32px -6px rgba(192,57,43,.35)',
    }}>
      <div className="aurora-layer" />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#c0392b,#f5c518,#e74c3c)' }}/>

      <div style={{ position: 'relative', padding: '12px 14px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ font: '800 9px Inter', letterSpacing: '.2em', color: 'var(--ce-fg-3)' }}>
          ZONA {m.zone}{m.fecha ? ` · F${m.fecha}` : ''}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: '900 10px Inter', letterSpacing: '.1em', color: '#e74c3c' }}>
          <LiveDot/>EN VIVO · {Math.floor(tick)}&apos;
        </span>
      </div>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '10px 14px 14px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <Monogram name={m.home} highlight ring size={40}/>
          <p style={{ margin: 0, font: `400 13px/1.1 var(--font-bebas)`, letterSpacing: '.04em', color: 'var(--ce-fg)', textAlign: 'center', maxWidth: 94 }}>{m.home}</p>
        </div>
        <div style={{ padding: '0 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="score-glow" style={{ font: `400 42px/1 var(--font-bebas)`, color: 'var(--ce-fg)' }}>{m.hs}</span>
          <span style={{ font: '300 16px Inter', color: 'var(--ce-fg-4)' }}>—</span>
          <span className="score-glow" style={{ font: `400 42px/1 var(--font-bebas)`, color: 'var(--ce-fg)' }}>{m.as}</span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <Monogram name={m.away} highlight ring size={40}/>
          <p style={{ margin: 0, font: `400 13px/1.1 var(--font-bebas)`, letterSpacing: '.04em', color: 'var(--ce-fg)', textAlign: 'center', maxWidth: 94 }}>{m.away}</p>
        </div>
      </div>

      {m.scorers && m.scorers.length > 0 && (
        <div style={{ position: 'relative', padding: '8px 14px 12px', borderTop: '1px solid var(--ce-border)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {m.scorers.map((s, i) => (
            <span key={i} style={{ font: '700 10px Inter', color: 'var(--ce-fg-2)', padding: '3px 8px', borderRadius: 6, background: 'var(--ce-bg-3)' }}>{s}</span>
          ))}
        </div>
      )}
    </div>
  )
}

export type UpcomingMatch = { zone: string; home: string; away: string; when: string; field: string }

export function UpcomingCard({ m, i }: { m: UpcomingMatch; i: number }) {
  return (
    <div className="tap anim-rise" style={{
      animationDelay: `${i * 80}ms`,
      background: 'var(--ce-card)', backdropFilter: 'var(--ce-blur)', WebkitBackdropFilter: 'var(--ce-blur)',
      border: '1px solid var(--ce-border)', borderRadius: 14, overflow: 'hidden',
    }}>
      <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', background: 'var(--ce-bg-3)', borderBottom: '1px solid var(--ce-divider)' }}>
        <span style={{ font: '800 9px Inter', letterSpacing: '.2em', color: 'var(--ce-fg-3)' }}>ZONA {m.zone}</span>
        <span style={{ font: '800 9px Inter', letterSpacing: '.1em', color: 'rgba(245,197,24,.85)' }}>{m.when}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 14px 12px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
          <Monogram name={m.home} highlight size={34}/>
          <p style={{ margin: 0, font: `400 12px/1.1 var(--font-bebas)`, letterSpacing: '.04em', color: 'var(--ce-fg)', textAlign: 'center' }}>{m.home}</p>
        </div>
        <span style={{ font: `400 14px var(--font-bebas)`, letterSpacing: '.15em', color: 'var(--ce-fg-4)' }}>VS</span>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
          <Monogram name={m.away} highlight size={34}/>
          <p style={{ margin: 0, font: `400 12px/1.1 var(--font-bebas)`, letterSpacing: '.04em', color: 'var(--ce-fg)', textAlign: 'center' }}>{m.away}</p>
        </div>
      </div>
      <p style={{ margin: 0, padding: '0 14px 10px', font: '700 9px Inter', letterSpacing: '.1em', color: 'var(--ce-fg-3)', textAlign: 'center', textTransform: 'uppercase' }}>{m.field}</p>
    </div>
  )
}
