'use client'

import { useEffect, useState } from 'react'
import { createBrowserSupabaseClient as createBrowserClient } from '../../../lib/supabase-browser'
import { useBooking } from './booking-context'

interface Service {
  id: string
  name: string
  description: string
  base_price_mur: number
  estimated_duration_min: number
}

function formatMUR(n: number): string {
  return `₨ ${n.toLocaleString('en-US')}`
}

export default function ServiceSelectPage() {
  const { serviceId, setService, setCanProceed } = useBooking()

  const [services, setServices]   = useState<Service[]>([])
  const [loading,  setLoading]    = useState(true)
  const [fetchErr, setFetchErr]   = useState<string | null>(null)
  const [selected, setSelected]   = useState(serviceId)

  useEffect(() => {
    const sb = createBrowserClient()
    sb.from('services')
      .select('id, name, description, base_price_mur, estimated_duration_min')
      .eq('active', true)
      .order('base_price_mur', { ascending: true })
      .then(({ data, error }) => {
        if (error) setFetchErr(error.message)
        setServices((data as Service[]) ?? [])
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    setCanProceed(!!selected)
  }, [selected, setCanProceed])

  function pick(svc: Service) {
    setSelected(svc.id)
    setService(svc.id, svc.name, svc.base_price_mur, svc.estimated_duration_min)
  }

  return (
    <div className="px-6 pt-10 pb-4">
      <p className="font-mono text-[9px] tracking-mono2 uppercase text-steel2 mb-3">
        STEP 1 OF 8
      </p>
      <h1 className="font-display text-[28px] font-bold text-bone tracking-tighter mb-8">
        What do you need?
      </h1>

      {loading ? (
        <p className="font-mono text-[10px] tracking-mono uppercase text-steel2">
          Loading services…
        </p>
      ) : fetchErr ? (
        <p className="font-mono text-[10px] tracking-mono uppercase text-red" role="alert">
          {fetchErr}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {services.map(svc => {
            const isSelected = selected === svc.id
            return (
              <li key={svc.id}>
                <button
                  type="button"
                  onClick={() => pick(svc)}
                  className="w-full text-left flex items-stretch border transition-colors duration-120"
                  style={{
                    borderColor:   isSelected ? '#FF5A1F' : '#2A2F33',
                    borderLeftWidth: 3,
                    background:    isSelected ? '#15181A' : 'transparent',
                  }}
                >
                  {/* Left content */}
                  <div className="flex-1 px-4 py-4">
                    <p className="font-display font-semibold text-[15px] text-bone mb-1">
                      {svc.name}
                    </p>
                    {svc.description ? (
                      <p className="font-sans text-[12px] text-steel3 leading-snug">
                        {svc.description}
                      </p>
                    ) : null}
                  </div>

                  {/* Right: price + duration */}
                  <div
                    className="flex flex-col items-end justify-center px-4 gap-1 flex-shrink-0"
                    style={{ borderLeft: '1px solid #2A2F33' }}
                  >
                    <span className="font-display font-bold text-[15px] text-bone">
                      {formatMUR(svc.base_price_mur)}
                    </span>
                    <span className="font-mono text-[9px] tracking-mono uppercase text-steel3">
                      {svc.estimated_duration_min} min
                    </span>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
