'use client'

import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '../../lib/supabase-browser'

interface MechanicTopBarProps {
  userName: string
}

export function MechanicTopBar({ userName }: MechanicTopBarProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 flex items-center justify-between px-5 bg-ink2"
      style={{ height: 52, borderBottom: '1px solid #2A2F33', zIndex: 40 }}
    >
      <div className="flex items-center gap-3">
        <span className="font-display text-[18px] font-bold text-bone tracking-tighter">
          JK
        </span>
        <span
          className="font-mono text-[8px] tracking-mono2 uppercase px-1.5 py-0.5 leading-none"
          style={{ background: '#FF5A1F', color: '#FFFFFF' }}
        >
          MECHANIC
        </span>
      </div>

      <span className="font-display text-[13px] text-bone font-semibold truncate max-w-[140px]">
        {userName}
      </span>

      <button
        onClick={handleSignOut}
        className="font-mono text-[9px] tracking-mono2 uppercase text-steel2 hover:text-bone transition-colors duration-120"
      >
        SIGN OUT
      </button>
    </header>
  )
}
