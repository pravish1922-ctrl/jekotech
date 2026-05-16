import { createServerSupabaseClient as createServerClient } from '../../lib/supabase-server'
import { redirect } from 'next/navigation'
import { MechanicTopBar } from '../../components/mechanic/mechanic-top-bar'

export default async function MechanicLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const { data: clientRow } = await supabase
    .from('clients')
    .select('name, role')
    .eq('id', user.id)
    .single()

  const role     = (clientRow as { name: string; role: string } | null)?.role ?? null
  const fullName = (clientRow as { name: string; role: string } | null)?.name ?? ''

  if (role !== 'mechanic') {
    redirect('/home')
  }

  return (
    <div className="min-h-screen bg-ink text-bone">
      <MechanicTopBar userName={fullName} />
      <main style={{ paddingTop: 52 }}>
        {children}
      </main>
    </div>
  )
}
