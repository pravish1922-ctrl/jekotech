'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

function JKMark() {
  return (
    <div
      className="flex items-center justify-center font-black text-sm"
      style={{ width: 32, height: 32, background: '#FF5A1F', color: '#fff', fontFamily: 'Space Grotesk, sans-serif' }}
    >
      JK
    </div>
  )
}

export default function StaffLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [pin, setPin]           = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await fetch('/api/auth/staff-login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username: username.trim().toLowerCase(), pin: pin.trim() }),
    })

    const json = await res.json() as { role?: string; must_change_pin?: boolean; error?: string }

    if (!res.ok || json.error) {
      setError(json.error ?? 'Login failed')
      setLoading(false)
      return
    }

    if (json.must_change_pin) {
      router.push('/staff-change-pin')
      return
    }

    const role = json.role
    if (role === 'mechanic') {
      router.push('/mechanic/jobs')
    } else {
      router.push('/admin/bookings')
    }
  }

  return (
    <main className="min-h-screen flex flex-col px-6 py-10 max-w-md mx-auto" style={{ background: '#0B0D0E' }}>

      {/* Wordmark */}
      <div className="flex items-center gap-3">
        <JKMark />
        <div>
          <div className="text-xs font-bold" style={{ color: '#F2EFEA', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.1em' }}>
            JEKOTECH
          </div>
          <div className="text-[10px]" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace' }}>
            GARAGE
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="mt-14 mb-10">
        <p className="text-[10px] font-bold tracking-[0.12em] uppercase mb-3" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace' }}>
          Staff Portal
        </p>
        <h1 className="font-bold text-[34px] leading-tight tracking-tight" style={{ color: '#F2EFEA', fontFamily: 'Space Grotesk, sans-serif' }}>
          Staff
        </h1>
        <h1 className="font-bold text-[34px] leading-tight tracking-tight" style={{ color: '#FF5A1F', fontFamily: 'Space Grotesk, sans-serif' }}>
          Sign in.
        </h1>
      </div>

      {/* Form */}
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>

        <div>
          <label htmlFor="username" className="block text-[10px] font-bold tracking-[0.12em] uppercase mb-1.5" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace' }}>
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="your.username"
            autoComplete="username"
            autoCapitalize="none"
            required
            className="w-full px-3.5 text-sm outline-none"
            style={{ height: 50, background: '#15181A', border: '1.5px solid #2A2F33', color: '#F2EFEA', fontFamily: 'Inter, sans-serif' }}
            onFocus={e => (e.currentTarget.style.borderColor = '#FF5A1F')}
            onBlur={e => (e.currentTarget.style.borderColor = '#2A2F33')}
          />
        </div>

        <div>
          <label htmlFor="pin" className="block text-[10px] font-bold tracking-[0.12em] uppercase mb-1.5" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace' }}>
            PIN
          </label>
          <input
            id="pin"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pin}
            onChange={e => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
            placeholder="••••"
            autoComplete="current-password"
            required
            className="w-full px-3.5 text-sm outline-none tracking-widest"
            style={{ height: 50, background: '#15181A', border: '1.5px solid #2A2F33', color: '#F2EFEA', fontFamily: 'JetBrains Mono, monospace' }}
            onFocus={e => (e.currentTarget.style.borderColor = '#FF5A1F')}
            onBlur={e => (e.currentTarget.style.borderColor = '#2A2F33')}
          />
        </div>

        {error && (
          <p className="text-[10px] font-bold tracking-[0.1em] uppercase" style={{ color: '#E8412B', fontFamily: 'JetBrains Mono, monospace' }} role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !username || !pin}
          className="w-full flex items-center justify-center gap-2 font-bold text-[15px] tracking-[0.06em] uppercase disabled:opacity-40 disabled:cursor-not-allowed mt-2"
          style={{ height: 56, background: '#FF5A1F', color: '#fff', fontFamily: 'Space Grotesk, sans-serif', border: 'none', cursor: 'pointer' }}
        >
          {loading ? (
            <span className="text-[11px] tracking-[0.1em]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Verifying…</span>
          ) : (
            <>Enter Portal <span aria-hidden>→</span></>
          )}
        </button>
      </form>

      {/* Help text */}
      <p className="mt-8 text-center text-[11px]" style={{ color: '#F2EFEA33', fontFamily: 'JetBrains Mono, monospace' }}>
        Contact your manager to reset PIN
      </p>

      {/* Customer portal link */}
      <p className="mt-auto pt-10 text-center text-[11px]" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace' }}>
        <Link
          href="/login"
          className="hover:text-bone transition-colors"
          style={{ color: '#F2EFEA44' }}
        >
          ← Customer portal
        </Link>
      </p>

    </main>
  )
}
