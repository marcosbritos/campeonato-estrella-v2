'use client'
import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import { getTopScorers } from '@/lib/supabase'
import type { TopScorer } from '@/lib/types'

const MEDAL = ['🥇', '🥈', '🥉']

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
      <div className="px-4 pt-4">
        <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">
          Tabla de Goleadores
        </h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-[#f5c518] border-t-transparent animate-spin" />
          </div>
        ) : scorers.length === 0 ? (
          <div className="text-center py-12 text-gray-600 text-sm">No hay goles registrados aún</div>
        ) : (
          <div className="space-y-2">
            {scorers.map((s, i) => (
              <div
                key={s.player_id}
                className="flex items-center gap-3 bg-[#141414] border border-[#1e1e1e] rounded-xl px-4 py-3"
              >
                <span className="text-lg w-7 text-center">
                  {i < 3 ? MEDAL[i] : <span className="text-sm text-gray-600 font-bold">{i + 1}</span>}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white truncate">{s.player_name}</p>
                  <p className="text-[10px] text-gray-500 truncate">
                    {s.team_name} · Zona {s.zone}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xl font-black text-[#f5c518]">{s.goals}</span>
                  <span className="text-xs text-gray-600">⚽</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
