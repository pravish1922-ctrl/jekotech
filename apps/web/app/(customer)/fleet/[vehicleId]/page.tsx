import { createServerSupabaseClient as createServerClient } from '../../../../lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { BottomNav } from '../../../../components/ui/bottom-nav'

// ── Types ─────────────────────────────────────────────────────────────────────

type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'complete' | 'cancelled'

interface Vehicle {
  id: string
  registration: string
  make: string
  model: string
  year: number
  mileage: number
  colour: string | null
}

interface BookingRow {
  id: string
  reference: string
  service_ids: string[]
  scheduled_start: string
  status: BookingStatus
  estimated_cost_mur: number
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

function smartDate(iso: string): string {
  const d = new Date(iso)
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return sameYear
    ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase()
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function VehicleDetailPage({ params }: { params: { vehicleId: string } }) {
  const supabase = createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const [{ data: vehicleRaw }, { data: bookingsRaw }] = await Promise.all([
    supabase
      .from('vehicles')
      .select('id, registration, make, model, year, mileage, colour')
      .eq('id', params.vehicleId)
      .single(),

    supabase
      .from('bookings')
      .select('id, reference, service_ids, scheduled_start, status, estimated_cost_mur')
      .eq('vehicle_id', params.vehicleId)
      .eq('client_id', user.id)
      .order('scheduled_start', { ascending: false }),
  ])

  if (!vehicleRaw) notFound()

  const vehicle  = vehicleRaw as Vehicle
  const bookings = (bookingsRaw as BookingRow[] | null) ?? []

  // Service names
  const allSvcIds = bookings.flatMap(b => b.service_ids).filter(Boolean)
  const { data: svcRaw } = allSvcIds.length > 0
    ? await supabase.from('services').select('id, name_en').in('id', allSvcIds)
    : { data: [] }

  const svcMap = new Map<string, string>(
    ((svcRaw as { id: string; name_en: string }[] | null) ?? []).map(s => [s.id, s.name_en])
  )

  return (
    <>
      <main className="min-h-screen bg-ink max-w-md mx-auto pb-20 px-6 pt-10">

        <Link
          href="/fleet"
          className="font-mono text-[10px] tracking-mono uppercase text-steel2 hover:text-bone transition-colors duration-120 mb-8 inline-block"
        >
          ← BACK TO FLEET
        </Link>

        {/* Hero */}
        <div className="mb-6">
          <p className="font-mono text-[9px] tracking-mono2 uppercase text-steel2 mb-2">
            VEHICLE
          </p>
          <h1 className="font-display text-[32px] font-bold text-bone tracking-tighter leading-none mb-4">
            {vehicle.registration}
          </h1>

          <div style={{ borderTop: '1px solid #2A2F33', borderBottom: '1px solid #2A2F33' }}>
            {[
              { label: 'Make / Model', value: `${vehicle.make} ${vehicle.model}` },
              { label: 'Year',         value: String(vehicle.year) },
              ...(vehicle.colour ? [{ label: 'Colour', value: vehicle.colour }] : []),
              { label: 'Mileage',      value: `${vehicle.mileage.toLocaleString('en-US')} mi` },
            ].map(({ label, value }, idx) => (
              <div
                key={label}
                className="flex items-center justify-between py-3"
                style={idx > 0 ? { borderTop: '1px solid #2A2F33' } : undefined}
              >
                <span className="font-mono text-[9px] tracking-mono2 uppercase text-steel2">
                  {label}
                </span>
                <span className="font-display text-[14px] text-bone">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Service history */}
        <div>
          <p className="font-mono text-[9px] tracking-mono2 uppercase text-steel2 mb-3">
            SERVICE HISTORY
          </p>

          {bookings.length > 0 ? (
            <div className="border border-ink4">
              {bookings.map((b, idx) => {
                const svcName   = b.service_ids?.[0] ? (svcMap.get(b.service_ids[0]) ?? '—') : '—'
                const statusCfg = STATUS_CFG[b.status] ?? STATUS_CFG.pending
                return (
                  <Link
                    key={b.id}
                    href={`/history/${b.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-ink2 transition-colors duration-120"
                    style={idx > 0 ? { borderTop: '1px solid #2A2F33' } : undefined}
                  >
                    <span className="font-mono text-[10px] tracking-mono uppercase text-steel3 flex-shrink-0 w-14">
                      {b.reference}
                    </span>
                    <span className="font-display text-[13px] text-bone flex-1 truncate">
                      {svcName}
                    </span>
                    <span className="font-mono text-[10px] tracking-mono text-steel3 flex-shrink-0">
                      {smartDate(b.scheduled_start)}
                    </span>
                    <span
                      className="font-mono text-[8px] tracking-mono uppercase px-1.5 py-0.5 leading-none flex-shrink-0"
                      style={{ background: statusCfg.bg, color: statusCfg.color }}
                    >
                      {statusCfg.label}
                    </span>
                    <span className="font-mono text-[10px] tracking-mono text-bone flex-shrink-0 text-right">
                      {formatMUR(b.estimated_cost_mur)}
                    </span>
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className="font-mono text-[10px] tracking-mono uppercase text-steel2">
              No service history yet
            </p>
          )}
        </div>

      </main>

      <BottomNav />
    </>
  )
}
