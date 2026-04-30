import type { Metadata, Viewport } from 'next'
import './globals.css'
import BottomNav from '@/components/BottomNav'
import RegisterSW from '@/components/RegisterSW'
import { ThemeProvider } from '@/components/ThemeProvider'
import SplashScreen from '@/components/SplashScreen'

export const metadata: Metadata = {
  title: 'Campeonato de la Estrella',
  description: 'Seguimiento en vivo — Predio Pintita',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'La Estrella' },
  icons: { icon: '/logo.png', apple: '/icons/icon-192.png' },
}

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false,
  themeColor: '#000000',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="dark">
      <body style={{ background: 'var(--ce-bg)', color: 'var(--ce-fg)', minHeight: '100vh', paddingBottom: 72, overflowX: 'hidden' }}>
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
