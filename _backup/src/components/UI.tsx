'use client'

export function Monogram({ name, size = 34, highlight = false, ring = false }: { name: string; size?: number; highlight?: boolean; ring?: boolean }) {
  const words = name.split(' ').filter(Boolean)
  const initials = (words[0][0] + (words[1]?.[0] || '')).toUpperCase()
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff
  const hue = h % 360
  return (
    <div className={ring ? 'mono-ring' : ''} style={{
      width: size, height: size, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: highlight
        ? `linear-gradient(135deg, oklch(65% 0.18 ${hue}), oklch(45% 0.15 ${hue}))`
        : 'var(--ce-bg-3)',
      color: '#fff', font: `900 ${Math.round(size * 0.38)}px Inter`, letterSpacing: '.02em',
      border: highlight ? '1px solid rgba(255,255,255,.18)' : '1px solid var(--ce-border)',
      boxShadow: highlight ? `0 4px 12px oklch(45% 0.15 ${hue} / 0.35)` : 'none',
      flexShrink: 0,
    }}>{initials}</div>
  )
}

export function SectionTitle({ eyebrow, children }: { eyebrow?: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '22px 16px 10px' }}>
      {eyebrow && (
        <p style={{ margin: 0, font: '800 9px Inter', letterSpacing: '.25em', textTransform: 'uppercase', color: 'rgba(245,197,24,.85)' }}>
          {eyebrow}
        </p>
      )}
      <h2 className="font-display" style={{ margin: '4px 0 0', fontSize: 26, lineHeight: 1, color: 'var(--ce-fg)' }}>
        {children}
      </h2>
    </div>
  )
}

export function LiveDot() {
  return <span className="live-dot" />
}
