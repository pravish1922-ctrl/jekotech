import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '../../../../lib/supabase-server'
import { MechanicsClient } from './mechanics-client'

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

  // Source of truth: all clients with role='mechanic'
  const { data: mechanicClients } = await supabase
    .from('clients')
    .select('id, name, email, phone')
    .eq('role', 'mechanic')
    .order('name')

  // Get active status from mechanics table (may be empty or partial)
  const { data: mechanicsRows } = await supabase
    .from('mechanics')
    .select('id, active')

  const activeMap: Record<string, boolean> = {}
  for (const m of mechanicsRows ?? []) {
    activeMap[m.id] = m.active
  }

  const rows = (mechanicClients ?? []).map(c => ({
    id:     c.id,
    name:   c.name,
    email:  c.email,
    phone:  c.phone as string | null,
    active: activeMap[c.id] ?? true,
  }))

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
