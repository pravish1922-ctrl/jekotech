import { createServerSupabaseClient as createServerClient } from '../../../lib/supabase-server'
import { redirect } from 'next/navigation'
import { AdminBookingsList } from './admin-bookings-list'

interface RawBooking {
  id: string
  reference: string
  service_ids: string[]
  bay_number: number | null
  scheduled_start: string
  status: string
  assigned_mechanic_id: string | null
  clients: { name: string; phone: string } | null
  vehicles: { registration: string; make: string; model: string; year: number } | null
  mechanics: { name: string; initials: string; color_hex: string } | null
}

export default async function AdminBookingsPage() {
  const supabase = createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const { data: bookingsRaw } = await supabase
    .from('bookings')
    .select(`
      id,
      reference,
      service_ids,
      bay_number,
      scheduled_start,
      status,
      assigned_mechanic_id,
      clients ( name, phone ),
      vehicles ( registration, make, model, year ),
      mechanics ( name, initials, color_hex )
    `)
    .order('scheduled_start', { ascending: false })

  const bookings = (bookingsRaw as RawBooking[] | null) ?? []

  // Resolve service names
  const allSvcIds = bookings.flatMap(b => b.service_ids ?? []).filter(Boolean)
  const { data: svcRaw } = allSvcIds.length > 0
    ? await supabase.from('services').select('id, name_en').in('id', allSvcIds)
    : { data: [] }

  const svcMap: Record<string, string> = {}
  for (const s of (svcRaw as { id: string; name_en: string }[] | null) ?? []) {
    svcMap[s.id] = s.name_en
  }

  return (
    <div className="min-h-screen bg-ink pb-16 md:pb-0">
      <header className="px-6 pt-8 pb-6" style={{ borderBottom: '1px solid #2A2F33' }}>
        <p className="font-mono text-[9px] tracking-mono2 uppercase text-steel2 mb-2">
          ALL BOOKINGS
        </p>
        <h1 className="font-display text-[28px] font-bold text-bone tracking-tighter">
          Bookings
        </h1>
      </header>

      <AdminBookingsList bookings={bookings as never} svcMap={svcMap} />
    </div>
  )
}
