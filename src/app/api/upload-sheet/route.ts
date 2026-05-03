import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  const form = await req.formData()
  const file = form.get('file') as File | null
  const matchId = form.get('matchId') as string | null

  if (!file || !matchId) {
    return NextResponse.json({ error: 'Missing file or matchId' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${matchId}/sheet.${ext}`

  const { data, error } = await admin.storage
    .from('planillas')
    .upload(path, file, { upsert: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = admin.storage.from('planillas').getPublicUrl(data.path)

  await admin.from('matches').update({ sheet_photo_url: publicUrl }).eq('id', matchId)

  return NextResponse.json({ url: publicUrl })
}
