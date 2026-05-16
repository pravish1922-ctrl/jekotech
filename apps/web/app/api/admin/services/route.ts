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

// POST — create new service
export async function POST(request: NextRequest) {
  const user = await verifyOwner()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json() as {
    name_en?: string
    base_price_mur?: number
    estimated_duration_min?: number
  }
  const name_en = body.name_en?.trim()
  if (!name_en) return NextResponse.json({ error: 'name_en required' }, { status: 400 })

  const db = serviceDb()
  const { data, error } = await db
    .from('services')
    .insert({
      name_en,
      type:                   name_en.toLowerCase().replace(/\s+/g, '_'),
      base_price_mur:         body.base_price_mur ?? 0,
      estimated_duration_min: body.estimated_duration_min ?? 60,
      active: true,
    })
    .select('id, name_en, base_price_mur, active')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, service: data })
}

// PATCH — update existing service
export async function PATCH(request: NextRequest) {
  const user = await verifyOwner()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json() as {
    id?: string
    name_en?: string
    base_price_mur?: number
    active?: boolean
  }
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const db = serviceDb()
  const updates: Record<string, unknown> = {}
  if (body.name_en       !== undefined) updates.name_en         = body.name_en.trim()
  if (body.base_price_mur !== undefined) updates.base_price_mur = body.base_price_mur
  if (body.active         !== undefined) updates.active          = body.active

  const { error } = await db.from('services').update(updates).eq('id', body.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
