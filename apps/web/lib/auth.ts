import type { SupabaseClient } from '@supabase/supabase-js'

export type UserRole = 'customer' | 'mechanic' | 'owner' | 'delegate'

const ROLE_PATHS: Record<UserRole, string> = {
  customer:  '/home',
  mechanic:  '/mechanic/jobs',
  owner:     '/admin/bookings',
  delegate:  '/admin/bookings',
}

// ── getRole ───────────────────────────────────────────────────────────────────
// Looks up the current session user in the clients table.
// Returns null if there is no session or no matching row.
export async function getRole(supabase: SupabaseClient): Promise<UserRole | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('clients')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error || !data) return null

  const role = data.role as string
  if (isUserRole(role)) return role

  return null
}

// ── redirectByRole ────────────────────────────────────────────────────────────
// Returns the destination path for a given role.
// Falls back to /home for unrecognised roles so the user is never stranded.
export function redirectByRole(role: UserRole | null): string {
  if (!role) return '/login'
  return ROLE_PATHS[role] ?? '/home'
}

// ── type guard ────────────────────────────────────────────────────────────────
function isUserRole(value: string): value is UserRole {
  return ['customer', 'mechanic', 'owner', 'delegate'].includes(value)
}
