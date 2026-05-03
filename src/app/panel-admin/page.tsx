'use client'

import { useEffect, useState, useCallback } from 'react'
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
  removeCard,
} from '@/lib/supabase'
import type { Match, Player, Goal, Card } from '@/lib/types'

const TOURNAMENT_ID = '11111111-1111-1111-1111-111111111111'
const ADMIN_PIN = '2204'

type AppState = 'login' | 'dashboard' | 'pre-match' | 'post-match'

function getRoundLabel(r: number) {
  if (r === 8) return 'Zona Campeonato'
  if (r === 9) return 'Zona Repechaje'
  if (r >= 10) return 'Amistosos'
  return `Fecha ${r}`
}

function getStageLabel(m: Match) {
  if (m.round === 8) return 'CUARTOS · CAMPEONATO'
  if (m.round === 9) return 'CUARTOS · REPECHAJE'
  if (m.round >= 10) return 'AMISTOSO'
  return `ZONA ${m.zone} · F${m.round}`
}

// ─── CSS variables injected once ───────────────────────────────────────────
const THEME_STYLES = `
  .adm-dark {
    --ab: #111111; --ac: #1c1c1c; --ac2: #252525; --ab2: #171717;
    --aborder: rgba(255,255,255,.08); --adiv: rgba(255,255,255,.05);
    --afg: #ffffff; --afg2: #b0b0b0; --afg3: #666666;
    --aaccent: #f59e0b; --aaccent2: #d97706; --aaccent-bg: rgba(245,158,11,.12);
    --alive: #ef4444; --alive-bg: rgba(239,68,68,.12);
    --awin: #22c55e; --awin-bg: rgba(34,197,94,.1);
    --ashadow: rgba(0,0,0,.6);
    color-scheme: dark;
  }
  .adm-light {
    --ab: #f0efe9; --ac: #ffffff; --ac2: #f7f6f0; --ab2: #e8e7e0;
    --aborder: rgba(0,0,0,.1); --adiv: rgba(0,0,0,.06);
    --afg: #111111; --afg2: #444444; --afg3: #888888;
    --aaccent: #b45309; --aaccent2: #92400e; --aaccent-bg: rgba(180,83,9,.1);
    --alive: #dc2626; --alive-bg: rgba(220,38,38,.08);
    --awin: #16a34a; --awin-bg: rgba(22,163,74,.08);
    --ashadow: rgba(0,0,0,.15);
    color-scheme: light;
  }
  .adm-root { background: var(--ab); color: var(--afg); min-height: 100svh; font-family: var(--font-bebas, system-ui); }
  .adm-card { background: var(--ac); border: 1px solid var(--aborder); border-radius: 14px; }
  .adm-card2 { background: var(--ac2); border: 1px solid var(--aborder); border-radius: 10px; }
  .adm-input { background: var(--ac2); border: 1.5px solid var(--aborder); border-radius: 12px; color: var(--afg); outline: none; font-family: inherit; }
  .adm-input:focus { border-color: var(--aaccent); }
  .adm-btn { border: none; cursor: pointer; border-radius: 12px; font-family: inherit; font-weight: 900; letter-spacing: .06em; transition: opacity .15s; }
  .adm-btn:active { opacity: .75; transform: scale(.97); }
  .adm-btn-primary { background: var(--aaccent); color: #000; }
  .adm-btn-outline { background: transparent; border: 2px solid var(--aaccent) !important; color: var(--aaccent); }
  .adm-btn-ghost { background: var(--ac2); color: var(--afg2); border: 1px solid var(--aborder) !important; }
  .adm-pill { border-radius: 100px; padding: 7px 16px; font-size: 12px; font-weight: 900; letter-spacing: .08em; white-space: nowrap; cursor: pointer; transition: all .2s; border: 1.5px solid var(--aborder); background: var(--ac); color: var(--afg3); }
  .adm-pill.active { background: var(--aaccent); color: #000; border-color: transparent; }
  .adm-pill.has-live { color: var(--alive); border-color: rgba(239,68,68,.35); }
  .adm-divider { height: 1px; background: var(--adiv); }
  .adm-live-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--alive); animation: adm-pulse 1.4s ease-in-out infinite; display: inline-block; }
  @keyframes adm-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.7)} }
  @keyframes adm-slide-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  .adm-anim { animation: adm-slide-up .22s ease forwards; }
`

