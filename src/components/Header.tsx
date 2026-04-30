'use client'
import Image from 'next/image'
import { useTheme } from './ThemeProvider'

export default function Header() {
  const { theme, toggle } = useTheme()
  return (
    <header className="relative z-40 glass-2 sticky top-0" style={{ borderBottom: '1px solid var(--ce-border)' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(0,240,255,.7) 40%, rgba(95,251,255,.5) 60%, transparent)',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          <div className="ce-logo">
            <Image src="/logo.png" alt="Estrella" fill unoptimized style={{ objectFit: 'contain' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 9, fontWeight: 800, letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--ce-cyan-3)', whiteSpace: 'nowrap' }}>
              Torneo Apertura · Pintita
            </p>
            <h1 className="text-grad-title" style={{
              margin: '2px 0 0', fontSize: 19, fontWeight: 900, lineHeight: 1,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '.03em',
            }}>
              CAMPEONATO DE LA ESTRELLA
            </h1>
          </div>
        </div>

        <button onClick={toggle} aria-label="Tema" className="tap" style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '1px solid var(--ce-border)', background: 'var(--ce-card)',
          color: 'var(--ce-fg-3)', fontSize: 14, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {theme === 'light' ? '☀' : '☾'}
        </button>

      </div>
    </header>
  )
}
