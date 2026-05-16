import { createServerSupabaseClient as createServerClient } from '../../../../lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { BookingDetailEditor } from './booking-detail-editor'

type AdminRole = 'owner' | 'delegate' | 'staff'

interface RawBooking {
  id: string
  reference: string
  service_ids: string[]
  vehicle_id: string | null
  bay_number: number | null
  scheduled_start: string
  status: string
  assigned_mechanic_id: string | null
  customer_notes: string | null
  photo_urls: string[] | null
  estimated_cost_mur: number
  final_cost_mur: number | null
  mechanic_notes: string | null
  clients: { name: string; email: string; phone: string } | null
  vehicles: { registration: string; make: string; model: string; year: number } | null
  mechanics: { name: string; initials: string; color_hex: string } | null
}

interface MechanicRow {
  id: string
  name: string
  initials: string
  color_hex: string
}

export default async function AdminBookingDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const { data: clientRow } = await supabase
    .from('clients')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (clientRow as { role: string } | null)?.role as AdminRole | null
  if (!role || !['owner', 'delegate', 'staff'].includes(role)) {
    redirect('/home')
  }

  const [{ data: raw }, { data: mechanicsRaw }] = await Promise.all([
    supabase
      .from('bookings')
      .select(`
        id,
        reference,
        service_ids,
        vehicle_id,
        bay_number,
        scheduled_start,
        status,
        assigned_mechanic_id,
        customer_notes,
        photo_urls,
        estimated_cost_mur,
        final_cost_mur,
        mechanic_notes,
        clients ( name, email, phone ),
        vehicles ( registration, make, model, year ),
        mechanics ( name, initials, color_hex )
      `)
      .eq('id', params.id)
      .single(),

    supabase
      .from('mechanics')
      .select('id, name, initials, color_hex')
      .eq('active', true)
      .order('name'),
  ])

  if (!raw) notFound()

  const booking  = raw as unknown as RawBooking
  const mechanics = (mechanicsRaw as MechanicRow[] | null) ?? []

  // Resolve service name
  const svcId = booking.service_ids?.[0] ?? null
  let svcName = '—'
  if (svcId) {
    const { data: svcRow } = await supabase
      .from('services')
      .select('name_en')
      .eq('id', svcId)
      .single()
    svcName = (svcRow as { name_en: string } | null)?.name_en ?? '—'
  }

  const photos = booking.photo_urls ?? []

  return (
    <div className="min-h-screen bg-ink pb-16 md:pb-0 px-6 pt-8">
      <Link
        href="/admin/bookings"
        className="font-mono text-[10px] tracking-mono uppercase text-steel2 hover:text-bone transition-colors duration-120 mb-8 inline-block"
      >
        ← BACK TO BOOKINGS
      </Link>

      <BookingDetailEditor
        booking={booking as never}
        role={role}
        mechanics={mechanics}
        svcName={svcName}
      />

      {/* Photos */}
      {photos.length > 0 && (
        <div className="mt-8">
          <p className="font-mono text-[9px] tracking-mono2 uppercase text-steel2 mb-3">
            PHOTOS ({photos.length})
          </p>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((url, idx) => (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-square overflow-hidden bg-ink2 border border-ink4"
              >
                <Image
                  src={url}
                  alt={`Photo ${idx + 1}`}
                  width={120}
                  height={120}
                  className="w-full h-full object-cover"
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
