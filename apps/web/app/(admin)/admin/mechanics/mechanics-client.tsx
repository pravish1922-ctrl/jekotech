'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

interface MechanicRow {
  id: string
  name: string
  email: string
  phone: string | null
  active: boolean
  job_count: number
}

interface Props {
  mechanics: MechanicRow[]
  isOwner: boolean
}

export function MechanicsClient({ mechanics: initial, isOwner }: Props) {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [mechanics, setMechanics] = useState<MechanicRow[]>(initial)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePhone, setInvitePhone] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  async function handleInvite() {
    if (!inviteEmail.trim() || !inviteName.trim()) return
    setInviting(true)
    setInviteError(null)

    const res = await fetch('/api/admin/invite-mechanic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:  inviteName.trim(),
        email: inviteEmail.trim(),
        phone: invitePhone.trim() || null,
      }),
    })
    const json = await res.json() as { success?: boolean; error?: string }

    setInviting(false)
    if (!res.ok || json.error) {
      setInviteError(json.error ?? 'Failed to add mechanic')
      return
    }

    setInviteName('')
    setInviteEmail('')
    setInvitePhone('')
    setInviteSuccess(true)
    setTimeout(() => setInviteSuccess(false), 2000)
    router.refresh()
  }

  async function handleToggle(mech: MechanicRow) {
    setTogglingId(mech.id)
    // Upsert handles both mechanics-table-present and mechanics-table-absent cases
    const { error } = await supabase
      .from('mechanics')
      .upsert({ id: mech.id, name: mech.name, phone: mech.phone, active: !mech.active })
    if (!error) {
      setMechanics(prev => prev.map(m => m.id === mech.id ? { ...m, active: !m.active } : m))
    }
    setTogglingId(null)
  }

  return (
    <div className="px-6 mt-4 flex flex-col gap-4 max-w-lg">

      <div className="flex flex-col gap-2">
        {mechanics.length === 0 && (
          <p className="text-center py-16 text-sm" style={{ color: '#F2EFEA33', fontFamily: 'JetBrains Mono, monospace' }}>
            NO MECHANICS REGISTERED YET
          </p>
        )}
        {mechanics.map(m => (
          <div key={m.id} className="p-4" style={{ background: '#15181A', border: '1px solid #2A2F33', boxShadow: '4px 4px 0 #0B0D0E' }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: '#F2EFEA', fontFamily: 'Inter, sans-serif' }}>{m.name}</p>
                <p className="text-xs mt-0.5" style={{ color: '#F2EFEA66', fontFamily: 'JetBrains Mono, monospace' }}>{m.email}</p>
                {m.phone && (
                  <p className="text-xs mt-0.5" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace' }}>{m.phone}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace' }}>
                  {m.job_count} JOBS
                </span>
                {isOwner ? (
                  <button
                    onClick={() => handleToggle(m)}
                    disabled={togglingId === m.id}
                    className="text-[10px] font-bold px-2 py-0.5"
                    style={{
                      background: m.active ? '#2F9E5A' : '#2A2F33',
                      color: m.active ? '#fff' : '#8B9197',
                      fontFamily: 'JetBrains Mono, monospace',
                      opacity: togglingId === m.id ? 0.5 : 1,
                      cursor: 'pointer',
                      border: 'none',
                    }}
                  >
                    {m.active ? 'ACTIVE' : 'INACTIVE'}
                  </button>
                ) : (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5"
                    style={{
                      background: m.active ? '#2F9E5A' : '#2A2F33',
                      color: m.active ? '#fff' : '#8B9197',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    {m.active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isOwner && (
        <div className="p-4" style={{ background: '#15181A', border: '1px solid #2A2F33', boxShadow: '4px 4px 0 #0B0D0E' }}>
          <h2 className="text-[10px] font-bold mb-3" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>
            ADD MECHANIC
          </h2>
          <div className="flex flex-col gap-2">
            {[
              { label: 'NAME', value: inviteName, setter: setInviteName, type: 'text', placeholder: 'Full name', mono: false },
              { label: 'EMAIL', value: inviteEmail, setter: setInviteEmail, type: 'email', placeholder: 'mechanic@example.com', mono: false },
              { label: 'PHONE (optional)', value: invitePhone, setter: setInvitePhone, type: 'tel', placeholder: '+230 5xxx xxxx', mono: true },
            ].map(({ label, value, setter, type, placeholder, mono }) => (
              <div key={label}>
                <p className="text-[10px] font-bold mb-1" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' }}>{label}</p>
                <input
                  type={type}
                  value={value}
                  onChange={e => setter(e.target.value)}
                  className="w-full px-3 py-2 text-sm outline-none"
                  style={{ background: '#1E2225', border: '1px solid #2A2F33', color: '#F2EFEA', fontFamily: mono ? 'JetBrains Mono, monospace' : 'Inter, sans-serif' }}
                  placeholder={placeholder}
                />
              </div>
            ))}
            {inviteError && (
              <p className="text-xs" style={{ color: '#E8412B', fontFamily: 'JetBrains Mono, monospace' }}>ERROR: {inviteError}</p>
            )}
            <button
              onClick={handleInvite}
              disabled={inviting || !inviteName.trim() || !inviteEmail.trim()}
              className="w-full py-2.5 text-sm font-bold mt-1"
              style={{
                background: inviteSuccess ? '#2F9E5A' : '#FF5A1F',
                color: '#fff',
                fontFamily: 'Space Grotesk, sans-serif',
                letterSpacing: '0.05em',
                opacity: inviting || (!inviteName.trim() || !inviteEmail.trim()) ? 0.5 : 1,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {inviting ? 'ADDING…' : inviteSuccess ? '✓ ADDED' : 'ADD MECHANIC'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
