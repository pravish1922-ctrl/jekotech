'use client'

import { useEffect } from 'react'

type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'

export interface PrintBooking {
  id: string
  reference: string
  status: BookingStatus
  scheduled_start: string | null
  bay_number: number | null
  client_name: string
  client_phone: string | null
  vehicle_label: string
  service_names: string
  mechanic_name: string
}

interface Props {
  bookings: PrintBooking[]
  dateLabel: string
}

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending:     'PENDING',
  confirmed:   'CONFIRMED',
  in_progress: 'IN PROGRESS',
  completed:   'COMPLETED',
  cancelled:   'CANCELLED',
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export default function PrintClient({ bookings, dateLabel }: Props) {
  useEffect(() => {
    window.print()
  }, [])

  const printedOn = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <>
      <style>{`
        @media print {
          header, nav, aside { display: none !important; }
          main { margin-left: 0 !important; padding-top: 0 !important; }
          .no-print { display: none !important; }
          body { background: #fff !important; color: #000 !important; }
        }
      `}</style>

      <div style={{ padding: '24px', fontFamily: 'monospace', background: '#fff', color: '#000', minHeight: '100vh' }}>
        {/* Header */}
        <div style={{ borderBottom: '2px solid #000', paddingBottom: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, fontFamily: 'Space Grotesk, sans-serif' }}>
                JEKOTECH CAR SERVICES
              </h1>
              <p style={{ fontSize: 11, margin: '4px 0 0', color: '#555' }}>DAILY BOOKING SHEET</p>
            </div>
            <p style={{ fontSize: 12, color: '#555', textAlign: 'right' }}>{dateLabel}</p>
          </div>
          <p style={{ fontSize: 11, marginTop: 8, color: '#555' }}>
            {bookings.length} BOOKING{bookings.length !== 1 ? 'S' : ''} TODAY
          </p>
        </div>

        {bookings.length === 0 ? (
          <p style={{ textAlign: 'center', padding: 40, color: '#999', fontSize: 13 }}>
            NO BOOKINGS SCHEDULED FOR TODAY
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000' }}>
                {['TIME', 'REF', 'CLIENT', 'PHONE', 'VEHICLE', 'SERVICES', 'BAY', 'MECHANIC', 'STATUS'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '5px 6px', fontSize: 9, color: '#555', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, idx) => (
                <tr key={b.id} style={{ borderBottom: '1px solid #ddd', background: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                  <td style={{ padding: '7px 6px', whiteSpace: 'nowrap', color: '#555' }}>
                    {b.scheduled_start ? formatTime(b.scheduled_start) : '—'}
                  </td>
                  <td style={{ padding: '7px 6px', fontWeight: 700, whiteSpace: 'nowrap' }}>{b.reference}</td>
                  <td style={{ padding: '7px 6px', whiteSpace: 'nowrap' }}>{b.client_name}</td>
                  <td style={{ padding: '7px 6px', whiteSpace: 'nowrap', color: '#555' }}>{b.client_phone ?? '—'}</td>
                  <td style={{ padding: '7px 6px', whiteSpace: 'nowrap' }}>{b.vehicle_label}</td>
                  <td style={{ padding: '7px 6px', maxWidth: 140 }}>{b.service_names || '—'}</td>
                  <td style={{ padding: '7px 6px', whiteSpace: 'nowrap' }}>{b.bay_number ? `Bay ${b.bay_number}` : '—'}</td>
                  <td style={{ padding: '7px 6px', whiteSpace: 'nowrap' }}>{b.mechanic_name}</td>
                  <td style={{ padding: '7px 6px', whiteSpace: 'nowrap', fontSize: 9, fontWeight: 700 }}>
                    {STATUS_LABEL[b.status] ?? b.status.toUpperCase()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Notes */}
        <div style={{ marginTop: 32, borderTop: '1px solid #ccc', paddingTop: 16 }}>
          <p style={{ fontSize: 9, color: '#555', letterSpacing: '0.1em', marginBottom: 8 }}>NOTES</p>
          <div style={{ border: '1px solid #ccc', height: 80 }} />
        </div>

        {/* Footer */}
        <div style={{ marginTop: 24, borderTop: '1px solid #ddd', paddingTop: 8 }}>
          <p style={{ fontSize: 9, color: '#999', textAlign: 'center' }}>
            Printed {printedOn} — JEKOTECH Car Services Ltd
          </p>
        </div>

        {/* Screen-only controls */}
        <div className="no-print" style={{ marginTop: 24, display: 'flex', gap: 8 }}>
          <button
            onClick={() => window.print()}
            style={{ background: '#0B0D0E', color: '#F2EFEA', border: 'none', padding: '8px 16px', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}
          >
            PRINT
          </button>
          <button
            onClick={() => window.close()}
            style={{ background: '#2A2F33', color: '#F2EFEA', border: 'none', padding: '8px 16px', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}
          >
            CLOSE
          </button>
        </div>
      </div>
    </>
  )
}
