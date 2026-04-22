'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  {
    href: '/',
    label: 'Tabla',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="9" x2="9" y2="21" />
      </svg>
    ),
  },
  {
    href: '/fixture',
    label: 'Fixture',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        <line x1="2" y1="12" x2="22" y2="12" />
      </svg>
    ),
  },
  {
    href: '/goleadores',
    label: 'Goles',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <text x="2" y="20" fontSize="18">⚽</text>
      </svg>
    ),
  },
  {
    href: '/fairplay',
    label: 'Fair Play',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="5" y="2" width="9" height="13" rx="1" fill="#f5c518" stroke="#f5c518" />
        <rect x="10" y="9" width="9" height="13" rx="1" fill="#c0392b" stroke="#c0392b" />
      </svg>
    ),
  },
  {
    href: '/arbitro',
    label: 'Árbitro',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const path = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f0f] border-t border-[#1e1e1e]">
      <div className="flex items-center justify-around">
        {NAV.map((item) => {
          const active = path === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 flex-1 text-center transition-colors ${
                active ? 'text-[#f5c518]' : 'text-gray-500'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-semibold uppercase tracking-wide">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
