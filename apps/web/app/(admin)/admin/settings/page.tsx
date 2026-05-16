import { redirect } from 'next/navigation'
import { createServerSupabaseClient as createServerClient } from '../../../../lib/supabase-server'
import { SettingsClient } from './settings-client'

export default async function AdminSettingsPage() {
  const supabase = createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: clientRow } = user
    ? await supabase.from('clients').select('name, email, role').eq('id', user.id).single()
    : { data: null }

  if (!clientRow || clientRow.role !== 'owner') {
    redirect('/admin/bookings')
  }

  const { data: services } = await supabase
    .from('services')
    .select('id, name_en, base_price_mur, active')
    .order('name_en')

  return (
    <div style={{ minHeight: '100vh', background: '#0B0D0E', paddingBottom: 80 }}>
      <div className="px-6 py-5" style={{ borderBottom: '1px solid #2A2F33' }}>
        <h1 className="text-xl font-bold" style={{ color: '#F2EFEA', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}>
          SETTINGS
        </h1>
        <p className="text-xs mt-0.5" style={{ color: '#F2EFEA66', fontFamily: 'JetBrains Mono, monospace' }}>
          OWNER CONFIGURATION
        </p>
      </div>

      <SettingsClient
        profileName={clientRow.name ?? ''}
        profileEmail={clientRow.email ?? ''}
        profileRole={clientRow.role ?? 'owner'}
        services={services ?? []}
      />
    </div>
  )
}
