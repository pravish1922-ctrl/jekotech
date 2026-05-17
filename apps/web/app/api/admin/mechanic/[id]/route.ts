import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '../../../../../lib/supabase-server'

function serviceDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authClient = createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = serviceDb()
  const { data: callerRow } = await db.from('clients').select('role').eq('id', user.id).single()
  if (callerRow?.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json() as {
    name?: string
    phone?: string | null
    specialties?: string[]
    color_hex?: string | null
    max_concurrent_jobs?: number
  }

  const mechId = params.id

  // Update clients table — name and phone live there
  if (body.name !== undefined || body.phone !== undefined) {
    const clientUpdates: Record<string, unknown> = {}
    if (body.name !== undefined) clientUpdates.name = body.name
    if (body.phone !== undefined) clientUpdates.phone = body.phone
    const { error: clientErr } = await db
      .from('clients')
      .update(clientUpdates)
      .eq('id', mechId)
    if (clientErr) return NextResponse.json({ error: clientErr.message }, { status: 500 })
  }

  // Update mechanics table — specialties, color_hex, max_concurrent_jobs
  const mechUpdates: Record<string, unknown> = {}
  if (body.specialties !== undefined) mechUpdates.specialties = body.specialties
  if (body.color_hex !== undefined) mechUpdates.color_hex = body.color_hex
  if (body.max_concurrent_jobs !== undefined) mechUpdates.max_concurrent_jobs = body.max_concurrent_jobs

  if (Object.keys(mechUpdates).length > 0) {
    const { error: mechErr } = await db
      .from('mechanics')
      .update(mechUpdates)
      .eq('id', mechId)
    if (mechErr) return NextResponse.json({ error: mechErr.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