export default function PanelAdminPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [state, setState] = useState<AppState>('login')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [matches, setMatches] = useState<Match[]>([])
  const [activeRound, setActiveRound] = useState<number | null>(null)
  const [activeMatch, setActiveMatch] = useState<Match | null>(null)

  // Pre-match
  const [homePlayers, setHomePlayers] = useState<Player[]>([])
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([])
  const [homeRoster, setHomeRoster] = useState<{ player_id: string; shirt_number: string }[]>([])
  const [awayRoster, setAwayRoster] = useState<{ player_id: string; shirt_number: string }[]>([])

  // Post-match
  const [goals, setGoals] = useState<Goal[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [observations, setObservations] = useState('')
  const [homeScore, setHomeScore] = useState(0)
  const [awayScore, setAwayScore] = useState(0)
  const [actionModal, setActionModal] = useState<{ type: 'goal' | 'yellow' | 'red'; teamId: string } | null>(null)
  const [sheetPhotoPreview, setSheetPhotoPreview] = useState<string | null>(null)
  const [sheetPhotoUploading, setSheetPhotoUploading] = useState(false)

  const themeClass = `adm-root ${theme === 'dark' ? 'adm-dark' : 'adm-light'}`

  const loadMatches = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getMatches(TOURNAMENT_ID)
      const ms = data as Match[]
      setMatches(ms)

      // Auto-select next operative round
      const rounds = Array.from(new Set(ms.map(m => m.round))).sort((a, b) => a - b)
      setActiveRound(prev => {
        if (prev !== null && rounds.includes(prev)) return prev
        const liveRound = rounds.find(r => ms.filter(m => m.round === r).some(m => m.status === 'live'))
        if (liveRound) return liveRound
        const pendingRound = rounds.find(r => ms.filter(m => m.round === r).some(m => m.status === 'pending'))
        if (pendingRound) return pendingRound
        return rounds[rounds.length - 1] ?? null
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (state === 'dashboard') loadMatches() }, [state, loadMatches])

  function handleLogin() {
    if (pin === ADMIN_PIN) setState('dashboard')
    else { setPin(''); shake() }
  }

  function shake() {
    const el = document.getElementById('pin-input')
    if (!el) return
    el.style.animation = 'none'
    requestAnimationFrame(() => { el.style.animation = 'adm-shake .35s ease' })
  }

  async function openMatch(m: Match) {
    setLoading(true)
    setActiveMatch(m)
    if (m.status === 'pending') {
      const [hp, ap] = await Promise.all([getPlayers(m.home_team_id), getPlayers(m.away_team_id)])
      setHomePlayers(hp)
      setAwayPlayers(ap)
      setHomeRoster([])
      setAwayRoster([])
      setState('pre-match')
    } else {
      const [hr, ar, goalsRes, cardsRes] = await Promise.all([
        getMatchRoster(m.id, m.home_team_id),
        getMatchRoster(m.id, m.away_team_id),
        supabase.from('goals').select('*, roster:match_rosters(*, player:players(*))').eq('match_id', m.id),
        supabase.from('cards').select('*, roster:match_rosters(*, player:players(*))').eq('match_id', m.id),
      ])
      const [hp, ap] = await Promise.all([getPlayers(m.home_team_id), getPlayers(m.away_team_id)])
      setHomePlayers(hp)
      setAwayPlayers(ap)
      setHomeScore(m.home_score)
      setAwayScore(m.away_score)
      setObservations(m.observations || '')
      setSheetPhotoPreview(m.sheet_photo_url || null)
      setGoals(goalsRes.data || [])
      setCards(cardsRes.data || [])
      setHomeRoster(hr.map(r => ({ player_id: r.player_id, shirt_number: r.shirt_number.toString(), roster_id: r.id } as any)))
      setAwayRoster(ar.map(r => ({ player_id: r.player_id, shirt_number: r.shirt_number.toString(), roster_id: r.id } as any)))
      setState('post-match')
    }
    setLoading(false)
  }

  async function startMatch() {
    if (!activeMatch) return
    setLoading(true)
    const cleanHome = homeRoster.filter(r => r.shirt_number !== '').map(r => ({ ...r, shirt_number: parseInt(r.shirt_number) }))
    const cleanAway = awayRoster.filter(r => r.shirt_number !== '').map(r => ({ ...r, shirt_number: parseInt(r.shirt_number) }))
    await upsertMatchRoster(activeMatch.id, activeMatch.home_team_id, cleanHome)
    await upsertMatchRoster(activeMatch.id, activeMatch.away_team_id, cleanAway)
    await updateMatchStatus(activeMatch.id, 'live', 0, 0)
    setActiveMatch({ ...activeMatch, status: 'live' })
    const [hr, ar] = await Promise.all([getMatchRoster(activeMatch.id, activeMatch.home_team_id), getMatchRoster(activeMatch.id, activeMatch.away_team_id)])
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
        if (actionModal.teamId === activeMatch.home_team_id) setHomeScore(s => s + 1)
        else setAwayScore(s => s + 1)
      } else {
        await addCard(activeMatch.id, actionModal.teamId, null, rosterId || null, actionModal.type, minute ? parseInt(minute) : null)
        if (actionModal.type === 'yellow' && rosterId) {
          const alreadyHasYellow = cards.some(c => c.card_type === 'yellow' && c.roster_id === rosterId)
          if (alreadyHasYellow) {
            await addCard(activeMatch.id, actionModal.teamId, null, rosterId, 'red', minute ? parseInt(minute) : null)
          }
        }
      }
      const [goalsRes, cardsRes] = await Promise.all([
        supabase.from('goals').select('*, roster:match_rosters(*, player:players(*))').eq('match_id', activeMatch.id),
        supabase.from('cards').select('*, roster:match_rosters(*, player:players(*))').eq('match_id', activeMatch.id),
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
    if (!confirm('¿Finalizar el partido? Los resultados se publicarán en la tabla.')) return
    setLoading(true)
    await updateMatchStatus(activeMatch.id, 'finished', homeScore, awayScore, observations)
    setState('dashboard')
    loadMatches()
    setLoading(false)
  }

  async function compressImage(file: File): Promise<File> {
    return new Promise((resolve) => {
      const img = new Image()
      const objUrl = URL.createObjectURL(file)
      img.onload = () => {
        const maxW = 1200
        const scale = Math.min(1, maxW / img.width)
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        URL.revokeObjectURL(objUrl)
        canvas.toBlob(
          blob => resolve(blob ? new File([blob], 'sheet.webp', { type: 'image/webp' }) : file),
          'image/webp', 0.85
        )
      }
      img.onerror = () => { URL.revokeObjectURL(objUrl); resolve(file) }
      img.src = objUrl
    })
  }

  async function handlePhotoUpload(file: File) {
    if (!activeMatch) return
    setSheetPhotoUploading(true)
    setSheetPhotoPreview(URL.createObjectURL(file))
    try {
      const compressed = await compressImage(file)
      setSheetPhotoPreview(URL.createObjectURL(compressed))
      const form = new FormData()
      form.append('file', compressed)
      form.append('matchId', activeMatch.id)
      const res = await fetch('/api/upload-sheet', { method: 'POST', body: form })
      if (res.ok) {
        const { url } = await res.json()
        setSheetPhotoPreview(url)
      }
    } catch {
      // keep local preview
    } finally {
      setSheetPhotoUploading(false)
    }
  }

  // ─── COMMON HEADER ────────────────────────────────────────────────────────
  function AdminHeader({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack?: () => void }) {
    return (
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'var(--ab)', borderBottom: '1px solid var(--aborder)',
        padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        {onBack && (
          <button onClick={onBack} className="adm-btn adm-btn-ghost" style={{ padding: '8px 12px', fontSize: 18, borderRadius: 10 }}>←</button>
        )}
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 9, fontWeight: 800, letterSpacing: '.2em', color: 'var(--aaccent)', textTransform: 'uppercase' }}>{subtitle ?? 'Panel Operativo'}</p>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: 'var(--afg)', lineHeight: 1.1 }}>{title}</h1>
        </div>
        <button
          onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          className="adm-btn adm-btn-ghost"
          style={{ padding: '8px 12px', fontSize: 16, borderRadius: 10 }}
          title="Cambiar tema"
        >{theme === 'dark' ? '☀️' : '🌙'}</button>
      </div>
    )
  }

  // ─── MATCH STATUS BADGE ───────────────────────────────────────────────────
  function StatusBadge({ status }: { status: string }) {
    if (status === 'live') return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 900, color: 'var(--alive)', letterSpacing: '.1em' }}>
        <span className="adm-live-dot" />EN VIVO
      </span>
    )
    if (status === 'finished') return (
      <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--afg3)', letterSpacing: '.1em' }}>FINALIZADO</span>
    )
    return <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--aaccent)', letterSpacing: '.1em' }}>PENDIENTE</span>
  }

  // ─── TEAM MONOGRAM ────────────────────────────────────────────────────────
  function Mono({ name, size = 36 }: { name: string; size?: number }) {
    const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: 'var(--aaccent-bg)', border: '1.5px solid var(--aaccent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.3, fontWeight: 900, color: 'var(--aaccent)', letterSpacing: '.04em',
      }}>{initials}</div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────────────────────────────────
  if (state === 'login') {
    return (
      <div className={themeClass} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20 }}>
        <style>{THEME_STYLES + `
          @keyframes adm-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
        `}</style>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--aaccent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 12, boxShadow: '0 4px 20px rgba(245,158,11,.4)' }}>⚽</div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: 'var(--afg)' }}>Panel Operativo</h1>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--afg3)', letterSpacing: '.15em', textTransform: 'uppercase' }}>Campeonato Estrella</p>
        </div>

        <input
          id="pin-input"
          type="password"
          value={pin}
          onChange={e => setPin(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          placeholder="PIN"
          inputMode="numeric"
          className="adm-input"
          style={{ width: '100%', maxWidth: 260, textAlign: 'center', fontSize: 32, fontWeight: 900, letterSpacing: '.4em', padding: '18px 16px' }}
        />

        <button onClick={handleLogin} className="adm-btn adm-btn-primary" style={{ width: '100%', maxWidth: 260, fontSize: 16, padding: '18px 0', boxShadow: '0 4px 20px rgba(245,158,11,.35)' }}>
          INGRESAR
        </button>

        <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} style={{ background: 'none', border: 'none', color: 'var(--afg3)', cursor: 'pointer', fontSize: 13 }}>
          {theme === 'dark' ? 'Modo claro ☀️' : 'Modo oscuro 🌙'}
        </button>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────
  if (state === 'dashboard') {
    const rounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b)
    const roundMatches = matches.filter(m => m.round === activeRound).sort((a, b) =>
      (a.match_date ?? '').localeCompare(b.match_date ?? '')
    )

    return (
      <div className={themeClass}>
        <style>{THEME_STYLES}</style>
        <AdminHeader title="Partidos" />

        {/* Round tabs */}
        {rounds.length > 0 && (
          <div className="no-scrollbar" style={{ display: 'flex', gap: 8, padding: '12px 16px', overflowX: 'auto', borderBottom: '1px solid var(--aborder)' }}>
            {rounds.map(r => {
              const hasLive = matches.filter(m => m.round === r).some(m => m.status === 'live')
              const active = activeRound === r
              return (
                <button
                  key={r}
                  onClick={() => setActiveRound(r)}
                  className={`adm-pill${active ? ' active' : hasLive ? ' has-live' : ''}`}
                >
                  {r >= 8
                    ? <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2 }}>
                        <span style={{ fontSize: 10 }}>{r === 10 ? 'AMISTOSOS' : 'ZONA'}</span>
                        {r !== 10 && <span style={{ fontSize: 11 }}>{r === 8 ? 'CAMPEONATO' : 'REPECHAJE'}</span>}
                      </span>
                    : getRoundLabel(r).toUpperCase()
                  }
                  {hasLive && !active && <span style={{ marginLeft: 4 }}>●</span>}
                </button>
              )
            })}
          </div>
        )}

        {/* Match list */}
        <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--afg3)' }}>Cargando...</div>
          )}
          {!loading && roundMatches.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--afg3)', fontSize: 13 }}>Sin partidos para esta fecha</div>
          )}
          {roundMatches.map((m, i) => {
            const isLive = m.status === 'live'
            const isFinished = m.status === 'finished'
            return (
              <div
                key={m.id}
                onClick={() => openMatch(m)}
                className="adm-card adm-anim"
                style={{
                  cursor: 'pointer', overflow: 'hidden', animationDelay: `${i * 50}ms`,
                  borderColor: isLive ? 'rgba(239,68,68,.4)' : 'var(--aborder)',
                  boxShadow: isLive ? '0 0 0 1px rgba(239,68,68,.2)' : 'none',
                }}
              >
                {/* Card header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', background: 'var(--ac2)', borderBottom: '1px solid var(--adiv)' }}>
                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.18em', color: 'var(--afg3)', textTransform: 'uppercase' }}>{getStageLabel(m)}</span>
                  <StatusBadge status={m.status} />
                </div>

                {/* Teams */}
                <div style={{ display: 'flex', alignItems: 'center', padding: '14px 14px' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <Mono name={m.home_team?.name || '?'} size={40} />
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: 'var(--afg)', textAlign: 'center', lineHeight: 1.2 }}>{m.home_team?.name}</p>
                  </div>

                  <div style={{ padding: '0 12px', textAlign: 'center', minWidth: 80 }}>
                    {isFinished || isLive
                      ? <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                          <span style={{ fontSize: 32, fontWeight: 900, color: 'var(--afg)' }}>{m.home_score}</span>
                          <span style={{ fontSize: 20, color: 'var(--afg3)', fontWeight: 300 }}>—</span>
                          <span style={{ fontSize: 32, fontWeight: 900, color: 'var(--afg)' }}>{m.away_score}</span>
                        </div>
                      : <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--afg3)', letterSpacing: '.1em' }}>VS</span>
                    }
                    {m.match_date && !isFinished && !isLive && (
                      <p style={{ margin: '4px 0 0', fontSize: 11, fontWeight: 700, color: 'var(--aaccent)' }}>
                        {new Date(m.match_date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                      </p>
                    )}
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <Mono name={m.away_team?.name || '?'} size={40} />
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: 'var(--afg)', textAlign: 'center', lineHeight: 1.2 }}>{m.away_team?.name}</p>
                  </div>
                </div>

                {/* CTA */}
                <div style={{ padding: '0 14px 12px', display: 'flex', justifyContent: 'center' }}>
                  <span style={{
                    fontSize: 10, fontWeight: 900, letterSpacing: '.15em', textTransform: 'uppercase',
                    padding: '5px 14px', borderRadius: 100,
                    background: isFinished ? 'var(--ac2)' : isLive ? 'var(--alive-bg)' : 'var(--aaccent-bg)',
                    color: isFinished ? 'var(--afg3)' : isLive ? 'var(--alive)' : 'var(--aaccent)',
                    border: `1px solid ${isFinished ? 'var(--aborder)' : isLive ? 'rgba(239,68,68,.3)' : 'rgba(245,158,11,.3)'}`,
                  }}>
                    {isFinished ? 'Ver planilla' : isLive ? 'Gestionar partido' : 'Armar planilla'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRE-MATCH
  // ─────────────────────────────────────────────────────────────────────────
  if (state === 'pre-match' && activeMatch) {
    const RosterSection = ({
      team, players, roster, setRoster,
    }: {
      team: string; players: Player[]
      roster: { player_id: string; shirt_number: string }[]
      setRoster: React.Dispatch<React.SetStateAction<{ player_id: string; shirt_number: string }[]>>
    }) => (
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '0 2px' }}>
          <Mono name={team} size={32} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: 'var(--afg)' }}>{team}</h3>
          <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 800, color: 'var(--afg3)' }}>{roster.length} / {players.length}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {players.map(p => {
            const r = roster.find(x => x.player_id === p.id)
            return (
              <div key={p.id} className="adm-card2" style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: 'var(--afg)' }}>{p.last_name}</p>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--afg3)', fontWeight: 600 }}>{p.first_name}</p>
                </div>
                <select
                  value={r?.shirt_number || ''}
                  onChange={e => {
                    const val = e.target.value
                    setRoster(prev => {
                      const rest = prev.filter(x => x.player_id !== p.id)
                      return val ? [...rest, { player_id: p.id, shirt_number: val }] : rest
                    })
                  }}
                  className="adm-input"
                  style={{ width: 70, textAlign: 'center', fontSize: 18, fontWeight: 900, padding: '8px 4px' }}
                >
                  <option value="">—</option>
                  {Array.from({ length: 99 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            )
          })}
        </div>
      </div>
    )

    return (
      <div className={themeClass} style={{ display: 'flex', flexDirection: 'column' }}>
        <style>{THEME_STYLES}</style>
        <AdminHeader
          title="Armar Planilla"
          subtitle={getStageLabel(activeMatch)}
          onBack={() => setState('dashboard')}
        />

        {/* Match info bar */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--ac2)', borderBottom: '1px solid var(--aborder)' }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--afg)' }}>{activeMatch.home_team?.name}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--afg3)' }}>vs</span>
          <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--afg)' }}>{activeMatch.away_team?.name}</span>
        </div>

        <div style={{ padding: '16px 14px', flex: 1, overflowY: 'auto' }}>
          <RosterSection
            team={activeMatch.home_team?.name || ''}
            players={homePlayers}
            roster={homeRoster}
            setRoster={setHomeRoster}
          />
          <div className="adm-divider" style={{ marginBottom: 24 }} />
          <RosterSection
            team={activeMatch.away_team?.name || ''}
            players={awayPlayers}
            roster={awayRoster}
            setRoster={setAwayRoster}
          />
        </div>

        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--aborder)', background: 'var(--ab)' }}>
          <button
            onClick={startMatch}
            disabled={loading}
            className="adm-btn adm-btn-primary"
            style={{ width: '100%', fontSize: 16, padding: '18px 0', boxShadow: '0 4px 20px rgba(245,158,11,.3)', opacity: loading ? .6 : 1 }}
          >
            {loading ? 'GUARDANDO...' : `INICIAR PARTIDO (${homeRoster.length + awayRoster.length} jugadores)`}
          </button>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // POST-MATCH
  // ─────────────────────────────────────────────────────────────────────────
  if (state === 'post-match' && activeMatch) {
    const isLive = activeMatch.status === 'live'

    const EventModal = () => {
      const [selPlayer, setSelPlayer] = useState('')
      const [selMinute, setSelMinute] = useState('')
      if (!actionModal) return null
      const roster = actionModal.teamId === activeMatch.home_team_id ? homeRoster : awayRoster
      const allPlayers = [...homePlayers, ...awayPlayers]
      const icon = actionModal.type === 'goal' ? '⚽' : actionModal.type === 'yellow' ? '🟨' : '🟥'
      const label = actionModal.type === 'goal' ? 'GOL' : actionModal.type === 'yellow' ? 'TARJETA AMARILLA' : 'TARJETA ROJA'
      const teamName = actionModal.teamId === activeMatch.home_team_id ? activeMatch.home_team?.name : activeMatch.away_team?.name

      return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 50, display: 'flex', flexDirection: 'column', padding: '0 16px 32px' }}>
          <div style={{ maxWidth: 420, width: '100%', margin: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24 }}>
              <div>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: 'var(--aaccent)', letterSpacing: '.2em' }}>{teamName?.toUpperCase()}</p>
                <h2 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#fff' }}>{icon} {label}</h2>
              </div>
              <button onClick={() => setActionModal(null)} style={{ background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 10, padding: '8px 14px', color: '#fff', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>

            {/* Player select */}
            <div>
              <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 800, letterSpacing: '.15em', color: 'var(--aaccent)', textTransform: 'uppercase' }}>Jugador</p>
              <select
                value={selPlayer}
                onChange={e => setSelPlayer(e.target.value)}
                className="adm-input"
                style={{ width: '100%', fontSize: 16, fontWeight: 700, padding: '14px 12px' }}
              >
                <option value="">Sin identificar</option>
                {roster.map((r: any) => {
                  const player = allPlayers.find(p => p.id === r.player_id)
                  return (
                    <option key={r.roster_id} value={r.roster_id}>
                      #{r.shirt_number} — {player?.last_name} {player?.first_name}
                    </option>
                  )
                })}
              </select>
            </div>

            {/* Minute */}
            <div>
              <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 800, letterSpacing: '.15em', color: 'var(--aaccent)', textTransform: 'uppercase' }}>Minuto (opcional)</p>
              <input
                type="number"
                value={selMinute}
                onChange={e => setSelMinute(e.target.value)}
                placeholder="Ej: 35"
                className="adm-input"
                style={{ width: '100%', fontSize: 22, fontWeight: 900, padding: '14px 12px', textAlign: 'center', boxSizing: 'border-box' }}
              />
            </div>

            <button
              onClick={() => handleEvent(selPlayer, selMinute)}
              disabled={loading}
              className="adm-btn adm-btn-primary"
              style={{ fontSize: 17, padding: '18px 0', boxShadow: '0 4px 20px rgba(245,158,11,.35)', opacity: loading ? .6 : 1 }}
            >
              {loading ? 'GUARDANDO...' : 'CONFIRMAR'}
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className={themeClass} style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh' }}>
        <style>{THEME_STYLES}</style>
        {actionModal && <EventModal />}

        <AdminHeader
          title="Planilla de Juego"
          subtitle={getStageLabel(activeMatch)}
          onBack={() => setState('dashboard')}
        />

        {/* Scoreboard */}
        <div style={{ background: 'var(--ac)', borderBottom: '1px solid var(--aborder)', padding: '16px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 400, margin: '0 auto' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <Mono name={activeMatch.home_team?.name || '?'} size={44} />
              <p style={{ margin: '8px 0 0', fontSize: 12, fontWeight: 900, color: 'var(--afg)', lineHeight: 1.2 }}>{activeMatch.home_team?.name}</p>
            </div>
            <div style={{ padding: '0 12px', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 52, fontWeight: 900, color: 'var(--afg)', lineHeight: 1 }}>{homeScore}</span>
                <span style={{ fontSize: 28, color: 'var(--afg3)', fontWeight: 300 }}>—</span>
                <span style={{ fontSize: 52, fontWeight: 900, color: 'var(--afg)', lineHeight: 1 }}>{awayScore}</span>
              </div>
              <div style={{ marginTop: 6 }}><StatusBadge status={activeMatch.status} /></div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <Mono name={activeMatch.away_team?.name || '?'} size={44} />
              <p style={{ margin: '8px 0 0', fontSize: 12, fontWeight: 900, color: 'var(--afg)', lineHeight: 1.2 }}>{activeMatch.away_team?.name}</p>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Action buttons — only if live */}
          {isLive && [
            { team: activeMatch.home_team_id, name: activeMatch.home_team?.name || '' },
            { team: activeMatch.away_team_id, name: activeMatch.away_team?.name || '' },
          ].map(({ team, name }) => (
            <div key={team} className="adm-card" style={{ padding: '12px 12px' }}>
              <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 900, color: 'var(--afg3)', letterSpacing: '.15em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mono name={name} size={20} />{name}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { type: 'goal' as const, icon: '⚽', label: 'GOL', color: 'var(--awin)', bg: 'var(--awin-bg)', border: 'rgba(34,197,94,.3)' },
                  { type: 'yellow' as const, icon: '🟨', label: 'AMARILLA', color: '#ca8a04', bg: 'rgba(202,138,4,.1)', border: 'rgba(202,138,4,.3)' },
                  { type: 'red' as const, icon: '🟥', label: 'ROJA', color: 'var(--alive)', bg: 'var(--alive-bg)', border: 'rgba(239,68,68,.3)' },
                ].map(({ type, icon, label, color, bg, border }) => (
                  <button
                    key={type}
                    onClick={() => setActionModal({ type, teamId: team })}
                    className="adm-btn"
                    style={{ padding: '14px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: bg, border: `1.5px solid ${border}`, borderRadius: 12 }}
                  >
                    <span style={{ fontSize: 28 }}>{icon}</span>
                    <span style={{ fontSize: 9, fontWeight: 900, color, letterSpacing: '.1em' }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Events log */}
          {(goals.length > 0 || cards.length > 0) && (() => {
            // Detect 2nd-yellow cards (trigger auto-red) and skip the generated red rows
            const sortedCards = [...cards].sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))
            const secondYellowIds = new Set<string>()
            const autoRedRosterIds = new Set<string>()
            const tmpCount: Record<string, number> = {}
            for (const c of sortedCards) {
              if (c.card_type === 'yellow' && c.roster_id) {
                tmpCount[c.roster_id] = (tmpCount[c.roster_id] || 0) + 1
                if (tmpCount[c.roster_id] === 2) { secondYellowIds.add(c.id); autoRedRosterIds.add(c.roster_id) }
              }
            }
            return (
              <div className="adm-card" style={{ padding: '12px 12px' }}>
                <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 900, color: 'var(--aaccent)', letterSpacing: '.15em', textTransform: 'uppercase' }}>
                  Eventos ({goals.length + cards.length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {goals.map(g => (
                    <div key={g.id} className="adm-card2" style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', gap: 10 }}>
                      <span style={{ fontSize: 18 }}>⚽</span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--afg)' }}>{(g.roster?.player as any)?.last_name || 'Desconocido'}</span>
                        {g.minute && <span style={{ fontSize: 11, color: 'var(--afg3)', marginLeft: 6 }}>{g.minute}'</span>}
                      </div>
                      {isLive && (
                        <button onClick={async () => { await removeGoal(g.id); setGoals(gs => gs.filter(x => x.id !== g.id)); if (g.team_id === activeMatch.home_team_id) setHomeScore(s => s - 1); else setAwayScore(s => s - 1) }} style={{ background: 'none', border: 'none', color: 'var(--alive)', fontSize: 18, cursor: 'pointer', padding: 4 }}>✕</button>
                      )}
                    </div>
                  ))}
                  {sortedCards.map(c => {
                    if (c.card_type === 'red' && c.roster_id && autoRedRosterIds.has(c.roster_id)) return null
                    const isSecondYellow = secondYellowIds.has(c.id)
                    return (
                      <div key={c.id} className="adm-card2" style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', gap: 10 }}>
                        <span style={{ fontSize: 18, letterSpacing: -2 }}>{isSecondYellow ? '🟨🟥' : c.card_type === 'yellow' ? '🟨' : '🟥'}</span>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--afg)' }}>{(c.roster?.player as any)?.last_name || 'Desconocido'}</span>
                          {isSecondYellow && <span style={{ fontSize: 9, fontWeight: 900, color: 'var(--alive)', marginLeft: 6, letterSpacing: '.1em' }}>DOBLE AMARILLA</span>}
                          {c.minute && <span style={{ fontSize: 11, color: 'var(--afg3)', marginLeft: 6 }}>{c.minute}'</span>}
                        </div>
                        {isLive && (
                          <button onClick={async () => { await removeCard(c.id); setCards(cs => cs.filter(x => x.id !== c.id)) }} style={{ background: 'none', border: 'none', color: 'var(--alive)', fontSize: 18, cursor: 'pointer', padding: 4 }}>✕</button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}

          {/* Observations */}
          <div className="adm-card" style={{ padding: '12px 12px' }}>
            <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 900, color: 'var(--afg3)', letterSpacing: '.15em', textTransform: 'uppercase' }}>Observaciones del árbitro</p>
            <textarea
              value={observations}
              onChange={e => setObservations(e.target.value)}
              disabled={!isLive}
              placeholder="Incidentes, reporte del partido..."
              className="adm-input"
              style={{ width: '100%', minHeight: 90, fontSize: 13, fontWeight: 600, padding: '12px', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5, opacity: isLive ? 1 : .6 }}
            />
          </div>

          {/* Sheet photo */}
          <div className="adm-card" style={{ padding: '12px 12px' }}>
            <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 900, color: 'var(--afg3)', letterSpacing: '.15em', textTransform: 'uppercase' }}>Planilla manual · Foto de respaldo</p>
            {sheetPhotoPreview ? (
              <div>
                <img src={sheetPhotoPreview} alt="Planilla" style={{ width: '100%', borderRadius: 8, marginBottom: 10 }} />
                <label style={{ display: 'flex', justifyContent: 'center', cursor: 'pointer' }}>
                  <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--aaccent)', letterSpacing: '.1em', textTransform: 'uppercase' }}>CAMBIAR FOTO</span>
                  <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])} />
                </label>
              </div>
            ) : (
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '24px 0', cursor: 'pointer', border: '2px dashed var(--aborder)', borderRadius: 10, opacity: sheetPhotoUploading ? .6 : 1 }}>
                <span style={{ fontSize: 36 }}>📷</span>
                <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--aaccent)', textTransform: 'uppercase', letterSpacing: '.1em' }}>{sheetPhotoUploading ? 'Subiendo...' : 'Fotografiar planilla'}</span>
                <span style={{ fontSize: 10, color: 'var(--afg3)' }}>Foto firmada por el árbitro · Respaldo digital</span>
                <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])} disabled={sheetPhotoUploading} />
              </label>
            )}
          </div>
        </div>

        {/* Bottom action */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--aborder)', background: 'var(--ab)' }}>
          {isLive ? (
            <button onClick={finishMatch} disabled={loading} className="adm-btn adm-btn-primary" style={{ width: '100%', fontSize: 16, padding: '18px 0', opacity: loading ? .6 : 1, boxShadow: '0 4px 20px rgba(245,158,11,.3)' }}>
              {loading ? 'GUARDANDO...' : 'FINALIZAR PARTIDO'}
            </button>
          ) : (
            <button
              onClick={async () => {
                setLoading(true)
                await updateMatchStatus(activeMatch.id, 'live', homeScore, awayScore, observations)
                setActiveMatch({ ...activeMatch, status: 'live' })
                setLoading(false)
              }}
              disabled={loading}
              className="adm-btn adm-btn-outline"
              style={{ width: '100%', fontSize: 16, padding: '18px 0' }}
            >
              {loading ? 'CARGANDO...' : 'REABRIR PARTIDO'}
            </button>
          )}
          <button
            onClick={() => setState('pre-match')}
            className="adm-btn adm-btn-ghost"
            style={{ width: '100%', fontSize: 13, padding: '12px 0', marginTop: 8 }}
          >
            ← Editar planilla de jugadores
          </button>
        </div>
      </div>
    )
  }

  return null
}
