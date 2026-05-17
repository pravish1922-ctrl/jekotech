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
    document.cookie = 'preview_mode=; max-age=0; path=/'
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

      {/* Right — identity + sign out */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: 28, height: 28, background: '#3B82F6' }}
        >
          <span className="text-xs font-bold" style={{ color: '#fff', fontFamily: 'Space Grotesk, sans-serif' }}>
            {initials}
          </span>
        </div>
        <span className="hidden sm:block text-sm" style={{ color: '#F2EFEA', fontFamily: 'Inter, sans-serif' }}>
          {userName}
        </span>
        <button
          onClick={handleSignOut}
          className="px-3 py-1 text-[10px] font-bold"
          style={{ background: '#E8412B', color: '#fff', fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', border: 'none' }}
        >
          SIGN OUT
        </button>
      </div>
    </header>
  )
}
