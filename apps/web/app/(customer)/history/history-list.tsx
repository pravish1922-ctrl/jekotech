'use client'

import { useState } from 'react'
import Link from 'next/link'

type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'complete' | 'cancelled'

interface Booking {
  id:                 string
  reference:          string
  service_ids:        string[]
  scheduled_start:    string
  status:             string
  estimated_cost_mur: number
  final_cost_mur:     number | null
  vehicles?:          { registration: string } | null
}

type Filter = 'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED'

const UPCOMING_STATUSES = new Set(['pending', 'confirmed', 'in_progress'])

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
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

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending
  return (
    <span
      className="font-mono text-[9px] tracking-mono uppercase px-2 py-0.5 leading-none flex-shrink-0"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  )
}

function applyFilter(bookings: Booking[], filter: Filter): Booking[] {
  switch (filter) {
    case 'UPCOMING':
      return bookings
        .filter(b => UPCOMING_STATUSES.has(b.status))
        .slice()
        .sort((a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime())
    case 'COMPLETED': return bookings.filter(b => b.status === 'completed')
    case 'CANCELLED': return bookings.filter(b => b.status === 'cancelled')
    default:          return bookings
  }
}

const FILTERS: Filter[] = ['ALL', 'UPCOMING', 'COMPLETED', 'CANCELLED']

interface Props {
  bookings: Booking[]
  svcMap:   Record<string, string>
}

export function HistoryList({ bookings, svcMap }: Props) {
  const [activeFilter, setActiveFilter] = useState<Filter>('ALL')

  const filtered = applyFilter(bookings, activeFilter)

  return (
    <div className="px-6">
      {/* Filter tabs */}
      <div
        className="flex overflow-x-auto gap-0 mb-6"
        style={{ borderBottom: '1px solid #2A2F33' }}
      >
        {FILTERS.map(f => {
          const isActive = f === activeFilter
          return (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              className="flex-shrink-0 px-4 py-3 font-mono text-[10px] tracking-mono uppercase transition-colors duration-120"
              style={{
                color:        isActive ? '#FF5A1F' : '#5C6369',
                borderBottom: isActive ? '2px solid #FF5A1F' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {f}
            </button>
          )
        })}
      </div>

      {/* Booking cards */}
      {filtered.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {filtered.map(b => {
            const svcName = b.service_ids?.[0] ? (svcMap[b.service_ids[0]] ?? '—') : '—'
            const cost    = b.final_cost_mur ?? b.estimated_cost_mur
            const reg     = b.vehicles?.registration ?? '—'

            return (
              <li key={b.id}>
                <Link
                  href={`/history/${b.id}`}
                  className="block border border-ink4 shadow-ticket bg-ink2 hover:bg-ink3 transition-colors duration-120"
                >
                  {/* Top strip */}
                  <div
                    className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: '1px solid #2A2F33' }}
                  >
                    <span className="font-mono text-[11px] tracking-mono uppercase text-steel3">
                      {b.reference}
                    </span>
                    <StatusPill status={b.status} />
                  </div>

                  {/* Middle */}
                  <div className="px-4 py-3">
                    <p className="font-display font-semibold text-[14px] text-bone mb-1">
                      {svcName}
                    </p>
                    <p className="font-mono text-[10px] tracking-mono uppercase text-steel3">
                      {smartDate(b.scheduled_start)}
                    </p>
                  </div>

                  {/* Bottom strip */}
                  <div
                    className="flex items-center justify-between px-4 py-2"
                    style={{ borderTop: '1px solid #2A2F33' }}
                  >
                    <span className="font-mono text-[10px] tracking-mono uppercase text-steel3">
                      {reg}
                    </span>
                    <span className="font-mono text-[10px] tracking-mono text-bone">
                      {cost ? formatMUR(cost) : '—'}
                    </span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="py-16 text-center">
          <p className="font-mono text-[14px] tracking-mono2 uppercase text-ink4 mb-2">
            NO VISITS YET
          </p>
          <p className="font-mono text-[10px] tracking-mono uppercase text-steel2">
            Your service history will appear here
          </p>
        </div>
      )}
    </div>
  )
}
