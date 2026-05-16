import { createServerSupabaseClient as createServerClient } from '../../../../lib/supabase-server'
import { MechanicsClient } from './mechanics-client'

export default async function AdminMechanicsPage() {
  const supabase = createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: currentClient } = user
    ? await supabase.from('clients').select('role').eq('id', user.id).single()
    : { data: null }
  const isOwner = currentClient?.role === 'owner'

  const { data: mechanics } = await supabase
    .from('mechanics')
    .select('id, name, email, phone, active, created_at')
    .order('name')

  const rows = mechanics ?? []

  // Count assigned jobs per mechanic
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

  const enriched = rows.map(m => ({ ...m, phone: m.phone as string | null, job_count: countMap[m.id] ?? 0 }))

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
