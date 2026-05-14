import { createServerSupabaseClient as createServerClient } from '../../../lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BottomNav } from '../../../components/ui/bottom-nav'

interface Vehicle {
  id: string
  registration: string
  make: string
  model: string
  year: number
  mileage: number
  colour: string | null
}

interface LastServicedRow {
  vehicle_id: string
  scheduled_start: string
}

function smartDate(iso: string): string {
  const d = new Date(iso)
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return sameYear
    ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase()
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()
}

export default async function FleetPage() {
  const supabase = createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const [{ data: vehiclesRaw }, { data: completedRaw }] = await Promise.all([
    supabase
      .from('vehicles')
      .select('id, registration, make, model, year, mileage, colour')
      .eq('owner_client_id', user.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('bookings')
      .select('vehicle_id, scheduled_start')
      .eq('client_id', user.id)
      .eq('status', 'complete')
      .order('scheduled_start', { ascending: false }),
  ])

  const vehicles  = (vehiclesRaw  as Vehicle[]          | null) ?? []
  const completed = (completedRaw as LastServicedRow[]  | null) ?? []

  // Most recent completed booking date per vehicle (already sorted DESC)
  const lastServiced = new Map<string, string>()
  for (const b of completed) {
    if (b.vehicle_id && !lastServiced.has(b.vehicle_id)) {
      lastServiced.set(b.vehicle_id, b.scheduled_start)
    }
  }

  return (
    <>
      <main className="min-h-screen bg-ink max-w-md mx-auto pb-20">

        <header className="px-6 pt-10 pb-6">
          <Link
            href="/home"
            className="font-mono text-[10px] tracking-mono uppercase text-steel2 hover:text-bone transition-colors duration-120 mb-8 inline-block"
          >
            ← HOME
          </Link>
          <div className="flex items-baseline gap-3">
            <h1 className="font-display text-[28px] font-bold text-bone tracking-tighter">
              Your Fleet
            </h1>
            {vehicles.length > 0 && (
              <span
                className="font-mono text-[9px] tracking-mono uppercase px-2 py-0.5"
                style={{ background: '#2A2F33', color: '#8B9197' }}
              >
                {vehicles.length}
              </span>
            )}
          </div>
        </header>

        <div className="px-6">
          {vehicles.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {vehicles.map(v => {
                const lastDate = lastServiced.get(v.id)
                return (
                  <li key={v.id} className="border border-ink4">
                    <div
                      className="flex items-center gap-4 px-4 pt-4 pb-3"
                      style={{ borderBottom: '1px solid #2A2F33' }}
                    >
                      <div
                        className="flex items-center justify-center bg-ink flex-shrink-0 px-2"
                        style={{ height: 32, border: '1px solid #2A2F33' }}
                      >
                        <span className="font-mono text-[11px] font-bold tracking-mono uppercase text-bone">
                          {v.registration}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-display font-semibold text-[14px] text-bone leading-tight">
                          {v.make} {v.model}
                        </p>
                        <p className="font-mono text-[10px] tracking-mono uppercase text-steel3 mt-0.5">
                          {v.year}{v.colour ? ` · ${v.colour}` : ''} · {v.mileage.toLocaleString('en-US')} mi
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="font-mono text-[9px] tracking-mono2 uppercase text-steel2">
                        {lastDate ? `Last serviced: ${smartDate(lastDate)}` : 'No services yet'}
                      </span>
                      <Link
                        href={`/fleet/${v.id}`}
                        className="font-mono text-[9px] tracking-mono2 uppercase text-orange hover:text-orangeDeep transition-colors duration-120"
                      >
                        VIEW HISTORY →
                      </Link>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="py-16 text-center">
              <p className="font-mono text-[14px] tracking-mono2 uppercase text-ink4 mb-2">
                NO VEHICLES YET
              </p>
              <p className="font-mono text-[10px] tracking-mono uppercase text-steel2">
                Add one when booking
              </p>
            </div>
          )}
        </div>

      </main>

      <BottomNav />
    </>
  )
}
