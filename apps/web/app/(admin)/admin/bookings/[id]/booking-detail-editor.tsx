'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updateBooking } from './actions'

type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'

const STATUS_STYLE: Record<BookingStatus, { bg: string; color: string; label: string }> = {
  pending:     { bg: '#F5C518', color: '#0B0D0E', label: 'PENDING' },
  confirmed:   { bg: '#3B82F6', color: '#fff',    label: 'CONFIRMED' },
  in_progress: { bg: '#FF5A1F', color: '#fff',    label: 'IN PROGRESS' },
  completed:   { bg: '#2F9E5A', color: '#fff',    label: 'COMPLETED' },
  cancelled:   { bg: '#2A2F33', color: '#F2EFEA', label: 'CANCELLED' },
}

const STATUS_FLOW: Record<BookingStatus, BookingStatus[]> = {
  pending:     ['confirmed', 'cancelled'],
  confirmed:   ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed:   [],
  cancelled:   [],
}

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
  booking: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vehicle: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bookingServices: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allServices: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mechanics: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assignedMechanic: any
  currentRole: string
}

export function BookingDetailEditor({
  booking,
  client,
  vehicle,
  bookingServices,
  mechanics,
  assignedMechanic,
  currentRole,
}: Props) {
  const router = useRouter()

  const [status, setStatus] = useState<BookingStatus>(booking.status)
  const [mechanicId, setMechanicId] = useState<string>(booking.assigned_mechanic_id ?? '')
  const [bayNumber, setBayNumber] = useState<string>(booking.bay_number?.toString() ?? '')
  const [estimatedCost, setEstimatedCost] = useState<string>(booking.estimated_cost_mur?.toString() ?? '')
  const [finalCost, setFinalCost] = useState<string>(booking.final_cost_mur?.toString() ?? '')
  const [mechanicNotes, setMechanicNotes] = useState<string>(booking.mechanic_notes ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canEdit = currentRole === 'owner' || currentRole === 'delegate'
  const canConfirmOnly = currentRole === 'staff'
  const allNextStatuses = STATUS_FLOW[status]
  const nextStatuses = canEdit
    ? allNextStatuses
    : allNextStatuses.filter(s => s === 'confirmed' || s === 'cancelled')

  async function handleSave() {
    setSaving(true)
    setError(null)
    const updates: Record<string, unknown> = {
      status,
      mechanic_notes: mechanicNotes,
      updated_at: new Date().toISOString(),
    }
    if (canEdit) {
      if (mechanicId) updates.assigned_mechanic_id = mechanicId
      if (bayNumber) updates.bay_number = parseInt(bayNumber)
      if (estimatedCost) updates.estimated_cost_mur = parseInt(estimatedCost)
      if (finalCost) updates.final_cost_mur = parseInt(finalCost)
    }
    const result = await updateBooking(booking.id, updates)
    setSaving(false)
    if (result.error) {
      setError(result.error)
    } else {
      router.push('/admin/bookings')
    }
  }

  const s = STATUS_STYLE[status]

  return (
    <div style={{ minHeight: '100vh', background: '#0B0D0E', paddingBottom: 80 }}>
      {/* Header */}
      <div
        className="px-6 py-4 flex items-center gap-4"
        style={{ borderBottom: '1px solid #2A2F33' }}
      >
        <Link
          href="/admin/bookings"
          className="text-sm flex items-center gap-1.5"
          style={{ color: '#F2EFEA66', fontFamily: 'JetBrains Mono, monospace' }}
        >
          ← BACK
        </Link>
        <div className="flex-1 min-w-0">
          <h1
            className="text-lg font-bold"
            style={{ color: '#FF5A1F', fontFamily: 'Space Grotesk, sans-serif' }}
          >
            {booking.reference}
          </h1>
          <p className="text-xs" style={{ color: '#F2EFEA66', fontFamily: 'JetBrains Mono, monospace' }}>
            {booking.scheduled_start ? formatDate(booking.scheduled_start) : '—'}
          </p>
        </div>
        <span
          className="text-xs font-bold px-2 py-1"
          style={{ background: s.bg, color: s.color, fontFamily: 'JetBrains Mono, monospace' }}
        >
          {s.label}
        </span>
      </div>

      <div className="px-6 py-6 flex flex-col gap-6 max-w-2xl">

        {/* Client + Vehicle */}
        <Section title="CLIENT & VEHICLE">
          <Row label="Client">{client?.name ?? '—'}</Row>
          <Row label="Email">{client?.email ?? '—'}</Row>
          <Row label="Phone">{client?.phone ?? '—'}</Row>
          {vehicle && <>
            <Row label="Vehicle">{vehicle.make} {vehicle.model} {vehicle.year}</Row>
            <Row label="Reg">{vehicle.registration}</Row>
            {vehicle.colour && <Row label="Colour">{vehicle.colour}</Row>}
            {vehicle.mileage && <Row label="Mileage">{vehicle.mileage.toLocaleString()} km</Row>}
          </>}
        </Section>

        {/* Services */}
        <Section title="SERVICES">
          {bookingServices.length === 0
            ? <p className="text-sm" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace' }}>NONE SELECTED</p>
            : bookingServices.map((svc: { id: string; name_en: string; base_price_mur: number }) => (
              <div key={svc.id} className="flex justify-between items-center">
                <span className="text-sm" style={{ color: '#F2EFEA', fontFamily: 'Inter, sans-serif' }}>{svc.name_en}</span>
                <span className="text-sm" style={{ color: '#F2EFEA66', fontFamily: 'JetBrains Mono, monospace' }}>₨{svc.base_price_mur.toLocaleString()}</span>
              </div>
            ))
          }
        </Section>

        {/* Customer notes */}
        {booking.customer_notes && (
          <Section title="CUSTOMER NOTES">
            <p className="text-sm" style={{ color: '#F2EFEA', fontFamily: 'Inter, sans-serif' }}>
              {booking.customer_notes}
            </p>
          </Section>
        )}

        {/* Photos */}
        {booking.photo_urls?.length > 0 && (
          <Section title={`PHOTOS (${booking.photo_urls.length})`}>
            <div className="grid grid-cols-2 gap-2">
              {booking.photo_urls.map((url: string, i: number) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Photo ${i + 1}`}
                    className="w-full object-cover"
                    style={{ height: 120, background: '#15181A' }}
                  />
                </a>
              ))}
            </div>
          </Section>
        )}

        {/* Edit section */}
        <Section title="MANAGE BOOKING">

          {/* Status transitions */}
          {(canEdit || canConfirmOnly) && nextStatuses.length > 0 && (
            <div>
              <Label>CHANGE STATUS</Label>
              <div className="flex gap-2 flex-wrap mt-1">
                {nextStatuses.map(ns => {
                  const ns_s = STATUS_STYLE[ns]
                  return (
                    <button
                      key={ns}
                      onClick={() => setStatus(ns)}
                      className="px-3 py-1.5 text-xs font-bold"
                      style={{
                        background: status === ns ? ns_s.bg : '#1E2225',
                        color: status === ns ? ns_s.color : '#F2EFEA66',
                        border: `1px solid ${status === ns ? ns_s.bg : '#2A2F33'}`,
                        fontFamily: 'JetBrains Mono, monospace',
                      }}
                    >
                      → {ns_s.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {canEdit && (
            <>
              {/* Mechanic assignment */}
              <div>
                <Label>ASSIGN MECHANIC</Label>
                <select
                  value={mechanicId}
                  onChange={e => setMechanicId(e.target.value)}
                  className="w-full px-3 py-2 text-sm mt-1"
                  style={{
                    background: '#15181A',
                    border: '1px solid #2A2F33',
                    color: '#F2EFEA',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  <option value="">— Unassigned —</option>
                  {mechanics.map((m: { id: string; name: string }) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Bay */}
              <div>
                <Label>BAY NUMBER</Label>
                <select
                  value={bayNumber}
                  onChange={e => setBayNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm mt-1"
                  style={{
                    background: '#15181A',
                    border: '1px solid #2A2F33',
                    color: '#F2EFEA',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  <option value="">— Select bay —</option>
                  {[1, 2, 3, 4].map(n => (
                    <option key={n} value={n}>Bay {n}</option>
                  ))}
                </select>
              </div>

              {/* Costs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>EST. COST (₨)</Label>
                  <input
                    type="number"
                    value={estimatedCost}
                    onChange={e => setEstimatedCost(e.target.value)}
                    className="w-full px-3 py-2 text-sm mt-1 outline-none"
                    style={{
                      background: '#15181A',
                      border: '1px solid #2A2F33',
                      color: '#F2EFEA',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>FINAL COST (₨)</Label>
                  <input
                    type="number"
                    value={finalCost}
                    onChange={e => setFinalCost(e.target.value)}
                    className="w-full px-3 py-2 text-sm mt-1 outline-none"
                    style={{
                      background: '#15181A',
                      border: '1px solid #2A2F33',
                      color: '#F2EFEA',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                    placeholder="0"
                  />
                </div>
              </div>
            </>
          )}

          {/* Mechanic notes — everyone can edit */}
          <div>
            <Label>MECHANIC NOTES</Label>
            <textarea
              value={mechanicNotes}
              onChange={e => setMechanicNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm mt-1 outline-none resize-none"
              style={{
                background: '#15181A',
                border: '1px solid #2A2F33',
                color: '#F2EFEA',
                fontFamily: 'Inter, sans-serif',
              }}
              placeholder="Internal notes…"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs" style={{ color: '#E8412B', fontFamily: 'JetBrains Mono, monospace' }}>
              ERROR: {error}
            </p>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 text-sm font-bold"
            style={{
              background: saved ? '#2F9E5A' : '#FF5A1F',
              color: '#fff',
              fontFamily: 'Space Grotesk, sans-serif',
              letterSpacing: '0.05em',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'SAVING…' : saved ? '✓ SAVED' : 'SAVE CHANGES'}
          </button>
        </Section>
      </div>
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="p-4 flex flex-col gap-3"
      style={{ background: '#15181A', border: '1px solid #2A2F33', boxShadow: '4px 4px 0 #0B0D0E' }}
    >
      <h2 className="text-[10px] font-bold" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-xs flex-shrink-0" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace' }}>{label}</span>
      <span className="text-sm text-right" style={{ color: '#F2EFEA', fontFamily: 'Inter, sans-serif' }}>{children}</span>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' }}>
      {children}
    </p>
  )
}
