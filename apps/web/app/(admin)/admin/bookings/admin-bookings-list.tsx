'use client'

import { useState } from 'react'
import Link from 'next/link'
import { NewBookingDrawer } from './new-booking-drawer'

type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
type DateFilter = 'all' | 'today' | 'week' | 'month'

const STATUS_STYLE: Record<BookingStatus, { bg: string; color: string; label: string }> = {
  pending:     { bg: '#F5C518', color: '#0B0D0E', label: 'PENDING' },
  confirmed:   { bg: '#3B82F6', color: '#fff',    label: 'CONFIRMED' },
  in_progress: { bg: '#FF5A1F', color: '#fff',    label: 'IN PROGRESS' },
  completed:   { bg: '#2F9E5A', color: '#fff',    label: 'COMPLETED' },
  cancelled:   { bg: '#2A2F33', color: '#F2EFEA', label: 'CANCELLED' },
}

const TABS: { key: BookingStatus | 'all'; label: string }[] = [
  { key: 'all',         label: 'ALL' },
  { key: 'pending',     label: 'PENDING' },
  { key: 'confirmed',   label: 'CONFIRMED' },
  { key: 'in_progress', label: 'IN PROGRESS' },
  { key: 'completed',   label: 'COMPLETED' },
  { key: 'cancelled',   label: 'CANCELLED' },
]

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const sameYear = d.getFullYear() === now.getFullYear()
  const day = d.getDate()
  const mon = d.toLocaleString('en-GB', { month: 'short' }).toUpperCase()
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return sameYear ? `${day} ${mon} · ${time}` : `${day} ${mon} ${d.getFullYear()} · ${time}`
}

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bookings: any[]
  allClients: { id: string; name: string; phone: string | null }[]
  allVehicles: { id: string; registration: string; make: string; model: string; year: number; owner_client_id: string }[]
  allServices: { id: string; name_en: string; base_price_mur: number }[]
  allMechanics: { id: string; name: string }[]
}

