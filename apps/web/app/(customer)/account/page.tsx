'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient as createBrowserClient } from '../../../lib/supabase-browser'
import { BottomNav } from '../../../components/ui/bottom-nav'

export default function AccountPage() {
  const router     = useRouter()
  const [supabase] = useState(() => createBrowserClient())
  const [email,    setEmail]   = useState('')
  const [name,     setName]    = useState('')
  const [loading,  setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setEmail(user.email ?? '')
      const { data } = await supabase
        .from('clients')
        .select('name')
        .eq('id', user.id)
        .single()
      if (data) setName((data as { name: string }).name)
    }
    load()
  }, [supabase, router])

  async function handleSignOut() {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      <main className="min-h-screen bg-ink max-w-md mx-auto pb-20 px-6 pt-10">

        <header className="pb-6" style={{ borderBottom: '1px solid #2A2F33' }}>
          <p className="font-mono text-[9px] tracking-mono2 uppercase text-steel2 mb-3">
            MY ACCOUNT
          </p>
          <h1 className="font-display text-[28px] font-bold text-bone tracking-tighter">
            {name || 'Profile'}
          </h1>
        </header>

        <div className="mt-6 flex flex-col gap-0" style={{ borderBottom: '1px solid #2A2F33' }}>
          <div className="py-4" style={{ borderTop: '1px solid #2A2F33' }}>
            <p className="font-mono text-[9px] tracking-mono2 uppercase text-steel2 mb-1">
              Email
            </p>
            <p className="font-display text-[14px] text-bone">{email || '—'}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-transparent text-bone font-display font-semibold text-[14px] tracking-[0.06em] uppercase transition-colors duration-120 disabled:opacity-40 hover:bg-ink2 mt-10"
          style={{ height: 52, border: '1.5px solid #2A2F33' }}
        >
          {loading ? 'Signing out…' : 'SIGN OUT →'}
        </button>

      </main>
      <BottomNav />
    </>
  )
}
