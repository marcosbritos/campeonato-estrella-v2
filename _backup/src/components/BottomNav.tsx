'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  {
    href: '/',
    label: 'Inicio',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: '/posiciones',
    label: 'Posiciones',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="9" x2="9" y2="21" />
      </svg>
    ),
  },
  {
    href: '/fairplay',
    label: 'Fair Play',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="5" y="2" width="9" height="13" rx="1" fill="var(--ce-warn)" />
        <rect x="10" y="9" width="9" height="13" rx="1" fill="var(--ce-loss)" />
      </svg>
    ),
  },
  {
    href: '/admin',
    label: 'Admin',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M6 20v-2a6 6 0 0 1 12 0v2" />
        <path d="M19 11l2 2-4 4" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const path = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-2" style={{ borderTop: '1px solid var(--ce-border)' }}>
      <div style={{
        position: 'absolute', top: -1, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(0,240,255,.5), rgba(95,251,255,.4), rgba(0,240,255,.5), transparent)',
      }} />
      <div style={{ display: 'flex' }}>
        {NAV.map(item => {
          const active = path === item.href
          return (
            <Link key={item.href} href={item.href}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 4px 8px', gap: 3, position: 'relative', overflow: 'hidden', textDecoration: 'none' }}
              className="tap">
              {active && (
                <>
                  <span style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(0,240,255,.1), transparent)' }} />
                  <span className="tab-line" style={{
                    position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                    height: 2, width: '2rem', borderRadius: '0 0 4px 4px',
                    background: 'linear-gradient(90deg, var(--ce-cyan-3), var(--ce-cyan), var(--ce-cyan-3))',
                    boxShadow: '0 0 8px var(--ce-cyan)',
                  }} />
                </>
              )}
              <span style={{
                color: active ? 'var(--ce-cyan)' : 'var(--ce-fg-2)',
                filter: active ? 'drop-shadow(0 0 6px rgba(0,240,255,.6))' : 'none',
                lineHeight: 1,
              }}>{item.icon}</span>
              <span style={{
                fontSize: 8, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase',
                color: active ? 'var(--ce-cyan)' : 'var(--ce-fg-2)', lineHeight: 1,
              }}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
