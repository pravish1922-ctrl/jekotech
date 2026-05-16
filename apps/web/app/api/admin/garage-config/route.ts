import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '../../../../lib/supabase-server'

function serviceDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

async function verifyOwner() {
  const authClient = createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return null
  const db = serviceDb()
  const { data } = await db.from('clients').select('role').eq('id', user.id).single()
  return data?.role === 'owner' ? user : null
}

// PATCH — upsert garage_config row (id = 1)
export async function PATCH(request: NextRequest) {
  const user = await verifyOwner()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json() as {
    hours?: Record<string, unknown>
    slots?: string[]
    bays?: number
    garage_name?: string
    address?: string
    phone?: string
    email?: string
  }

  const db = serviceDb()
  const { error } = await db
    .from('garage_config')
    .upsert({ id: 1, ...body }, { onConflict: 'id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
