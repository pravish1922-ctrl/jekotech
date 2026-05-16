'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '../../../../lib/supabase-browser'

type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'complete' | 'cancelled'
type AdminRole     = 'owner' | 'delegate' | 'staff'

interface BookingDetail {
  id: string
  reference: string
  service_ids: string[]
  bay_number: number | null
  scheduled_start: string
  status: BookingStatus
  assigned_mechanic_id: string | null
  customer_notes: string | null
  photo_urls: string[] | null
  estimated_cost_mur: number
  final_cost_mur: number | null
  mechanic_notes: string | null
  clients: { name: string; email: string; phone: string } | null
  vehicles: { registration: string; make: string; model: string; year: number } | null
  mechanics: { name: string; initials: string; color_hex: string } | null
}

interface MechanicOption {
  id: string
  name: string
  initials: string
  color_hex: string
}

interface BookingDetailEditorProps {
  booking: BookingDetail
  role: AdminRole
  mechanics: MechanicOption[]
  svcName: string
}

const STATUS_CFG: Record<BookingStatus, { label: string; bg: string; color: string }> = {
  pending:     { label: 'PENDING',     bg: '#F5C518', color: '#0B0D0E' },
  confirmed:   { label: 'CONFIRMED',   bg: '#3B82F6', color: '#F2EFEA' },
  in_progress: { label: 'IN PROGRESS', bg: '#FF5A1F', color: '#F2EFEA' },
  complete:    { label: 'COMPLETE',    bg: '#2F9E5A', color: '#F2EFEA' },
  cancelled:   { label: 'CANCELLED',   bg: '#2A2F33', color: '#8B9197' },
}

