'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient as createBrowserClient } from '@/lib/supabase-browser'
import { useBooking } from '../booking-context'

function formatMUR(n: number): string {
  return `₨ ${n.toLocaleString('en-US')}`
}

function formatDisplayDate(iso: string, time: string): string {
  const d = new Date(`${iso}T${time}:00`)
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

function generateRef(): string {
  return 'JK-' + String(Math.floor(1000 + Math.random() * 9000))
}

export default function ConfirmPage() {
  const router  = useRouter()
  const booking = useBooking()
  const [supabase] = useState(() => createBrowserClient())

  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  // Confirm step has its own CTA — footer NEXT button is hidden
  useEffect(() => {
    booking.setCanProceed(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const displayDate = booking.date && booking.time
    ? formatDisplayDate(booking.date, booking.time)
    : '—'

  async function handleConfirm() {
    setError(null)
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Session expired. Please log in again.'); setSubmitting(false); return }

    const ref            = generateRef()
    const scheduledStart = new Date(`${booking.date}T${booking.time}:00`).toISOString()
    const scheduledEnd   = new Date(
      new Date(scheduledStart).getTime() + booking.serviceDuration * 60_000
    ).toISOString()

    const { error: insertErr } = await supabase.from('bookings').insert({
      reference:          ref,
      client_id:          user.id,
      vehicle_id:         booking.vehicleId,
      service_ids:        [booking.serviceId],
      bay_number:         1,
      scheduled_start:    scheduledStart,
      scheduled_end:      scheduledEnd,
      status:             'pending',
      estimated_cost_mur: booking.servicePrice,
      customer_notes:     booking.notes || null,
      photo_urls:         booking.photoUrls,
    })

    setSubmitting(false)

    if (insertErr) {
      setError(insertErr.message)
      return
    }

    booking.reset()
    router.push(`/book/done?ref=${ref}`)
  }

  return (
    <div className="px-6 pt-10 pb-4">
      <p className="font-mono text-[9px] tracking-mono2 uppercase text-steel2 mb-3">
        STEP 7 OF 8
      </p>
      <h1 className="font-display text-[28px] font-bold text-bone tracking-tighter mb-8">
        Confirm booking.
      </h1>

      {/* Receipt card */}
      <div className="border border-ink4 shadow-ticket mb-6">
        {/* Header */}
        <div
          className="px-5 py-3"
          style={{ borderBottom: '1px solid #2A2F33' }}
        >
          <p className="font-mono text-[9px] tracking-mono2 uppercase text-steel3">
            BOOKING SUMMARY
          </p>
        </div>

        {/* Perforated divider (dashed) */}
        <div style={{ borderBottom: '1px dashed #2A2F33' }} />

        {/* KV rows */}
        {[
          { label: 'Service',        value: booking.serviceName || '—' },
          { label: 'Date',           value: displayDate },
          { label: 'Time',           value: booking.time || '—' },
          { label: 'Vehicle',        value: booking.registration || '—' },
          { label: 'Estimated cost', value: booking.servicePrice ? formatMUR(booking.servicePrice) : '—' },
        ].map(({ label, value }, idx, arr) => (
          <div
            key={label}
            className="flex items-center justify-between px-5 py-3"
            style={idx < arr.length - 1 ? { borderBottom: '1px solid #2A2F33' } : undefined}
          >
            <span className="font-mono text-[10px] tracking-mono uppercase text-steel3">
              {label}
            </span>
            <span className="font-display font-semibold text-[13px] text-bone text-right ml-4">
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* WhatsApp preview */}
      <div
        className="px-4 py-4 mb-6"
        style={{ background: '#1A2E1A', border: '1px solid #2F9E5A' }}
      >
        <p className="font-mono text-[9px] tracking-mono2 uppercase text-green mb-3">
          WHATSAPP PREVIEW
        </p>
        <pre className="font-mono text-[11px] text-bone leading-relaxed whitespace-pre-wrap">
          {`Hello Jekotech! 👋 I'd like to book an appointment.
📋 Service: ${booking.serviceName || '—'}
📅 Date: ${displayDate}
🕐 Time: ${booking.time || '—'}
🚗 Vehicle: ${booking.registration || '—'}`}
        </pre>
      </div>

      {/* Error */}
      {error && (
        <p className="font-mono text-[10px] tracking-mono uppercase text-red mb-4" role="alert">
          {error}
        </p>
      )}

      {/* Confirm CTA */}
      <button
        type="button"
        onClick={handleConfirm}
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 bg-orange hover:bg-orangeDeep text-white font-display font-semibold text-[15px] tracking-[0.06em] uppercase transition-colors duration-120 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ height: 56 }}
      >
        {submitting ? (
          <span className="font-mono text-[11px] tracking-mono">Confirming…</span>
        ) : (
          <>CONFIRM BOOKING <span aria-hidden>✓</span></>
        )}
      </button>
    </div>
  )
}
