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
  // Verify caller is an authenticated owner
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

  function generateInitials(fullName: string): string {
    const parts = fullName.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return parts[0][0].toUpperCase()
  }

  // Check if a client with this email already exists
  const { data: existing } = await db
    .from('clients')
    .select('id, role')
    .eq('email', email)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: `A user with email ${email} already exists (role: ${existing.role}). Remove them first or use a different email.` },
      { status: 409 }
    )
  }

  // Create new client record with role='mechanic'
  const newId = crypto.randomUUID()
  const { data: newClient, error: clientErr } = await db
    .from('clients')
    .insert({ id: newId, email, name, role: 'mechanic', whatsapp_opt_in: false })
    .select('id')
    .single()

  if (clientErr || !newClient) {
    return NextResponse.json(
      { error: clientErr?.message ?? 'Failed to create client record' },
      { status: 500 }
    )
  }

  // Check if a mechanics row already exists for this client
  const { data: existingMech } = await db
    .from('mechanics')
    .select('id')
    .eq('id', newClient.id)
    .maybeSingle()

  if (existingMech) {
    return NextResponse.json(
      { error: 'This person is already registered as a mechanic.' },
      { status: 409 }
    )
  }

  // Insert mechanics row — only columns that exist in mechanics table
  const { error: mechErr } = await db
    .from('mechanics')
    .insert({ id: newClient.id, initials: generateInitials(name), active: true })

  if (mechErr) return NextResponse.json({ error: mechErr.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
