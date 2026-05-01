'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getStandings } from '@/lib/supabase'
import type { Standing } from '@/lib/types'

const TOURNAMENT_ID = '11111111-1111-1111-1111-111111111111'

const ZONES = ['A', 'B', 'C', 'GEN'] as const
type ZoneTab = (typeof ZONES)[number]

const POS_STYLE: Record<number, { color: string; shadow: string; label: string }> = {
  1: { color: '#5ffbff', shadow: '0 0 12px rgba(0,240,255,0.7)', label: '1°' },
  2: { color: '#00f0ff', shadow: '0 0 8px rgba(0,240,255,0.45)', label: '2°' },
  3: { color: '#00b8cc', shadow: '0 0 8px rgba(0,184,204,0.45)', label: '3°' },
}

function TeamRow({ s, pos, delay }: { s: Standing; pos: number; delay: number }) {
  const router = useRouter()
  const posStyle = POS_STYLE[pos]
  const isTop3 = pos <= 3
  const isClassified = pos <= 2

  return (
    <tr
      className="team-row tap"
      onClick={() => router.push(`/equipo?id=${s.team_id}`)}
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        animationDelay: `${delay}ms`,
        borderLeft: isClassified ? '2px solid rgba(0,240,255,0.3)' : '2px solid transparent',
        cursor: 'pointer',
      }}
    >
      {/* # */}
      <td style={{ width: 36, padding: '10px 6px 10px 12px', textAlign: 'center' }}>
        <span style={posStyle
          ? { fontSize: 13, fontWeight: 900, color: posStyle.color, textShadow: posStyle.shadow }
          : { fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.2)' }
        }>
          {pos}
        </span>
      </td>

      {/* Team */}
      <td style={{ padding: '8px 6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 130 }}>
          {/* Badge */}
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 900, letterSpacing: '0.05em',
            color: isTop3 ? '#00f0ff' : 'rgba(255,255,255,0.3)',
            background: isTop3
              ? 'linear-gradient(135deg, rgba(0,184,204,0.3), rgba(0,240,255,0.12))'
              : 'rgba(255,255,255,0.04)',
            border: isTop3
              ? '1px solid rgba(0,240,255,0.25)'
              : '1px solid rgba(255,255,255,0.06)',
            boxShadow: isTop3 ? '0 0 12px rgba(0,240,255,0.12)' : 'none',
          }}>
            {s.name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()}
          </div>

          {/* Name + scorer */}
          <div style={{ minWidth: 0 }}>
            <p className="font-display" style={{
              fontSize: 14, lineHeight: 1.1, letterSpacing: '0.04em',
              color: isTop3 ? '#ffffff' : 'rgba(255,255,255,0.65)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              maxWidth: 120,
            }}>
              {s.name}
            </p>
          </div>
        </div>
      </td>

      {/* PTS */}
      <td style={{ padding: '10px 6px', textAlign: 'center', width: 38 }}>
        <span style={isClassified
          ? { fontSize: 16, fontWeight: 900, color: '#00f0ff', textShadow: '0 0 15px rgba(0,240,255,0.55)' }
          : { fontSize: 15, fontWeight: 900, color: '#ffffff' }
        }>
          {s.points}
        </span>
      </td>

      {/* PJ */}
      <td style={{ padding: '10px 4px', textAlign: 'center', width: 28 }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>{s.played}</span>
      </td>

      {/* G */}
      <td style={{ padding: '10px 3px', textAlign: 'center', width: 24 }}>
        <span style={{ fontSize: 11, color: 'rgba(74,180,74,0.8)', fontWeight: 700 }}>{s.won}</span>
      </td>

      {/* E */}
      <td style={{ padding: '10px 3px', textAlign: 'center', width: 24 }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>{s.drawn}</span>
      </td>

      {/* P */}
      <td style={{ padding: '10px 3px', textAlign: 'center', width: 24 }}>
        <span style={{ fontSize: 11, color: 'rgba(200,60,60,0.8)', fontWeight: 700 }}>{s.lost}</span>
      </td>

      {/* +/- */}
      <td style={{ padding: '10px 6px', textAlign: 'center', width: 32 }}>
        <span style={{
          fontSize: 11, fontWeight: 800,
          color: s.goal_diff > 0 ? 'rgba(74,200,74,0.9)' : s.goal_diff < 0 ? 'rgba(200,74,74,0.9)' : 'rgba(255,255,255,0.2)',
        }}>
          {s.goal_diff > 0 ? `+${s.goal_diff}` : s.goal_diff}
        </span>
      </td>

    </tr>
  )
}

