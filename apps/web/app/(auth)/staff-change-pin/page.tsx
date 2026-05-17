'use client'

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

export default function StaffChangePinPage() {
  const router = useRouter()
  const [newPin, setNewPin]         = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (newPin !== confirmPin) {
      setError('PINs do not match')
      return
    }

    setLoading(true)

    const res  = await fetch('/api/auth/change-pin', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ new_pin: newPin }),
    })

    const json = await res.json() as { success?: boolean; error?: string }

    if (!res.ok || json.error) {
      setError(json.error ?? 'Failed to update PIN')
      setLoading(false)
      return
    }

    // Redirect to portal — middleware will send to correct home by role
    router.push('/admin/bookings')
  }

  const canSubmit = newPin.length >= 4 && confirmPin.length >= 4 && !loading

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
          First Login
        </p>
        <h1 className="font-bold text-[34px] leading-tight tracking-tight" style={{ color: '#F2EFEA', fontFamily: 'Space Grotesk, sans-serif' }}>
          Welcome!
        </h1>
        <h1 className="font-bold text-[34px] leading-tight tracking-tight" style={{ color: '#FF5A1F', fontFamily: 'Space Grotesk, sans-serif' }}>
          Set your PIN.
        </h1>
        <p className="mt-4 text-sm" style={{ color: '#F2EFEA88', fontFamily: 'Inter, sans-serif' }}>
          Choose a new 4–6 digit PIN to secure your account.
        </p>
      </div>

      {/* Form */}
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>

        <div>
          <label htmlFor="new-pin" className="block text-[10px] font-bold tracking-[0.12em] uppercase mb-1.5" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace' }}>
            New PIN
          </label>
          <input
            id="new-pin"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            value={newPin}
            onChange={e => setNewPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
            placeholder="••••"
            autoComplete="new-password"
            required
            className="w-full px-3.5 text-sm outline-none tracking-widest"
            style={{ height: 50, background: '#15181A', border: '1.5px solid #2A2F33', color: '#F2EFEA', fontFamily: 'JetBrains Mono, monospace' }}
            onFocus={e => (e.currentTarget.style.borderColor = '#FF5A1F')}
            onBlur={e => (e.currentTarget.style.borderColor = '#2A2F33')}
          />
        </div>

        <div>
          <label htmlFor="confirm-pin" className="block text-[10px] font-bold tracking-[0.12em] uppercase mb-1.5" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace' }}>
            Confirm PIN
          </label>
          <input
            id="confirm-pin"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            value={confirmPin}
            onChange={e => setConfirmPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
            placeholder="••••"
            autoComplete="new-password"
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
          disabled={!canSubmit}
          className="w-full flex items-center justify-center gap-2 font-bold text-[15px] tracking-[0.06em] uppercase disabled:opacity-40 disabled:cursor-not-allowed mt-2"
          style={{ height: 56, background: '#FF5A1F', color: '#fff', fontFamily: 'Space Grotesk, sans-serif', border: 'none', cursor: 'pointer' }}
        >
          {loading ? (
            <span className="text-[11px] tracking-[0.1em]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Saving…</span>
          ) : (
            <>Set PIN <span aria-hidden>→</span></>
          )}
        </button>
      </form>

    </main>
  )
}
