'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'

const PHOTOS = [
  { src: '/bg.jpg', alt: 'Predio Pintita' },
  { src: '/predio1.png', alt: 'Predio Pintita' },
  { src: '/predio2.jpg', alt: 'Predio Pintita' },
]

export default function PredioCarousel() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setCurrent(i => (i + 1) % PHOTOS.length), 3500)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', position: 'relative', height: 180 }}>
      {PHOTOS.map((photo, i) => (
        <div key={photo.src} style={{
          position: 'absolute', inset: 0,
          opacity: i === current ? 1 : 0,
          transition: 'opacity .6s ease',
        }}>
          <Image src={photo.src} alt={photo.alt} fill unoptimized style={{ objectFit: 'cover', filter: 'brightness(.8) saturate(1.1)' }} />
        </div>
      ))}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.7), transparent)', zIndex: 1 }} />
      <div style={{ position: 'absolute', bottom: 12, left: 14, zIndex: 2 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#fff' }}>Predio Pintita</p>
        <p style={{ margin: '2px 0 0', fontSize: 10, color: 'rgba(255,255,255,.6)' }}>Sede oficial del torneo</p>
      </div>
      <div style={{ position: 'absolute', bottom: 10, right: 14, zIndex: 2, display: 'flex', gap: 5 }}>
        {PHOTOS.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} style={{
            width: i === current ? 16 : 6, height: 6, borderRadius: 3, border: 'none', padding: 0, cursor: 'pointer',
            background: i === current ? 'var(--ce-cyan)' : 'rgba(255,255,255,.35)',
            transition: 'all .3s',
          }} />
        ))}
      </div>
    </div>
  )
}
