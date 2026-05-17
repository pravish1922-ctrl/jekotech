import { createClient } from '@supabase/supabase-js'
import PrintClient from './print-client'
import type { PrintBooking } from './print-client'

function serviceDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

export default async function PrintPage() {
  const supabase = serviceDb()
  const today = new Date()
  const todayStart = new Date(today)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)

  const { data: bookingsRaw } = await supabase
    .from('bookings')
    .select('id, reference, status, scheduled_start, bay_number, service_ids, client_id, vehicle_id, assigned_mechanic_id')
    .gte('scheduled_start', todayStart.toISOString())
    .lte('scheduled_start', todayEnd.toISOString())
    .order('scheduled_start', { ascending: true })

  const rows = bookingsRaw ?? []

  const allClientIds  = [...new Set(rows.map(b => b.client_id).filter(Boolean))]
  const allVehicleIds = [...new Set(rows.map(b => b.vehicle_id).filter(Boolean))]
  const allMechIds    = [...new Set(rows.map(b => b.assigned_mechanic_id).filter(Boolean))]
  const allSvcIds     = [...new Set(rows.flatMap(b => b.service_ids ?? []))]

  const [clientsRes, vehiclesRes, mechsRes, svcsRes] = await Promise.all([
    allClientIds.length  ? supabase.from('clients').select('id, name, phone').in('id', allClientIds)         : { data: [] as { id: string; name: string; phone: string | null }[] },
    allVehicleIds.length ? supabase.from('vehicles').select('id, registration, make, model').in('id', allVehicleIds) : { data: [] as { id: string; registration: string; make: string; model: string }[] },
    allMechIds.length    ? supabase.from('mechanics').select('id, clients(name)').in('id', allMechIds)        : { data: [] as unknown[] },
    allSvcIds.length     ? supabase.from('services').select('id, name_en').in('id', allSvcIds)                : { data: [] as { id: string; name_en: string }[] },
  ])

  type MechRow = { id: string; clients: { name: string } | null }
  const clientMap  = Object.fromEntries(((clientsRes.data ?? []) as { id: string; name: string; phone: string | null }[]).map(c => [c.id, c]))
  const vehicleMap = Object.fromEntries(((vehiclesRes.data ?? []) as { id: string; registration: string; make: string; model: string }[]).map(v => [v.id, v]))
  const mechMap    = Object.fromEntries(((mechsRes.data ?? []) as unknown as MechRow[]).map(m => [m.id, m.clients?.name ?? '—']))
  const svcMap     = Object.fromEntries(((svcsRes.data ?? []) as { id: string; name_en: string }[]).map(s => [s.id, s.name_en]))

  const bookings: PrintBooking[] = rows.map(b => ({
    id:            b.id,
    reference:     b.reference,
    status:        b.status as PrintBooking['status'],
    scheduled_start: b.scheduled_start ?? null,
    bay_number:    b.bay_number ?? null,
    client_name:   clientMap[b.client_id]?.name ?? '—',
    client_phone:  clientMap[b.client_id]?.phone ?? null,
    vehicle_label: vehicleMap[b.vehicle_id]
      ? `${vehicleMap[b.vehicle_id].registration} · ${vehicleMap[b.vehicle_id].make} ${vehicleMap[b.vehicle_id].model}`
      : '—',
    service_names: (b.service_ids ?? []).map((id: string) => svcMap[id] ?? '—').join(', '),
    mechanic_name: b.assigned_mechanic_id ? (mechMap[b.assigned_mechanic_id] ?? '—') : '—',
  }))

  const dateLabel = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return <PrintClient bookings={bookings} dateLabel={dateLabel} />
}
