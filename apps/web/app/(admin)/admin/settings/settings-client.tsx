'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface ServiceRow { id: string; name_en: string; base_price_mur: number; active: boolean }
interface DayConfig { open: string; close: string; closed: boolean }
interface GarageConfig {
  hours: { mon_fri: DayConfig; sun: DayConfig; sat: DayConfig }
  slots: string[]
  bays: number
  garage_name: string
  address: string
  phone: string
  email: string
}

interface Props {
  profileName: string
  profileEmail: string
  profileRole: string
  services: ServiceRow[]
  garageConfig: GarageConfig
}

const LABEL_STYLE = { color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' } as const
const INPUT_STYLE = { background: '#1E2225', border: '1px solid #2A2F33', color: '#F2EFEA', fontFamily: 'Inter, sans-serif' } as const
const MONO_INPUT  = { ...INPUT_STYLE, fontFamily: 'JetBrains Mono, monospace' } as const

function SectionHead({ title }: { title: string }) {
  return (
    <h2 className="text-[10px] font-bold mb-3"
      style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>
      {title}
    </h2>
  )
}

function FieldLabel({ children }: { children: string }) {
  return <p className="text-[10px] font-bold mb-1" style={LABEL_STYLE}>{children}</p>
}

function SaveBtn({ saving, saved, label = 'SAVE', onClick, disabled }: {
  saving: boolean; saved: boolean; label?: string; onClick: () => void; disabled?: boolean
}) {
  return (
    <button onClick={onClick} disabled={saving || disabled}
      className="px-3 py-2 text-xs font-bold flex-shrink-0"
      style={{
        background: saved ? '#2F9E5A' : '#FF5A1F', color: '#fff',
        fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.05em',
        opacity: saving || disabled ? 0.5 : 1, border: 'none', cursor: 'pointer',
      }}>
      {saving ? '…' : saved ? '✓' : label}
    </button>
  )
}

export function SettingsClient({ profileName, profileEmail, profileRole, services: initial, garageConfig: gc }: Props) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // ── Services ────────────────────────────────────────────────────────────────
  const [services, setServices] = useState<ServiceRow[]>(initial)
  const [savingId, setSavingId]   = useState<string | null>(null)
  const [savedId, setSavedId]     = useState<string | null>(null)
  const [svcErrors, setSvcErrors] = useState<Record<string, string>>({})

  // Add service form
  const [newName, setNewName]       = useState('')
  const [newPrice, setNewPrice]     = useState('')
  const [newDur, setNewDur]         = useState('60')
  const [addingSvc, setAddingSvc]   = useState(false)
  const [addSvcErr, setAddSvcErr]   = useState<string | null>(null)

  function updateSvcField<K extends keyof ServiceRow>(id: string, key: K, val: ServiceRow[K]) {
    setServices(prev => prev.map(s => s.id === id ? { ...s, [key]: val } : s))
  }

  async function handleSaveSvc(svc: ServiceRow) {
    setSavingId(svc.id)
    setSvcErrors(prev => ({ ...prev, [svc.id]: '' }))
    const res  = await fetch('/api/admin/services', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: svc.id, name_en: svc.name_en, base_price_mur: svc.base_price_mur, active: svc.active }),
    })
    const json = await res.json() as { error?: string }
    setSavingId(null)
    if (json.error) { setSvcErrors(prev => ({ ...prev, [svc.id]: json.error! })); return }
    setSavedId(svc.id)
    setTimeout(() => setSavedId(s => s === svc.id ? null : s), 1800)
  }

  async function handleAddSvc() {
    if (!newName.trim()) return
    setAddingSvc(true); setAddSvcErr(null)
    const res  = await fetch('/api/admin/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name_en: newName.trim(), base_price_mur: parseInt(newPrice) || 0, estimated_duration_min: parseInt(newDur) || 60 }),
    })
    const json = await res.json() as { error?: string; service?: ServiceRow }
    setAddingSvc(false)
    if (json.error) { setAddSvcErr(json.error); return }
    if (json.service) setServices(prev => [...prev, json.service!])
    setNewName(''); setNewPrice(''); setNewDur('60')
  }

  // ── Business hours ──────────────────────────────────────────────────────────
  const [hours, setHours]       = useState(gc.hours)
  const [slots, setSlots]       = useState(gc.slots.join(', '))
  const [bays, setBays]         = useState(gc.bays.toString())
  const [savingHrs, setSavingHrs] = useState(false)
  const [savedHrs, setSavedHrs]   = useState(false)
  const [hrsError, setHrsError]   = useState<string | null>(null)

  function setDay(key: 'mon_fri' | 'sun' | 'sat', field: keyof DayConfig, val: string | boolean) {
    setHours(prev => ({ ...prev, [key]: { ...prev[key], [field]: val } }))
  }

  async function handleSaveHours() {
    setSavingHrs(true); setHrsError(null)
    const hoursPayload = {
      mon_fri: hours.mon_fri.closed ? 'closed' : { open: hours.mon_fri.open, close: hours.mon_fri.close },
      sun:     hours.sun.closed     ? 'closed' : { open: hours.sun.open,     close: hours.sun.close },
      sat:     hours.sat.closed     ? 'closed' : { open: hours.sat.open,     close: hours.sat.close },
    }
    const parsedSlots = slots.split(',').map(s => s.trim()).filter(Boolean)
    const parsedBays  = parseInt(bays) || 4
    const res  = await fetch('/api/admin/garage-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hours: hoursPayload, slots: parsedSlots, bays: parsedBays }),
    })
    const json = await res.json() as { error?: string }
    setSavingHrs(false)
    if (json.error) { setHrsError(json.error); return }
    setSavedHrs(true); setTimeout(() => setSavedHrs(false), 1800)
  }

  // ── Garage info ─────────────────────────────────────────────────────────────
  const [garageName,    setGarageName]    = useState(gc.garage_name)
  const [garageAddress, setGarageAddress] = useState(gc.address)
  const [garagePhone,   setGaragePhone]   = useState(gc.phone)
  const [garageEmail,   setGarageEmail]   = useState(gc.email)
  const [savingInfo, setSavingInfo] = useState(false)
  const [savedInfo,  setSavedInfo]  = useState(false)
  const [infoError,  setInfoError]  = useState<string | null>(null)

  async function handleSaveInfo() {
    setSavingInfo(true); setInfoError(null)
    const res  = await fetch('/api/admin/garage-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ garage_name: garageName, address: garageAddress, phone: garagePhone, email: garageEmail }),
    })
    const json = await res.json() as { error?: string }
    setSavingInfo(false)
    if (json.error) { setInfoError(json.error); return }
    setSavedInfo(true); setTimeout(() => setSavedInfo(false), 1800)
  }

  // ── Password change ─────────────────────────────────────────────────────────
  const [newPass,      setNewPass]      = useState('')
  const [confirmPass,  setConfirmPass]  = useState('')
  const [changingPass, setChangingPass] = useState(false)
  const [passError,    setPassError]    = useState<string | null>(null)
  const [passSaved,    setPassSaved]    = useState(false)

  async function handleChangePass() {
    if (!newPass || newPass !== confirmPass) {
      setPassError('Passwords do not match'); return
    }
    if (newPass.length < 8) {
      setPassError('Minimum 8 characters'); return
    }
    setChangingPass(true); setPassError(null)
    const { error } = await supabase.auth.updateUser({ password: newPass })
    setChangingPass(false)
    if (error) { setPassError(error.message); return }
    setNewPass(''); setConfirmPass('')
    setPassSaved(true); setTimeout(() => setPassSaved(false), 2000)
  }

  const DAY_KEYS: { key: 'mon_fri' | 'sun' | 'sat'; label: string }[] = [
    { key: 'mon_fri', label: 'MON – FRI' },
    { key: 'sun',     label: 'SUNDAY' },
    { key: 'sat',     label: 'SATURDAY' },
  ]

  return (
    <div className="px-6 mt-6 max-w-lg flex flex-col gap-4">

      {/* Account */}
      <div className="p-4" style={{ background: '#15181A', border: '1px solid #2A2F33', boxShadow: '4px 4px 0 #0B0D0E' }}>
        <SectionHead title="ACCOUNT" />
        {[
          { label: 'NAME',  value: profileName  || '—' },
          { label: 'EMAIL', value: profileEmail || '—' },
          { label: 'ROLE',  value: profileRole.toUpperCase() },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center py-2" style={{ borderTop: '1px solid #2A2F33' }}>
            <span className="text-xs" style={LABEL_STYLE}>{label}</span>
            <span className="text-sm" style={{ color: '#F2EFEA', fontFamily: 'Inter, sans-serif' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Services & Pricing */}
      <div className="p-4" style={{ background: '#15181A', border: '1px solid #2A2F33', boxShadow: '4px 4px 0 #0B0D0E' }}>
        <SectionHead title="SERVICES & PRICING" />
        <div className="flex flex-col gap-3">
          {services.map(svc => (
            <div key={svc.id} className="pt-3" style={{ borderTop: '1px solid #2A2F33' }}>
              {/* Name row */}
              <div className="flex gap-2 items-center mb-2">
                <input
                  type="text"
                  value={svc.name_en}
                  onChange={e => updateSvcField(svc.id, 'name_en', e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm outline-none"
                  style={INPUT_STYLE}
                />
                <button
                  onClick={() => updateSvcField(svc.id, 'active', !svc.active)}
                  className="text-[10px] font-bold px-2 py-1 flex-shrink-0"
                  style={{
                    background: svc.active ? '#2F9E5A' : '#2A2F33',
                    color: svc.active ? '#fff' : '#8B9197',
                    fontFamily: 'JetBrains Mono, monospace', border: 'none', cursor: 'pointer',
                  }}
                >
                  {svc.active ? 'ACTIVE' : 'INACTIVE'}
                </button>
              </div>
              {/* Price row */}
              <div className="flex gap-2 items-center">
                <div className="flex items-center flex-1" style={{ border: '1px solid #2A2F33', background: '#1E2225' }}>
                  <span className="px-2 text-sm" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace' }}>₨</span>
                  <input
                    type="number" min={0}
                    value={svc.base_price_mur}
                    onChange={e => updateSvcField(svc.id, 'base_price_mur', parseInt(e.target.value) || 0)}
                    className="flex-1 py-2 pr-3 text-sm outline-none"
                    style={{ background: 'transparent', color: '#F2EFEA', fontFamily: 'JetBrains Mono, monospace' }}
                  />
                </div>
                <SaveBtn saving={savingId === svc.id} saved={savedId === svc.id} onClick={() => handleSaveSvc(svc)} />
              </div>
              {svcErrors[svc.id] && (
                <p className="text-xs mt-1" style={{ color: '#E8412B', fontFamily: 'JetBrains Mono, monospace' }}>{svcErrors[svc.id]}</p>
              )}
            </div>
          ))}

          {/* Add new service */}
          <div className="pt-3 mt-1" style={{ borderTop: '1px solid #2A2F33' }}>
            <p className="text-[10px] font-bold mb-2" style={LABEL_STYLE}>ADD SERVICE</p>
            <div className="flex flex-col gap-2">
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                className="w-full px-3 py-2 text-sm outline-none" style={INPUT_STYLE}
                placeholder="Service name" />
              <div className="flex gap-2">
                <div className="flex items-center flex-1" style={{ border: '1px solid #2A2F33', background: '#1E2225' }}>
                  <span className="px-2 text-sm" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace' }}>₨</span>
                  <input type="number" min={0} value={newPrice} onChange={e => setNewPrice(e.target.value)}
                    className="flex-1 py-2 pr-3 text-sm outline-none"
                    style={{ background: 'transparent', color: '#F2EFEA', fontFamily: 'JetBrains Mono, monospace' }}
                    placeholder="0" />
                </div>
                <div className="flex items-center" style={{ border: '1px solid #2A2F33', background: '#1E2225', width: 80 }}>
                  <input type="number" min={15} value={newDur} onChange={e => setNewDur(e.target.value)}
                    className="w-full px-2 py-2 text-sm outline-none"
                    style={{ background: 'transparent', color: '#F2EFEA', fontFamily: 'JetBrains Mono, monospace' }}
                    placeholder="60" />
                  <span className="pr-2 text-xs" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace' }}>min</span>
                </div>
              </div>
              {addSvcErr && <p className="text-xs" style={{ color: '#E8412B', fontFamily: 'JetBrains Mono, monospace' }}>{addSvcErr}</p>}
              <button onClick={handleAddSvc} disabled={addingSvc || !newName.trim()}
                className="w-full py-2 text-sm font-bold"
                style={{
                  background: '#FF5A1F', color: '#fff', fontFamily: 'Space Grotesk, sans-serif',
                  letterSpacing: '0.05em', opacity: addingSvc || !newName.trim() ? 0.5 : 1, border: 'none', cursor: 'pointer',
                }}>
                {addingSvc ? 'ADDING…' : '+ ADD SERVICE'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Business Hours */}
      <div className="p-4" style={{ background: '#15181A', border: '1px solid #2A2F33', boxShadow: '4px 4px 0 #0B0D0E' }}>
        <SectionHead title="BUSINESS HOURS" />
        <div className="flex flex-col gap-3">
          {DAY_KEYS.map(({ key, label }) => (
            <div key={key} className="pt-3" style={{ borderTop: '1px solid #2A2F33' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs" style={{ color: '#F2EFEA66', fontFamily: 'JetBrains Mono, monospace' }}>{label}</span>
                <button
                  onClick={() => setDay(key, 'closed', !hours[key].closed)}
                  className="text-[10px] font-bold px-2 py-0.5"
                  style={{
                    background: hours[key].closed ? '#E8412B22' : '#2F9E5A22',
                    color: hours[key].closed ? '#E8412B' : '#2F9E5A',
                    fontFamily: 'JetBrains Mono, monospace', border: `1px solid ${hours[key].closed ? '#E8412B44' : '#2F9E5A44'}`,
                    cursor: 'pointer',
                  }}
                >
                  {hours[key].closed ? 'CLOSED' : 'OPEN'}
                </button>
              </div>
              {!hours[key].closed && (
                <div className="flex gap-2">
                  {(['open', 'close'] as const).map(f => (
                    <div key={f} className="flex-1">
                      <p className="text-[9px] font-bold mb-1" style={LABEL_STYLE}>{f.toUpperCase()}</p>
                      <input type="time" value={hours[key][f]}
                        onChange={e => setDay(key, f, e.target.value)}
                        className="w-full px-2 py-1.5 text-sm outline-none" style={MONO_INPUT} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="pt-3" style={{ borderTop: '1px solid #2A2F33' }}>
            <FieldLabel>TIME SLOTS (comma separated)</FieldLabel>
            <input type="text" value={slots} onChange={e => setSlots(e.target.value)}
              className="w-full px-3 py-2 text-sm outline-none" style={MONO_INPUT}
              placeholder="08:30, 10:30, 13:00, 15:30" />
          </div>

          <div className="pt-3" style={{ borderTop: '1px solid #2A2F33' }}>
            <FieldLabel>NUMBER OF BAYS</FieldLabel>
            <input type="number" min={1} max={20} value={bays} onChange={e => setBays(e.target.value)}
              className="w-full px-3 py-2 text-sm outline-none" style={MONO_INPUT} />
          </div>

          {hrsError && <p className="text-xs" style={{ color: '#E8412B', fontFamily: 'JetBrains Mono, monospace' }}>{hrsError}</p>}
          <button onClick={handleSaveHours} disabled={savingHrs}
            className="w-full py-2.5 text-sm font-bold"
            style={{
              background: savedHrs ? '#2F9E5A' : '#FF5A1F', color: '#fff',
              fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.05em',
              opacity: savingHrs ? 0.5 : 1, border: 'none', cursor: 'pointer',
            }}>
            {savingHrs ? 'SAVING…' : savedHrs ? '✓ SAVED' : 'SAVE HOURS'}
          </button>
        </div>
      </div>

      {/* Garage Info */}
      <div className="p-4" style={{ background: '#15181A', border: '1px solid #2A2F33', boxShadow: '4px 4px 0 #0B0D0E' }}>
        <SectionHead title="GARAGE INFO" />
        <div className="flex flex-col gap-2">
          {[
            { label: 'BUSINESS NAME', value: garageName,    setter: setGarageName },
            { label: 'ADDRESS',       value: garageAddress, setter: setGarageAddress },
            { label: 'PHONE',         value: garagePhone,   setter: setGaragePhone },
            { label: 'EMAIL',         value: garageEmail,   setter: setGarageEmail },
          ].map(({ label, value, setter }) => (
            <div key={label}>
              <FieldLabel>{label}</FieldLabel>
              <input type="text" value={value} onChange={e => setter(e.target.value)}
                className="w-full px-3 py-2 text-sm outline-none" style={INPUT_STYLE} />
            </div>
          ))}
          {infoError && <p className="text-xs" style={{ color: '#E8412B', fontFamily: 'JetBrains Mono, monospace' }}>{infoError}</p>}
          <button onClick={handleSaveInfo} disabled={savingInfo}
            className="w-full py-2.5 text-sm font-bold mt-1"
            style={{
              background: savedInfo ? '#2F9E5A' : '#FF5A1F', color: '#fff',
              fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.05em',
              opacity: savingInfo ? 0.5 : 1, border: 'none', cursor: 'pointer',
            }}>
            {savingInfo ? 'SAVING…' : savedInfo ? '✓ SAVED' : 'SAVE INFO'}
          </button>
        </div>
      </div>

      {/* Password Change */}
      <div className="p-4" style={{ background: '#15181A', border: '1px solid #2A2F33', boxShadow: '4px 4px 0 #0B0D0E' }}>
        <SectionHead title="CHANGE PASSWORD" />
        <div className="flex flex-col gap-2">
          {[
            { label: 'NEW PASSWORD',     value: newPass,     setter: setNewPass },
            { label: 'CONFIRM PASSWORD', value: confirmPass, setter: setConfirmPass },
          ].map(({ label, value, setter }) => (
            <div key={label}>
              <FieldLabel>{label}</FieldLabel>
              <input type="password" value={value} onChange={e => setter(e.target.value)}
                className="w-full px-3 py-2 text-sm outline-none" style={INPUT_STYLE}
                placeholder="••••••••" />
            </div>
          ))}
          {passError && <p className="text-xs" style={{ color: '#E8412B', fontFamily: 'JetBrains Mono, monospace' }}>{passError}</p>}
          <button onClick={handleChangePass} disabled={changingPass || !newPass || !confirmPass}
            className="w-full py-2.5 text-sm font-bold mt-1"
            style={{
              background: passSaved ? '#2F9E5A' : '#FF5A1F', color: '#fff',
              fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.05em',
              opacity: changingPass || !newPass || !confirmPass ? 0.5 : 1, border: 'none', cursor: 'pointer',
            }}>
            {changingPass ? 'UPDATING…' : passSaved ? '✓ PASSWORD UPDATED' : 'UPDATE PASSWORD'}
          </button>
        </div>
      </div>

    </div>
  )
}
