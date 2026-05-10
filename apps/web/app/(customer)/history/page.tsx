import { createServerSupabaseClient as createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BottomNav } from '@/components/ui/bottom-nav'
import { HistoryList } from './history-list'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Booking {
  id:             string
  reference:      string
  service_ids:    string[]
  scheduled_start: string
  status:         string
  estimated_cost_mur: number
  final_cost_mur: number | null
  vehicles:       { registration: string } | null
}

interface KpiData {
  visits:    number
  spend:     number
  lastDate:  string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatMUR(n: number): string {
  return `₨ ${n.toLocaleString('en-US')}`
}

function formatKpiDate(iso: string): string {
  return new Date(iso)
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
    .toUpperCase()
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HistoryPage() {
  const supabase = createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const [{ data: bookingsRaw }, { data: kpiRaw }] = await Promise.all([
    supabase
      .from('bookings')
      .select('id, reference, service_ids, scheduled_start, status, estimated_cost_mur, final_cost_mur, vehicles(registration)')
      .eq('client_id', user.id)
      .order('scheduled_start', { ascending: false }),

    supabase
      .from('bookings')
      .select('final_cost_mur, scheduled_start')
      .eq('client_id', user.id)
      .eq('status', 'complete'),
  ])

  const bookings = (bookingsRaw as Booking[] | null) ?? []
  const complete = (kpiRaw as { final_cost_mur: number | null; scheduled_start: string }[] | null) ?? []

  const kpi: KpiData = {
    visits:   complete.length,
    spend:    complete.reduce((acc, b) => acc + (b.final_cost_mur ?? 0), 0),
    lastDate: complete.length > 0
      ? complete.sort((a, b) =>
          new Date(b.scheduled_start).getTime() - new Date(a.scheduled_start).getTime()
        )[0].scheduled_start
      : null,
  }

  // Fetch service name map
  const allSvcIds = bookings.flatMap(b => b.service_ids).filter(Boolean)
  const { data: svcRaw } = allSvcIds.length > 0
    ? await supabase.from('services').select('id, name').in('id', allSvcIds)
    : { data: [] }

  const svcMap = new Map(
    ((svcRaw as { id: string; name: string }[] | null) ?? []).map(s => [s.id, s.name])
  )

  return (
    <>
      <main className="min-h-screen bg-ink max-w-md mx-auto pb-20">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="px-6 pt-10 pb-6">
          <p className="font-mono text-[9px] tracking-mono2 uppercase text-steel2 mb-3">
            SERVICE LOG
          </p>
          <h1 className="font-display text-[28px] font-bold text-bone tracking-tighter">
            Your visits.
          </h1>
        </header>

        {/* ── KPI chips ───────────────────────────────────────────────────── */}
        <div className="flex mx-6 mb-6" style={{ borderTop: '1px solid #2A2F33', borderBottom: '1px solid #2A2F33' }}>
          {[
            { label: 'VISITS',         value: String(kpi.visits) },
            { label: 'TOTAL SPEND',    value: kpi.spend > 0 ? formatMUR(kpi.spend) : '—' },
            { label: 'LAST IN',        value: kpi.lastDate ? formatKpiDate(kpi.lastDate) : '—' },
          ].map(({ label, value }, idx) => (
            <div
              key={label}
              className="flex-1 flex flex-col items-center justify-center py-4 gap-1"
              style={idx > 0 ? { borderLeft: '1px solid #2A2F33' } : undefined}
            >
              <span className="font-display font-bold text-[16px] text-bone">
                {value}
              </span>
              <span className="font-mono text-[8px] tracking-mono2 uppercase text-steel3">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* ── Filter tabs + booking list (client component for interactivity) */}
        <HistoryList bookings={bookings} svcMap={Object.fromEntries(svcMap)} />

      </main>

      <BottomNav />
    </>
  )
}
