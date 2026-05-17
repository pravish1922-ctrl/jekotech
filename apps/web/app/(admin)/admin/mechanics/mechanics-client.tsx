'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface MechanicRow {
  id: string
  initials: string
  active: boolean
  specialties: string[]
  max_concurrent_jobs: number
  color_hex: string | null
  name: string
  email: string
  phone: string | null
  job_count: number
}

interface Props {
  mechanics: MechanicRow[]
  isOwner: boolean
}

const COLOR_SWATCHES = ['#FF5A1F', '#3B82F6', '#2F9E5A', '#F5C518', '#E8412B', '#8B5CF6']

export function MechanicsClient({ mechanics: initial, isOwner }: Props) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [mechanics, setMechanics] = useState<MechanicRow[]>(initial)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editSpecialties, setEditSpecialties] = useState('')
  const [editColor, setEditColor] = useState<string | null>(null)
  const [editMaxJobs, setEditMaxJobs] = useState('1')
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  function startEdit(m: MechanicRow) {
    setEditingId(m.id)
    setEditName(m.name)
    setEditPhone(m.phone ?? '')
    setEditSpecialties(m.specialties.join(', '))
    setEditColor(m.color_hex)
    setEditMaxJobs(m.max_concurrent_jobs.toString())
    setEditError(null)
  }

  async function handleSaveEdit(mechId: string) {
    setEditSaving(true)
    setEditError(null)
    const specialties = editSpecialties.split(',').map(s => s.trim()).filter(Boolean)
    const body = {
      name: editName.trim(),
      phone: editPhone.trim() || null,
      specialties,
      color_hex: editColor,
      max_concurrent_jobs: parseInt(editMaxJobs) || 1,
    }
    const res = await fetch(`/api/admin/mechanic/${mechId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json() as { success?: boolean; error?: string }
    setEditSaving(false)
    if (!res.ok || json.error) {
      setEditError(json.error ?? 'Failed to save')
      return
    }
    setMechanics(prev => prev.map(m => m.id === mechId ? {
      ...m,
      name: body.name,
      phone: body.phone,
      specialties: body.specialties,
      color_hex: body.color_hex,
      max_concurrent_jobs: body.max_concurrent_jobs,
    } : m))
    setEditingId(null)
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

      <div className="flex flex-col gap-2">
        {mechanics.length === 0 && (
          <p className="text-center py-16 text-sm" style={{ color: '#F2EFEA33', fontFamily: 'JetBrains Mono, monospace' }}>
            NO MECHANICS REGISTERED YET
          </p>
        )}
        {mechanics.map(m => {
          const isEditing = editingId === m.id
          return (
            <div key={m.id} className="p-4" style={{ background: '#15181A', border: '1px solid #2A2F33', boxShadow: '4px 4px 0 #0B0D0E' }}>
              <div className="flex items-start gap-3">
                {/* Initials badge */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    background: isEditing ? (editColor ?? '#2A2F33') : (m.color_hex ?? '#2A2F33'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ color: '#fff', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 14 }}>
                    {m.initials}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    /* ── Edit form ── */
                    <div className="flex flex-col gap-2">
                      <div>
                        <p className="text-[10px] font-bold mb-1" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace' }}>NAME</p>
                        <input
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="w-full px-2 py-1.5 text-sm outline-none"
                          style={{ background: '#1E2225', border: '1px solid #2A2F33', color: '#F2EFEA', fontFamily: 'Inter, sans-serif' }}
                        />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold mb-1" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace' }}>PHONE</p>
                        <input
                          value={editPhone}
                          onChange={e => setEditPhone(e.target.value)}
                          placeholder="+230 5xxx xxxx"
                          className="w-full px-2 py-1.5 text-sm outline-none"
                          style={{ background: '#1E2225', border: '1px solid #2A2F33', color: '#F2EFEA', fontFamily: 'JetBrains Mono, monospace' }}
                        />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold mb-1" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace' }}>SPECIALTIES (comma-separated)</p>
                        <input
                          value={editSpecialties}
                          onChange={e => setEditSpecialties(e.target.value)}
                          placeholder="engine, brakes, tyres"
                          className="w-full px-2 py-1.5 text-sm outline-none"
                          style={{ background: '#1E2225', border: '1px solid #2A2F33', color: '#F2EFEA', fontFamily: 'Inter, sans-serif' }}
                        />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold mb-1.5" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace' }}>COLOR</p>
                        <div className="flex gap-2">
                          {COLOR_SWATCHES.map(color => (
                            <button
                              key={color}
                              onClick={() => setEditColor(color)}
                              style={{
                                width: 22,
                                height: 22,
                                background: color,
                                border: 'none',
                                cursor: 'pointer',
                                outline: editColor === color ? '2px solid #F2EFEA' : '2px solid transparent',
                                outlineOffset: 2,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold mb-1" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace' }}>MAX CONCURRENT JOBS</p>
                        <select
                          value={editMaxJobs}
                          onChange={e => setEditMaxJobs(e.target.value)}
                          className="px-2 py-1.5 text-sm outline-none"
                          style={{ background: '#1E2225', border: '1px solid #2A2F33', color: '#F2EFEA', fontFamily: 'JetBrains Mono, monospace' }}
                        >
                          {[1, 2, 3, 4].map(n => (
                            <option key={n} value={n}>{n} JOB{n > 1 ? 'S' : ''} MAX</option>
                          ))}
                        </select>
                      </div>
                      {editError && (
                        <p className="text-xs" style={{ color: '#E8412B', fontFamily: 'JetBrains Mono, monospace' }}>ERROR: {editError}</p>
                      )}
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => handleSaveEdit(m.id)}
                          disabled={editSaving}
                          className="flex-1 py-1.5 text-xs font-bold"
                          style={{ background: '#FF5A1F', color: '#fff', fontFamily: 'Space Grotesk, sans-serif', border: 'none', cursor: 'pointer', opacity: editSaving ? 0.6 : 1 }}
                        >
                          {editSaving ? 'SAVING…' : 'SAVE'}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex-1 py-1.5 text-xs font-bold"
                          style={{ background: '#2A2F33', color: '#F2EFEA', fontFamily: 'JetBrains Mono, monospace', border: 'none', cursor: 'pointer' }}
                        >
                          CANCEL
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── Display view ── */
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
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
                            <>
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
                              <button
                                onClick={() => startEdit(m)}
                                className="text-[10px] font-bold px-2 py-0.5"
                                style={{ background: '#1E2225', color: '#F2EFEA66', fontFamily: 'JetBrains Mono, monospace', border: '1px solid #2A2F33', cursor: 'pointer' }}
                              >
                                EDIT
                              </button>
                            </>
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

                      {/* Specialties pills */}
                      {m.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {m.specialties.map(s => (
                            <span
                              key={s}
                              className="text-[9px] font-bold px-1.5 py-0.5"
                              style={{
                                background: '#1E2225',
                                color: '#F2EFEA66',
                                fontFamily: 'JetBrains Mono, monospace',
                                border: '1px solid #2A2F33',
                              }}
                            >
                              {s.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="p-4" style={{ background: '#15181A', border: '1px solid #2A2F33' }}>
        <p className="text-xs" style={{ color: '#F2EFEA66', fontFamily: 'Inter, sans-serif' }}>
          To add a mechanic, go to{' '}
          <Link
            href="/admin/settings"
            style={{ color: '#FF5A1F', textDecoration: 'underline' }}
          >
            Settings → Team Management
          </Link>
        </p>
      </div>
    </div>
  )
}
