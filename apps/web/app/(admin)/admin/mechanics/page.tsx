import { createServerSupabaseClient as createServerClient } from '../../../../lib/supabase-server'

interface Mechanic {
  id: string
  name: string
  initials: string
  specialties: string[]
  max_concurrent_jobs: number
  active: boolean
  color_hex: string
}

export default async function AdminMechanicsPage() {
  const supabase = createServerClient()

  const { data: mechanics } = await supabase
    .from('mechanics')
    .select('id, name, initials, specialties, max_concurrent_jobs, active, color_hex')
    .order('name')

  const rows = (mechanics as Mechanic[] | null) ?? []

  return (
    <div style={{ minHeight: '100vh', background: '#0B0D0E', paddingBottom: 80 }}>
      <div
        className="px-6 py-5"
        style={{ borderBottom: '1px solid #2A2F33' }}
      >
        <h1
          className="text-xl font-bold"
          style={{ color: '#F2EFEA', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}
        >
          MECHANICS
        </h1>
        <p className="text-xs mt-0.5" style={{ color: '#F2EFEA66', fontFamily: 'JetBrains Mono, monospace' }}>
          {rows.length} REGISTERED
        </p>
      </div>

      <div className="px-6 mt-4 flex flex-col gap-2">
        {rows.length === 0 && (
          <p className="text-center py-16 text-sm" style={{ color: '#F2EFEA33', fontFamily: 'JetBrains Mono, monospace' }}>
            NO MECHANICS REGISTERED YET
          </p>
        )}
        {rows.map(m => (
          <div
            key={m.id}
            className="p-4"
            style={{ background: '#15181A', border: '1px solid #2A2F33', boxShadow: '4px 4px 0 #0B0D0E' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ width: 36, height: 36, background: m.color_hex, color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}
              >
                {m.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: '#F2EFEA', fontFamily: 'Inter, sans-serif' }}>
                  {m.name}
                </p>
                {m.specialties?.length > 0 && (
                  <p className="text-xs mt-0.5" style={{ color: '#F2EFEA66', fontFamily: 'JetBrains Mono, monospace' }}>
                    {m.specialties.join(' · ')}
                  </p>
                )}
              </div>
              <span
                className="text-[10px] font-bold px-2 py-0.5 flex-shrink-0"
                style={{
                  background: m.active ? '#2F9E5A' : '#2A2F33',
                  color: m.active ? '#fff' : '#8B9197',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {m.active ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-4">
              <span className="text-xs" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace' }}>
                MAX {m.max_concurrent_jobs} CONCURRENT JOBS
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
