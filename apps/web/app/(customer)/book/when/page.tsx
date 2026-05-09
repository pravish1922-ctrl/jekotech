'use client'

import { useEffect, useState } from 'react'
import { useBooking } from '../booking-context'

const TIME_SLOTS = ['08:30', '10:30', '13:00', '15:30'] as const

// Build 14 days from tomorrow, skipping Saturdays
function buildDays(): { iso: string; weekday: string; day: string }[] {
  const days: { iso: string; weekday: string; day: string }[] = []
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  cursor.setDate(cursor.getDate() + 1) // start from tomorrow

  while (days.length < 14) {
    if (cursor.getDay() !== 6) { // 6 = Saturday
      days.push({
        iso:     cursor.toISOString().slice(0, 10),
        weekday: cursor.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase(),
        day:     String(cursor.getDate()),
      })
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

const DAYS = buildDays()

export default function WhenPage() {
  const { date: ctxDate, time: ctxTime, setDateTime, setCanProceed } = useBooking()

  const [selectedDate, setSelectedDate] = useState(ctxDate)
  const [selectedTime, setSelectedTime] = useState(ctxTime)

  useEffect(() => {
    setCanProceed(!!(selectedDate && selectedTime))
  }, [selectedDate, selectedTime, setCanProceed])

  function pickDate(iso: string) {
    setSelectedDate(iso)
    setDateTime(iso, selectedTime)
  }

  function pickTime(t: string) {
    setSelectedTime(t)
    setDateTime(selectedDate, t)
  }

  return (
    <div className="pt-10 pb-4">
      <div className="px-6">
        <p className="font-mono text-[9px] tracking-mono2 uppercase text-steel2 mb-3">
          STEP 2 OF 8
        </p>
        <h1 className="font-display text-[28px] font-bold text-bone tracking-tighter mb-8">
          When shall we book?
        </h1>
      </div>

      {/* Horizontal date strip */}
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-2 px-6" style={{ width: 'max-content' }}>
          {DAYS.map(d => {
            const isActive = d.iso === selectedDate
            return (
              <button
                key={d.iso}
                type="button"
                onClick={() => pickDate(d.iso)}
                className="flex flex-col items-center justify-center gap-1 flex-shrink-0 transition-colors duration-120"
                style={{
                  width:      52,
                  height:     68,
                  background: isActive ? '#F2EFEA' : '#15181A',
                  border:     `1px solid ${isActive ? '#F2EFEA' : '#2A2F33'}`,
                }}
              >
                <span
                  className="font-mono text-[9px] tracking-mono uppercase leading-none"
                  style={{ color: isActive ? '#0B0D0E' : '#5C6369' }}
                >
                  {d.weekday}
                </span>
                <span
                  className="font-display font-bold leading-none"
                  style={{ fontSize: 22, color: isActive ? '#0B0D0E' : '#F2EFEA' }}
                >
                  {d.day}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Time slots — 2×2 grid */}
      <div className="px-6 mt-8">
        <p className="font-mono text-[9px] tracking-mono2 uppercase text-steel2 mb-4">
          AVAILABLE SLOTS
        </p>
        <div className="grid grid-cols-2 gap-3">
          {TIME_SLOTS.map(t => {
            const isActive = t === selectedTime
            return (
              <button
                key={t}
                type="button"
                onClick={() => pickTime(t)}
                className="flex items-center justify-center transition-colors duration-120"
                style={{
                  height:     52,
                  background: isActive ? '#FF5A1F' : '#15181A',
                  border:     `1px solid ${isActive ? '#FF5A1F' : '#2A2F33'}`,
                  color:      '#F2EFEA',
                }}
              >
                <span className="font-mono text-[16px] tracking-mono">
                  {t}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
