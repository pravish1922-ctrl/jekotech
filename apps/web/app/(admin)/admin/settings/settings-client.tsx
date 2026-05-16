'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface ServiceRow {
  id: string
  name_en: string
  base_price_mur: number
  active: boolean
}

interface Props {
  profileName: string
  profileEmail: string
  profileRole: string
  services: ServiceRow[]
}

export function SettingsClient({ profileName, profileEmail, profileRole, services: initial }: Props) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [services, setServices] = useState<ServiceRow[]>(initial)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function updatePrice(id: string, raw: string) {
    const val = parseInt(raw) || 0
    setServices(prev => prev.map(s => s.id === id ? { ...s, base_price_mur: val } : s))
  }

  function updateActive(id: string, active: boolean) {
    setServices(prev => prev.map(s => s.id === id ? { ...s, active } : s))
  }

  async function handleSave(svc: ServiceRow) {
    setSavingId(svc.id)
    setErrors(prev => ({ ...prev, [svc.id]: '' }))
    const { error } = await supabase
      .from('services')
      .update({ base_price_mur: svc.base_price_mur, active: svc.active })
      .eq('id', svc.id)
    setSavingId(null)
    if (error) {
      setErrors(prev => ({ ...prev, [svc.id]: error.message }))
    } else {
      setSavedId(svc.id)
      setTimeout(() => setSavedId(s => s === svc.id ? null : s), 1800)
    }
  }

  return (
    <div className="px-6 mt-6 max-w-lg flex flex-col gap-4">

      {/* Account section */}
      <div className="p-4" style={{ background: '#15181A', border: '1px solid #2A2F33', boxShadow: '4px 4px 0 #0B0D0E' }}>
        <h2 className="text-[10px] font-bold mb-3" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>
          ACCOUNT
        </h2>
        {[
          { label: 'NAME',  value: profileName  || '—' },
          { label: 'EMAIL', value: profileEmail || '—' },
          { label: 'ROLE',  value: profileRole.toUpperCase() },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center py-2" style={{ borderTop: '1px solid #2A2F33' }}>
            <span className="text-xs" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace' }}>{label}</span>
            <span className="text-sm" style={{ color: '#F2EFEA', fontFamily: 'Inter, sans-serif' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Services & Pricing */}
      <div className="p-4" style={{ background: '#15181A', border: '1px solid #2A2F33', boxShadow: '4px 4px 0 #0B0D0E' }}>
        <h2 className="text-[10px] font-bold mb-3" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>
          SERVICES & PRICING
        </h2>
        <div className="flex flex-col gap-3">
          {services.map(svc => (
            <div key={svc.id} className="pt-3" style={{ borderTop: '1px solid #2A2F33' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: '#F2EFEA', fontFamily: 'Inter, sans-serif' }}>{svc.name_en}</span>
                <button
                  onClick={() => updateActive(svc.id, !svc.active)}
                  className="text-[10px] font-bold px-2 py-0.5"
                  style={{
                    background: svc.active ? '#2F9E5A' : '#2A2F33',
                    color: svc.active ? '#fff' : '#8B9197',
                    fontFamily: 'JetBrains Mono, monospace',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {svc.active ? 'ACTIVE' : 'INACTIVE'}
                </button>
              </div>
              <div className="flex gap-2 items-center">
                <div className="flex items-center flex-1" style={{ border: '1px solid #2A2F33', background: '#1E2225' }}>
                  <span className="px-2 text-sm" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace' }}>₨</span>
                  <input
                    type="number"
                    value={svc.base_price_mur}
                    onChange={e => updatePrice(svc.id, e.target.value)}
                    className="flex-1 py-2 pr-3 text-sm outline-none"
                    style={{ background: 'transparent', color: '#F2EFEA', fontFamily: 'JetBrains Mono, monospace' }}
                    min={0}
                  />
                </div>
                <button
                  onClick={() => handleSave(svc)}
                  disabled={savingId === svc.id}
                  className="px-3 py-2 text-xs font-bold flex-shrink-0"
                  style={{
                    background: savedId === svc.id ? '#2F9E5A' : '#FF5A1F',
                    color: '#fff',
                    fontFamily: 'Space Grotesk, sans-serif',
                    opacity: savingId === svc.id ? 0.6 : 1,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {savingId === svc.id ? '…' : savedId === svc.id ? '✓' : 'SAVE'}
                </button>
              </div>
              {errors[svc.id] && (
                <p className="text-xs mt-1" style={{ color: '#E8412B', fontFamily: 'JetBrains Mono, monospace' }}>
                  {errors[svc.id]}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Business Hours */}
      <div className="p-4" style={{ background: '#15181A', border: '1px solid #2A2F33', boxShadow: '4px 4px 0 #0B0D0E' }}>
        <h2 className="text-[10px] font-bold mb-3" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>
          BUSINESS HOURS
        </h2>
        {[
          { day: 'MON – FRI', hours: '08:00 – 17:00' },
          { day: 'SUNDAY',    hours: '08:00 – 13:00' },
          { day: 'SATURDAY',  hours: 'CLOSED' },
        ].map(({ day, hours }) => (
          <div key={day} className="flex justify-between items-center py-2" style={{ borderTop: '1px solid #2A2F33' }}>
            <span className="text-xs" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace' }}>{day}</span>
            <span className="text-sm" style={{ color: hours === 'CLOSED' ? '#E8412B' : '#F2EFEA', fontFamily: 'JetBrains Mono, monospace' }}>{hours}</span>
          </div>
        ))}
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid #2A2F33' }}>
          <p className="text-[10px] font-bold mb-1" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' }}>SLOTS</p>
          <p className="text-sm" style={{ color: '#F2EFEA66', fontFamily: 'JetBrains Mono, monospace' }}>08:30 · 10:30 · 13:00 · 15:30</p>
        </div>
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid #2A2F33' }}>
          <p className="text-[10px] font-bold mb-1" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' }}>BAYS</p>
          <p className="text-sm" style={{ color: '#F2EFEA66', fontFamily: 'JetBrains Mono, monospace' }}>4 ACTIVE</p>
        </div>
      </div>

      {/* Garage Info */}
      <div className="p-4" style={{ background: '#15181A', border: '1px solid #2A2F33', boxShadow: '4px 4px 0 #0B0D0E' }}>
        <h2 className="text-[10px] font-bold mb-3" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>
          GARAGE INFO
        </h2>
        {[
          { label: 'NAME',    value: 'JEKOTECH Car Services Ltd' },
          { label: 'ADDRESS', value: 'Savanne Road, Nouvelle France, Mauritius' },
          { label: 'PHONE',   value: '+230 5709 9631' },
          { label: 'EMAIL',   value: 'info@jekotechltd.com' },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between items-start gap-4 py-2" style={{ borderTop: '1px solid #2A2F33' }}>
            <span className="text-xs flex-shrink-0" style={{ color: '#F2EFEA44', fontFamily: 'JetBrains Mono, monospace' }}>{label}</span>
            <span className="text-sm text-right" style={{ color: '#F2EFEA', fontFamily: 'Inter, sans-serif' }}>{value}</span>
          </div>
        ))}
      </div>

    </div>
  )
}
