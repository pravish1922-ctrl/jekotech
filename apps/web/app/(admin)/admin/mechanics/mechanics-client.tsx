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

    const { data: existing } = await supabase
      .from('clients')
      .select('id')
      .eq('email', inviteEmail.trim())
      .single()

    let clientId: string | null = null

    if (existing) {
      clientId = existing.id
      const { error } = await supabase
        .from('clients')
        .update({ role: 'mechanic', name: inviteName.trim() })
        .eq('id', clientId)
      if (error) { setInviteError(error.message); setInviting(false); return }
    } else {
      const { data: newClient, error } = await supabase
        .from('clients')
        .insert({ email: inviteEmail.trim(), name: inviteName.trim(), role: 'mechanic' })
        .select('id')
        .single()
      if (error || !newClient) { setInviteError(error?.message ?? 'Failed to create client'); setInviting(false); return }
      clientId = newClient.id
    }

    const { error: mechErr } = await supabase
      .from('mechanics')
      .upsert({
        id: clientId,
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        phone: invitePhone.trim() || null,
        active: true,
      })
    if (mechErr) { setInviteError(mechErr.message); setInviting(false); return }

    setInviteName('')
    setInviteEmail('')
    setInvitePhone('')
    setInviting(false)
    setInviteSuccess(true)
    setTimeout(() => setInviteSuccess(false), 2000)
    router.refresh()
  }

  async function handleToggle(mech: MechanicRow) {
    setTogglingId(mech.id)
    const { error } = await supabase
      .from('mechanics')
      .update({ active: !mech.active })
      .eq('id', mech.id)
    if (!error) {
      setMechanics(prev => prev.map(m => m.id === mech.id ? { ...m, active: !m.active } : m))
    }
    setTogglingId(null)
  }

  return (
    <div className="px-6 mt-4 flex flex-col gap-4 max-w-lg">

      {/* Mechanic list */}
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

      {/* Owner-only invite form */}
      {isOwner && (
        <div className="p-4" style={{ background: '#15181A', border: '1px solid #2A2F33', boxShadow: '4px 4px 0 #0B0D0E' }}>
          <h2 className="text-[10px] font-bold mb-3" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>
            ADD MECHANIC
          </h2>
          <div className="flex flex-col gap-2">
            <div>
              <p className="text-[10px] font-bold mb-1" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' }}>NAME</p>
              <input
                type="text"
                value={inviteName}
                onChange={e => setInviteName(e.target.value)}
                className="w-full px-3 py-2 text-sm outline-none"
                style={{ background: '#1E2225', border: '1px solid #2A2F33', color: '#F2EFEA', fontFamily: 'Inter, sans-serif' }}
                placeholder="Full name"
              />
            </div>
            <div>
              <p className="text-[10px] font-bold mb-1" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' }}>EMAIL</p>
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm outline-none"
                style={{ background: '#1E2225', border: '1px solid #2A2F33', color: '#F2EFEA', fontFamily: 'Inter, sans-serif' }}
                placeholder="mechanic@example.com"
              />
            </div>
            <div>
              <p className="text-[10px] font-bold mb-1" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' }}>PHONE (optional)</p>
              <input
                type="tel"
                value={invitePhone}
                onChange={e => setInvitePhone(e.target.value)}
                className="w-full px-3 py-2 text-sm outline-none"
                style={{ background: '#1E2225', border: '1px solid #2A2F33', color: '#F2EFEA', fontFamily: 'JetBrains Mono, monospace' }}
                placeholder="+230 5xxx xxxx"
              />
            </div>
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
