import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Panel Administrativo | Campeonato Estrella',
  robots: 'noindex, nofollow', // Oculto de buscadores
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {children}
    </div>
  )
}
