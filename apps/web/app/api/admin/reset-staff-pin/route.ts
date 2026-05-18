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

export async function POST(request: NextRequest) {
  const authClient = createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = serviceDb()
  const { data: callerRow } = await db.from('clients').select('role').eq('id', user.id).single()
  if (callerRow?.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden — owner only' }, { status: 403 })
  }

  const body = await request.json() as { client_id?: string; new_pin?: string }
  const clientId = body.client_id?.trim()
  const newPin   = body.new_pin?.trim()

  if (!clientId || !newPin) {
    return NextResponse.json({ error: 'client_id and new_pin required' }, { status: 400 })
  }
  if (!/^\d{4,6}$/.test(newPin)) {
    return NextResponse.json({ error: 'PIN must be 4–6 digits' }, { status: 400 })
  }

  const { data: clientRow } = await db
    .from('clients')
    .select('username')
    .eq('id', clientId)
    .single()

  const pinHash = await bcrypt.hash(newPin, 10)

  const { error: pinErr } = await db
    .from('staff_pins')
    .update({ pin_hash: pinHash, must_change: true, last_changed_at: new Date().toISOString() })
    .eq('client_id', clientId)

  if (pinErr) return NextResponse.json({ error: pinErr.message }, { status: 500 })

  // Update Supabase Auth password + sync email to current username
  const authUpdate: { password: string; email?: string } = { password: newPin.padEnd(6, '0') }
  if (clientRow?.username) {
    authUpdate.email = `${clientRow.username}@staff.jekotech.internal`
  }
  const { error: authErr } = await db.auth.admin.updateUserById(clientId, authUpdate)
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
