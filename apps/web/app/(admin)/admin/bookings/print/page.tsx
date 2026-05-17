import { createClient } from '@supabase/supabase-js'
import PrintOnLoad from './print-on-load'

function serviceDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'

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

export default async function PrintPage() {
  const supabase = serviceDb()
  const today = new Date()
  const todayStart = new Date(today)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)

  const { data: bookingsRaw } = await supabase
    .from('bookings')
    .select('id, reference, status, scheduled_start, bay_number, service_ids, client_id, vehicle_id, assigned_mechanic_id, estimated_cost_mur, final_cost_mur')
    .gte('scheduled_start', todayStart.toISOString())
    .lte('scheduled_start', todayEnd.toISOString())
    .order('scheduled_start', { ascending: true })

  const rows = bookingsRaw ?? []

  const allClientIds  = [...new Set(rows.map(b => b.client_id).filter(Boolean))]
  const allVehicleIds = [...new Set(rows.map(b => b.vehicle_id).filter(Boolean))]
  const allMechIds    = [...new Set(rows.map(b => b.assigned_mechanic_id).filter(Boolean))]
  const allSvcIds     = [...new Set(rows.flatMap(b => b.service_ids ?? []))]

  const [clientsRes, vehiclesRes, mechsRes, svcsRes] = await Promise.all([
    allClientIds.length  ? supabase.from('clients').select('id, name, phone').in('id', allClientIds)  : { data: [] },
    allVehicleIds.length ? supabase.from('vehicles').select('id, registration, make, model').in('id', allVehicleIds) : { data: [] },
    allMechIds.length    ? supabase.from('mechanics').select('id, clients(name)').in('id', allMechIds) : { data: [] },
    allSvcIds.length     ? supabase.from('services').select('id, name_en').in('id', allSvcIds)         : { data: [] },
  ])

  type MechWithClient = { id: string; clients: { name: string } | null }
  const clientMap  = Object.fromEntries(((clientsRes.data ?? []) as { id: string; name: string; phone: string | null }[]).map(c => [c.id, c]))
  const vehicleMap = Object.fromEntries(((vehiclesRes.data ?? []) as { id: string; registration: string; make: string; model: string }[]).map(v => [v.id, v]))
  const mechMap    = Object.fromEntries(((mechsRes.data ?? []) as unknown as MechWithClient[]).map(m => [m.id, m.clients?.name ?? '—']))
  const svcMap     = Object.fromEntries(((svcsRes.data ?? []) as { id: string; name_en: string }[]).map(s => [s.id, s.name_en]))

  const dateLabel = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <>
      {/* Hide admin chrome when printing */}
      <style>{`
        @media print {
          header, nav, aside { display: none !important; }
          main { margin-left: 0 !important; padding-top: 0 !important; }
          body { background: #fff !important; color: #000 !important; }
          .no-print { display: none !important; }
        }
        @media screen {
          body { background: #0B0D0E; }
        }
      `}</style>

      <PrintOnLoad />

      <div style={{ padding: '24px', fontFamily: 'monospace', color: '#F2EFEA', minHeight: '100vh' }}>
        {/* Print header */}
        <div style={{ borderBottom: '2px solid #2A2F33', paddingBottom: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, fontFamily: 'Space Grotesk, sans-serif', color: '#FF5A1F' }}>
                JEKOTECH CAR SERVICES
              </h1>
              <p style={{ fontSize: 11, margin: '4px 0 0', color: '#F2EFEA66' }}>DAILY BOOKING SHEET</p>
            </div>
            <p style={{ fontSize: 12, color: '#F2EFEA99', textAlign: 'right' }}>{dateLabel}</p>
          </div>
          <p style={{ fontSize: 11, marginTop: 8, color: '#F2EFEA66' }}>
            {rows.length} BOOKING{rows.length !== 1 ? 'S' : ''} TODAY
          </p>
        </div>

        {rows.length === 0 ? (
          <p style={{ textAlign: 'center', padding: 40, color: '#F2EFEA44', fontSize: 13 }}>NO BOOKINGS SCHEDULED FOR TODAY</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2A2F33' }}>
                {['REF', 'TIME', 'CLIENT', 'VEHICLE', 'SERVICE', 'BAY', 'MECHANIC', 'STATUS', 'COST'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontSize: 9, color: '#F2EFEA44', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((b, idx) => {
                const client  = clientMap[b.client_id]
                const vehicle = vehicleMap[b.vehicle_id]
                const mech    = b.assigned_mechanic_id ? mechMap[b.assigned_mechanic_id] : '—'
                const svcs    = (b.service_ids ?? []).map((id: string) => svcMap[id] ?? '—').join(', ')
                const cost    = b.final_cost_mur ?? b.estimated_cost_mur
                const status  = (b.status as BookingStatus) ?? 'pending'

                return (
                  <tr key={b.id} style={{ borderBottom: '1px solid #1E2225', background: idx % 2 === 0 ? 'transparent' : '#15181A' }}>
                    <td style={{ padding: '8px 8px', color: '#FF5A1F', fontWeight: 700, whiteSpace: 'nowrap' }}>{b.reference}</td>
                    <td style={{ padding: '8px 8px', color: '#F2EFEA99', whiteSpace: 'nowrap' }}>{b.scheduled_start ? formatTime(b.scheduled_start) : '—'}</td>
                    <td style={{ padding: '8px 8px', color: '#F2EFEA', whiteSpace: 'nowrap' }}>
                      {client?.name ?? '—'}
                      {client?.phone && <span style={{ color: '#F2EFEA44', display: 'block', fontSize: 10 }}>{client.phone}</span>}
                    </td>
                    <td style={{ padding: '8px 8px', color: '#F2EFEA99', whiteSpace: 'nowrap' }}>
                      {vehicle ? `${vehicle.registration}` : '—'}
                      {vehicle && <span style={{ color: '#F2EFEA44', display: 'block', fontSize: 10 }}>{vehicle.make} {vehicle.model}</span>}
                    </td>
                    <td style={{ padding: '8px 8px', color: '#F2EFEA', maxWidth: 140 }}>{svcs || '—'}</td>
                    <td style={{ padding: '8px 8px', color: '#F5C518', whiteSpace: 'nowrap' }}>{b.bay_number ? `Bay ${b.bay_number}` : '—'}</td>
                    <td style={{ padding: '8px 8px', color: '#3B82F6', whiteSpace: 'nowrap' }}>{mech}</td>
                    <td style={{ padding: '8px 8px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', color: '#F2EFEA99' }}>
                        {STATUS_LABEL[status]}
                      </span>
                    </td>
                    <td style={{ padding: '8px 8px', color: '#F2EFEA', whiteSpace: 'nowrap', textAlign: 'right' }}>
                      {cost ? `₨${cost.toLocaleString()}` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* Notes section */}
        <div style={{ marginTop: 32, borderTop: '1px solid #2A2F33', paddingTop: 16 }}>
          <p style={{ fontSize: 9, color: '#F2EFEA44', letterSpacing: '0.1em', marginBottom: 8 }}>NOTES</p>
          <div style={{ border: '1px solid #2A2F33', height: 80 }} />
        </div>

        {/* Close button — hidden on print */}
        <div className="no-print" style={{ marginTop: 24 }}>
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
