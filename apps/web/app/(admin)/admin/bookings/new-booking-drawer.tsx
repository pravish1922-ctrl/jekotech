'use client'

import { useState } from 'react'
import {
  createClientForBooking,
  createVehicleForBooking,
  createWalkinBooking,
} from './create-booking-action'

interface DrawerClient  { id: string; name: string; phone: string | null }
interface DrawerVehicle { id: string; registration: string; make: string; model: string; year: number; owner_client_id: string }
interface DrawerService { id: string; name_en: string; base_price_mur: number }
interface DrawerMechanic { id: string; name: string }

interface Props {
  open: boolean
  onClose: () => void
  clients: DrawerClient[]
  vehicles: DrawerVehicle[]
  services: DrawerService[]
  mechanics: DrawerMechanic[]
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold mb-1" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' }}>
      {children}
    </p>
  )
}

function FieldInput({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm outline-none"
      style={{ background: '#1E2225', border: '1px solid #2A2F33', color: '#F2EFEA', fontFamily: 'Inter, sans-serif' }}
    />
  )
}

export function NewBookingDrawer({ open, onClose, clients, vehicles, services, mechanics }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  // Step 1 — client
  const [clientMode, setClientMode] = useState<'existing' | 'new'>('existing')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [newClientName, setNewClientName] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')

  // Step 2 — vehicle
  const [vehicleMode, setVehicleMode] = useState<'existing' | 'new'>('existing')
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const [newVehicleReg, setNewVehicleReg] = useState('')
  const [newVehicleMake, setNewVehicleMake] = useState('')
  const [newVehicleModel, setNewVehicleModel] = useState('')
  const [newVehicleYear, setNewVehicleYear] = useState(new Date().getFullYear().toString())

  // Step 3 — service + details
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().slice(0, 10))
  const [scheduledTime, setScheduledTime] = useState('09:00')
  const [bayNumber, setBayNumber] = useState('')
  const [selectedMechanicId, setSelectedMechanicId] = useState('')
  const [estimatedCost, setEstimatedCost] = useState('')
  const [notes, setNotes] = useState('')

  // Submission
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createdRef, setCreatedRef] = useState<string | null>(null)

  function reset() {
    setStep(1)
    setClientMode('existing')
    setSelectedClientId('')
    setNewClientName('')
    setNewClientPhone('')
    setVehicleMode('existing')
    setSelectedVehicleId('')
    setNewVehicleReg('')
    setNewVehicleMake('')
    setNewVehicleModel('')
    setNewVehicleYear(new Date().getFullYear().toString())
    setSelectedServiceIds([])
    setScheduledDate(new Date().toISOString().slice(0, 10))
    setScheduledTime('09:00')
    setBayNumber('')
    setSelectedMechanicId('')
    setEstimatedCost('')
    setNotes('')
    setCreating(false)
    setCreateError(null)
    setCreatedRef(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  const clientVehicles = vehicles.filter(v => v.owner_client_id === selectedClientId)

  function canAdvanceStep1() {
    if (clientMode === 'existing') return !!selectedClientId
    return newClientName.trim().length > 0
  }

  function canAdvanceStep2() {
    if (vehicleMode === 'existing') return !!selectedVehicleId
    return newVehicleReg.trim().length > 0 && newVehicleMake.trim().length > 0 && newVehicleModel.trim().length > 0
  }

  function canAdvanceStep3() {
    return selectedServiceIds.length > 0 && !!scheduledDate
  }

  async function handleCreate() {
    setCreating(true)
    setCreateError(null)

    let finalClientId = selectedClientId
    let finalVehicleId = selectedVehicleId

    if (clientMode === 'new') {
      const result = await createClientForBooking(newClientName.trim(), newClientPhone.trim())
      if (result.error || !result.data) {
        setCreateError(result.error ?? 'Failed to create client')
        setCreating(false)
        return
      }
      finalClientId = result.data.id
    }

    if (vehicleMode === 'new') {
      const result = await createVehicleForBooking(
        finalClientId,
        newVehicleReg.trim().toUpperCase(),
        newVehicleMake.trim(),
        newVehicleModel.trim(),
        parseInt(newVehicleYear) || new Date().getFullYear()
      )
      if (result.error || !result.data) {
        setCreateError(result.error ?? 'Failed to create vehicle')
        setCreating(false)
        return
      }
      finalVehicleId = result.data.id
    }

    const scheduledStart = `${scheduledDate}T${scheduledTime}:00`
    const result = await createWalkinBooking({
      clientId: finalClientId,
      vehicleId: finalVehicleId,
      serviceIds: selectedServiceIds,
      scheduledStart,
      bayNumber: bayNumber ? parseInt(bayNumber) : null,
      mechanicId: selectedMechanicId || null,
      estimatedCost: estimatedCost ? parseInt(estimatedCost) : null,
      notes,
    })

    setCreating(false)
    if (result.error || !result.data) {
      setCreateError(result.error ?? 'Failed to create booking')
      return
    }
    setCreatedRef(result.data.reference)
  }

  // Derived labels for confirm step
  const clientLabel = clientMode === 'existing'
    ? (clients.find(c => c.id === selectedClientId)?.name ?? '—')
    : newClientName

  const vehicleLabel = vehicleMode === 'existing'
    ? (() => {
        const v = vehicles.find(v => v.id === selectedVehicleId)
        return v ? `${v.registration} · ${v.make} ${v.model}` : '—'
      })()
    : `${newVehicleReg} · ${newVehicleMake} ${newVehicleModel}`

  const serviceLabels = selectedServiceIds
    .map(id => services.find(s => s.id === id)?.name_en ?? id)
    .join(', ')

  const mechanicLabel = selectedMechanicId
    ? (mechanics.find(m => m.id === selectedMechanicId)?.name ?? '—')
    : '—'

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: 'rgba(11,13,14,0.7)' }}
      onClick={e => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div
        className="w-full flex flex-col"
        style={{ maxWidth: 400, height: '100vh', overflowY: 'auto', background: '#15181A', borderLeft: '1px solid #2A2F33' }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: '1px solid #2A2F33' }}
        >
          <div>
            <h2 className="text-sm font-bold" style={{ color: '#F2EFEA', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.05em' }}>
              NEW BOOKING
            </h2>
            <p className="text-[10px] mt-0.5" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace' }}>
              {createdRef ? 'COMPLETE' : `STEP ${step} / 4`}
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{ color: '#F2EFEA66', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Success screen */}
        {createdRef && (
          <div className="flex-1 flex flex-col items-center justify-center px-5 gap-4">
            <div
              className="px-4 py-2 text-sm font-bold"
              style={{ background: '#2F9E5A', color: '#fff', fontFamily: 'Space Grotesk, sans-serif' }}
            >
              ✓ BOOKING CREATED
            </div>
            <p className="text-2xl font-bold" style={{ color: '#FF5A1F', fontFamily: 'Space Grotesk, sans-serif' }}>
              {createdRef}
            </p>
            <button
              onClick={handleClose}
              className="w-full py-2.5 text-sm font-bold mt-4"
              style={{ background: '#FF5A1F', color: '#fff', fontFamily: 'Space Grotesk, sans-serif', border: 'none', cursor: 'pointer' }}
            >
              CLOSE
            </button>
          </div>
        )}

        {/* Step content */}
        {!createdRef && (
          <div className="flex-1 px-5 py-5 flex flex-col gap-4">

            {/* ── STEP 1: CLIENT ── */}
            {step === 1 && (
              <>
                <div className="flex gap-2">
                  {(['existing', 'new'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setClientMode(mode)}
                      className="flex-1 py-1.5 text-xs font-bold"
                      style={{
                        background: clientMode === mode ? '#FF5A1F' : '#1E2225',
                        color: clientMode === mode ? '#fff' : '#F2EFEA66',
                        border: clientMode === mode ? 'none' : '1px solid #2A2F33',
                        fontFamily: 'JetBrains Mono, monospace',
                        cursor: 'pointer',
                      }}
                    >
                      {mode === 'existing' ? 'EXISTING CLIENT' : 'NEW CLIENT'}
                    </button>
                  ))}
                </div>

                {clientMode === 'existing' ? (
                  <div>
                    <FieldLabel>SELECT CLIENT</FieldLabel>
                    <select
                      value={selectedClientId}
                      onChange={e => setSelectedClientId(e.target.value)}
                      className="w-full px-3 py-2 text-sm outline-none"
                      style={{ background: '#1E2225', border: '1px solid #2A2F33', color: '#F2EFEA', fontFamily: 'Inter, sans-serif' }}
                    >
                      <option value="">— Choose client —</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <>
                    <div>
                      <FieldLabel>NAME *</FieldLabel>
                      <FieldInput value={newClientName} onChange={setNewClientName} placeholder="Full name" />
                    </div>
                    <div>
                      <FieldLabel>PHONE</FieldLabel>
                      <FieldInput value={newClientPhone} onChange={setNewClientPhone} placeholder="+230 5xxx xxxx" type="tel" />
                    </div>
                  </>
                )}
              </>
            )}

            {/* ── STEP 2: VEHICLE ── */}
            {step === 2 && (
              <>
                {clientVehicles.length > 0 && (
                  <div className="flex gap-2">
                    {(['existing', 'new'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setVehicleMode(mode)}
                        className="flex-1 py-1.5 text-xs font-bold"
                        style={{
                          background: vehicleMode === mode ? '#FF5A1F' : '#1E2225',
                          color: vehicleMode === mode ? '#fff' : '#F2EFEA66',
                          border: vehicleMode === mode ? 'none' : '1px solid #2A2F33',
                          fontFamily: 'JetBrains Mono, monospace',
                          cursor: 'pointer',
                        }}
                      >
                        {mode === 'existing' ? 'EXISTING VEHICLE' : 'NEW VEHICLE'}
                      </button>
                    ))}
                  </div>
                )}

                {(vehicleMode === 'existing' && clientVehicles.length > 0) ? (
                  <div>
                    <FieldLabel>SELECT VEHICLE</FieldLabel>
                    <div className="flex flex-col gap-2">
                      {clientVehicles.map(v => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVehicleId(v.id)}
                          className="w-full p-3 text-left"
                          style={{
                            background: selectedVehicleId === v.id ? '#1E2225' : '#0B0D0E',
                            border: `1px solid ${selectedVehicleId === v.id ? '#FF5A1F' : '#2A2F33'}`,
                            cursor: 'pointer',
                          }}
                        >
                          <p className="text-xs font-bold" style={{ color: '#F2EFEA', fontFamily: 'JetBrains Mono, monospace' }}>{v.registration}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#F2EFEA66', fontFamily: 'Inter, sans-serif' }}>{v.make} {v.model} {v.year}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <FieldLabel>REGISTRATION *</FieldLabel>
                      <FieldInput value={newVehicleReg} onChange={v => setNewVehicleReg(v.toUpperCase())} placeholder="AB 1234" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <FieldLabel>MAKE *</FieldLabel>
                        <FieldInput value={newVehicleMake} onChange={setNewVehicleMake} placeholder="Toyota" />
                      </div>
                      <div>
                        <FieldLabel>MODEL *</FieldLabel>
                        <FieldInput value={newVehicleModel} onChange={setNewVehicleModel} placeholder="Corolla" />
                      </div>
                    </div>
                    <div>
                      <FieldLabel>YEAR</FieldLabel>
                      <FieldInput value={newVehicleYear} onChange={setNewVehicleYear} type="number" placeholder="2020" />
                    </div>
                  </>
                )}
              </>
            )}

            {/* ── STEP 3: SERVICE + DETAILS ── */}
            {step === 3 && (
              <>
                <div>
                  <FieldLabel>SERVICES *</FieldLabel>
                  <div className="flex flex-col gap-1">
                    {services.map(svc => {
                      const checked = selectedServiceIds.includes(svc.id)
                      return (
                        <button
                          key={svc.id}
                          onClick={() => setSelectedServiceIds(prev =>
                            checked ? prev.filter(id => id !== svc.id) : [...prev, svc.id]
                          )}
                          className="flex items-center justify-between px-3 py-2 text-sm text-left"
                          style={{
                            background: checked ? '#1E2225' : '#0B0D0E',
                            border: `1px solid ${checked ? '#FF5A1F' : '#2A2F33'}`,
                            cursor: 'pointer',
                          }}
                        >
                          <span style={{ color: '#F2EFEA', fontFamily: 'Inter, sans-serif' }}>{svc.name_en}</span>
                          <span style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>₨{svc.base_price_mur.toLocaleString()}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>DATE *</FieldLabel>
                    <FieldInput value={scheduledDate} onChange={setScheduledDate} type="date" />
                  </div>
                  <div>
                    <FieldLabel>TIME</FieldLabel>
                    <FieldInput value={scheduledTime} onChange={setScheduledTime} type="time" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>BAY</FieldLabel>
                    <select
                      value={bayNumber}
                      onChange={e => setBayNumber(e.target.value)}
                      className="w-full px-3 py-2 text-sm outline-none"
                      style={{ background: '#1E2225', border: '1px solid #2A2F33', color: '#F2EFEA', fontFamily: 'Inter, sans-serif' }}
                    >
                      <option value="">—</option>
                      {[1, 2, 3, 4].map(n => <option key={n} value={n}>Bay {n}</option>)}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>MECHANIC</FieldLabel>
                    <select
                      value={selectedMechanicId}
                      onChange={e => setSelectedMechanicId(e.target.value)}
                      className="w-full px-3 py-2 text-sm outline-none"
                      style={{ background: '#1E2225', border: '1px solid #2A2F33', color: '#F2EFEA', fontFamily: 'Inter, sans-serif' }}
                    >
                      <option value="">—</option>
                      {mechanics.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <FieldLabel>EST. COST (₨)</FieldLabel>
                  <FieldInput value={estimatedCost} onChange={setEstimatedCost} type="number" placeholder="0" />
                </div>

                <div>
                  <FieldLabel>NOTES</FieldLabel>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm outline-none resize-none"
                    style={{ background: '#1E2225', border: '1px solid #2A2F33', color: '#F2EFEA', fontFamily: 'Inter, sans-serif' }}
                    placeholder="Additional notes…"
                  />
                </div>
              </>
            )}

            {/* ── STEP 4: CONFIRM ── */}
            {step === 4 && (
              <div className="flex flex-col gap-3">
                <div className="p-4 flex flex-col gap-3" style={{ background: '#0B0D0E', border: '1px solid #2A2F33' }}>
                  {[
                    { label: 'CLIENT',   value: clientLabel },
                    { label: 'VEHICLE',  value: vehicleLabel },
                    { label: 'SERVICES', value: serviceLabels || '—' },
                    { label: 'DATE',     value: `${scheduledDate} ${scheduledTime}` },
                    { label: 'BAY',      value: bayNumber ? `Bay ${bayNumber}` : '—' },
                    { label: 'MECHANIC', value: mechanicLabel },
                    { label: 'EST. COST', value: estimatedCost ? `₨${parseInt(estimatedCost).toLocaleString()}` : '—' },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between gap-4">
                      <span className="text-[10px] font-bold flex-shrink-0" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace' }}>{row.label}</span>
                      <span className="text-sm text-right" style={{ color: '#F2EFEA', fontFamily: 'Inter, sans-serif' }}>{row.value}</span>
                    </div>
                  ))}
                  {notes && (
                    <div>
                      <span className="text-[10px] font-bold" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace' }}>NOTES</span>
                      <p className="text-sm mt-1" style={{ color: '#F2EFEA', fontFamily: 'Inter, sans-serif' }}>{notes}</p>
                    </div>
                  )}
                </div>

                {createError && (
                  <p className="text-xs" style={{ color: '#E8412B', fontFamily: 'JetBrains Mono, monospace' }}>ERROR: {createError}</p>
                )}

                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full py-3 text-sm font-bold"
                  style={{ background: '#FF5A1F', color: '#fff', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.05em', border: 'none', cursor: 'pointer', opacity: creating ? 0.7 : 1 }}
                >
                  {creating ? 'CREATING…' : 'CREATE BOOKING'}
                </button>
              </div>
            )}

            {/* ── Navigation ── */}
            {!createdRef && (
              <div className="flex gap-2 mt-auto pt-4">
                {step > 1 && (
                  <button
                    onClick={() => setStep(s => (s - 1) as 1 | 2 | 3 | 4)}
                    className="flex-1 py-2.5 text-xs font-bold"
                    style={{ background: '#1E2225', color: '#F2EFEA66', border: '1px solid #2A2F33', fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}
                  >
                    ← BACK
                  </button>
                )}
                {step < 4 && (
                  <button
                    onClick={() => setStep(s => (s + 1) as 1 | 2 | 3 | 4)}
                    disabled={
                      (step === 1 && !canAdvanceStep1()) ||
                      (step === 2 && !canAdvanceStep2()) ||
                      (step === 3 && !canAdvanceStep3())
                    }
                    className="flex-1 py-2.5 text-xs font-bold"
                    style={{
                      background: '#FF5A1F',
                      color: '#fff',
                      border: 'none',
                      fontFamily: 'JetBrains Mono, monospace',
                      cursor: 'pointer',
                      opacity: (
                        (step === 1 && !canAdvanceStep1()) ||
                        (step === 2 && !canAdvanceStep2()) ||
                        (step === 3 && !canAdvanceStep3())
                      ) ? 0.4 : 1,
                    }}
                  >
                    NEXT →
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
