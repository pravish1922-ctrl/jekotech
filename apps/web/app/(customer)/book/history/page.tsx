'use client'

import { useEffect, useState } from 'react'
import { createBrowserSupabaseClient as createBrowserClient } from '../../../../lib/supabase-browser'
import { useBooking } from '../booking-context'

interface PastBooking {
  reference:      string
  service_ids:    string[]
  scheduled_start: string
  final_cost_mur: number | null
}

interface Service {
  id:   string
  name: string
}

function formatMUR(n: number): string {
  return `₨ ${n.toLocaleString('en-US')}`
}

function formatDate(iso: string): string {
  return new Date(iso)
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase()
}

export default function VehicleHistoryPage() {
  const { vehicleId, registration, setCanProceed } = useBooking()

  const [bookings,  setBookings]  = useState<PastBooking[]>([])
  const [svcMap,    setSvcMap]    = useState<Map<string, string>>(new Map())
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    setCanProceed(true) // always enabled
  }, [setCanProceed])

  useEffect(() => {
    if (!vehicleId) { setLoading(false); return }

    const sb = createBrowserClient()
    sb.from('bookings')
      .select('reference, service_ids, scheduled_start, final_cost_mur')
      .eq('vehicle_id', vehicleId)
      .eq('status', 'complete')
      .order('scheduled_start', { ascending: false })
      .limit(4)
      .then(async ({ data }) => {
        const rows = (data as PastBooking[]) ?? []
        setBookings(rows)

        const ids = rows.flatMap(r => r.service_ids).filter(Boolean)
        if (ids.length > 0) {
          const { data: svcs } = await sb
            .from('services')
            .select('id, name')
            .in('id', ids)
          setSvcMap(new Map(((svcs as Service[]) ?? []).map(s => [s.id, s.name])))
        }
        setLoading(false)
      })
  }, [vehicleId])

  return (
    <div className="px-6 pt-10 pb-4">
      <p className="font-mono text-[9px] tracking-mono2 uppercase text-steel2 mb-3">
        STEP 4 OF 8
      </p>
      <h1 className="font-display text-[28px] font-bold text-bone tracking-tighter mb-2">
        Service history
      </h1>
      <p className="font-mono text-[10px] tracking-mono uppercase text-steel3 mb-8">
        {registration || 'Vehicle'}
      </p>

      {loading ? (
        <p className="font-mono text-[10px] tracking-mono uppercase text-steel2">Loading…</p>
      ) : bookings.length > 0 ? (
        <div className="border border-ink4">
          {bookings.map((b, idx) => {
            const svcName = b.service_ids?.[0] ? (svcMap.get(b.service_ids[0]) ?? '—') : '—'
            return (
              <div
                key={b.reference}
                className="flex items-center gap-3 px-4 py-3"
                style={idx > 0 ? { borderTop: '1px solid #2A2F33' } : undefined}
              >
                <span className="font-mono text-[10px] tracking-mono uppercase text-steel3 flex-shrink-0 w-16">
                  {b.reference}
                </span>
                <span className="font-display text-[13px] text-bone flex-1 truncate">
                  {svcName}
                </span>
                <span className="font-mono text-[10px] tracking-mono text-steel3 flex-shrink-0">
                  {formatDate(b.scheduled_start)}
                </span>
                <span className="font-mono text-[10px] tracking-mono text-bone flex-shrink-0 text-right">
                  {b.final_cost_mur != null ? formatMUR(b.final_cost_mur) : '—'}
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="font-mono text-[10px] tracking-mono uppercase text-steel2">
          No previous services on record for this vehicle.
        </p>
      )}
    </div>
  )
}
