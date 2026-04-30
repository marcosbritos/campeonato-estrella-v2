'use client'
import { useState } from 'react'
import { SectionTitle, Monogram } from './UI'
import { ZONE_A, ZONE_B, ZONE_C, type Standing } from '@/lib/mock'

type Zone = 'A' | 'B' | 'C' | 'GEN'

function Row({ s, pos, i }: { s: Standing; pos: number; i: number }) {
  const top3 = pos <= 3
  const classif = pos <= 2
  const posColor: Record<number, string> = { 1: '#f5c518', 2: '#d8d8e0', 3: '#cd7f32' }
  const color = posColor[pos]

  return (
    <tr className="anim-rise team-row" style={{
      animationDelay: `${Math.min(i, 7) * 50}ms`,
      borderBottom: '1px solid var(--ce-divider)',
      borderLeft: classif ? '2px solid rgba(245,197,24,.45)' : '2px solid transparent',
    }}>
      <td style={{ padding: '10px 4px 10px 12px', textAlign: 'center', width: 34 }}>
        {color
          ? <span style={{ fontSize: 13, fontWeight: 900, color, textShadow: `0 0 12px ${color}aa`, fontFamily: 'Inter' }}>{pos}</span>
          : <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ce-fg-4)', fontFamily: 'Inter' }}>{pos}</span>}
      </td>
      <td style={{ padding: '8px 6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Monogram name={s.n} highlight={top3} size={28} ring={pos === 1} />
          <p style={{
            margin: 0, font: `400 13px/1.1 var(--font-bebas)`, letterSpacing: '.04em',
            color: top3 ? 'var(--ce-fg)' : 'var(--ce-fg-2)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110,
          }}>{s.n}</p>
        </div>
      </td>
      <td style={{ padding: '10px 4px', textAlign: 'center', width: 38 }}>
        {classif
          ? <span style={{ font: '900 15px Inter', color: '#f5c518', textShadow: '0 0 14px rgba(245,197,24,.5)' }}>{s.pts}</span>
          : <span style={{ font: '900 14px Inter', color: 'var(--ce-fg)' }}>{s.pts}</span>}
      </td>
      <td style={{ padding: '10px 3px', textAlign: 'center', width: 26, font: '600 11px Inter', color: 'var(--ce-fg-3)' }}>{s.pj}</td>
      <td style={{ padding: '10px 3px', textAlign: 'center', width: 22, font: '700 11px Inter', color: 'rgba(74,222,128,.85)' }}>{s.g}</td>
      <td style={{ padding: '10px 3px', textAlign: 'center', width: 22, font: '600 11px Inter', color: 'var(--ce-fg-3)' }}>{s.e}</td>
      <td style={{ padding: '10px 3px', textAlign: 'center', width: 22, font: '700 11px Inter', color: 'rgba(231,76,60,.85)' }}>{s.p}</td>
      <td style={{ padding: '10px 8px 10px 3px', textAlign: 'center', width: 36 }}>
        <span style={{ font: '800 11px Inter', color: s.gd > 0 ? 'rgba(74,222,128,.95)' : s.gd < 0 ? 'rgba(231,76,60,.95)' : 'var(--ce-fg-4)' }}>
          {s.gd > 0 ? `+${s.gd}` : s.gd}
        </span>
      </td>
    </tr>
  )
}

export default function StandingsTable() {
  const [zone, setZone] = useState<Zone>('B')
  const data: Standing[] = zone === 'A' ? ZONE_A
    : zone === 'B' ? ZONE_B
    : zone === 'C' ? ZONE_C
    : [...ZONE_A, ...ZONE_B, ...ZONE_C].sort((a, b) => b.pts - a.pts).slice(0, 12)

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <SectionTitle eyebrow="6 fechas disputadas">Tabla de posiciones</SectionTitle>

      <div style={{ padding: '0 16px 14px' }}>
        <div style={{
          display: 'flex', background: 'var(--ce-card)', borderRadius: 100, padding: 4,
          border: '1px solid var(--ce-border)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,.2)',
        }}>
          {(['A', 'B', 'C', 'GEN'] as Zone[]).map(z => {
            const act = zone === z
            return (
              <button key={z} onClick={() => setZone(z)} className="tap" style={{
                flex: 1, padding: '10px 4px', border: 0, borderRadius: 100,
                background: act ? 'linear-gradient(135deg,#c0392b,#e74c3c)' : 'transparent',
                color: act ? '#fff' : 'var(--ce-fg-3)',
                font: `400 14px var(--font-bebas)`, letterSpacing: '.08em',
                boxShadow: act ? '0 4px 14px rgba(192,57,43,.35)' : 'none',
                transition: 'all .25s var(--ce-ease-spring)',
              }}>{z === 'GEN' ? 'GENERAL' : `ZONA ${z}`}</button>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, padding: '0 16px 10px', font: '700 8px Inter', letterSpacing: '.15em', color: 'var(--ce-fg-4)', textTransform: 'uppercase' }}>
        <span><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#f5c518', marginRight: 4, verticalAlign: 'middle' }}/>Clasifica</span>
        <span>Top 2 de cada zona pasa a semis</span>
      </div>

      <div style={{ padding: '0 12px' }}>
        <div className="glass" style={{ borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--ce-border)' }}>
                {['#', 'EQUIPO', 'PTS', 'PJ', 'G', 'E', 'P', '+/-'].map((h, i) => (
                  <th key={i} style={{
                    padding: i === 1 ? '10px 6px' : '10px 3px', fontFamily: 'Inter', fontSize: 9, fontWeight: 800,
                    letterSpacing: '.15em', textTransform: 'uppercase',
                    color: i === 2 ? 'rgba(245,197,24,.8)' : 'var(--ce-fg-4)',
                    textAlign: i === 1 ? 'left' : 'center', background: 'var(--ce-bg-3)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>{data.map((s, i) => <Row key={s.n + i} s={s} pos={i + 1} i={i}/>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
