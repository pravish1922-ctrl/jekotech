import { createServerSupabaseClient as createServerClient } from '../../../../lib/supabase-server'
import { MechanicJobsClient } from './mechanic-jobs-client'

export default async function MechanicJobsPage() {
  const supabase = createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id,
      reference,
      status,
      scheduled_start,
      scheduled_end,
      bay_number,
      service_ids,
      customer_notes,
      mechanic_notes,
      photo_urls,
      client_id,
      vehicle_id
    `)
    .eq('assigned_mechanic_id', user.id)
    .order('scheduled_start', { ascending: true })

  if (error) {
    return (
      <div className="p-6">
        <p style={{ color: '#E8412B', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
          ERROR: {error.message}
        </p>
      </div>
    )
  }

  const clientIds   = [...new Set((bookings ?? []).map(b => b.client_id).filter(Boolean))]
  const vehicleIds  = [...new Set((bookings ?? []).map(b => b.vehicle_id).filter(Boolean))]
  const allSvcIds   = [...new Set((bookings ?? []).flatMap(b => b.service_ids ?? []))]

  const [{ data: clients }, { data: vehicles }, { data: services }] = await Promise.all([
    clientIds.length  ? supabase.from('clients').select('id, name, phone').in('id', clientIds) : Promise.resolve({ data: [] }),
    vehicleIds.length ? supabase.from('vehicles').select('id, registration, make, model, year, colour').in('id', vehicleIds) : Promise.resolve({ data: [] }),
    allSvcIds.length  ? supabase.from('services').select('id, name_en').in('id', allSvcIds) : Promise.resolve({ data: [] }),
  ])

  const clientMap  = Object.fromEntries((clients  ?? []).map(c => [c.id, c]))
  const vehicleMap = Object.fromEntries((vehicles ?? []).map(v => [v.id, v]))
  const serviceMap = Object.fromEntries((services ?? []).map(s => [s.id, s]))

  const enriched = (bookings ?? []).map(b => ({
    ...b,
    client:   clientMap[b.client_id] ?? null,
    vehicle:  vehicleMap[b.vehicle_id] ?? null,
    services: (b.service_ids ?? []).map((id: string) => serviceMap[id]).filter(Boolean),
  }))

  return <MechanicJobsClient jobs={enriched} mechanicId={user.id} />
}
