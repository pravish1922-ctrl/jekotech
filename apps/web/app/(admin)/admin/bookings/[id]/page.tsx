import { createServerSupabaseClient as createServerClient } from '../../../../../lib/supabase-server'
import { notFound } from 'next/navigation'
import { BookingDetailEditor } from './booking-detail-editor'

export default async function AdminBookingDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()

  const { data: booking, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !booking) notFound()

  const { data: client } = await supabase
    .from('clients')
    .select('id, name, email, phone')
    .eq('id', booking.client_id)
    .single()

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id, registration, make, model, year, colour, mileage')
    .eq('id', booking.vehicle_id)
    .single()

  const { data: services } = await supabase
    .from('services')
    .select('id, name_en, base_price_mur, estimated_duration_min')

  const { data: mechanics } = await supabase
    .from('mechanics')
    .select('id, name')

  const { data: { user } } = await supabase.auth.getUser()
  const { data: currentClient } = await supabase
    .from('clients')
    .select('role')
    .eq('id', user!.id)
    .single()

  const serviceMap = Object.fromEntries((services ?? []).map(s => [s.id, s]))
  const bookingServices = (booking.service_ids ?? []).map((id: string) => serviceMap[id]).filter(Boolean)
  const assignedMechanic = (mechanics ?? []).find(m => m.id === booking.assigned_mechanic_id) ?? null

  return (
    <BookingDetailEditor
      booking={booking}
      client={client}
      vehicle={vehicle}
      bookingServices={bookingServices}
      allServices={services ?? []}
      mechanics={mechanics ?? []}
      assignedMechanic={assignedMechanic}
      currentRole={currentClient?.role ?? 'staff'}
    />
  )
}
