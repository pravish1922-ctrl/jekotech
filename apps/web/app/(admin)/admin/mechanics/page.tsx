import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '../../../../lib/supabase-server'
import { MechanicsClient } from './mechanics-client'

type MechanicWithClient = {
  id: string
  initials: string
  active: boolean
  specialties: string[] | null
  max_concurrent_jobs: number | null
  color_hex: string | null
  clients: {
    name: string
    email: string
    phone: string | null
  } | null
}

function serviceDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

export default async function AdminMechanicsPage() {
  const authClient = createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()

  const supabase = serviceDb()

  const { data: currentClient } = user
    ? await supabase.from('clients').select('role').eq('id', user.id).single()
    : { data: null }
  const isOwner = currentClient?.role === 'owner'

  // Join mechanics with clients to get name/email/phone alongside mechanic-specific fields
  const { data: mechanicsData } = await supabase
    .from('mechanics')
    .select('id, initials, active, specialties, max_concurrent_jobs, color_hex, clients(name, email, phone)')

  const rows = ((mechanicsData ?? []) as unknown as MechanicWithClient[])
    .map(m => ({
      id:                 m.id,
      initials:           m.initials,
      active:             m.active,
      specialties:        m.specialties ?? [],
      max_concurrent_jobs: m.max_concurrent_jobs ?? 1,
      color_hex:          m.color_hex,
      name:               m.clients?.name ?? '',
      email:              m.clients?.email ?? '',
      phone:              m.clients?.phone ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const mechanicIds = rows.map(m => m.id)
  const { data: jobCounts } = mechanicIds.length
    ? await supabase
        .from('bookings')
        .select('assigned_mechanic_id')
        .in('assigned_mechanic_id', mechanicIds)
        .not('status', 'eq', 'cancelled')
    : { data: [] as { assigned_mechanic_id: string | null }[] }

  const countMap: Record<string, number> = {}
  for (const j of jobCounts ?? []) {
    if (j.assigned_mechanic_id) {
      countMap[j.assigned_mechanic_id] = (countMap[j.assigned_mechanic_id] ?? 0) + 1
    }
  }

  const enriched = rows.map(m => ({ ...m, job_count: countMap[m.id] ?? 0 }))

  return (
    <div style={{ minHeight: '100vh', background: '#0B0D0E', paddingBottom: 80 }}>
      <div className="px-6 py-5" style={{ borderBottom: '1px solid #2A2F33' }}>
        <h1 className="text-xl font-bold" style={{ color: '#F2EFEA', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}>
          MECHANICS
        </h1>
        <p className="text-xs mt-0.5" style={{ color: '#F2EFEA66', fontFamily: 'JetBrains Mono, monospace' }}>
          {rows.length} REGISTERED
        </p>
      </div>

      <MechanicsClient mechanics={enriched} isOwner={isOwner} />
    </div>
  )
}
