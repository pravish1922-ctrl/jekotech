'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

type JobStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'

const STATUS_STYLE: Record<JobStatus, { bg: string; color: string; label: string }> = {
  pending:     { bg: '#F5C518', color: '#0B0D0E', label: 'PENDING' },
  confirmed:   { bg: '#3B82F6', color: '#fff',    label: 'CONFIRMED' },
  in_progress: { bg: '#FF5A1F', color: '#fff',    label: 'IN PROGRESS' },
  completed:   { bg: '#2F9E5A', color: '#fff',    label: 'COMPLETED' },
  cancelled:   { bg: '#2A2F33', color: '#F2EFEA', label: 'CANCELLED' },
}

// Mechanic can only move: confirmed → in_progress, in_progress → completed
const MECHANIC_TRANSITIONS: Partial<Record<JobStatus, JobStatus>> = {
  confirmed:   'in_progress',
  in_progress: 'completed',
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function MechanicJobsClient({ jobs, mechanicId }: { jobs: any[]; mechanicId: string }) {
  const [tab, setTab] = useState<'active' | 'done' | 'cancelled'>('active')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [localJobs, setLocalJobs] = useState<any[]>(jobs)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [notesMap, setNotesMap] = useState<Record<string, string>>(
    Object.fromEntries(jobs.map(j => [j.id, j.mechanic_notes ?? '']))
  )
  const [savingId, setSavingId] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const activeJobs    = localJobs.filter(j => ['pending', 'confirmed', 'in_progress'].includes(j.status))
  const doneJobs      = localJobs.filter(j => j.status === 'completed')
  const cancelledJobs = localJobs.filter(j => j.status === 'cancelled')
  const displayed     = tab === 'active' ? activeJobs : tab === 'done' ? doneJobs : cancelledJobs

  async function handleStatusChange(jobId: string, newStatus: JobStatus) {
    setSavingId(jobId)
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', jobId)
    setSavingId(null)
    if (!error) {
      setLocalJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: newStatus } : j))
    }
  }

  async function handleSaveNotes(jobId: string) {
    setSavingId(jobId + '_notes')
    const { error } = await supabase
      .from('bookings')
      .update({ mechanic_notes: notesMap[jobId], updated_at: new Date().toISOString() })
      .eq('id', jobId)
    setSavingId(null)
    if (!error) {
      setLocalJobs(prev => prev.map(j => j.id === jobId ? { ...j, mechanic_notes: notesMap[jobId] } : j))
    }
  }

  const TABS = [
    { key: 'active'    as const, label: `ACTIVE (${activeJobs.length})` },
    { key: 'done'      as const, label: `DONE (${doneJobs.length})` },
    { key: 'cancelled' as const, label: `CANCELLED (${cancelledJobs.length})` },
  ]

  const EMPTY: Record<typeof tab, string> = {
    active:    'NO ACTIVE JOBS',
    done:      'NO COMPLETED JOBS',
    cancelled: 'NO CANCELLED JOBS',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0B0D0E', paddingBottom: 32 }}>
      {/* Header */}
      <div
        className="px-6 py-5"
        style={{ borderBottom: '1px solid #2A2F33' }}
      >
        <h1
          className="text-xl font-bold"
          style={{ color: '#F2EFEA', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}
        >
          MY JOBS
        </h1>
        <p className="text-xs mt-0.5" style={{ color: '#F2EFEA66', fontFamily: 'JetBrains Mono, monospace' }}>
          {activeJobs.length} ACTIVE · {doneJobs.length} DONE · {cancelledJobs.length} CANCELLED
        </p>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-4 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-shrink-0 px-4 py-1.5 text-xs font-bold"
            style={{
              background: tab === t.key ? '#FF5A1F' : '#15181A',
              color: tab === t.key ? '#fff' : '#F2EFEA66',
              border: tab === t.key ? 'none' : '1px solid #2A2F33',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Jobs */}
      <div className="px-6 mt-4 flex flex-col gap-3">
        {displayed.length === 0 && (
          <p className="text-center py-16 text-sm" style={{ color: '#F2EFEA33', fontFamily: 'JetBrains Mono, monospace' }}>
            {EMPTY[tab]}
          </p>
        )}

        {displayed.map(job => {
          const status = job.status as JobStatus
          const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending
          const nextStatus = MECHANIC_TRANSITIONS[status]
          const isExpanded = expandedId === job.id
          const isSaving = savingId === job.id
          const isCancelled = status === 'cancelled'

          return (
            <div
              key={job.id}
              style={{
                background: '#15181A',
                border: '1px solid #2A2F33',
                boxShadow: '4px 4px 0 #0B0D0E',
                opacity: isCancelled ? 0.6 : 1,
              }}
            >
              {/* Card header — always visible */}
              <button
                className="w-full p-4 text-left"
                onClick={() => setExpandedId(isExpanded ? null : job.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold" style={{ color: '#FF5A1F', fontFamily: 'JetBrains Mono, monospace' }}>
                        {job.reference}
                      </span>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5"
                        style={{ background: s.bg, color: s.color, fontFamily: 'JetBrains Mono, monospace' }}
                      >
                        {s.label}
                      </span>
                    </div>
                    <p className="text-sm font-medium" style={{ color: '#F2EFEA', fontFamily: 'Inter, sans-serif' }}>
                      {job.client?.name ?? 'Unknown'}
                    </p>
                    {job.vehicle && (
                      <p className="text-xs mt-0.5" style={{ color: '#F2EFEA66', fontFamily: 'JetBrains Mono, monospace' }}>
                        {job.vehicle.registration} · {job.vehicle.make} {job.vehicle.model}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {job.scheduled_start && (
                      <p className="text-xs" style={{ color: '#F2EFEA66', fontFamily: 'JetBrains Mono, monospace' }}>
                        {formatDate(job.scheduled_start)}
                      </p>
                    )}
                    {job.bay_number && (
                      <p className="text-xs mt-0.5" style={{ color: '#F5C518', fontFamily: 'JetBrains Mono, monospace' }}>
                        BAY {job.bay_number}
                      </p>
                    )}
                    <p className="text-[10px] mt-2" style={{ color: '#F2EFEA33', fontFamily: 'JetBrains Mono, monospace' }}>
                      {isExpanded ? '▲ CLOSE' : '▼ DETAILS'}
                    </p>
                  </div>
                </div>

                {/* Services pills */}
                {job.services?.length > 0 && (
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {job.services.map((svc: { id: string; name_en: string }) => (
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
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-4 flex flex-col gap-4" style={{ borderTop: '1px solid #2A2F33' }}>
                  <div className="pt-3" />

                  {/* Customer notes */}
                  {job.customer_notes && (
                    <div>
                      <p className="text-[10px] font-bold mb-1" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace' }}>
                        CUSTOMER NOTES
                      </p>
                      <p className="text-sm" style={{ color: '#F2EFEA', fontFamily: 'Inter, sans-serif' }}>
                        {job.customer_notes}
                      </p>
                    </div>
                  )}

                  {/* Photos */}
                  {job.photo_urls?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold mb-2" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace' }}>
                        PHOTOS ({job.photo_urls.length})
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {job.photo_urls.map((url: string, i: number) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={`Photo ${i + 1}`}
                              className="w-full object-cover"
                              style={{ height: 100, background: '#0B0D0E' }}
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mechanic notes */}
                  <div>
                    <p className="text-[10px] font-bold mb-1" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace' }}>
                      MY NOTES
                    </p>
                    <textarea
                      value={notesMap[job.id] ?? ''}
                      onChange={e => setNotesMap(prev => ({ ...prev, [job.id]: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 text-sm outline-none resize-none"
                      style={{
                        background: '#0B0D0E',
                        border: '1px solid #2A2F33',
                        color: '#F2EFEA',
                        fontFamily: 'Inter, sans-serif',
                      }}
                      placeholder="Add notes…"
                    />
                    <button
                      onClick={() => handleSaveNotes(job.id)}
                      disabled={savingId === job.id + '_notes'}
                      className="mt-2 px-4 py-1.5 text-xs font-bold"
                      style={{
                        background: '#2A2F33',
                        color: '#F2EFEA',
                        fontFamily: 'JetBrains Mono, monospace',
                        opacity: savingId === job.id + '_notes' ? 0.6 : 1,
                      }}
                    >
                      {savingId === job.id + '_notes' ? 'SAVING…' : 'SAVE NOTES'}
                    </button>
                  </div>

                  {/* Status action button — not shown for cancelled jobs */}
                  {nextStatus && !isCancelled && (
                    <button
                      onClick={() => handleStatusChange(job.id, nextStatus)}
                      disabled={isSaving}
                      className="w-full py-3 text-sm font-bold"
                      style={{
                        background: STATUS_STYLE[nextStatus].bg,
                        color: STATUS_STYLE[nextStatus].color,
                        fontFamily: 'Space Grotesk, sans-serif',
                        letterSpacing: '0.05em',
                        opacity: isSaving ? 0.7 : 1,
                      }}
                    >
                      {isSaving ? 'UPDATING…' : `MARK AS ${STATUS_STYLE[nextStatus].label}`}
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
