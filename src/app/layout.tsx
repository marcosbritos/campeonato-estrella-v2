import type { Metadata, Viewport } from 'next'
import './globals.css'
import BottomNav from '@/components/BottomNav'
import RegisterSW from '@/components/RegisterSW'
import { ThemeProvider } from '@/components/ThemeProvider'
import SplashScreen from '@/components/SplashScreen'

export const metadata: Metadata = {
  metadataBase: new URL('https://campeonatodelaestrella.vercel.app'),
  title: 'Campeonato de la Estrella',
  description: 'Seguimiento en vivo del torneo — Fixture, posiciones, goleadores y Fair Play. Predio Pintita, Mariano Acosta.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'La Estrella' },
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Campeonato de la Estrella ⚽',
    description: 'Seguí en vivo el torneo: fixture, posiciones, goleadores y Fair Play. Predio Pintita.',
    url: 'https://campeonatodelaestrella.vercel.app',
    siteName: 'Campeonato de la Estrella',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Logo del Campeonato de la Estrella',
      },
    ],
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Campeonato de la Estrella ⚽',
    description: 'Seguí en vivo el torneo: fixture, posiciones, goleadores y Fair Play.',
    images: ['/og-image.png'],
  },
}

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false,
  themeColor: '#000000',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="dark">
      <body style={{ background: 'var(--ce-bg)', color: 'var(--ce-fg)', minHeight: '100dvh', paddingBottom: 72, overflowX: 'hidden' }}>
        <ThemeProvider>
          <SplashScreen />
          <RegisterSW />
          <div className="mesh-bg" aria-hidden="true" />
          <div className="mesh-orb mesh-orb-a" aria-hidden="true" />
          <div className="mesh-orb mesh-orb-b" aria-hidden="true" />
          <div className="mesh-orb mesh-orb-c" aria-hidden="true" />
          <div style={{ position: 'relative', zIndex: 1 }}>
            {children}
          </div>
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  )
}