function SkeletonRows() {
  return (
    <>
      {[...Array(8)].map((_, i) => (
        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
          <td colSpan={9} style={{ padding: '8px 12px' }}>
            <div className="shimmer" style={{ height: 14, borderRadius: 6, opacity: 1 - i * 0.1 }} />
          </td>
        </tr>
      ))}
    </>
  )
}

export default function ZoneStandings() {
  const [activeZone, setActiveZone] = useState<ZoneTab>('A')
  const [standings, setStandings] = useState<Standing[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getStandings(TOURNAMENT_ID, activeZone === 'GEN' ? undefined : activeZone)
      setStandings(data)
    } finally {
      setLoading(false)
    }
  }, [activeZone])

  useEffect(() => {
    load()
    const ch = supabase
      .channel('standings-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goals' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [load])

  return (
    <div>
      {/* Zone Tabs */}
      <div
        className="glass-strong"
        style={{
          position: 'sticky', top: 0, zIndex: 30,
          display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {ZONES.map((z) => {
          const active = activeZone === z
          return (
            <button
              key={z}
              onClick={() => setActiveZone(z)}
              style={{
                flex: 1, padding: '14px 4px', border: 'none', background: 'none',
                cursor: 'pointer', position: 'relative',
                fontFamily: 'var(--font-bebas, system-ui)',
                fontSize: 16, letterSpacing: '0.08em',
                color: active ? '#00f0ff' : 'rgba(255,255,255,0.2)',
                transition: 'color 0.2s ease',
              }}
            >
              {active && (
                <>
                  <span style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(180deg, rgba(0,240,255,0.06) 0%, transparent 100%)',
                  }} />
                  <span
                    className="tab-line"
                    style={{
                      position: 'absolute', bottom: -1, left: '50%', transform: 'translateX(-50%)',
                      height: 2, borderRadius: '2px 2px 0 0',
                      background: 'linear-gradient(90deg, #00b8cc, #00f0ff)',
                    boxShadow: '0 0 8px rgba(0,240,255,0.5)',
                    }}
                  />
                </>
              )}
              <span style={{ position: 'relative' }}>
                {z === 'GEN' ? 'GENERAL' : `ZONA ${z}`}
              </span>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="scroll-x">
        <table style={{ width: '100%', minWidth: 490, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['#','EQUIPO','PTS','PJ','G','E','P','+/-'].map((h, i) => (
                <th key={i} style={{
                  padding: i === 1 ? '8px 6px' : '8px 4px',
                  fontSize: 9, fontWeight: 800, letterSpacing: '0.15em',
                  color: i === 2 ? 'rgba(0,240,255,0.7)' : 'rgba(255,255,255,0.15)',
                  textAlign: i === 1 ? 'left' : 'center',
                  background: 'rgba(255,255,255,0.02)',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? <SkeletonRows />
              : standings.length === 0
              ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.15)', fontSize: 13 }}>
                    Sin datos aún
                  </td>
                </tr>
              )
              : standings.map((s, i) => (
                <TeamRow key={s.team_id} s={s} pos={i + 1} delay={i * 40} />
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: '10px 16px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'inline-block', width: 2, height: 14, borderRadius: 2, background: 'linear-gradient(180deg, #00f0ff, #c0392b)' }} />
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Clasificado
          </span>
        </div>
      </div>
    </div>
  )
}