export function AdminBookingsList({ bookings, allClients, allVehicles, allServices, allMechanics }: Props) {
  const [tab, setTab] = useState<BookingStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)

  const filtered = bookings.filter(b => {
    const matchTab = tab === 'all' || b.status === tab

    const q = search.toLowerCase()
    const matchSearch = !q ||
      b.reference?.toLowerCase().includes(q) ||
      b.client?.name?.toLowerCase().includes(q) ||
      b.client?.phone?.toLowerCase().includes(q) ||
      b.vehicle?.registration?.toLowerCase().includes(q) ||
      b.vehicle?.make?.toLowerCase().includes(q)

    let matchDate = true
    if (dateFilter !== 'all' && b.scheduled_start) {
      const bDate = new Date(b.scheduled_start)
      if (dateFilter === 'today') {
        matchDate = b.scheduled_start.slice(0, 10) === todayStr
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        matchDate = bDate >= weekAgo
      } else if (dateFilter === 'month') {
        matchDate = bDate.getFullYear() === now.getFullYear() && bDate.getMonth() === now.getMonth()
      }
    } else if (dateFilter !== 'all' && !b.scheduled_start) {
      matchDate = false
    }

    return matchTab && matchSearch && matchDate
  })

  const counts: Record<string, number> = { all: bookings.length }
  for (const b of bookings) {
    counts[b.status] = (counts[b.status] ?? 0) + 1
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0B0D0E', paddingBottom: 80 }}>
      {/* Header */}
      <div
        className="px-6 py-5 flex items-center justify-between"
        style={{ borderBottom: '1px solid #2A2F33' }}
      >
        <div>
          <h1
            className="text-xl font-bold"
            style={{ color: '#F2EFEA', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}
          >
            BOOKINGS
          </h1>
          <p className="text-xs mt-0.5" style={{ color: '#F2EFEA66', fontFamily: 'JetBrains Mono, monospace' }}>
            {bookings.length} TOTAL
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open('/admin/bookings/print', '_blank')}
            className="px-3 py-1.5 text-[10px] font-bold"
            style={{ background: '#15181A', border: '1px solid #2A2F33', color: '#F2EFEA66', fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}
          >
            PRINT TODAY
          </button>
          <button
            onClick={() => setDrawerOpen(true)}
            className="px-3 py-1.5 text-[10px] font-bold"
            style={{ background: '#FF5A1F', color: '#fff', fontFamily: 'JetBrains Mono, monospace', border: 'none', cursor: 'pointer' }}
          >
            + NEW BOOKING
          </button>
        </div>
      </div>

      {/* Search + date filter */}
      <div className="px-6 py-4 flex gap-2">
        <input
          type="text"
          placeholder="Search ref, client, phone, vehicle…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 text-sm outline-none"
          style={{
            background: '#15181A',
            border: '1px solid #2A2F33',
            color: '#F2EFEA',
            fontFamily: 'Inter, sans-serif',
          }}
        />
        <select
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value as DateFilter)}
          className="px-3 py-2 text-[11px] outline-none"
          style={{ background: '#15181A', border: '1px solid #2A2F33', color: '#F2EFEA', fontFamily: 'JetBrains Mono, monospace' }}
        >
          <option value="all">ALL TIME</option>
          <option value="today">TODAY</option>
          <option value="week">THIS WEEK</option>
          <option value="month">THIS MONTH</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="px-6 flex gap-1 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {TABS.map(t => {
          const active = tab === t.key
          const count = counts[t.key] ?? 0
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex-shrink-0 px-3 py-1.5 text-[10px] font-bold flex items-center gap-1.5"
              style={{
                background: active ? '#FF5A1F' : '#15181A',
                color: active ? '#fff' : '#F2EFEA66',
                border: active ? 'none' : '1px solid #2A2F33',
                fontFamily: 'JetBrains Mono, monospace',
                cursor: 'pointer',
              }}
            >
              {t.label}
              <span
                className="px-1 py-0.5 text-[9px]"
                style={{ background: active ? '#ffffff33' : '#2A2F33', color: active ? '#fff' : '#F2EFEA66' }}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* List */}
      <div className="px-6 mt-2 flex flex-col gap-2">
        {filtered.length === 0 && (
          <p className="text-center py-16 text-sm" style={{ color: '#F2EFEA33', fontFamily: 'JetBrains Mono, monospace' }}>
            NO BOOKINGS FOUND
          </p>
        )}
        {filtered.map(b => {
          const status = b.status as BookingStatus
          const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending
          const cost = b.final_cost_mur ?? b.estimated_cost_mur
          return (
            <Link
              key={b.id}
              href={`/admin/bookings/${b.id}`}
              className="block p-4 transition-colors"
              style={{
                background: '#15181A',
                border: '1px solid #2A2F33',
                boxShadow: '4px 4px 0 #0B0D0E',
              }}
            >
              {/* Row 1 */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="text-xs font-bold flex-shrink-0"
                    style={{ color: '#FF5A1F', fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {b.reference ?? '—'}
                  </span>
                  <span
                    className="text-xs font-bold px-2 py-0.5 flex-shrink-0"
                    style={{ background: s.bg, color: s.color, fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {s.label}
                  </span>
                </div>
                {cost != null && (
                  <span className="text-sm font-bold flex-shrink-0" style={{ color: '#F2EFEA', fontFamily: 'JetBrains Mono, monospace' }}>
                    ₨{cost.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Row 2 — client + vehicle */}
              <div className="mt-2 flex items-center gap-4">
                <span className="text-sm font-medium" style={{ color: '#F2EFEA', fontFamily: 'Inter, sans-serif' }}>
                  {b.client?.name ?? 'Unknown'}
                </span>
                {b.vehicle && (
                  <span className="text-xs" style={{ color: '#F2EFEA66', fontFamily: 'JetBrains Mono, monospace' }}>
                    {b.vehicle.registration} · {b.vehicle.make} {b.vehicle.model}
                  </span>
                )}
              </div>

              {/* Row 3 — date + bay + mechanic */}
              <div className="mt-1.5 flex items-center gap-4 flex-wrap">
                {b.scheduled_start && (
                  <span className="text-xs" style={{ color: '#F2EFEA66', fontFamily: 'JetBrains Mono, monospace' }}>
                    {formatDate(b.scheduled_start)}
                  </span>
                )}
                {b.bay_number && (
                  <span className="text-xs" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace' }}>
                    BAY {b.bay_number}
                  </span>
                )}
                {b.mechanic && (
                  <span className="text-xs" style={{ color: '#3B82F6', fontFamily: 'JetBrains Mono, monospace' }}>
                    {b.mechanic.name}
                  </span>
                )}
              </div>

              {/* Services */}
              {b.services?.length > 0 && (
                <div className="mt-2 flex gap-1 flex-wrap">
                  {b.services.map((svc: { id: string; name_en: string }) => (
                    <span
                      key={svc.id}
                      className="text-[10px] px-2 py-0.5"
                      style={{ background: '#1E2225', color: '#F2EFEA99', fontFamily: 'JetBrains Mono, monospace' }}
                    >
                      {svc.name_en}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          )
        })}
      </div>

      {/* Walk-in booking drawer */}
      <NewBookingDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        clients={allClients}
        vehicles={allVehicles}
        services={allServices}
        mechanics={allMechanics}
      />
    </div>
  )
}
