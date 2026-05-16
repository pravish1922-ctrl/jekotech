import { createServerSupabaseClient as createServerClient } from '../../../../lib/supabase-server'
import { AdminBookingsList } from './admin-bookings-list'

export default async function AdminBookingsPage() {
  const supabase = createServerClient()

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id,
      reference,
      status,
      scheduled_start,
      scheduled_end,
      estimated_cost_mur,
      final_cost_mur,
      service_ids,
      bay_number,
      client_id,
      vehicle_id,
      assigned_mechanic_id,
      created_at
    `)
    .order('scheduled_start', { ascending: false })

  if (error) {
    return (
      <div className="p-6">
        <p style={{ color: '#E8412B', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
          ERROR LOADING BOOKINGS: {error.message}
        </p>
      </div>
    )
  }

  const { data: clients }   = await supabase.from('clients').select('id, name, email, phone')
  const { data: vehicles }  = await supabase.from('vehicles').select('id, registration, make, model, year')
  const { data: services }  = await supabase.from('services').select('id, name_en, base_price_mur')
  const { data: mechanics } = await supabase.from('mechanics').select('id, name')

  const clientMap   = Object.fromEntries((clients   ?? []).map(c => [c.id, c]))
  const vehicleMap  = Object.fromEntries((vehicles  ?? []).map(v => [v.id, v]))
  const serviceMap  = Object.fromEntries((services  ?? []).map(s => [s.id, s]))
  const mechanicMap = Object.fromEntries((mechanics ?? []).map(m => [m.id, m]))

  const enriched = (bookings ?? []).map(b => ({
    ...b,
    client:   clientMap[b.client_id] ?? null,
    vehicle:  vehicleMap[b.vehicle_id] ?? null,
    services: (b.service_ids ?? []).map((id: string) => serviceMap[id]).filter(Boolean),
    mechanic: b.assigned_mechanic_id ? (mechanicMap[b.assigned_mechanic_id] ?? null) : null,
  }))

  return <AdminBookingsList bookings={enriched} />
}
