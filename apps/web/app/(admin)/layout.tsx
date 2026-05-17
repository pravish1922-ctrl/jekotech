import { createServerSupabaseClient as createAuthClient } from '../../lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '../../components/admin/admin-sidebar'

type AdminRole = 'owner' | 'delegate' | 'staff'

const ADMIN_ROLES = new Set<string>(['owner', 'delegate', 'staff'])

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase()
  }
  return (parts[0]?.[0] ?? '?').toUpperCase()
}

function roleHome(role: string | null): string {
  switch (role) {
    case 'mechanic': return '/mechanic/jobs'
    default:         return '/home'
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authClient = createAuthClient()
  const { data: { user }, error: authError } = await authClient.auth.getUser()
  if (authError || !user) redirect('/login')

  // Use service role for DB read so RLS misconfiguration can never silently fail
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  const { data: clientRaw } = await db
    .from('clients')
    .select('name, role, username')
    .eq('id', user.id)
    .single()

  type ClientRow = { name: string; role: string; username: string | null }
  const row      = clientRaw as ClientRow | null
  const role     = row?.role ?? null
  const fullName = row?.name ?? ''
  const username = row?.username ?? null

  if (!role || !ADMIN_ROLES.has(role)) {
    redirect(roleHome(role))
  }

  return (
    <div className="min-h-screen bg-ink text-bone flex">
      <AdminSidebar
        role={role as AdminRole}
        userName={fullName}
        initials={getInitials(fullName)}
        username={username}
      />

      {/* Desktop: offset by sidebar width. Mobile: offset by top bar + bottom nav */}
      <main
        className="flex-1 min-h-screen"
        style={{ paddingTop: 52 }}
      >
        {/* Desktop overrides paddingTop since sidebar is vertical */}
        <style>{`@media (min-width: 768px) { main { padding-top: 0; margin-left: 240px; } }`}</style>
        {children}
      </main>
    </div>
  )
}
