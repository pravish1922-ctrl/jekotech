import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '../../../../lib/supabase-server'
import { SettingsClient } from './settings-client'

function serviceDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

interface DayConfig { open: string; close: string; closed: boolean }

function parseHours(raw: Record<string, unknown> | null) {
  function parseDay(val: unknown, defaultOpen: string, defaultClose: string, defaultClosed: boolean): DayConfig {
    if (!val || val === 'closed') return { open: defaultOpen, close: defaultClose, closed: true }
    const d = val as { open?: string; close?: string }
    return { open: d.open ?? defaultOpen, close: d.close ?? defaultClose, closed: defaultClosed }
  }
  if (!raw) {
    return {
      mon_fri: { open: '08:00', close: '17:00', closed: false },
      sun:     { open: '08:00', close: '13:00', closed: false },
      sat:     { open: '08:00', close: '17:00', closed: true  },
    }
  }
  return {
    mon_fri: parseDay(raw.mon_fri, '08:00', '17:00', false),
    sun:     parseDay(raw.sun,     '08:00', '13:00', false),
    sat:     parseDay(raw.sat,     '08:00', '17:00', true),
  }
}

export default async function AdminSettingsPage() {
  const authClient = createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()

  const supabase = serviceDb()

  const { data: clientRow } = user
    ? await supabase.from('clients').select('name, email, role').eq('id', user.id).single()
    : { data: null }

  if (!clientRow || clientRow.role !== 'owner') redirect('/admin/bookings')

  const [{ data: services }, { data: gc }, { data: staffList }] = await Promise.all([
    supabase.from('services').select('id, name_en, base_price_mur, active').order('name_en'),
    supabase.from('garage_config').select('*').eq('id', 1).maybeSingle(),
    supabase.from('clients').select('id, name, username, role').not('role', 'eq', 'customer').order('name'),
  ])

  const garageConfig = {
    hours:        parseHours((gc?.hours as Record<string, unknown> | null) ?? null),
    slots:        (gc?.slots as string[] | null) ?? ['08:30', '10:30', '13:00', '15:30'],
    bays:         (gc?.bays as number | null) ?? 4,
    garage_name:  (gc?.garage_name as string | null) ?? 'JEKOTECH Car Services Ltd',
    address:      (gc?.address   as string | null) ?? 'Savanne Road, Nouvelle France, Mauritius',
    phone:        (gc?.phone     as string | null) ?? '+230 5709 9631',
    email:        (gc?.email     as string | null) ?? 'info@jekotechltd.com',
  }

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
        garageConfig={garageConfig}
        staffMembers={staffList ?? []}
      />
    </div>
  )
}
