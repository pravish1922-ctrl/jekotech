import { createServerSupabaseClient as createServerClient } from '../../../../lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { BottomNav } from '../../../../components/ui/bottom-nav'

// ── Types ─────────────────────────────────────────────────────────────────────

type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'complete' | 'cancelled'

interface BookingRow {
  id:                   string
  reference:            string
  service_ids:          string[]
  vehicle_id:           string | null
  bay_number:           number | null
  scheduled_start:      string
  status:               BookingStatus
  assigned_mechanic_id: string | null
  customer_notes:       string | null
  photo_urls:           string[] | null
  estimated_cost_mur:   number
  final_cost_mur:       number | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<BookingStatus, { label: string; bg: string; color: string }> = {
  pending:     { label: 'PENDING',     bg: '#F5C518', color: '#0B0D0E' },
  confirmed:   { label: 'CONFIRMED',   bg: '#2F9E5A', color: '#F2EFEA' },
  in_progress: { label: 'IN PROGRESS', bg: '#FF5A1F', color: '#F2EFEA' },
  complete:    { label: 'COMPLETE',    bg: '#2A2F33', color: '#8B9197' },
  cancelled:   { label: 'CANCELLED',   bg: '#2A2F33', color: '#8B9197' },
}

function formatMUR(n: number): string {
  return `₨ ${n.toLocaleString('en-US')}`
}

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso)
  const sameYear = d.getFullYear() === new Date().getFullYear()
  const dateStr = sameYear
    ? d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    : d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return {
    date: dateStr,
    time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
  }
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-4" style={{ borderTop: '1px solid #2A2F33' }}>
      <p className="font-mono text-[9px] tracking-mono2 uppercase text-steel2 mb-1">{label}</p>
      <p className="font-display text-[14px] text-bone">{value}</p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function BookingDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const { data: raw } = await supabase
    .from('bookings')
    .select('id, reference, service_ids, vehicle_id, bay_number, scheduled_start, status, assigned_mechanic_id, customer_notes, photo_urls, estimated_cost_mur, final_cost_mur')
    .eq('id', params.id)
    .eq('client_id', user.id)
    .single()

  if (!raw) notFound()

  const booking = raw as BookingRow

  // Parallel: service name + vehicle + mechanic
  const svcId     = booking.service_ids?.[0] ?? null
  const vehicleId = booking.vehicle_id

  const [svcResult, vehicleResult, mechResult] = await Promise.all([
    svcId
      ? supabase.from('services').select('name_en').eq('id', svcId).single()
      : Promise.resolve(null),
    vehicleId
      ? supabase.from('vehicles').select('registration, make, model, year').eq('id', vehicleId).single()
      : Promise.resolve(null),
    booking.assigned_mechanic_id
      ? supabase.from('mechanics').select('name').eq('id', booking.assigned_mechanic_id).single()
      : Promise.resolve(null),
  ])

  const serviceName  = (svcResult?.data as { name_en: string } | null)?.name_en ?? '—'
  const vehicle      = vehicleResult?.data as { registration: string; make: string; model: string; year: number } | null
  const mechanicName = (mechResult?.data as { name: string } | null)?.name ?? null

  const statusCfg = STATUS_CFG[booking.status] ?? STATUS_CFG.pending
  const { date, time } = formatDateTime(booking.scheduled_start)
  const cost = booking.final_cost_mur ?? booking.estimated_cost_mur
  const photos = booking.photo_urls ?? []

  return (
    <>
      <main className="min-h-screen bg-ink max-w-md mx-auto pb-20 px-6 pt-10">

        {/* Back link */}
        <Link
          href="/history"
          className="font-mono text-[10px] tracking-mono uppercase text-steel2 hover:text-bone transition-colors duration-120 mb-8 inline-block"
        >
          ← BACK TO LOG
        </Link>

        {/* Header */}
        <div className="mb-6">
          <p className="font-mono text-[9px] tracking-mono2 uppercase text-steel2 mb-2">
            BOOKING
          </p>
          <div className="flex items-center justify-between">
            <h1 className="font-display text-[24px] font-bold text-bone tracking-tighter">
              {booking.reference}
            </h1>
            <span
              className="font-mono text-[9px] tracking-mono uppercase px-2 py-1 leading-none"
              style={{ background: statusCfg.bg, color: statusCfg.color }}
            >
              {statusCfg.label}
            </span>
          </div>
        </div>

        {/* Detail rows */}
        <div className="mb-6" style={{ borderBottom: '1px solid #2A2F33' }}>
          <Row label="Service" value={serviceName} />
          <Row
            label="Date"
            value={
              <span className="capitalize">
                {date} · {time}
              </span>
            }
          />
          <Row
            label="Vehicle"
            value={vehicle ? `${vehicle.registration} · ${vehicle.make} ${vehicle.model} ${vehicle.year}` : '—'}
          />
          {booking.bay_number != null && (
            <Row label="Bay" value={`BAY ${booking.bay_number}`} />
          )}
          {mechanicName && (
            <Row label="Mechanic" value={mechanicName} />
          )}
          <Row
            label={booking.final_cost_mur != null ? 'Final Cost' : 'Estimated Cost'}
            value={cost ? formatMUR(cost) : '—'}
          />
          {booking.customer_notes && (
            <Row label="Your Notes" value={booking.customer_notes} />
          )}
        </div>

        {/* Photos */}
        {photos.length > 0 && (
          <div className="mb-6">
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

      </main>

      <BottomNav />
    </>
  )
}
