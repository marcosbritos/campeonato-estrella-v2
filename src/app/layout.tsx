import type { Metadata, Viewport } from 'next'
import './globals.css'
import BottomNav from '@/components/BottomNav'
import RegisterSW from '@/components/RegisterSW'

export const metadata: Metadata = {
  title: 'Campeonato de la Estrella',
  description: 'Seguimiento en vivo — Predio Pintita',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'La Estrella',
  },
  icons: {
    apple: '/icons/icon-192.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#c0392b',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-[#0a0a0a] text-white min-h-screen pb-16">
        <RegisterSW />
        {children}
        <BottomNav />
      </body>
    </html>
  )
}
