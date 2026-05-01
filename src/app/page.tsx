'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import PredioCarousel from '@/components/PredioCarousel'
import { getTopScorers } from '@/lib/supabase'
import type { TopScorer } from '@/lib/types'

const WA_URL = 'https://wa.me/5491134290431'
const TOURNAMENT_ID = '11111111-1111-1111-1111-111111111111'



function TopScorerWidget({ scorer }: { scorer: TopScorer | null }) {
  if (!scorer) return null
  return (
    <div className="glass" style={{ borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderLeft: '2px solid var(--ce-cyan)' }}>
      <span style={{ fontSize: 28 }}>⚽</span>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 9, fontWeight: 800, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--ce-fg-4)' }}>Goleador del torneo</p>
        <p style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 900, color: 'var(--ce-fg)' }}>{scorer.player_name}</p>
        <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--ce-fg-4)' }}>{scorer.team_name}</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color: 'var(--ce-cyan)', textShadow: '0 0 12px rgba(0,240,255,.5)', lineHeight: 1 }}>{scorer.goals}</p>
        <p style={{ margin: '2px 0 0', fontSize: 8, fontWeight: 800, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--ce-fg-4)' }}>goles</p>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [topScorer, setTopScorer] = useState<TopScorer | null>(null)

  useEffect(() => {
    getTopScorers(TOURNAMENT_ID).then(s => { if (s.length > 0) setTopScorer(s[0]) })
  }, [])

  return (
    <main style={{ paddingBottom: 32 }}>
      {/* Hero */}
      <div style={{ position: 'relative', height: 260, overflow: 'hidden' }}>
        <Image
          src="/bg.jpg"
          alt="Predio Pintita"
          fill
          unoptimized
          style={{ objectFit: 'cover', filter: 'brightness(.45) saturate(1.2)' }}
          priority
        />
        {/* Cyan overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(0,240,255,.08) 0%, rgba(0,0,0,.7) 100%)',
        }} />
        {/* Logo centrado */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 200, height: 200, position: 'relative', filter: 'drop-shadow(0 0 32px rgba(0,240,255,.5))' }}>
            <Image src="/logo.png" alt="Campeonato de la Estrella" fill unoptimized style={{ objectFit: 'contain' }} />
          </div>
        </div>
        {/* Bottom fade */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(to bottom, transparent, var(--ce-bg))' }} />
      </div>

      {/* Goleador del torneo */}
      <div style={{ padding: '20px 16px 0' }}>
        <TopScorerWidget scorer={topScorer} />
      </div>

      {/* Sobre el torneo */}
      <div style={{ padding: '24px 16px 0' }}>
        <p style={{ margin: '0 0 12px', fontSize: 9, fontWeight: 800, letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--ce-cyan)' }}>
          Sobre el torneo
        </p>
        <div className="glass" style={{ borderRadius: 14, padding: '16px' }}>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: 'var(--ce-fg-2)' }}>
            El <strong style={{ color: 'var(--ce-fg)' }}>Campeonato de la Estrella</strong> es un torneo de fútbol amateur organizado en el <strong style={{ color: 'var(--ce-fg)' }}>Predio Pintita</strong>, con el objetivo de fomentar el deporte y la competencia sana entre equipos del barrio y la zona.
          </p>
          <p style={{ margin: '12px 0 0', fontSize: 13, lineHeight: 1.7, color: 'var(--ce-fg-2)' }}>
            24 equipos divididos en <strong style={{ color: 'var(--ce-cyan)' }}>3 zonas</strong> compiten durante la fase regular. Los 2 mejores de cada zona avanzan a semifinales, con una gran final que coronará al campeón del torneo.
          </p>
        </div>
      </div>

      {/* Formato */}
      <div style={{ padding: '20px 16px 0' }}>
        <p style={{ margin: '0 0 6px', fontSize: 9, fontWeight: 800, letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--ce-cyan)' }}>
          Formato
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { icon: '⚽', title: 'Fase de grupos', desc: '8 equipos por zona, todos contra todos' },
            { icon: '🏆', title: 'Semifinales', desc: 'Top 2 de cada zona y los 2 mejores terceros se clasifican' },
            { icon: '📍', title: 'Sede', desc: 'Predio Pintita · Mariano Acosta 2005' },
            { icon: '⚖️', title: 'Fair Play', desc: 'Ranking de conducta deportiva por equipo' },
          ].map(f => (
            <div key={f.title} className="glass" style={{ borderRadius: 12, padding: '14px 12px' }}>
              <p style={{ margin: '0 0 6px', fontSize: 20 }}>{f.icon}</p>
              <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 900, color: 'var(--ce-fg)' }}>{f.title}</p>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--ce-fg-3)', lineHeight: 1.4 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Fotos del predio */}
      <div style={{ padding: '20px 16px 0' }}>
        <p style={{ margin: '0 0 10px', fontSize: 9, fontWeight: 800, letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--ce-cyan)' }}>
          El predio
        </p>
        <PredioCarousel />
      </div>

      {/* Accesos rápidos */}
      <div style={{ padding: '20px 16px 0' }}>
        <p style={{ margin: '0 0 10px', fontSize: 9, fontWeight: 800, letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--ce-cyan)' }}>
          Accesos rápidos
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Link href="/posiciones" className="tap glass" style={{
            borderRadius: 12, padding: '18px 14px', textDecoration: 'none',
            border: '1px solid rgba(0,240,255,.2)', display: 'block',
          }}>
            <p style={{ margin: '0 0 4px', fontSize: 22 }}>📊</p>
            <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 900, color: 'var(--ce-fg)' }}>Posiciones</p>
            <p style={{ margin: 0, fontSize: 10, color: 'var(--ce-fg-4)' }}>Tabla por zona</p>
          </Link>
          <Link href="/fairplay" className="tap glass" style={{
            borderRadius: 12, padding: '18px 14px', textDecoration: 'none',
            border: '1px solid rgba(0,240,255,.2)', display: 'block',
          }}>
            <p style={{ margin: '0 0 4px', fontSize: 22 }}>🤝</p>
            <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 900, color: 'var(--ce-fg)' }}>Fair Play</p>
            <p style={{ margin: 0, fontSize: 10, color: 'var(--ce-fg-4)' }}>Conducta deportiva</p>
          </Link>
        </div>
      </div>

      {/* Admin link (discreto) */}
      <div style={{ padding: '16px 16px 0' }}>
        <Link href="/panel-admin" className="tap glass" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          borderRadius: 12, padding: '12px 14px', textDecoration: 'none',
          border: '1px solid rgba(255,255,255,.06)',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ce-fg-4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ce-fg-4)', letterSpacing: '.06em' }}>Panel de Administración</span>
        </Link>
      </div>

      {/* WhatsApp Organización */}
      <div style={{ padding: '24px 16px 0', display: 'flex', justifyContent: 'center' }}>
        <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="tap" style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '14px 24px', borderRadius: 100,
          background: 'linear-gradient(135deg, var(--ce-cyan-3), var(--ce-cyan))',
          color: '#000', fontWeight: 900, fontSize: 13, letterSpacing: '.06em',
          textDecoration: 'none', textTransform: 'uppercase',
          boxShadow: '0 6px 24px rgba(0,240,255,.3)',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01s-.52.08-.79.37c-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.42-.08-.12-.28-.2-.57-.35M12.05 21.95h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.64-.23-.38a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.9 6.99c-.01 5.45-4.45 9.89-9.91 9.89" />
          </svg>
          Contactar Organización
        </a>
      </div>
      {/* Footer */}
      <footer style={{ margin: '32px 16px 0', padding: '20px 0', borderTop: '1px solid var(--ce-border)', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--ce-fg-4)' }}>
          Desarrollado por <span style={{ color: 'var(--ce-cyan)', fontWeight: 800 }}>B&amp;B</span>
        </p>
        <p style={{ margin: '6px 0 0', fontSize: 9, color: 'var(--ce-fg-4)', letterSpacing: '.1em' }}>
          © 2026 · Campeonato de la Estrella
        </p>
      </footer>
    </main>
  )
}
