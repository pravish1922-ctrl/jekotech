import { createServerSupabaseClient as createServerClient } from '../../../lib/supabase-server'
import { redirect } from 'next/navigation'
import { MechanicJobsClient } from './mechanic-jobs-client'

interface RawJob {
  id: string
  reference: string
  service_ids: string[]
  bay_number: number | null
  scheduled_start: string
  status: string
  mechanic_notes: string | null
  clients: { name: string; phone: string } | null
  vehicles: { registration: string; make: string; model: string; year: number } | null
}

export default async function MechanicJobsPage() {
  const supabase = createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  // Resolve the mechanic record by client_id (existing schema)
  const { data: mechanicRow } = await supabase
    .from('mechanics')
    .select('id')
    .eq('client_id', user.id)
    .eq('active', true)
    .single()

  // Fallback: try id = auth.uid() (new schema)
  let mechanicId = (mechanicRow as { id: string } | null)?.id ?? null
  if (!mechanicId) {
    const { data: mechById } = await supabase
      .from('mechanics')
      .select('id')
      .eq('id', user.id)
      .single()
    mechanicId = (mechById as { id: string } | null)?.id ?? null
  }

  if (!mechanicId) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="font-mono text-[11px] tracking-mono2 uppercase text-steel2">
          No mechanic profile found. Contact your administrator.
        </p>
      </div>
    )
  }

  const [{ data: activeRaw }, { data: pastRaw }] = await Promise.all([
    supabase
      .from('bookings')
      .select(`
        id,
        reference,
        service_ids,
        bay_number,
        scheduled_start,
        status,
        mechanic_notes,
        clients ( name, phone ),
        vehicles ( registration, make, model, year )
      `)
      .eq('assigned_mechanic_id', mechanicId)
      .in('status', ['confirmed', 'in_progress'])
      .order('scheduled_start', { ascending: true }),

    supabase
      .from('bookings')
      .select(`
        id,
        reference,
        service_ids,
        bay_number,
        scheduled_start,
        status,
        mechanic_notes,
        clients ( name, phone ),
        vehicles ( registration, make, model, year )
      `)
      .eq('assigned_mechanic_id', mechanicId)
      .eq('status', 'complete')
      .order('scheduled_start', { ascending: false })
      .limit(10),
  ])

  const activeJobs = (activeRaw as RawJob[] | null) ?? []
  const pastJobs   = (pastRaw  as RawJob[] | null) ?? []

  // Resolve service names
  const allSvcIds = [...activeJobs, ...pastJobs].flatMap(j => j.service_ids ?? []).filter(Boolean)
  const { data: svcRaw } = allSvcIds.length > 0
    ? await supabase.from('services').select('id, name_en').in('id', allSvcIds)
    : { data: [] }

  const svcMap: Record<string, string> = {}
  for (const s of (svcRaw as { id: string; name_en: string }[] | null) ?? []) {
    svcMap[s.id] = s.name_en
  }

  return (
    <div className="min-h-screen bg-ink max-w-md mx-auto">
      <header className="px-5 pt-6 pb-4" style={{ borderBottom: '1px solid #2A2F33' }}>
        <p className="font-mono text-[9px] tracking-mono2 uppercase text-steel2 mb-1">
          MY JOBS
        </p>
        <h1 className="font-display text-[24px] font-bold text-bone tracking-tighter">
          Workshop
        </h1>
      </header>

      <MechanicJobsClient
        activeJobs={activeJobs as never}
        pastJobs={pastJobs as never}
        svcMap={svcMap}
      />
    </div>
  )
}
