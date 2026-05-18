import { createServerSupabaseClient as createServerClient } from '../../../lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BottomNav } from '../../../components/ui/bottom-nav'

// ── Types ─────────────────────────────────────────────────────────────────────

type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'complete' | 'cancelled'

interface UpcomingBooking {
  id: string
  reference: string
  service_ids: string[]
  bay_number: number
  scheduled_start: string
  status: BookingStatus
  assigned_mechanic_id: string | null
}

interface CompletedVisit {
  id: string
  reference: string
  service_ids: string[]
  scheduled_start: string
}

interface Vehicle {
  id: string
  registration: string
  make: string
  model: string
  year: number
  mileage: number
  colour: string | null
}

interface TimelineEntry {
  id: string
  reference: string
  service_ids: string[]
  scheduled_start: string
  tag: 'UPCOMING' | 'PAST'
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase()
  }
  return (parts[0]?.[0] ?? '?').toUpperCase()
}

function parseDate(iso: string) {
  const d = new Date(iso)
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return {
    weekday: d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase(),
    day:     String(d.getDate()),
    month:   d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase(),
    year:    sameYear ? null : String(d.getFullYear()),
    time:    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
  }
}

function smartDate(iso: string): string {
  const d = new Date(iso)
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return sameYear
    ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase()
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()
}

// ── Status pill ───────────────────────────────────────────────────────────────

const STATUS_CFG: Record<BookingStatus, { label: string; bg: string; color: string }> = {
  pending:     { label: 'PENDING',     bg: '#F5C518', color: '#0B0D0E' },
  confirmed:   { label: 'CONFIRMED',   bg: '#2F9E5A', color: '#F2EFEA' },
  in_progress: { label: 'IN PROGRESS', bg: '#FF5A1F', color: '#F2EFEA' },
  complete:    { label: 'COMPLETE',    bg: '#2A2F33', color: '#8B9197' },
  cancelled:   { label: 'CANCELLED',   bg: '#2A2F33', color: '#8B9197' },
}

