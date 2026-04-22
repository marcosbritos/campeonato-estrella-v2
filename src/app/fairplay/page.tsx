'use client'
import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import { getFairPlay } from '@/lib/supabase'
import type { FairPlayEntry } from '@/lib/types'

export default function FairPlayPage() {
  const [data, setData] = useState<FairPlayEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFairPlay()
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  return (
    <main>
      <Header />
      <div className="px-4 pt-4">
        <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">
          Fair Play
        </h2>
        <p className="text-[10px] text-gray-600 mb-4">Menor puntaje = mejor Fair Play (🟨 = 1pt · 🟥 = 3pts)</p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-[#f5c518] border-t-transparent animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-12 text-gray-600 text-sm">Sin tarjetas registradas aún</div>
        ) : (
          <div className="overflow-x-auto table-container rounded-xl border border-[#1e1e1e]">
            <table className="w-full min-w-[360px]">
              <thead>
                <tr className="border-b border-[#222] bg-[#111]">
                  <th className="px-3 py-2.5 text-[10px] text-gray-600 font-semibold text-left">#</th>
                  <th className="px-3 py-2.5 text-[10px] text-gray-600 font-semibold text-left">EQUIPO</th>
                  <th className="px-3 py-2.5 text-[10px] text-gray-600 font-semibold text-center">ZONA</th>
                  <th className="px-3 py-2.5 text-[10px] text-[#f5c518] font-black text-center">🟨</th>
                  <th className="px-3 py-2.5 text-[10px] text-red-400 font-black text-center">🟥</th>
                  <th className="px-3 py-2.5 text-[10px] text-gray-600 font-semibold text-center">PTS</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr
                    key={row.team_id}
                    className={`border-b border-[#1a1a1a] ${i % 2 === 0 ? 'bg-[#0f0f0f]' : 'bg-[#0a0a0a]'}`}
                  >
                    <td className="px-3 py-3 text-xs text-gray-500 font-bold">{i + 1}</td>
                    <td className="px-3 py-3 text-xs font-bold text-white">{row.team_name}</td>
                    <td className="px-3 py-3 text-xs text-gray-400 text-center">{row.zone}</td>
                    <td className="px-3 py-3 text-xs font-black text-[#f5c518] text-center">{row.yellow_cards}</td>
                    <td className="px-3 py-3 text-xs font-black text-red-500 text-center">{row.red_cards}</td>
                    <td className="px-3 py-3 text-xs font-black text-white text-center">{row.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
