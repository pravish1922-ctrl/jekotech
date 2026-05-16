'use client'

import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

interface MechanicTopBarProps {
  userName: string
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase()
  }
  return (parts[0]?.[0] ?? '?').toUpperCase()
}

export function MechanicTopBar({ userName }: MechanicTopBarProps) {
  const router = useRouter()
  const initials = getInitials(userName)

  async function handleSignOut() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4"
      style={{ height: 52, background: '#15181A', borderBottom: '1px solid #2A2F33' }}
    >
      {/* Left — brand */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center font-black text-sm"
          style={{ width: 32, height: 32, background: '#3B82F6', color: '#fff', fontFamily: 'Space Grotesk, sans-serif' }}
        >
          JK
        </div>
        <div>
          <div className="text-xs font-bold" style={{ color: '#F2EFEA', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.08em' }}>
            JEKOTECH
          </div>
          <div className="text-[10px]" style={{ color: '#F2EFEA66', fontFamily: 'JetBrains Mono, monospace' }}>
            MECHANIC
          </div>
        </div>
      </div>

      {/* Right — user + sign out */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:block text-sm" style={{ color: '#F2EFEA99', fontFamily: 'Inter, sans-serif' }}>
          {userName}
        </div>
        <span
          className="text-[10px] font-bold px-2 py-0.5"
          style={{ background: '#3B82F6', color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}
        >
          MECHANIC
        </span>
        <button
          onClick={handleSignOut}
          className="flex items-center justify-center w-8 h-8 text-xs font-bold"
          style={{ background: '#FF5A1F', color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}
          title="Sign out"
        >
          {initials}
        </button>
      </div>
    </header>
  )
}
