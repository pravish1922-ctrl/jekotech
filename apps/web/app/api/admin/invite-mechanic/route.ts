import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '../../../../lib/supabase-server'

function serviceDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

export async function POST(request: NextRequest) {
  // Verify caller is an authenticated admin
  const authClient = createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = serviceDb()
  const { data: callerRow } = await db.from('clients').select('role').eq('id', user.id).single()
  if (callerRow?.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json() as { name?: string; email?: string; phone?: string }
  const name  = body.name?.trim()
  const email = body.email?.trim().toLowerCase()
  const phone = body.phone?.trim() || null

  if (!name || !email) {
    return NextResponse.json({ error: 'name and email required' }, { status: 400 })
  }

  // Check if a client with this email already exists
  const { data: existing } = await db
    .from('clients')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  let clientId: string

  if (existing) {
    clientId = existing.id
    const { error } = await db
      .from('clients')
      .update({ role: 'mechanic', name })
      .eq('id', clientId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { data: newClient, error } = await db
      .from('clients')
      .insert({ email, name, role: 'mechanic', whatsapp_opt_in: false })
      .select('id')
      .single()
    if (error || !newClient) {
      return NextResponse.json({ error: error?.message ?? 'Failed to create client' }, { status: 500 })
    }
    clientId = newClient.id
  }

  const { error: mechErr } = await db
    .from('mechanics')
    .upsert({ id: clientId, name, email, phone, active: true })
  if (mechErr) return NextResponse.json({ error: mechErr.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
