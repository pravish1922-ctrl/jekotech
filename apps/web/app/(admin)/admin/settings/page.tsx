import { createServerSupabaseClient as createServerClient } from '../../../../lib/supabase-server'

export default async function AdminSettingsPage() {
  const supabase = createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: clientRow } = user
    ? await supabase.from('clients').select('name, email, role').eq('id', user.id).single()
    : { data: null }

  const profile = clientRow as { name: string; email: string; role: string } | null

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
          SETTINGS
        </h1>
        <p className="text-xs mt-0.5" style={{ color: '#F2EFEA66', fontFamily: 'JetBrains Mono, monospace' }}>
          OWNER CONFIGURATION
        </p>
      </div>

      <div className="px-6 mt-6 max-w-lg flex flex-col gap-4">
        {/* Account section */}
        <div
          className="p-4"
          style={{ background: '#15181A', border: '1px solid #2A2F33', boxShadow: '4px 4px 0 #0B0D0E' }}
        >
          <h2
            className="text-[10px] font-bold mb-3"
            style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}
          >
            ACCOUNT
          </h2>
          {[
            { label: 'NAME',  value: profile?.name  ?? '—' },
            { label: 'EMAIL', value: profile?.email ?? '—' },
            { label: 'ROLE',  value: (profile?.role ?? '—').toUpperCase() },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center py-2" style={{ borderTop: '1px solid #2A2F33' }}>
              <span className="text-xs" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace' }}>{label}</span>
              <span className="text-sm" style={{ color: '#F2EFEA', fontFamily: 'Inter, sans-serif' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Placeholder sections */}
        <div
          className="p-4"
          style={{ background: '#15181A', border: '1px solid #2A2F33', boxShadow: '4px 4px 0 #0B0D0E' }}
        >
          <h2
            className="text-[10px] font-bold mb-2"
            style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}
          >
            WORKSHOP
          </h2>
          <p className="text-xs py-4 text-center" style={{ color: '#F2EFEA22', fontFamily: 'JetBrains Mono, monospace' }}>
            BAY CONFIGURATION · HOURS · NOTIFICATIONS — COMING SOON
          </p>
        </div>
      </div>
    </div>
  )
}
