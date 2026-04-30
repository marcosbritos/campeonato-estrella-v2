'use client'

import { useEffect, useState } from 'react'
import { 
  supabase, 
  getMatches, 
  getPlayers, 
  getMatchRoster,
  upsertMatchRoster,
  updateMatchStatus,
  addGoal,
  addCard,
  removeGoal,
  removeCard
} from '@/lib/supabase'
import type { Match, Player, MatchRoster, Goal, Card } from '@/lib/types'
import StarLogo from '@/components/StarLogo'
import TeamLogo from '@/components/TeamLogo'

const TOURNAMENT_ID = '11111111-1111-1111-1111-111111111111'
const ADMIN_PIN = '2204'

type AppState = 'login' | 'dashboard' | 'pre-match' | 'post-match'

export default function PanelAdminPage() {
  const [state, setState] = useState<AppState>('login')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  
  const [matches, setMatches] = useState<Match[]>([])
  const [activeMatch, setActiveMatch] = useState<Match | null>(null)

  // Pre-match states
  const [homePlayers, setHomePlayers] = useState<Player[]>([])
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([])
  const [homeRoster, setHomeRoster] = useState<{player_id: string, shirt_number: string}[]>([])
  const [awayRoster, setAwayRoster] = useState<{player_id: string, shirt_number: string}[]>([])

  // Post-match states
  const [goals, setGoals] = useState<Goal[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [observations, setObservations] = useState('')
  const [homeScore, setHomeScore] = useState(0)
  const [awayScore, setAwayScore] = useState(0)

  // Modals
  const [actionModal, setActionModal] = useState<{type: 'goal'|'yellow'|'red', teamId: string} | null>(null)

  useEffect(() => {
    if (state === 'dashboard') {
      loadMatches()
    }
  }, [state])

  async function loadMatches() {
    setLoading(true)
    try {
      const data = await getMatches(TOURNAMENT_ID)
      setMatches(data)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin() {
    if (pin === ADMIN_PIN) setState('dashboard')
    else alert('PIN Incorrecto')
  }

  async function openMatch(m: Match) {
    setLoading(true)
    setActiveMatch(m)
    
    if (m.status === 'pending') {
      const hp = await getPlayers(m.home_team_id)
      const ap = await getPlayers(m.away_team_id)
      setHomePlayers(hp)
      setAwayPlayers(ap)
      setHomeRoster([])
      setAwayRoster([])
      setState('pre-match')
    } else if (m.status === 'live' || m.status === 'finished') {
      const hr = await getMatchRoster(m.id, m.home_team_id)
      const ar = await getMatchRoster(m.id, m.away_team_id)
      
      const [goalsRes, cardsRes] = await Promise.all([
        supabase.from('goals').select('*, roster:match_rosters(*, player:players(*))').eq('match_id', m.id),
        supabase.from('cards').select('*, roster:match_rosters(*, player:players(*))').eq('match_id', m.id)
      ])
      
      setHomeScore(m.home_score)
      setAwayScore(m.away_score)
      setObservations(m.observations || '')
      setGoals(goalsRes.data || [])
      setCards(cardsRes.data || [])
      
      // Store rosters in state so we can select them in modals
      setHomeRoster(hr.map(r => ({ player_id: r.player_id, shirt_number: r.shirt_number.toString(), roster_id: r.id } as any)))
      setAwayRoster(ar.map(r => ({ player_id: r.player_id, shirt_number: r.shirt_number.toString(), roster_id: r.id } as any)))
      
      setState('post-match')
    }
    setLoading(false)
  }

  async function startMatch() {
    if (!activeMatch) return
    setLoading(true)
    
    const cleanHome = homeRoster.filter(r => r.shirt_number !== '').map(r => ({...r, shirt_number: parseInt(r.shirt_number)}))
    const cleanAway = awayRoster.filter(r => r.shirt_number !== '').map(r => ({...r, shirt_number: parseInt(r.shirt_number)}))
    
    await upsertMatchRoster(activeMatch.id, activeMatch.home_team_id, cleanHome)
    await upsertMatchRoster(activeMatch.id, activeMatch.away_team_id, cleanAway)
    await updateMatchStatus(activeMatch.id, 'live', 0, 0)
    
    // Switch to post-match mode
    setActiveMatch({...activeMatch, status: 'live'})
    
    // Reload rosters to get their IDs
    const hr = await getMatchRoster(activeMatch.id, activeMatch.home_team_id)
    const ar = await getMatchRoster(activeMatch.id, activeMatch.away_team_id)
    setHomeRoster(hr.map(r => ({ player_id: r.player_id, shirt_number: r.shirt_number.toString(), roster_id: r.id } as any)))
    setAwayRoster(ar.map(r => ({ player_id: r.player_id, shirt_number: r.shirt_number.toString(), roster_id: r.id } as any)))
    
    setState('post-match')
    setLoading(false)
  }

  async function handleEvent(rosterId: string, minute: string) {
    if (!activeMatch || !actionModal) return
    setLoading(true)
    
    try {
      if (actionModal.type === 'goal') {
        await addGoal(activeMatch.id, actionModal.teamId, null, rosterId || null, minute ? parseInt(minute) : null)
        const isHome = actionModal.teamId === activeMatch.home_team_id
        if (isHome) setHomeScore(s => s + 1)
        else setAwayScore(s => s + 1)
      } else {
        await addCard(activeMatch.id, actionModal.teamId, null, rosterId || null, actionModal.type, minute ? parseInt(minute) : null)
      }
      
      // Refresh events
      const [goalsRes, cardsRes] = await Promise.all([
        supabase.from('goals').select('*, roster:match_rosters(*, player:players(*))').eq('match_id', activeMatch.id),
        supabase.from('cards').select('*, roster:match_rosters(*, player:players(*))').eq('match_id', activeMatch.id)
      ])
      setGoals(goalsRes.data || [])
      setCards(cardsRes.data || [])
      setActionModal(null)
    } finally {
      setLoading(false)
    }
  }

  async function finishMatch() {
    if (!activeMatch) return
    if (!confirm('¿Seguro que quieres finalizar el partido? Los puntos irán a la tabla general.')) return
    
    setLoading(true)
    await updateMatchStatus(activeMatch.id, 'finished', homeScore, awayScore, observations)
    setActiveMatch({...activeMatch, status: 'finished'})
    setState('dashboard')
    setLoading(false)
  }

  // --- RENDERERS ---

  if (state === 'login') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 gap-6">
        <StarLogo size={80} />
        <h1 className="text-2xl font-black text-white">Panel Administrativo</h1>
        <input 
          type="password" 
          value={pin} onChange={e => setPin(e.target.value)} 
          placeholder="PIN"
          inputMode="numeric"
          className="w-full max-w-[250px] bg-[#141414] border border-[#222] rounded-2xl py-5 text-center text-3xl text-white font-black tracking-[0.3em] outline-none focus:border-[#00f0ff]"
        />
        <button 
          onClick={handleLogin}
          className="w-full max-w-[250px] bg-gradient-to-r from-[#00f0ff] to-[#00b8cc] text-black font-black text-lg py-5 rounded-2xl tap shadow-[0_0_20px_rgba(0,240,255,0.4)]"
        >
          INGRESAR
        </button>
      </div>
    )
  }

  if (state === 'dashboard') {
    return (
      <div className="p-4 pb-20">
        <h1 className="text-2xl font-black text-white mb-6 pt-4 px-2">Partidos del Día</h1>
        <div className="flex flex-col gap-4">
          {matches.map(m => (
            <div key={m.id} onClick={() => openMatch(m)} className="glass-2 rounded-2xl p-5 tap">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[11px] font-black uppercase text-[#00f0ff] tracking-widest">Zona {m.zone}</span>
                {m.status === 'live' && <span className="text-[11px] font-black uppercase text-[#ff3366] flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#ff3366] animate-pulse"/> En Juego</span>}
                {m.status === 'finished' && <span className="text-[11px] font-black uppercase text-gray-500">Finalizado</span>}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col items-center gap-2 w-[40%]">
                  <TeamLogo url={m.home_team?.logo_url} name={m.home_team?.name || ''} size={48} />
                  <span className="text-sm font-bold text-center leading-tight">{m.home_team?.name}</span>
                </div>
                <span className="text-gray-500 font-light text-xl">vs</span>
                <div className="flex flex-col items-center gap-2 w-[40%]">
                  <TeamLogo url={m.away_team?.logo_url} name={m.away_team?.name || ''} size={48} />
                  <span className="text-sm font-bold text-center leading-tight">{m.away_team?.name}</span>
                </div>
              </div>
              {m.status === 'finished' && (
                <div className="mt-3 text-center border-t border-[#222] pt-3">
                  <span className="text-lg font-black text-white">{m.home_score} - {m.away_score}</span>
                </div>
              )}
            </div>
          ))}
          {matches.length === 0 && !loading && (
             <p className="text-center text-gray-500 mt-10">No hay partidos pendientes</p>
          )}
        </div>
      </div>
    )
  }

  if (state === 'pre-match' && activeMatch) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0a0a0a]">
        <div className="p-5 border-b border-[#222] sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md z-10">
          <h2 className="text-lg font-black text-white">Armar Planilla</h2>
          <p className="text-xs text-[#00f0ff] uppercase tracking-widest mt-1">Paso 1: Asignar Dorsales</p>
        </div>
        
        <div className="p-4 flex-1">
          {/* Home Team */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <TeamLogo url={activeMatch.home_team?.logo_url} name={activeMatch.home_team?.name || ''} size={40} />
              <h3 className="font-black text-lg">{activeMatch.home_team?.name}</h3>
            </div>
            <div className="flex flex-col gap-2">
              {homePlayers.map(p => {
                const r = homeRoster.find(x => x.player_id === p.id)
                return (
                  <div key={p.id} className="flex items-center justify-between bg-[#141414] p-3 rounded-xl border border-[#222]">
                    <span className="text-sm font-bold">{p.first_name} {p.last_name}</span>
                    <select 
                      value={r?.shirt_number || ''}
                      onChange={(e) => {
                        const val = e.target.value
                        setHomeRoster(prev => {
                          const rest = prev.filter(x => x.player_id !== p.id)
                          if (!val) return rest
                          return [...rest, { player_id: p.id, shirt_number: val }]
                        })
                      }}
                      className="bg-[#222] border-none text-white text-lg font-black rounded-lg px-3 py-2 w-[80px] text-center outline-none focus:ring-2 ring-[#00f0ff]"
                    >
                      <option value="">-</option>
                      {Array.from({length: 99}, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Away Team */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <TeamLogo url={activeMatch.away_team?.logo_url} name={activeMatch.away_team?.name || ''} size={40} />
              <h3 className="font-black text-lg">{activeMatch.away_team?.name}</h3>
            </div>
            <div className="flex flex-col gap-2">
              {awayPlayers.map(p => {
                const r = awayRoster.find(x => x.player_id === p.id)
                return (
                  <div key={p.id} className="flex items-center justify-between bg-[#141414] p-3 rounded-xl border border-[#222]">
                    <span className="text-sm font-bold">{p.first_name} {p.last_name}</span>
                    <select 
                      value={r?.shirt_number || ''}
                      onChange={(e) => {
                        const val = e.target.value
                        setAwayRoster(prev => {
                          const rest = prev.filter(x => x.player_id !== p.id)
                          if (!val) return rest
                          return [...rest, { player_id: p.id, shirt_number: val }]
                        })
                      }}
                      className="bg-[#222] border-none text-white text-lg font-black rounded-lg px-3 py-2 w-[80px] text-center outline-none focus:ring-2 ring-[#00f0ff]"
                    >
                      <option value="">-</option>
                      {Array.from({length: 99}, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="p-4 sticky bottom-0 bg-[#0a0a0a]/90 backdrop-blur-md border-t border-[#222]">
          <button 
            onClick={startMatch}
            disabled={loading}
            className="w-full bg-[#00f0ff] text-black font-black text-lg py-5 rounded-2xl tap shadow-[0_0_20px_rgba(0,240,255,0.4)]"
          >
            {loading ? 'GUARDANDO...' : 'COMENZAR PARTIDO'}
          </button>
        </div>
      </div>
    )
  }

  if (state === 'post-match' && activeMatch) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0a0a0a]">
        
        {/* ACTION MODAL (Goal / Card) */}
        {actionModal && (
          <div className="fixed inset-0 bg-black/90 z-50 flex flex-col p-4 animate-in fade-in slide-in-from-bottom-8">
            <div className="flex justify-between items-center mb-6 pt-4">
              <h2 className="text-2xl font-black text-white">
                {actionModal.type === 'goal' ? '⚽ GOL' : actionModal.type === 'yellow' ? '🟨 AMARILLA' : '🟥 ROJA'}
              </h2>
              <button onClick={() => setActionModal(null)} className="text-gray-500 text-3xl font-light">✕</button>
            </div>
            
            <p className="text-[#00f0ff] text-xs font-black uppercase tracking-widest mb-2">1. Seleccionar Jugador</p>
            <select 
              id="player-select"
              className="bg-[#141414] border border-[#222] text-white text-lg font-bold rounded-2xl p-4 w-full mb-6 outline-none focus:border-[#00f0ff]"
            >
              <option value="">Sin identificar / Gol en contra</option>
              {(actionModal.teamId === activeMatch.home_team_id ? homeRoster : awayRoster).map((r: any) => (
                <option key={r.roster_id} value={r.roster_id}>#{r.shirt_number} - {(homePlayers.find(p => p.id === r.player_id) || awayPlayers.find(p => p.id === r.player_id))?.last_name}</option>
              ))}
            </select>

            <p className="text-[#00f0ff] text-xs font-black uppercase tracking-widest mb-2">2. Minuto (Opcional)</p>
            <input 
              id="minute-input"
              type="number" 
              placeholder="Ej: 23"
              className="bg-[#141414] border border-[#222] text-white text-xl font-bold rounded-2xl p-4 w-full mb-8 outline-none focus:border-[#00f0ff]"
            />

            <button 
              onClick={() => {
                const p = (document.getElementById('player-select') as HTMLSelectElement).value;
                const m = (document.getElementById('minute-input') as HTMLInputElement).value;
                handleEvent(p, m);
              }}
              className="w-full bg-[#00f0ff] text-black font-black text-xl py-5 rounded-2xl tap shadow-[0_0_20px_rgba(0,240,255,0.4)] mt-auto mb-4"
            >
              CONFIRMAR
            </button>
          </div>
        )}

        {/* Post Match View */}
        <div className="p-5 border-b border-[#222] bg-[#141414]">
          <h2 className="text-center text-[#00f0ff] text-[11px] font-black uppercase tracking-widest mb-4">Planilla de Juego</h2>
          <div className="flex justify-between items-center px-2">
            <div className="flex flex-col items-center gap-2 w-1/3">
              <TeamLogo url={activeMatch.home_team?.logo_url} name={activeMatch.home_team?.name || ''} size={50} />
              <span className="text-xs font-bold text-center line-clamp-2">{activeMatch.home_team?.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-5xl font-black text-white">{homeScore}</span>
              <span className="text-gray-600 text-2xl">-</span>
              <span className="text-5xl font-black text-white">{awayScore}</span>
            </div>
            <div className="flex flex-col items-center gap-2 w-1/3">
              <TeamLogo url={activeMatch.away_team?.logo_url} name={activeMatch.away_team?.name || ''} size={50} />
              <span className="text-xs font-bold text-center line-clamp-2">{activeMatch.away_team?.name}</span>
            </div>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-6">
          {/* Action Buttons HOME */}
          {activeMatch.status === 'live' && (
            <div>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <TeamLogo url={activeMatch.home_team?.logo_url} name={activeMatch.home_team?.name || ''} size={20} />
              {activeMatch.home_team?.name}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => setActionModal({type: 'goal', teamId: activeMatch.home_team_id})} className="bg-[#141414] border border-[#222] rounded-2xl py-6 flex flex-col items-center gap-2 tap">
                <span className="text-3xl">⚽</span><span className="text-[10px] font-black text-white uppercase">GOL</span>
              </button>
              <button onClick={() => setActionModal({type: 'yellow', teamId: activeMatch.home_team_id})} className="bg-[#141414] border border-[#222] rounded-2xl py-6 flex flex-col items-center gap-2 tap">
                <span className="text-3xl">🟨</span><span className="text-[10px] font-black text-white uppercase">AMARILLA</span>
              </button>
              <button onClick={() => setActionModal({type: 'red', teamId: activeMatch.home_team_id})} className="bg-[#141414] border border-[#222] rounded-2xl py-6 flex flex-col items-center gap-2 tap">
                <span className="text-3xl">🟥</span><span className="text-[10px] font-black text-white uppercase">ROJA</span>
              </button>
            </div>
          </div>
          )}

          {/* Action Buttons AWAY */}
          {activeMatch.status === 'live' && (
            <div>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <TeamLogo url={activeMatch.away_team?.logo_url} name={activeMatch.away_team?.name || ''} size={20} />
              {activeMatch.away_team?.name}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => setActionModal({type: 'goal', teamId: activeMatch.away_team_id})} className="bg-[#141414] border border-[#222] rounded-2xl py-6 flex flex-col items-center gap-2 tap">
                <span className="text-3xl">⚽</span><span className="text-[10px] font-black text-white uppercase">GOL</span>
              </button>
              <button onClick={() => setActionModal({type: 'yellow', teamId: activeMatch.away_team_id})} className="bg-[#141414] border border-[#222] rounded-2xl py-6 flex flex-col items-center gap-2 tap">
                <span className="text-3xl">🟨</span><span className="text-[10px] font-black text-white uppercase">AMARILLA</span>
              </button>
              <button onClick={() => setActionModal({type: 'red', teamId: activeMatch.away_team_id})} className="bg-[#141414] border border-[#222] rounded-2xl py-6 flex flex-col items-center gap-2 tap">
                <span className="text-3xl">🟥</span><span className="text-[10px] font-black text-white uppercase">ROJA</span>
              </button>
            </div>
          </div>
          )}

          {/* Events Log */}
          {(goals.length > 0 || cards.length > 0) && (
            <div className="bg-[#141414] border border-[#222] rounded-2xl p-4">
              <h3 className="text-[10px] font-black text-[#00f0ff] uppercase tracking-widest mb-3">Eventos Cargados</h3>
              <div className="flex flex-col gap-3">
                {goals.map(g => (
                  <div key={g.id} className="flex justify-between items-center text-sm font-bold text-white bg-black/40 p-3 rounded-lg">
                    <span>⚽ {(g.roster?.player as any)?.last_name || 'Desconocido'} {g.minute && `(${g.minute}')`}</span>
                    {activeMatch.status === 'live' && (
                      <button onClick={async () => { await removeGoal(g.id); setGoals(gs => gs.filter(x=>x.id!==g.id)); if(g.team_id===activeMatch.home_team_id) setHomeScore(s=>s-1); else setAwayScore(s=>s-1); }} className="text-red-500 px-3 tap">✕</button>
                    )}
                  </div>
                ))}
                {/* Tarjetas agrupadas */}
                {(() => {
                  const grouped: any[] = []
                  const playerYellows: Record<string, any[]> = {}
                  
                  const sorted = [...cards].sort((a,b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
                  
                  sorted.forEach(c => {
                    const rId = c.roster_id || 'unknown'
                    if (c.card_type === 'yellow') {
                      if (!playerYellows[rId]) playerYellows[rId] = []
                      playerYellows[rId].push(c)
                      
                      if (playerYellows[rId].length === 2) {
                        grouped.push({ ...c, isSecondYellow: true })
                      } else {
                        grouped.push({ ...c, isSecondYellow: false })
                      }
                    } else {
                      if (playerYellows[rId] && playerYellows[rId].length >= 2) {
                        const sy = grouped.find(g => g.isSecondYellow && g.roster_id === c.roster_id)
                        if (sy) {
                          sy.associatedRedId = c.id
                        } else {
                          grouped.push({ ...c, isSecondYellow: false })
                        }
                      } else {
                        grouped.push({ ...c, isSecondYellow: false })
                      }
                    }
                  })

                  return grouped.map(c => (
                    <div key={c.id} className="flex justify-between items-center text-sm font-bold text-white bg-black/40 p-3 rounded-lg">
                      <span>
                        {c.isSecondYellow ? (
                          <span className="flex items-center gap-1.5"><span className="text-lg">🟨</span><span className="text-gray-500 text-xs font-black">➔</span><span className="text-lg">🟥</span></span>
                        ) : (
                          <span className="text-lg">{c.card_type === 'yellow' ? '🟨' : '🟥'}</span>
                        )}
                        {' '} {(c.roster?.player as any)?.last_name || 'Desconocido'} {c.minute ? `(${c.minute}')` : ''}
                      </span>
                      {activeMatch.status === 'live' && (
                        <button onClick={async () => { 
                          await removeCard(c.id); 
                          if (c.associatedRedId) await removeCard(c.associatedRedId);
                          setCards(cs => cs.filter(x => x.id !== c.id && x.id !== c.associatedRedId));
                        }} className="text-red-500 px-3 tap text-lg">✕</button>
                      )}
                    </div>
                  ))
                })()}
              </div>
            </div>
          )}

          {/* Observations */}
          <div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Observaciones del Árbitro</h3>
            <textarea 
              value={observations}
              onChange={e => setObservations(e.target.value)}
              disabled={activeMatch.status !== 'live'}
              placeholder="Incidentes, reporte del partido..."
              className="w-full bg-[#141414] border border-[#222] text-white text-sm rounded-2xl p-4 min-h-[100px] outline-none focus:border-[#00f0ff] disabled:opacity-50"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sticky bottom-0 bg-[#0a0a0a]/90 backdrop-blur-md border-t border-[#222]">
          {activeMatch.status === 'live' ? (
            <button 
              onClick={finishMatch}
              disabled={loading}
              className="w-full bg-[#00f0ff] text-black font-black text-lg py-5 rounded-2xl tap shadow-[0_0_20px_rgba(0,240,255,0.4)]"
            >
              {loading ? 'FINALIZANDO...' : 'FINALIZAR PARTIDO'}
            </button>
          ) : (
            <button 
              onClick={async () => {
                setLoading(true)
                await updateMatchStatus(activeMatch.id, 'live', homeScore, awayScore, observations)
                setActiveMatch({...activeMatch, status: 'live'})
                setLoading(false)
              }}
              disabled={loading}
              className="w-full bg-transparent border-2 border-[#00f0ff] text-[#00f0ff] font-black text-lg py-5 rounded-2xl tap"
            >
              {loading ? 'CARGANDO...' : 'REABRIR PARTIDO'}
            </button>
          )}
        </div>
      </div>
    )
  }

  return null
}
