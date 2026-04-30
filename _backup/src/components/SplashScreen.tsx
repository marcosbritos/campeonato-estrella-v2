'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function SplashScreen() {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1800)
    const hideTimer = setTimeout(() => setVisible(false), 2400)
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer) }
  }, [])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#000',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20,
      opacity: fading ? 0 : 1,
      transition: 'opacity .6s ease',
      pointerEvents: fading ? 'none' : 'all',
    }}>
      <div style={{
        width: 180, height: 180, position: 'relative',
        animation: 'splash-pulse 1.4s ease-in-out infinite',
        filter: 'drop-shadow(0 0 40px rgba(0,240,255,.6))',
      }}>
        <Image src="/logo.png" alt="Campeonato de la Estrella" fill unoptimized style={{ objectFit: 'contain' }} />
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--ce-cyan)',
            animation: `dot-bounce .9s ease-in-out ${i * 0.18}s infinite`,
            display: 'inline-block',
          }} />
        ))}
      </div>

      <style>{`
        @keyframes splash-pulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 30px rgba(0,240,255,.5)); }
          50% { transform: scale(1.06); filter: drop-shadow(0 0 55px rgba(0,240,255,.85)); }
        }
        @keyframes dot-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: .4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
