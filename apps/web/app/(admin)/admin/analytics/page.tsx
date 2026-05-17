import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

function serviceDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:     { bg: '#F5C518', color: '#0B0D0E' },
  confirmed:   { bg: '#3B82F6', color: '#fff' },
  in_progress: { bg: '#FF5A1F', color: '#fff' },
  completed:   { bg: '#2F9E5A', color: '#fff' },
  cancelled:   { bg: '#2A2F33', color: '#8B9197' },
}

const RANGE_OPTIONS = [
  { key: '7d',  label: '7D' },
  { key: '30d', label: '30D' },
  { key: '90d', label: '90D' },
  { key: 'all', label: 'ALL' },
]

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: { range?: string }
}) {
  const supabase = serviceDb()
  const range = searchParams?.range ?? '30d'

  const now = new Date()
  let dateFrom: Date | null = null
  if (range === '7d') {
    dateFrom = new Date(now)
    dateFrom.setDate(now.getDate() - 7)
  } else if (range === '30d') {
    dateFrom = new Date(now)
    dateFrom.setDate(now.getDate() - 30)
  } else if (range === '90d') {
    dateFrom = new Date(now)
    dateFrom.setDate(now.getDate() - 90)
  }

  let query = supabase
    .from('bookings')
    .select('id, reference, status, final_cost_mur, estimated_cost_mur, scheduled_start, service_ids, client_id')
    .order('scheduled_start', { ascending: false })

  if (dateFrom) {
    query = query.gte('scheduled_start', dateFrom.toISOString())
  }

  const { data: bookings } = await query
  const rows = bookings ?? []

  // Split rows by status
  const completedRows  = rows.filter(b => b.status === 'completed')
  const inProgressRows = rows.filter(b => b.status === 'in_progress')
  const cancelledRows  = rows.filter(b => b.status === 'cancelled')
  const awaitingRows   = rows.filter(b => b.status === 'pending' || b.status === 'confirmed')

  // Revenue KPIs
  const totalRevenue    = completedRows.reduce((s, b) => s + (b.final_cost_mur ?? b.estimated_cost_mur ?? 0), 0)
  const inProgressValue = inProgressRows.reduce((s, b) => s + (b.estimated_cost_mur ?? 0), 0)
  const lostRevenue     = cancelledRows.reduce((s, b) => s + (b.estimated_cost_mur ?? 0), 0)

  // Count KPIs
  const awaitingCount   = awaitingRows.length
  const inProgressCount = inProgressRows.length
  const completedCount  = completedRows.length
  const cancelledCount  = cancelledRows.length

  // Stats KPIs
  const nonCancelledWithCost = rows
    .filter(b => b.status !== 'cancelled')
    .filter(b => (b.final_cost_mur ?? b.estimated_cost_mur) != null)
  const avgBookingValue = nonCancelledWithCost.length > 0
    ? Math.round(nonCancelledWithCost.reduce((s, b) => s + (b.final_cost_mur ?? b.estimated_cost_mur ?? 0), 0) / nonCancelledWithCost.length)
    : 0

  const clientBookingCounts: Record<string, number> = {}
  for (const b of rows) {
    if (b.client_id) clientBookingCounts[b.client_id] = (clientBookingCounts[b.client_id] ?? 0) + 1
  }
  const returningClientsCount = Object.values(clientBookingCounts).filter(c => c > 1).length
  const totalDistinctClients  = Object.keys(clientBookingCounts).length

  // Revenue by service — exclude cancelled
  const allSvcIds = [...new Set(rows.flatMap(b => b.service_ids ?? []))]
  const { data: services } = allSvcIds.length
    ? await supabase.from('services').select('id, name_en').in('id', allSvcIds)
    : { data: [] as { id: string; name_en: string }[] }

  const serviceMap = Object.fromEntries((services ?? []).map(s => [s.id, s.name_en as string]))

  const revenueByService: Record<string, { name: string; revenue: number; count: number }> = {}
  for (const b of rows) {
    if (b.status === 'cancelled') continue
    const cost = b.final_cost_mur ?? b.estimated_cost_mur
    if (!cost || !b.service_ids?.length) continue
    const perSvc = Math.round(cost / b.service_ids.length)
    for (const sid of b.service_ids) {
      if (!revenueByService[sid]) revenueByService[sid] = { name: serviceMap[sid] ?? sid, revenue: 0, count: 0 }
      revenueByService[sid].revenue += perSvc
      revenueByService[sid].count   += 1
    }
  }
  const topServices   = Object.values(revenueByService).sort((a, b) => b.revenue - a.revenue).slice(0, 6)
  const maxSvcRevenue = topServices[0]?.revenue ?? 1

  // Bookings per day — last 14 days (always shows 14-day window regardless of range)
  const chartEnd = new Date(now)
  chartEnd.setHours(23, 59, 59, 999)
  const chartDays: { label: string; date: string; count: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(chartEnd)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const day = d.getDate()
    const mon = d.toLocaleString('en-GB', { month: 'short' }).toUpperCase().slice(0, 3)
    chartDays.push({ label: `${day} ${mon}`, date: dateStr, count: 0 })
  }
  for (const b of rows) {
    if (!b.scheduled_start) continue
    const dateStr = b.scheduled_start.slice(0, 10)
    const slot = chartDays.find(d => d.date === dateStr)
    if (slot) slot.count++
  }
  const maxDay = Math.max(...chartDays.map(d => d.count), 1)

  // Client names for recent activity
  const recentRows      = rows.slice(0, 10)
  const recentClientIds = [...new Set(recentRows.map(b => b.client_id).filter(Boolean))]
  const { data: clients } = recentClientIds.length
    ? await supabase.from('clients').select('id, name').in('id', recentClientIds)
    : { data: [] as { id: string; name: string }[] }
  const clientMap = Object.fromEntries((clients ?? []).map(c => [c.id, c.name as string]))

  return (
    <div style={{ minHeight: '100vh', background: '#0B0D0E', paddingBottom: 80 }}>
      <div className="px-6 py-5" style={{ borderBottom: '1px solid #2A2F33' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#F2EFEA', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}>
              ANALYTICS
            </h1>
            <p className="text-xs mt-0.5" style={{ color: '#F2EFEA66', fontFamily: 'JetBrains Mono, monospace' }}>
              REVENUE & BOOKINGS OVERVIEW
            </p>
          </div>

          <div className="flex gap-1">
            {RANGE_OPTIONS.map(opt => (
              <Link
                key={opt.key}
                href={`/admin/analytics?range=${opt.key}`}
                className="px-3 py-1.5 text-[10px] font-bold"
                style={{
                  background: range === opt.key ? '#FF5A1F' : '#15181A',
                  color: range === opt.key ? '#fff' : '#F2EFEA66',
                  border: range === opt.key ? 'none' : '1px solid #2A2F33',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 mt-6 flex flex-col gap-6 max-w-3xl">

        {/* Revenue KPI Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4" style={{ background: '#15181A', border: '1px solid #2A2F33', boxShadow: '4px 4px 0 #0B0D0E' }}>
            <p className="text-[10px] font-bold mb-1" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>TOTAL REVENUE</p>
            <p className="text-2xl font-bold" style={{ color: '#2F9E5A', fontFamily: 'Space Grotesk, sans-serif' }}>₨{totalRevenue.toLocaleString()}</p>
            <p className="text-[9px] mt-1" style={{ color: '#F2EFEA33', fontFamily: 'JetBrains Mono, monospace' }}>COMPLETED ONLY</p>
          </div>
          <div className="p-4" style={{ background: '#15181A', border: '1px solid #2A2F33', boxShadow: '4px 4px 0 #0B0D0E' }}>
            <p className="text-[10px] font-bold mb-1" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>IN PROGRESS VALUE</p>
            <p className="text-2xl font-bold" style={{ color: '#FF5A1F', fontFamily: 'Space Grotesk, sans-serif' }}>₨{inProgressValue.toLocaleString()}</p>
            <p className="text-[9px] mt-1" style={{ color: '#F2EFEA33', fontFamily: 'JetBrains Mono, monospace' }}>EST. COST</p>
          </div>
          <div className="p-4" style={{ background: '#15181A', border: '1px solid #2A2F33', boxShadow: '4px 4px 0 #0B0D0E' }}>
            <p className="text-[10px] font-bold mb-1" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>LOST REVENUE</p>
            <p className="text-2xl font-bold" style={{ color: '#8B9197', fontFamily: 'Space Grotesk, sans-serif' }}>₨{lostRevenue.toLocaleString()}</p>
            <p className="text-[9px] mt-1" style={{ color: '#F2EFEA33', fontFamily: 'JetBrains Mono, monospace' }}>CANCELLED</p>
          </div>
        </div>

        {/* Count KPI Cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'AWAITING',    value: awaitingCount.toString(),   accent: '#F5C518', sub: 'PENDING + CONFIRMED' },
            { label: 'IN PROGRESS', value: inProgressCount.toString(), accent: '#FF5A1F', sub: 'ACTIVE JOBS' },
            { label: 'COMPLETED',   value: completedCount.toString(),  accent: '#2F9E5A', sub: 'FINISHED' },
            { label: 'CANCELLED',   value: cancelledCount.toString(),  accent: '#8B9197', sub: 'DROPPED' },
          ].map(({ label, value, accent, sub }) => (
            <div key={label} className="p-4" style={{ background: '#15181A', border: '1px solid #2A2F33', boxShadow: '4px 4px 0 #0B0D0E' }}>
              <p className="text-[10px] font-bold mb-1" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>{label}</p>
              <p className="text-2xl font-bold" style={{ color: accent, fontFamily: 'Space Grotesk, sans-serif' }}>{value}</p>
              <p className="text-[9px] mt-1" style={{ color: '#F2EFEA33', fontFamily: 'JetBrains Mono, monospace' }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Stats KPI Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4" style={{ background: '#15181A', border: '1px solid #2A2F33', boxShadow: '4px 4px 0 #0B0D0E' }}>
            <p className="text-[10px] font-bold mb-1" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>AVG VALUE</p>
            <p className="text-2xl font-bold" style={{ color: '#3B82F6', fontFamily: 'Space Grotesk, sans-serif' }}>₨{avgBookingValue.toLocaleString()}</p>
            <p className="text-[9px] mt-1" style={{ color: '#F2EFEA33', fontFamily: 'JetBrains Mono, monospace' }}>PER BOOKING</p>
          </div>
          <div className="p-4" style={{ background: '#15181A', border: '1px solid #2A2F33', boxShadow: '4px 4px 0 #0B0D0E' }}>
            <p className="text-[10px] font-bold mb-1" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>RETURNING</p>
            <p className="text-2xl font-bold" style={{ color: '#3B82F6', fontFamily: 'Space Grotesk, sans-serif' }}>{returningClientsCount}</p>
            <p className="text-[9px] mt-1" style={{ color: '#F2EFEA33', fontFamily: 'JetBrains Mono, monospace' }}>REPEAT CLIENTS</p>
          </div>
          <div className="p-4" style={{ background: '#15181A', border: '1px solid #2A2F33', boxShadow: '4px 4px 0 #0B0D0E' }}>
            <p className="text-[10px] font-bold mb-1" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>TOTAL CLIENTS</p>
            <p className="text-2xl font-bold" style={{ color: '#3B82F6', fontFamily: 'Space Grotesk, sans-serif' }}>{totalDistinctClients}</p>
            <p className="text-[9px] mt-1" style={{ color: '#F2EFEA33', fontFamily: 'JetBrains Mono, monospace' }}>UNIQUE</p>
          </div>
        </div>

        {/* 14-day bar chart */}
        <div className="p-4" style={{ background: '#15181A', border: '1px solid #2A2F33', boxShadow: '4px 4px 0 #0B0D0E' }}>
          <h2 className="text-[10px] font-bold mb-4" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>
            BOOKINGS · LAST 14 DAYS
          </h2>
          <div className="flex items-end gap-1" style={{ height: 80 }}>
            {chartDays.map(d => {
              const pct = Math.round((d.count / maxDay) * 100)
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center">
                  <div
                    style={{
                      width: '100%',
                      height: `${Math.max(pct, d.count > 0 ? 4 : 2)}%`,
                      minHeight: d.count > 0 ? 4 : 2,
                      background: d.count > 0 ? '#FF5A1F' : '#2A2F33',
                    }}
                  />
                </div>
              )
            })}
          </div>
          <div className="flex gap-1 mt-1">
            {chartDays.map((d, i) => (
              <div key={d.date} className="flex-1 text-center" style={{ fontSize: 7, color: '#F2EFEA22', fontFamily: 'JetBrains Mono, monospace', overflow: 'hidden' }}>
                {i % 2 === 0 ? d.label.split(' ')[0] : ''}
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by service */}
        {topServices.length > 0 && (
          <div className="p-4" style={{ background: '#15181A', border: '1px solid #2A2F33', boxShadow: '4px 4px 0 #0B0D0E' }}>
            <h2 className="text-[10px] font-bold mb-3" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>
              REVENUE BY SERVICE
            </h2>
            <div className="flex flex-col gap-3">
              {topServices.map(svc => {
                const pct = Math.round((svc.revenue / maxSvcRevenue) * 100)
                return (
                  <div key={svc.name}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs" style={{ color: '#F2EFEA', fontFamily: 'Inter, sans-serif' }}>{svc.name}</span>
                      <span className="text-xs" style={{ color: '#F2EFEA66', fontFamily: 'JetBrains Mono, monospace' }}>₨{svc.revenue.toLocaleString()} · {svc.count}</span>
                    </div>
                    <div style={{ height: 4, background: '#2A2F33' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: '#FF5A1F' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recent activity */}
        <div className="p-4" style={{ background: '#15181A', border: '1px solid #2A2F33', boxShadow: '4px 4px 0 #0B0D0E' }}>
          <h2 className="text-[10px] font-bold mb-3" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>
            RECENT ACTIVITY
          </h2>
          {recentRows.length === 0 && (
            <p className="text-xs text-center py-4" style={{ color: '#F2EFEA22', fontFamily: 'JetBrains Mono, monospace' }}>NO BOOKINGS YET</p>
          )}
          {recentRows.map(b => {
            const ss = STATUS_STYLE[b.status] ?? STATUS_STYLE.cancelled
            return (
              <div key={b.id} className="flex items-center justify-between py-2" style={{ borderTop: '1px solid #2A2F33' }}>
                <div>
                  <span className="text-sm font-bold" style={{ color: '#FF5A1F', fontFamily: 'Space Grotesk, sans-serif' }}>{b.reference}</span>
                  <span className="text-xs ml-2" style={{ color: '#F2EFEA66', fontFamily: 'Inter, sans-serif' }}>{clientMap[b.client_id] ?? '—'}</span>
                </div>
                <div className="flex items-center gap-3">
                  {(b.final_cost_mur ?? b.estimated_cost_mur) ? (
                    <span className="text-xs" style={{ color: '#F2EFEA66', fontFamily: 'JetBrains Mono, monospace' }}>
                      ₨{(b.final_cost_mur ?? b.estimated_cost_mur).toLocaleString()}
                    </span>
                  ) : null}
                  <span className="text-[10px] font-bold px-2 py-0.5" style={{ background: ss.bg, color: ss.color, fontFamily: 'JetBrains Mono, monospace' }}>
                    {b.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