function StatusPill({ status }: { status: BookingStatus }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending
  return (
    <span
      className="font-mono text-[9px] tracking-mono uppercase px-2 py-0.5 leading-none"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const supabase = createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  // Phase 1 — parallel fetches
  const [
    { data: clientRaw },
    { data: bookingsRaw },
    { data: vehiclesRaw },
    { data: completedRaw },
  ] = await Promise.all([
    supabase
      .from('clients')
      .select('name')
      .eq('id', user.id)
      .single(),

    // All upcoming regardless of time — status is the source of truth
    supabase
      .from('bookings')
      .select('id, reference, service_ids, bay_number, scheduled_start, status, assigned_mechanic_id')
      .eq('client_id', user.id)
      .in('status', ['pending', 'confirmed', 'in_progress'])
      .order('scheduled_start', { ascending: true }),

    supabase
      .from('vehicles')
      .select('id, registration, make, model, year, mileage, colour')
      .eq('owner_client_id', user.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('bookings')
      .select('id, reference, service_ids, scheduled_start')
      .eq('client_id', user.id)
      .eq('status', 'completed')
      .order('scheduled_start', { ascending: false })
      .limit(3),
  ])

  const upcomingBookings  = (bookingsRaw  as UpcomingBooking[]  | null) ?? []
  const vehicles          = (vehiclesRaw  as Vehicle[]          | null) ?? []
  const completedVisits   = (completedRaw as CompletedVisit[]   | null) ?? []

  // Phase 2 — service names for upcoming + completed
  const allSvcIds = [
    ...upcomingBookings.flatMap(b => b.service_ids),
    ...completedVisits.flatMap(v => v.service_ids),
  ].filter(Boolean)

  // Mechanic for the first upcoming booking only
  const nextBooking  = upcomingBookings[0] ?? null
  const mechPromise  = nextBooking?.assigned_mechanic_id
    ? supabase.from('mechanics').select('clients(name)').eq('id', nextBooking.assigned_mechanic_id).single()
    : Promise.resolve(null)

  const svcPromise = allSvcIds.length > 0
    ? supabase.from('services').select('id, name_en').in('id', allSvcIds)
    : Promise.resolve(null)

  const [mechResult, svcResult] = await Promise.all([mechPromise, svcPromise])

  type MechWithClient = { clients: { name: string } | null }
  const mechanicName = (mechResult?.data as MechWithClient | null)?.clients?.name ?? null

  const svcMap = new Map<string, string>(
    svcResult?.data
      ? (svcResult.data as { id: string; name_en: string }[]).map(s => [s.id, s.name_en])
      : [],
  )

  // Mixed timeline: upcoming first (ASC), then completed (DESC), capped at 3
  const upcomingSlice  = upcomingBookings.slice(0, 3)
  const completedSlice = completedVisits.slice(0, Math.max(0, 3 - upcomingSlice.length))
  const timeline: TimelineEntry[] = [
    ...upcomingSlice.map(b => ({ id: b.id, reference: b.reference, service_ids: b.service_ids, scheduled_start: b.scheduled_start, tag: 'UPCOMING' as const })),
    ...completedSlice.map(b => ({ ...b, tag: 'PAST' as const })),
  ]

  const fullName  = (clientRaw as { name: string } | null)?.name ?? ''
  const firstName = getFirstName(fullName)
  const initials  = getInitials(fullName)

  return (
    <>
      <main className="min-h-screen bg-ink max-w-md mx-auto pb-20">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="px-6 pt-10 pb-8 flex items-start justify-between">
          <div>
            <p className="font-mono text-[9px] tracking-mono2 uppercase text-steel2 mb-3">
              WELCOME BACK
            </p>
            <h1 className="font-display text-[32px] font-bold text-bone tracking-tighter leading-none">
              {firstName}.
            </h1>
          </div>

          {/* rounded-full is permitted for avatar circles — see tailwind.config.ts */}
          <div
            className="rounded-full bg-orange flex items-center justify-center flex-shrink-0 mt-1"
            style={{ width: 40, height: 40 }}
            aria-label={`Avatar for ${fullName}`}
          >
            <span className="font-display font-bold text-[13px] text-white select-none">
              {initials}
            </span>
          </div>
        </header>

        <div className="px-6 flex flex-col gap-5">

          {/* ── Upcoming booking cards ───────────────────────────────────── */}
          {upcomingBookings.length > 0 ? (
            <div className="flex flex-col gap-3">
              {upcomingBookings.map((booking, idx) => {
                const bd      = parseDate(booking.scheduled_start)
                const svcName = booking.service_ids?.[0]
                  ? (svcMap.get(booking.service_ids[0]) ?? 'Service')
                  : 'Service'

                return (
                  <Link
                    key={booking.id}
                    href={`/history/${booking.id}`}
                    className="block bg-ink2 border border-ink4 shadow-ticket hover:bg-ink3 transition-colors duration-120"
                    aria-label={`Booking ${booking.reference}`}
                  >
                    <div
                      className="flex items-center justify-between px-4 py-3"
                      style={{ borderBottom: '1px solid #2A2F33' }}
                    >
                      <span className="font-mono text-[11px] tracking-mono uppercase text-steel3">
                        {booking.reference}
                      </span>
                      <StatusPill status={booking.status} />
                    </div>

                    <div className="px-4 py-5">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-[10px] uppercase text-steel3 tracking-mono">
                          {bd.weekday}
                        </span>
                        <span className="font-display text-[28px] font-bold text-bone leading-none">
                          {bd.day}
                        </span>
                        <span className="font-mono text-[10px] uppercase text-steel3 tracking-mono">
                          {bd.month}
                        </span>
                        {bd.year && (
                          <span className="font-mono text-[10px] uppercase text-steel3 tracking-mono">
                            {bd.year}
                          </span>
                        )}
                        <span className="ml-auto font-mono text-[14px] text-bone tracking-mono">
                          {bd.time}
                        </span>
                      </div>
                      <p className="font-display font-semibold text-[15px] text-bone mt-3">
                        {svcName}
                      </p>
                    </div>

                    <div
                      className="flex items-center justify-between px-4 py-3"
                      style={{ borderTop: '1px solid #2A2F33' }}
                    >
                      <span className="font-mono text-[10px] tracking-mono uppercase text-steel3">
                        BAY {booking.bay_number}
                      </span>
                      {idx === 0 && mechanicName && (
                        <span className="font-mono text-[10px] tracking-mono uppercase text-steel3">
                          {mechanicName}
                        </span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="border border-ink4 px-5 py-8 text-center">
              <p className="font-display font-semibold text-[15px] text-bone mb-1">
                No upcoming bookings
              </p>
              <p className="font-mono text-[10px] tracking-mono uppercase text-steel2">
                Tap below to reserve your slot
              </p>
            </div>
          )}

          {/* ── Book CTA ────────────────────────────────────────────────── */}
          <Link
            href="/book"
            className="w-full flex items-center justify-center gap-2 bg-orange hover:bg-orangeDeep text-white font-display font-semibold text-[15px] tracking-[0.06em] uppercase transition-colors duration-120"
            style={{ height: 56 }}
          >
            BOOK THE WORKSHOP <span aria-hidden>→</span>
          </Link>

          {/* ── Your fleet ──────────────────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="font-mono text-[9px] tracking-mono2 uppercase text-steel2">
                YOUR FLEET
              </p>
              {vehicles.length > 0 && (
                <Link
                  href="/fleet"
                  className="font-mono text-[9px] tracking-mono2 uppercase text-orange hover:text-orangeDeep transition-colors duration-120"
                >
                  SEE ALL →
                </Link>
              )}
            </div>
            {vehicles.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {vehicles.slice(0, 2).map(v => (
                  <li
                    key={v.id}
                    className="flex items-center gap-4 border border-ink4 px-4 py-3"
                  >
                    <div
                      className="flex items-center justify-center bg-ink flex-shrink-0 px-2"
                      style={{ height: 32, border: '1px solid #2A2F33' }}
                    >
                      <span className="font-mono text-[11px] font-bold tracking-mono uppercase text-bone">
                        {v.registration}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-display font-semibold text-[14px] text-bone leading-tight">
                        {v.make} {v.model}
                      </p>
                      <p className="font-mono text-[10px] tracking-mono uppercase text-steel3 mt-0.5">
                        {v.year}{v.colour ? ` · ${v.colour}` : ''} · {v.mileage.toLocaleString('en-US')} mi
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-mono text-[10px] tracking-mono uppercase text-steel2">
                No vehicles yet — add one when booking
              </p>
            )}
          </section>

          {/* ── Activity timeline ───────────────────────────────────────── */}
          <section className="pb-2">
            <div className="flex items-center justify-between mb-3">
              <p className="font-mono text-[9px] tracking-mono2 uppercase text-steel2">
                RECENT VISITS
              </p>
              <Link
                href="/history"
                className="font-mono text-[9px] tracking-mono2 uppercase text-orange hover:text-orangeDeep transition-colors duration-120"
              >
                SEE ALL →
              </Link>
            </div>

            {timeline.length > 0 ? (
              <div className="border border-ink4">
                {timeline.map((entry, idx) => {
                  const svcName = entry.service_ids?.[0]
                    ? (svcMap.get(entry.service_ids[0]) ?? '—')
                    : '—'
                  const isUpcoming = entry.tag === 'UPCOMING'
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 px-4 py-3"
                      style={idx > 0 ? { borderTop: '1px solid #2A2F33' } : undefined}
                    >
                      <span
                        className="font-mono text-[8px] tracking-mono uppercase px-1.5 py-0.5 leading-none flex-shrink-0"
                        style={{
                          background: isUpcoming ? '#F5C518' : '#2A2F33',
                          color:      isUpcoming ? '#0B0D0E' : '#8B9197',
                        }}
                      >
                        {entry.tag}
                      </span>
                      <span className="font-mono text-[10px] tracking-mono uppercase text-steel3 flex-shrink-0 w-14">
                        {entry.reference}
                      </span>
                      <span className="font-display text-[13px] text-bone flex-1 truncate">
                        {svcName}
                      </span>
                      <span className="font-mono text-[10px] tracking-mono text-steel3 flex-shrink-0">
                        {smartDate(entry.scheduled_start)}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="font-mono text-[10px] tracking-mono uppercase text-steel2">
                No visits yet
              </p>
            )}
          </section>

        </div>
      </main>

      <BottomNav />
    </>
  )
}
