import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

function serviceDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const body = await request.json() as { username?: string; pin?: string }
  const username = body.username?.trim().toLowerCase()
  const pin      = body.pin?.trim()

  if (!username || !pin) {
    return NextResponse.json({ error: 'Username and PIN required' }, { status: 400 })
  }

  const db = serviceDb()

  const { data: clientRow } = await db
    .from('clients')
    .select('id, role')
    .eq('username', username)
    .maybeSingle()

  if (!clientRow) {
    return NextResponse.json({ error: 'Invalid username or PIN' }, { status: 401 })
  }

  const { data: pinRow } = await db
    .from('staff_pins')
    .select('pin_hash, must_change')
    .eq('client_id', clientRow.id)
    .maybeSingle()

  if (!pinRow) {
    return NextResponse.json({ error: 'Invalid username or PIN' }, { status: 401 })
  }

  const valid = await bcrypt.compare(pin, pinRow.pin_hash)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid username or PIN' }, { status: 401 })
  }

  // Establish a Supabase Auth session using the system email + PIN as password
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          try { cookieStore.set({ name, value, ...options }) } catch { /* route handler */ }
        },
        remove(name: string, options: CookieOptions) {
          try { cookieStore.set({ name, value: '', ...options }) } catch { /* route handler */ }
        },
      },
    }
  )

  const systemEmail = `${username}@staff.jekotech.internal`
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: systemEmail,
    password: pin,
  })

  if (signInError) {
    return NextResponse.json(
      { error: 'Authentication failed. Contact your manager to verify your account.' },
      { status: 401 }
    )
  }

  return NextResponse.json({
    role: clientRow.role as string,
    must_change_pin: pinRow.must_change as boolean,
  })
}
