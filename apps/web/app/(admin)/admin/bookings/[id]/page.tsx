import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '../../../../../lib/supabase-server'
import { notFound } from 'next/navigation'
import { BookingDetailEditor } from './booking-detail-editor'

type MechanicWithClient = {
  id: string
  clients: { name: string } | null
}

function serviceDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

export default async function AdminBookingDetailPage({ params }: { params: { id: string } }) {
  const authClient = createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) notFound()

  const supabase = serviceDb()

  const { data: booking, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !booking) notFound()

  const [
    { data: client },
    { data: vehicle },
    { data: services },
    { data: mechanicsRaw },
    { data: currentClient },
  ] = await Promise.all([
    supabase.from('clients').select('id, name, email, phone').eq('id', booking.client_id).single(),
    supabase.from('vehicles').select('id, registration, make, model, year, colour, mileage').eq('id', booking.vehicle_id).single(),
    supabase.from('services').select('id, name_en, base_price_mur, estimated_duration_min'),
    supabase.from('mechanics').select('id, clients(name)').eq('active', true),
    supabase.from('clients').select('role').eq('id', user.id).single(),
  ])

  const mechanics = ((mechanicsRaw ?? []) as unknown as MechanicWithClient[])
    .map(m => ({ id: m.id, name: m.clients?.name ?? '(unknown)' }))

  const serviceMap = Object.fromEntries((services ?? []).map(s => [s.id, s]))
  const bookingServices = (booking.service_ids ?? []).map((id: string) => serviceMap[id]).filter(Boolean)
  const assignedMechanic = mechanics.find(m => m.id === booking.assigned_mechanic_id) ?? null

  return (
    <BookingDetailEditor
      booking={booking}
      client={client}
      vehicle={vehicle}
      bookingServices={bookingServices}
      allServices={services ?? []}
      mechanics={mechanics}
      assignedMechanic={assignedMechanic}
      currentRole={currentClient?.role ?? 'staff'}
    />
  )
}
