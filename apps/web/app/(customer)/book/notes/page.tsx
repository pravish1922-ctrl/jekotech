'use client'

import { useEffect, useState } from 'react'
import { useBooking } from '../booking-context'

const CHIPS = [
  'Strange noise',
  'Warning light on',
  'Routine check',
  'Vibration when braking',
] as const

const MAX_CHARS = 500

export default function NotesPage() {
  const { notes: ctxNotes, setNotes, setCanProceed } = useBooking()

  const [activeChips, setActiveChips] = useState<Set<string>>(new Set())
  const [freeText,    setFreeText]    = useState(ctxNotes)

  useEffect(() => {
    setCanProceed(true) // always enabled
  }, [setCanProceed])

  function toggleChip(chip: string) {
    setActiveChips(prev => {
      const next = new Set(prev)
      next.has(chip) ? next.delete(chip) : next.add(chip)
      const combined = buildNotes(next, freeText)
      setNotes(combined)
      return next
    })
  }

  function handleTextChange(v: string) {
    const trimmed = v.slice(0, MAX_CHARS)
    setFreeText(trimmed)
    setNotes(buildNotes(activeChips, trimmed))
  }

  function buildNotes(chips: Set<string>, text: string): string {
    const parts: string[] = []
    if (chips.size > 0) parts.push([...chips].join(', '))
    if (text.trim()) parts.push(text.trim())
    return parts.join('. ')
  }

  return (
    <div className="px-6 pt-10 pb-4">
      <p className="font-mono text-[9px] tracking-mono2 uppercase text-steel2 mb-3">
        STEP 5 OF 8
      </p>
      <h1 className="font-display text-[28px] font-bold text-bone tracking-tighter mb-8">
        Any notes for us?
      </h1>

      {/* Quick-select chips */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        {CHIPS.map(chip => {
          const active = activeChips.has(chip)
          return (
            <button
              key={chip}
              type="button"
              onClick={() => toggleChip(chip)}
              className="flex items-center justify-center px-3 py-3 font-mono text-[10px] tracking-mono uppercase text-center leading-snug transition-colors duration-120"
              style={{
                border:     `1.5px solid ${active ? '#FF5A1F' : '#2A2F33'}`,
                background: active ? '#FF5A1F1A' : 'transparent',
                color:      active ? '#FF5A1F' : '#8B9197',
              }}
            >
              {chip}
            </button>
          )
        })}
      </div>

      {/* Free text */}
      <div className="relative">
        <textarea
          value={freeText}
          onChange={e => handleTextChange(e.target.value)}
          placeholder="Any other details…"
          rows={5}
          className="w-full bg-ink2 text-bone font-sans text-[14px] placeholder:text-steel px-3.5 py-3 outline-none resize-none transition-colors duration-120"
          style={{ border: '1.5px solid #2A2F33' }}
          onFocus={e => (e.currentTarget.style.borderColor = '#FF5A1F')}
          onBlur={e  => (e.currentTarget.style.borderColor = '#2A2F33')}
        />
        <span className="absolute bottom-3 right-3 font-mono text-[9px] tracking-mono uppercase text-steel2">
          {freeText.length}/{MAX_CHARS}
        </span>
      </div>
    </div>
  )
}
