'use client'

import { useState } from 'react'
import Link from 'next/link'

type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'complete' | 'cancelled'

interface AdminBooking {
  id: string
  reference: string
  service_ids: string[]
  bay_number: number | null
  scheduled_start: string
  status: BookingStatus
  assigned_mechanic_id: string | null
  clients: { name: string; phone: string } | null
  vehicles: { registration: string; make: string; model: string; year: number } | null
  mechanics: { name: string; initials: string; color_hex: string } | null
}

interface AdminBookingsListProps {
  bookings: AdminBooking[]
  svcMap: Record<string, string>
}

// Admin status config — confirmed = blue (distinguishes from complete)
const STATUS_CFG: Record<BookingStatus, { label: string; bg: string; color: string }> = {
  pending:     { label: 'PENDING',     bg: '#F5C518', color: '#0B0D0E' },
  confirmed:   { label: 'CONFIRMED',   bg: '#3B82F6', color: '#F2EFEA' },
  in_progress: { label: 'IN PROGRESS', bg: '#FF5A1F', color: '#F2EFEA' },
  complete:    { label: 'COMPLETE',    bg: '#2F9E5A', color: '#F2EFEA' },
  cancelled:   { label: 'CANCELLED',   bg: '#2A2F33', color: '#8B9197' },
}

type FilterTab = 'ALL' | BookingStatus

const TABS: { label: string; value: FilterTab }[] = [
  { label: 'ALL',         value: 'ALL' },
  { label: 'PENDING',     value: 'pending' },
  { label: 'CONFIRMED',   value: 'confirmed' },
  { label: 'IN PROGRESS', value: 'in_progress' },
  { label: 'COMPLETE',    value: 'complete' },
  { label: 'CANCELLED',   value: 'cancelled' },
]

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const sameYear = d.getFullYear() === new Date().getFullYear()
  const datePart = sameYear
    ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase()
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()
  const timePart = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${datePart} · ${timePart}`
}

export function AdminBookingsList({ bookings, svcMap }: AdminBookingsListProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL')

  const filtered = activeTab === 'ALL'
    ? bookings
    : bookings.filter(b => b.status === activeTab)

  return (
    <div>
      {/* Filter tabs */}
      <div
        className="flex overflow-x-auto"
        style={{ borderBottom: '1px solid #2A2F33', scrollbarWidth: 'none' }}
      >
        {TABS.map(tab => {
          const isActive = tab.value === activeTab
          const count = tab.value === 'ALL'
            ? bookings.length
            : bookings.filter(b => b.status === tab.value).length
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-3 transition-colors duration-120"
              style={{
                color:     isActive ? '#FF5A1F' : '#5C6369',
                boxShadow: isActive ? 'inset 0 -2px 0 #FF5A1F' : 'none',
              }}
            >
              <span className="font-mono text-[10px] tracking-mono uppercase">
                {tab.label}
              </span>
              {count > 0 && (
                <span
                  className="font-mono text-[8px] tracking-mono px-1 leading-none py-0.5"
                  style={{ background: '#2A2F33', color: '#8B9197' }}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Booking list */}
      {filtered.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <p className="font-mono text-[11px] tracking-mono2 uppercase text-steel2">
            No bookings
          </p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: '#2A2F33' }}>
          {filtered.map(b => {
            const cfg     = STATUS_CFG[b.status] ?? STATUS_CFG.pending
            const svcName = b.service_ids?.[0] ? (svcMap[b.service_ids[0]] ?? '—') : '—'
            const client  = b.clients
            const vehicle = b.vehicles
            const mech    = b.mechanics

            return (
              <Link
                key={b.id}
                href={`/admin/bookings/${b.id}`}
                className="block px-6 py-4 hover:bg-ink2 transition-colors duration-120"
                style={{ borderBottom: '1px solid #2A2F33' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[11px] tracking-mono uppercase text-steel3">
                    {b.reference}
                  </span>
                  <span
                    className="font-mono text-[8px] tracking-mono uppercase px-1.5 py-0.5 leading-none"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                </div>

                <p className="font-display font-semibold text-[14px] text-bone mb-1">
                  {svcName}
                </p>

                <div className="flex items-center gap-2 flex-wrap">
                  {client && (
                    <span className="font-mono text-[10px] tracking-mono uppercase text-steel3">
                      {client.name}
                    </span>
                  )}
                  {vehicle && (
                    <>
                      <span className="text-steel" aria-hidden>·</span>
                      <span className="font-mono text-[10px] tracking-mono uppercase text-steel3">
                        {vehicle.registration}
                      </span>
                    </>
                  )}
                  {b.bay_number != null && (
                    <>
                      <span className="text-steel" aria-hidden>·</span>
                      <span className="font-mono text-[10px] tracking-mono uppercase text-steel3">
                        BAY {b.bay_number}
                      </span>
                    </>
                  )}
                  {mech && (
                    <>
                      <span className="text-steel" aria-hidden>·</span>
                      <span
                        className="font-mono text-[9px] tracking-mono uppercase px-1 py-0.5 leading-none"
                        style={{ background: mech.color_hex + '33', color: mech.color_hex }}
                      >
                        {mech.initials}
                      </span>
                    </>
                  )}
                </div>

                <p className="font-mono text-[10px] tracking-mono text-steel2 mt-1.5">
                  {formatDateTime(b.scheduled_start)}
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
