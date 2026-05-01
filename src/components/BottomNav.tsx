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
    href: '/fixture',
    label: 'Fixture',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
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
    href: '/goleadores',
    label: 'Goleadores',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2l2.5 7.5H22l-6 4.5 2.5 7.5L12 17l-6.5 4.5L8 14 2 9.5h7.5z" />
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
]

export default function BottomNav() {
  const path = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-2" style={{ borderTop: '1px solid var(--ce-border)', paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}>
      <div style={{
        position: 'absolute', top: -1, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(0,240,255,.5), rgba(95,251,255,.4), rgba(0,240,255,.5), transparent)',
      }} />
      <div style={{ display: 'flex' }}>
        {NAV.map(item => {
          const active = path === item.href
          return (
            <Link key={item.href} href={item.href}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 2px 8px', gap: 3, position: 'relative', overflow: 'hidden', textDecoration: 'none' }}
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
                fontSize: 7, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase',
                color: active ? 'var(--ce-cyan)' : 'var(--ce-fg-2)', lineHeight: 1,
              }}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
