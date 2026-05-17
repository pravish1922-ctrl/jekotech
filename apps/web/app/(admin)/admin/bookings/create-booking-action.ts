'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

function serviceDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

export async function createClientForBooking(
  name: string,
  phone: string
): Promise<{ data?: { id: string; name: string; phone: string | null }; error?: string }> {
  const db = serviceDb()
  const { data, error } = await db
    .from('clients')
    .insert({ name, phone: phone || null, role: 'customer', whatsapp_opt_in: false })
    .select('id, name, phone')
    .single()
  if (error) return { error: error.message }
  return { data: data as { id: string; name: string; phone: string | null } }
}

export async function createVehicleForBooking(
  ownerId: string,
  registration: string,
  make: string,
  model: string,
  year: number
): Promise<{ data?: { id: string }; error?: string }> {
  const db = serviceDb()
  const { data, error } = await db
    .from('vehicles')
    .insert({
      id: crypto.randomUUID(),
      owner_client_id: ownerId,
      registration,
      make,
      model,
      year,
      mileage: 0,
      colour: '',
    })
    .select('id')
    .single()
  if (error) return { error: error.message }
  return { data: data as { id: string } }
}

export async function createWalkinBooking(payload: {
  clientId: string
  vehicleId: string
  serviceIds: string[]
  scheduledStart: string
  bayNumber: number | null
  mechanicId: string | null
  estimatedCost: number | null
  notes: string
}): Promise<{ data?: { id: string; reference: string }; error?: string }> {
  const db = serviceDb()

  const ref = `JK-${String(Math.floor(1000 + Math.random() * 9000))}`

  const { data, error } = await db
    .from('bookings')
    .insert({
      reference: ref,
      client_id: payload.clientId,
      vehicle_id: payload.vehicleId,
      service_ids: payload.serviceIds,
      scheduled_start: payload.scheduledStart,
      bay_number: payload.bayNumber,
      assigned_mechanic_id: payload.mechanicId || null,
      estimated_cost_mur: payload.estimatedCost,
      customer_notes: payload.notes || null,
      status: 'pending',
    })
    .select('id, reference')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/admin/bookings')
  return { data: data as { id: string; reference: string } }
}
