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
  const authClient = createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = serviceDb()
  const { data: callerRow } = await db.from('clients').select('role').eq('id', user.id).single()
  if (callerRow?.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden — owner only' }, { status: 403 })
  }

  const body = await request.json() as { client_id?: string }
  const clientId = body.client_id?.trim()

  if (!clientId) {
    return NextResponse.json({ error: 'client_id required' }, { status: 400 })
  }

  if (clientId === user.id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  // Delete from mechanics (ignore if not mechanic)
  await db.from('mechanics').delete().eq('id', clientId)

  // Delete from staff_pins (ignore if not staff)
  await db.from('staff_pins').delete().eq('client_id', clientId)

  // Delete from clients before deleting auth user (FK: clients.id → auth.users.id)
  const { error: clientErr } = await db.from('clients').delete().eq('id', clientId)
  if (clientErr) return NextResponse.json({ error: clientErr.message }, { status: 500 })

  // Delete from Supabase Auth
  const { error: authErr } = await db.auth.admin.deleteUser(clientId)
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
