import { Suspense } from 'react'
import { getTeamById, getTeamMatches, getTopScorers } from '@/lib/supabase'
import TeamDetailClient from './TeamDetailClient'
import { Metadata } from 'next'

const TOURNAMENT_ID = '11111111-1111-1111-1111-111111111111'

// Dynamic metadata for WhatsApp previews
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const team = await getTeamById(params.id)
  
  if (!team) {
    return {
      title: 'Equipo no encontrado | Campeonato Estrella',
    }
  }

  return {
    title: `${team.name} | Campeonato Estrella`,
    description: `Estadísticas, resultados y goleadores de ${team.name} en la Zona ${team.zone}.`,
    openGraph: {
      title: `${team.name} | Campeonato Estrella`,
      description: `Estadísticas, resultados y goleadores de ${team.name} en la Zona ${team.zone}.`,
      images: team.logo_url ? [team.logo_url] : [],
    },
  }
}

export default async function TeamDetailPage({ params }: { params: { id: string } }) {
  // Fetch initial data on the server
  const [team, matches, scorers] = await Promise.all([
    getTeamById(params.id),
    getTeamMatches(params.id),
    getTopScorers(TOURNAMENT_ID)
  ])

  // Filter scorers for this team
  const teamScorers = scorers.filter(s => s.team_id === params.id)

  return (
    <Suspense fallback={
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100dvh' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(0,240,255,0.15)', borderTopColor: '#00f0ff', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    }>
      <TeamDetailClient 
        teamId={params.id} 
        initialTeam={team} 
        initialMatches={matches} 
        initialScorers={teamScorers} 
      />
    </Suspense>
  )
}
