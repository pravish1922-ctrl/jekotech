import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '../../../../lib/supabase-server'
import bcrypt from 'bcryptjs'

function serviceDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

function generateInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length >= 2) return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase()
  return (parts[0]?.[0] ?? '?').toUpperCase()
}

export async function POST(request: NextRequest) {
  const authClient = createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = serviceDb()
  const { data: callerRow } = await db.from('clients').select('role').eq('id', user.id).single()
  if (callerRow?.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden — owner only' }, { status: 403 })
  }

  const body = await request.json() as {
    name?: string
    username?: string
    role?: string
    pin?: string
  }

  const name     = body.name?.trim()
  const username = body.username?.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
  const role     = body.role?.trim()
  const pin      = body.pin?.trim()

  if (!name || !username || !role || !pin) {
    return NextResponse.json({ error: 'name, username, role, and pin are required' }, { status: 400 })
  }
  if (!/^\d{4,6}$/.test(pin)) {
    return NextResponse.json({ error: 'PIN must be 4–6 digits' }, { status: 400 })
  }
  const validRoles = ['owner', 'delegate', 'staff', 'mechanic']
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  // Check username not already taken
  const { data: existing } = await db
    .from('clients')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: `Username "${username}" is already taken` }, { status: 409 })
  }

  const systemEmail = `${username}@staff.jekotech.internal`

  // Create Supabase Auth user — pad PIN to 6 chars to meet Auth minimum
  const { data: authData, error: authErr } = await db.auth.admin.createUser({
    email: systemEmail,
    password: pin.padEnd(6, '0'),
    email_confirm: true,
  })

  if (authErr || !authData.user) {
    return NextResponse.json({ error: authErr?.message ?? 'Failed to create auth user' }, { status: 500 })
  }

  const userId = authData.user.id

  // Insert into clients
  const { error: clientErr } = await db
    .from('clients')
    .insert({
      id:               userId,
      name,
      username,
      role,
      email:            systemEmail,
      whatsapp_opt_in:  false,
    })

  if (clientErr) {
    await db.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: clientErr.message }, { status: 500 })
  }

  // If mechanic, insert into mechanics table
  if (role === 'mechanic') {
    const { error: mechErr } = await db
      .from('mechanics')
      .insert({ id: userId, initials: generateInitials(name), active: true })

    if (mechErr) {
      return NextResponse.json({ error: mechErr.message }, { status: 500 })
    }
  }

  // Insert PIN hash
  const pinHash = await bcrypt.hash(pin, 10)
  const { error: pinErr } = await db
    .from('staff_pins')
    .insert({ client_id: userId, pin_hash: pinHash, must_change: true })

  if (pinErr) {
    return NextResponse.json({ error: pinErr.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, id: userId })
}
