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

  const body = await request.json() as { new_pin?: string }
  const newPin = body.new_pin?.trim()

  if (!newPin || newPin.length < 4 || newPin.length > 6 || !/^\d+$/.test(newPin)) {
    return NextResponse.json({ error: 'PIN must be 4–6 digits' }, { status: 400 })
  }

  const pinHash = await bcrypt.hash(newPin, 10)
  const db = serviceDb()

  const { error: updatePinErr } = await db
    .from('staff_pins')
    .update({ pin_hash: pinHash, must_change: false, last_changed_at: new Date().toISOString() })
    .eq('client_id', user.id)

  if (updatePinErr) {
    return NextResponse.json({ error: updatePinErr.message }, { status: 500 })
  }

  // Update Supabase Auth password to match new PIN so future signInWithPassword works
  const { error: authUpdateErr } = await db.auth.admin.updateUserById(user.id, { password: newPin })
  if (authUpdateErr) {
    return NextResponse.json({ error: authUpdateErr.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