const ALL_STATUSES: BookingStatus[] = ['pending', 'confirmed', 'in_progress', 'complete', 'cancelled']
const STAFF_STATUSES: BookingStatus[] = ['confirmed', 'cancelled']

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const sameYear = d.getFullYear() === new Date().getFullYear()
  const datePart = sameYear
    ? d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    : d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const timePart = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${datePart} · ${timePart}`
}

function formatMUR(n: number): string {
  return `₨ ${n.toLocaleString('en-US')}`
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-4" style={{ borderTop: '1px solid #2A2F33' }}>
      <p className="font-mono text-[9px] tracking-mono2 uppercase text-steel2 mb-1">{label}</p>
      <div className="font-display text-[14px] text-bone">{value}</div>
    </div>
  )
}

export function BookingDetailEditor({ booking, role, mechanics, svcName }: BookingDetailEditorProps) {
  const router = useRouter()
  const canEditAll    = role === 'owner' || role === 'delegate'
  const statusOptions = canEditAll ? ALL_STATUSES : STAFF_STATUSES

  const [status,       setStatus]       = useState<BookingStatus>(booking.status)
  const [mechanicId,   setMechanicId]   = useState<string>(booking.assigned_mechanic_id ?? '')
  const [finalCost,    setFinalCost]    = useState<string>(booking.final_cost_mur != null ? String(booking.final_cost_mur) : '')
  const [mechNotes,    setMechNotes]    = useState<string>(booking.mechanic_notes ?? '')
  const [saving,       setSaving]       = useState(false)
  const [saveError,    setSaveError]    = useState<string | null>(null)
  const [saveSuccess,  setSaveSuccess]  = useState(false)

  const statusCfg = STATUS_CFG[status] ?? STATUS_CFG.pending
  const vehicle   = booking.vehicles

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    const supabase = createBrowserSupabaseClient()

    // Build the update payload based on role
    const payload: Record<string, unknown> = { status }

    if (canEditAll) {
      payload.assigned_mechanic_id = mechanicId || null
      payload.final_cost_mur       = finalCost ? parseInt(finalCost, 10) : null
      payload.mechanic_notes       = mechNotes || null
    }

    const { error } = await supabase
      .from('bookings')
      .update(payload)
      .eq('id', booking.id)

    setSaving(false)

    if (error) {
      setSaveError(error.message)
    } else {
      setSaveSuccess(true)
      router.refresh()
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="font-mono text-[9px] tracking-mono2 uppercase text-steel2 mb-1">
            BOOKING
          </p>
          <h1 className="font-display text-[24px] font-bold text-bone tracking-tighter">
            {booking.reference}
          </h1>
        </div>
        <span
          className="font-mono text-[9px] tracking-mono uppercase px-2 py-1 leading-none"
          style={{ background: statusCfg.bg, color: statusCfg.color }}
        >
          {statusCfg.label}
        </span>
      </div>

      {/* Read-only details */}
      <div className="mb-6" style={{ borderBottom: '1px solid #2A2F33' }}>
        <InfoRow label="Service" value={svcName} />
        <InfoRow label="Date" value={<span className="capitalize">{formatDateTime(booking.scheduled_start)}</span>} />
        <InfoRow
          label="Vehicle"
          value={vehicle
            ? `${vehicle.registration} · ${vehicle.make} ${vehicle.model} ${vehicle.year}`
            : '—'}
        />
        {booking.bay_number != null && (
          <InfoRow label="Bay" value={`BAY ${booking.bay_number}`} />
        )}
        <InfoRow
          label="Estimated Cost"
          value={booking.estimated_cost_mur ? formatMUR(booking.estimated_cost_mur) : '—'}
        />
        {booking.customer_notes && (
          <InfoRow label="Customer Notes" value={booking.customer_notes} />
        )}
        {booking.clients && (
          <InfoRow
            label="Client"
            value={`${booking.clients.name} · ${booking.clients.phone}`}
          />
        )}
      </div>

      {/* Editable controls */}
      <div className="mb-8 flex flex-col gap-5">
        {/* Status */}
        <div>
          <label className="font-mono text-[9px] tracking-mono2 uppercase text-steel2 block mb-2">
            STATUS
          </label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value as BookingStatus)}
            className="w-full bg-ink2 text-bone font-mono text-[12px] tracking-mono px-3 py-2.5"
            style={{ border: '1px solid #2A2F33' }}
          >
            {statusOptions.map(s => (
              <option key={s} value={s}>
                {STATUS_CFG[s].label}
              </option>
            ))}
          </select>
        </div>

        {/* Mechanic assignment — owner/delegate only */}
        {canEditAll && (
          <div>
            <label className="font-mono text-[9px] tracking-mono2 uppercase text-steel2 block mb-2">
              MECHANIC
            </label>
            <select
              value={mechanicId}
              onChange={e => setMechanicId(e.target.value)}
              className="w-full bg-ink2 text-bone font-mono text-[12px] tracking-mono px-3 py-2.5"
              style={{ border: '1px solid #2A2F33' }}
            >
              <option value="">Unassigned</option>
              {mechanics.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.initials})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Final cost — owner/delegate only */}
        {canEditAll && (
          <div>
            <label className="font-mono text-[9px] tracking-mono2 uppercase text-steel2 block mb-2">
              FINAL COST (MUR)
            </label>
            <input
              type="number"
              value={finalCost}
              onChange={e => setFinalCost(e.target.value)}
              placeholder="Leave blank to use estimated"
              className="w-full bg-ink2 text-bone font-mono text-[12px] tracking-mono px-3 py-2.5 placeholder:text-steel2"
              style={{ border: '1px solid #2A2F33' }}
            />
          </div>
        )}

        {/* Mechanic notes — owner/delegate only */}
        {canEditAll && (
          <div>
            <label className="font-mono text-[9px] tracking-mono2 uppercase text-steel2 block mb-2">
              MECHANIC NOTES
            </label>
            <textarea
              value={mechNotes}
              onChange={e => setMechNotes(e.target.value)}
              rows={4}
              placeholder="Internal notes visible to mechanic"
              className="w-full bg-ink2 text-bone font-mono text-[12px] tracking-mono px-3 py-2.5 resize-none placeholder:text-steel2"
              style={{ border: '1px solid #2A2F33' }}
            />
          </div>
        )}
      </div>

      {/* Feedback */}
      {saveError && (
        <p className="font-mono text-[10px] tracking-mono uppercase text-red mb-4">
          {saveError}
        </p>
      )}
      {saveSuccess && (
        <p className="font-mono text-[10px] tracking-mono uppercase text-green mb-4">
          SAVED
        </p>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center font-display font-semibold text-[14px] uppercase tracking-[0.06em] text-white transition-colors duration-120 disabled:opacity-50"
        style={{ height: 52, background: saving ? '#D9430C' : '#FF5A1F' }}
      >
        {saving ? 'SAVING…' : 'SAVE CHANGES'}
      </button>
    </div>
  )
}
