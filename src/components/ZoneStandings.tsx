'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase, getStandings } from '@/lib/supabase'
import type { Standing } from '@/lib/types'

const ZONES = ['A', 'B', 'C', 'GEN'] as const
type ZoneTab = (typeof ZONES)[number]

function TeamInitial({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  return (
    <div className="w-7 h-7 rounded-full bg-[#222] border border-[#333] flex items-center justify-center text-[9px] font-black text-[#f5c518] flex-shrink-0">
      {initials}
    </div>
  )
}

function StandingRow({ s, pos, highlight }: { s: Standing; pos: number; highlight?: boolean }) {
  const isTop3 = pos <= 3
  return (
    <tr
      className={`border-b border-[#1a1a1a] ${
        highlight ? 'bg-[#1a1500]' : pos % 2 === 0 ? 'bg-[#0f0f0f]' : 'bg-[#0a0a0a]'
      }`}
    >
      {/* Pos */}
      <td className="px-2 py-2.5 text-center">
        <span
          className={`text-xs font-black ${
            pos === 1 ? 'text-[#f5c518]' : pos === 2 ? 'text-gray-300' : pos === 3 ? 'text-amber-600' : 'text-gray-500'
          }`}
        >
          {pos}
        </span>
      </td>

      {/* Team */}
      <td className="px-2 py-2.5">
        <div className="flex items-center gap-2 min-w-[130px]">
          <TeamInitial name={s.name} />
          <span className={`text-xs font-bold leading-tight ${isTop3 ? 'text-white' : 'text-gray-300'}`}>
            {s.name}
          </span>
        </div>
      </td>

      {/* PTS */}
      <td className="px-2 py-2.5 text-center">
        <span className="text-sm font-black text-white">{s.points}</span>
      </td>

      {/* PJ */}
      <td className="px-1.5 py-2.5 text-center text-xs text-gray-400">{s.played}</td>

      {/* G */}
      <td className="px-1.5 py-2.5 text-center text-xs text-green-400">{s.won}</td>

      {/* E */}
      <td className="px-1.5 py-2.5 text-center text-xs text-gray-400">{s.drawn}</td>

      {/* P */}
      <td className="px-1.5 py-2.5 text-center text-xs text-red-400">{s.lost}</td>

      {/* +/- */}
      <td className="px-1.5 py-2.5 text-center text-xs font-semibold">
        <span className={s.goal_diff > 0 ? 'text-green-400' : s.goal_diff < 0 ? 'text-red-400' : 'text-gray-400'}>
          {s.goal_diff > 0 ? `+${s.goal_diff}` : s.goal_diff}
        </span>
      </td>

      {/* Goleador */}
      <td className="px-2 py-2.5 text-[10px] text-gray-400 max-w-[90px]">
        <span className="truncate block">{s.top_scorer ?? '—'}</span>
      </td>

      {/* Tarjetas */}
      <td className="px-2 py-2.5 text-center text-[10px] whitespace-nowrap">
        {s.yellow_cards > 0 && (
          <span className="inline-flex items-center gap-0.5">
            <span className="inline-block w-2.5 h-3.5 bg-[#f5c518] rounded-sm" />
            <span className="text-gray-400">{s.yellow_cards}</span>
          </span>
        )}
        {s.yellow_cards > 0 && s.red_cards > 0 && <span className="mx-0.5 text-gray-600">/</span>}
        {s.red_cards > 0 && (
          <span className="inline-flex items-center gap-0.5">
            <span className="inline-block w-2.5 h-3.5 bg-red-600 rounded-sm" />
            <span className="text-gray-400">{s.red_cards}</span>
          </span>
        )}
        {s.yellow_cards === 0 && s.red_cards === 0 && <span className="text-gray-700">—</span>}
      </td>
    </tr>
  )
}

function TableHeader() {
  return (
    <thead>
      <tr className="border-b border-[#222]">
        <th className="px-2 py-2 text-[10px] text-gray-600 font-semibold text-center">#</th>
        <th className="px-2 py-2 text-[10px] text-gray-600 font-semibold text-left">EQUIPO</th>
        <th className="px-2 py-2 text-[10px] text-[#f5c518] font-black text-center">PTS</th>
        <th className="px-1.5 py-2 text-[10px] text-gray-600 font-semibold text-center">PJ</th>
        <th className="px-1.5 py-2 text-[10px] text-gray-600 font-semibold text-center">G</th>
        <th className="px-1.5 py-2 text-[10px] text-gray-600 font-semibold text-center">E</th>
        <th className="px-1.5 py-2 text-[10px] text-gray-600 font-semibold text-center">P</th>
        <th className="px-1.5 py-2 text-[10px] text-gray-600 font-semibold text-center">+/-</th>
        <th className="px-2 py-2 text-[10px] text-gray-600 font-semibold text-left">GOLEADOR</th>
        <th className="px-2 py-2 text-[10px] text-gray-600 font-semibold text-center">TARJ.</th>
      </tr>
    </thead>
  )
}

export default function ZoneStandings() {
  const [activeZone, setActiveZone] = useState<ZoneTab>('A')
  const [standings, setStandings] = useState<Standing[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const zone = activeZone === 'GEN' ? undefined : activeZone
      const data = await getStandings(zone)
      setStandings(data)
    } finally {
      setLoading(false)
    }
  }, [activeZone])

  useEffect(() => {
    load()
    // Realtime subscription
    const channel = supabase
      .channel('standings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goals' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])

  return (
    <div>
      {/* Zone tabs */}
      <div className="flex border-b border-[#1e1e1e] bg-[#0a0a0a] sticky top-[61px] z-30">
        {ZONES.map((z) => (
          <button
            key={z}
            onClick={() => setActiveZone(z)}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-colors ${
              activeZone === z
                ? 'text-[#f5c518] border-b-2 border-[#f5c518]'
                : 'text-gray-500 border-b-2 border-transparent'
            }`}
          >
            {z === 'GEN' ? 'General' : `Zona ${z}`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-[#f5c518] border-t-transparent animate-spin" />
          </div>
        ) : standings.length === 0 ? (
          <div className="text-center py-12 text-gray-600 text-sm">Sin datos aún</div>
        ) : (
          <table className="w-full min-w-[580px]">
            <TableHeader />
            <tbody>
              {standings.map((s, i) => (
                <StandingRow key={s.team_id} s={s} pos={i + 1} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-4 px-4 py-3 text-[10px] text-gray-600 border-t border-[#1a1a1a]">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-green-900" /> Clasificado
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-3.5 rounded-sm bg-[#f5c518]" /> Amarilla
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-3.5 rounded-sm bg-red-600" /> Roja
        </span>
      </div>
    </div>
  )
}
