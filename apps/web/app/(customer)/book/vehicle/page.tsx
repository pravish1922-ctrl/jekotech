'use client'

import { useEffect, useRef, useState } from 'react'
import { createBrowserSupabaseClient as createBrowserClient } from '../../../../lib/supabase-browser'
import { useBooking } from '../booking-context'

interface FoundVehicle {
  id: string
  registration: string
  make: string
  model: string
  year: number
  colour: string | null
  mileage: number
}

export default function VehiclePage() {
  const { setVehicle, setCanProceed } = useBooking()
  const [supabase] = useState(() => createBrowserClient())

  const [reg,       setReg]       = useState('')
  const [found,     setFound]     = useState<FoundVehicle | null>(null)
  const [notFound,  setNotFound]  = useState(false)
  const [searching, setSearching] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  // Manual entry fields
  const [make,    setMake]    = useState('')
  const [model,   setModel]   = useState('')
  const [year,    setYear]    = useState('')
  const [colour,  setColour]  = useState('')
  const [mileage, setMileage] = useState('')
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    setCanProceed(confirmed)
  }, [confirmed, setCanProceed])

  async function handleLookup() {
    const clean = reg.toUpperCase().replace(/\s/g, '')
    if (!clean) return
    setSearching(true)
    setFound(null)
    setNotFound(false)
    setConfirmed(false)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('vehicles')
      .select('id, registration, make, model, year, colour, mileage')
      .eq('owner_client_id', user.id)
      .eq('registration', clean)
      .single()

    setSearching(false)
    if (data) {
      setFound(data as FoundVehicle)
    } else {
      setNotFound(true)
    }
  }

  function handleUseFound() {
    if (!found) return
    setVehicle(found.id, found.registration, found.make, found.model, found.year, found.mileage)
    setConfirmed(true)
  }

  async function handleConfirmManual() {
    const cleanReg = reg.toUpperCase().replace(/\s/g, '')
    if (!cleanReg || !make || !model || !year) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { data, error } = await supabase
      .from('vehicles')
      .insert({
        owner_client_id: user.id,
        registration:    cleanReg,
        make:            make.trim(),
        model:           model.trim(),
        year:            parseInt(year, 10),
        colour:          colour.trim() || null,
        mileage:         parseInt(mileage, 10) || 0,
      })
      .select('id')
      .single()

    setSaving(false)
    if (!error && data) {
      setVehicle(
        (data as { id: string }).id,
        cleanReg, make.trim(), model.trim(),
        parseInt(year, 10), parseInt(mileage, 10) || 0,
      )
      setConfirmed(true)
    }
  }

  const canManualConfirm = make && model && year && !saving

  return (
    <div className="px-6 pt-10 pb-4">
      <p className="font-mono text-[9px] tracking-mono2 uppercase text-steel2 mb-3">
        STEP 3 OF 8
      </p>
      <h1 className="font-display text-[28px] font-bold text-bone tracking-tighter mb-8">
        Which vehicle?
      </h1>

      {/* Registration input + Look up */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={reg}
          onChange={e => {
            setReg(e.target.value.toUpperCase().replace(/\s/g, ''))
            setFound(null)
            setNotFound(false)
            setConfirmed(false)
          }}
          placeholder="AB12 CDE"
          className="flex-1 bg-ink2 text-bone font-mono text-[15px] tracking-mono uppercase placeholder:text-steel px-3.5 outline-none transition-colors duration-120"
          style={{ height: 50, border: '1.5px solid #2A2F33' }}
          onFocus={e  => (e.currentTarget.style.borderColor = '#FF5A1F')}
          onBlur={e   => (e.currentTarget.style.borderColor = '#2A2F33')}
          onKeyDown={e => e.key === 'Enter' && handleLookup()}
        />
        <button
          type="button"
          onClick={handleLookup}
          disabled={!reg || searching}
          className="flex-shrink-0 px-4 font-mono text-[10px] tracking-mono uppercase text-bone transition-colors duration-120 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ height: 50, background: '#15181A', border: '1.5px solid #2A2F33' }}
        >
          {searching ? '…' : 'LOOK UP →'}
        </button>
      </div>

      {/* Found vehicle */}
      {found && !confirmed && (
        <div className="border border-ink4 mb-4">
          <div className="px-4 py-4">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="flex items-center justify-center bg-ink px-2 flex-shrink-0"
                style={{ height: 32, border: '1px solid #2A2F33' }}
              >
                <span className="font-mono text-[11px] font-bold tracking-mono uppercase text-bone">
                  {found.registration}
                </span>
              </div>
              <div>
                <p className="font-display font-semibold text-[14px] text-bone">
                  {found.make} {found.model}
                </p>
                <p className="font-mono text-[10px] tracking-mono uppercase text-steel3 mt-0.5">
                  {found.year}{found.colour ? ` · ${found.colour}` : ''} · {found.mileage.toLocaleString('en-US')} mi
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleUseFound}
              className="w-full flex items-center justify-center gap-2 bg-orange hover:bg-orangeDeep text-white font-display font-semibold text-[14px] tracking-[0.06em] uppercase transition-colors duration-120"
              style={{ height: 48 }}
            >
              USE THIS VEHICLE →
            </button>
          </div>
        </div>
      )}

      {/* Confirmed state */}
      {confirmed && (
        <div
          className="border px-4 py-3 mb-4 flex items-center gap-3"
          style={{ borderColor: '#2F9E5A' }}
        >
          <span className="font-mono text-[10px] tracking-mono uppercase text-green">
            ✓ Vehicle confirmed
          </span>
          <button
            type="button"
            onClick={() => { setConfirmed(false); setFound(null); setNotFound(false) }}
            className="ml-auto font-mono text-[10px] tracking-mono uppercase text-steel2 hover:text-bone transition-colors"
          >
            CHANGE
          </button>
        </div>
      )}

      {/* Manual entry */}
      {notFound && !confirmed && (
        <div>
          <p className="font-mono text-[10px] tracking-mono uppercase text-steel2 mb-4">
            Not on file — enter details manually
          </p>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Make',         value: make,    set: setMake,    placeholder: 'Toyota' },
              { label: 'Model',        value: model,   set: setModel,   placeholder: 'Yaris' },
              { label: 'Year',         value: year,    set: setYear,    placeholder: '2019', type: 'number' },
              { label: 'Colour',       value: colour,  set: setColour,  placeholder: 'Silver (optional)' },
              { label: 'Mileage (mi)', value: mileage, set: setMileage, placeholder: '45000', type: 'number' },
            ].map(({ label, value, set, placeholder, type = 'text' }) => (
              <div key={label}>
                <label className="block font-mono text-[9px] tracking-mono2 uppercase text-steel2 mb-1.5">
                  {label}
                </label>
                <input
                  type={type}
                  value={value}
                  onChange={e => set(e.target.value)}
                  placeholder={placeholder}
                  className="w-full bg-ink2 text-bone font-sans text-[15px] placeholder:text-steel px-3.5 outline-none transition-colors duration-120"
                  style={{ height: 50, border: '1.5px solid #2A2F33' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#FF5A1F')}
                  onBlur={e  => (e.currentTarget.style.borderColor = '#2A2F33')}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={handleConfirmManual}
              disabled={!canManualConfirm}
              className="w-full flex items-center justify-center gap-2 bg-orange hover:bg-orangeDeep text-white font-display font-semibold text-[14px] tracking-[0.06em] uppercase transition-colors duration-120 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              style={{ height: 52 }}
            >
              {saving ? 'Saving…' : 'CONFIRM VEHICLE →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
