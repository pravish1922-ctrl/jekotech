import { createServerSupabaseClient as createServerClient } from '../../lib/supabase-server'
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

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const { data: clientRaw } = await supabase
    .from('clients')
    .select('name, role')
    .eq('id', user.id)
    .single()

  const role     = (clientRaw as { name: string; role: string } | null)?.role ?? null
  const fullName = (clientRaw as { name: string; role: string } | null)?.name ?? ''

  if (!role || !ADMIN_ROLES.has(role)) {
    redirect('/home')
  }

  return (
    <div className="min-h-screen bg-ink text-bone flex">
      <AdminSidebar
        role={role as AdminRole}
        userName={fullName}
        initials={getInitials(fullName)}
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
