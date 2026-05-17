import { createServerSupabaseClient as createServerClient } from '../../lib/supabase-server'
import { redirect } from 'next/navigation'
import { MechanicTopBar } from '../../components/mechanic/mechanic-top-bar'

export default async function MechanicLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const { data: clientRow } = await supabase
    .from('clients')
    .select('name, role, username')
    .eq('id', user.id)
    .single()

  type ClientRow = { name: string; role: string; username: string | null }
  const row      = clientRow as ClientRow | null
  const role     = row?.role ?? null
  const fullName = row?.name ?? ''
  const username = row?.username ?? null

  if (role !== 'mechanic') {
    redirect('/home')
  }

  return (
    <div className="min-h-screen bg-ink text-bone">
      <MechanicTopBar userName={fullName} username={username} />
      <main style={{ paddingTop: 52 }}>
        {children}
      </main>
    </div>
  )
}
