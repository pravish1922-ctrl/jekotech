'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '../../../lib/supabase-browser'

type BookingStatus = 'confirmed' | 'in_progress' | 'complete' | 'cancelled' | 'pending'

interface Job {
  id: string
  reference: string
  service_ids: string[]
  bay_number: number | null
  scheduled_start: string
  status: BookingStatus
  mechanic_notes: string | null
  clients: { name: string; phone: string } | null
  vehicles: { registration: string; make: string; model: string; year: number } | null
}

interface MechanicJobsClientProps {
  activeJobs: Job[]
  pastJobs: Job[]
  svcMap: Record<string, string>
}

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  pending:     { label: 'PENDING',     bg: '#F5C518', color: '#0B0D0E' },
  confirmed:   { label: 'CONFIRMED',   bg: '#3B82F6', color: '#F2EFEA' },
  in_progress: { label: 'IN PROGRESS', bg: '#FF5A1F', color: '#F2EFEA' },
  complete:    { label: 'COMPLETE',    bg: '#2F9E5A', color: '#F2EFEA' },
  cancelled:   { label: 'CANCELLED',   bg: '#2A2F33', color: '#8B9197' },
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const sameYear = d.getFullYear() === new Date().getFullYear()
  const datePart = sameYear
    ? d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()
    : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()
  const timePart = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${datePart} · ${timePart}`
}

function JobCard({
  job,
  svcMap,
  onUpdate,
}: {
  job: Job
  svcMap: Record<string, string>
  onUpdate: (id: string, status: BookingStatus, notes: string) => Promise<string | null>
}) {
  const [notes,   setNotes]   = useState(job.mechanic_notes ?? '')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const svcName  = job.service_ids?.[0] ? (svcMap[job.service_ids[0]] ?? '—') : '—'
  const cfg      = STATUS_CFG[job.status] ?? STATUS_CFG.confirmed

  async function act(nextStatus: BookingStatus) {
    setSaving(true)
    setError(null)
    setSuccess(false)
    const err = await onUpdate(job.id, nextStatus, notes)
    setSaving(false)
    if (err) setError(err)
    else     setSuccess(true)
  }

  async function saveNotes() {
    setSaving(true)
    setError(null)
    setSuccess(false)
    const err = await onUpdate(job.id, job.status, notes)
    setSaving(false)
    if (err) setError(err)
    else     setSuccess(true)
  }

  return (
    <div
      className="bg-ink2 mb-3"
      style={{ border: '1px solid #2A2F33' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid #2A2F33' }}
      >
        <span className="font-mono text-[11px] tracking-mono uppercase text-steel3">
          {job.reference}
        </span>
        <span
          className="font-mono text-[8px] tracking-mono uppercase px-1.5 py-0.5 leading-none"
          style={{ background: cfg.bg, color: cfg.color }}
        >
          {cfg.label}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-4">
        <p className="font-display font-semibold text-[15px] text-bone mb-1">
          {svcName}
        </p>
        <p className="font-mono text-[10px] tracking-mono uppercase text-steel3 mb-0.5">
          {formatDateTime(job.scheduled_start)}
        </p>
        {job.clients && (
          <p className="font-mono text-[10px] tracking-mono uppercase text-steel3 mb-0.5">
            {job.clients.name}
          </p>
        )}
        {job.vehicles && (
          <p className="font-mono text-[10px] tracking-mono uppercase text-steel3">
            {job.vehicles.registration} · {job.vehicles.make} {job.vehicles.model}
            {job.bay_number != null ? ` · BAY ${job.bay_number}` : ''}
          </p>
        )}
      </div>

      {/* Mechanic notes */}
      <div className="px-4 pb-4">
        <label className="font-mono text-[9px] tracking-mono2 uppercase text-steel2 block mb-2">
          NOTES
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Add job notes…"
          className="w-full bg-ink text-bone font-mono text-[11px] tracking-mono px-3 py-2 resize-none placeholder:text-steel2"
          style={{ border: '1px solid #2A2F33' }}
        />
      </div>

      {/* Actions */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderTop: '1px solid #2A2F33' }}
      >
        {job.status === 'confirmed' && (
          <button
            onClick={() => act('in_progress')}
            disabled={saving}
            className="flex-1 flex items-center justify-center font-mono text-[10px] tracking-mono2 uppercase text-white transition-colors duration-120 disabled:opacity-50"
            style={{ height: 40, background: '#FF5A1F' }}
          >
            START JOB
          </button>
        )}
        {job.status === 'in_progress' && (
          <button
            onClick={() => act('complete')}
            disabled={saving}
            className="flex-1 flex items-center justify-center font-mono text-[10px] tracking-mono2 uppercase text-white transition-colors duration-120 disabled:opacity-50"
            style={{ height: 40, background: '#2F9E5A' }}
          >
            COMPLETE JOB
          </button>
        )}
        <button
          onClick={saveNotes}
          disabled={saving}
          className="px-4 flex items-center justify-center font-mono text-[10px] tracking-mono2 uppercase text-steel2 hover:text-bone transition-colors duration-120 disabled:opacity-50"
          style={{ height: 40, border: '1px solid #2A2F33' }}
        >
          SAVE NOTES
        </button>
      </div>

      {error && (
        <p className="px-4 pb-3 font-mono text-[9px] tracking-mono uppercase text-red">
          {error}
        </p>
      )}
      {success && (
        <p className="px-4 pb-3 font-mono text-[9px] tracking-mono uppercase text-green">
          SAVED
        </p>
      )}
    </div>
  )
}

export function MechanicJobsClient({ activeJobs, pastJobs, svcMap }: MechanicJobsClientProps) {
  const router = useRouter()
  const [showPast, setShowPast] = useState(false)

  async function handleUpdate(id: string, status: BookingStatus, notes: string): Promise<string | null> {
    const supabase = createBrowserSupabaseClient()
    const { error } = await supabase
      .from('bookings')
      .update({ status, mechanic_notes: notes || null })
      .eq('id', id)

    if (error) return error.message
    router.refresh()
    return null
  }

  return (
    <div className="px-5 py-6">
      {/* Active jobs */}
      <div className="mb-2">
        <p className="font-mono text-[9px] tracking-mono2 uppercase text-steel2 mb-4">
          ACTIVE JOBS ({activeJobs.length})
        </p>

        {activeJobs.length === 0 ? (
          <div className="border border-ink4 px-5 py-8 text-center">
            <p className="font-display font-semibold text-[14px] text-bone mb-1">
              No active jobs
            </p>
            <p className="font-mono text-[10px] tracking-mono uppercase text-steel2">
              Confirmed jobs will appear here
            </p>
          </div>
        ) : (
          activeJobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              svcMap={svcMap}
              onUpdate={handleUpdate}
            />
          ))
        )}
      </div>

      {/* Past jobs — collapsible */}
      {pastJobs.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowPast(p => !p)}
            className="flex items-center justify-between w-full mb-4"
          >
            <p className="font-mono text-[9px] tracking-mono2 uppercase text-steel2">
              PAST JOBS ({pastJobs.length})
            </p>
            <span className="font-mono text-[9px] tracking-mono uppercase text-steel2">
              {showPast ? '▲ HIDE' : '▼ SHOW'}
            </span>
          </button>

          {showPast && (
            <div style={{ border: '1px solid #2A2F33' }}>
              {pastJobs.map((job, idx) => {
                const svcName = job.service_ids?.[0] ? (svcMap[job.service_ids[0]] ?? '—') : '—'
                return (
                  <div
                    key={job.id}
                    className="flex items-center gap-3 px-4 py-3"
                    style={idx > 0 ? { borderTop: '1px solid #2A2F33' } : undefined}
                  >
                    <span className="font-mono text-[10px] tracking-mono uppercase text-steel3 flex-shrink-0 w-14">
                      {job.reference}
                    </span>
                    <span className="font-display text-[13px] text-bone flex-1 truncate">
                      {svcName}
                    </span>
                    <span className="font-mono text-[10px] tracking-mono text-steel3 flex-shrink-0">
                      {new Date(job.scheduled_start).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short',
                      }).toUpperCase()}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
