'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useBooking } from './booking-context'

// ── Step registry ─────────────────────────────────────────────────────────────

const STEPS = [
  { path: '/book',          name: 'SERVICE',  showNext: true },
  { path: '/book/when',     name: 'WHEN',     showNext: true },
  { path: '/book/vehicle',  name: 'VEHICLE',  showNext: true },
  { path: '/book/history',  name: 'HISTORY',  showNext: true },
  { path: '/book/notes',    name: 'NOTES',    showNext: true },
  { path: '/book/photos',   name: 'PHOTOS',   showNext: true },
  { path: '/book/confirm',  name: 'CONFIRM',  showNext: false }, // confirm page owns its CTA
] as const

const NEXT_PATH: Record<string, string> = {
  '/book':          '/book/when',
  '/book/when':     '/book/vehicle',
  '/book/vehicle':  '/book/history',
  '/book/history':  '/book/notes',
  '/book/notes':    '/book/photos',
  '/book/photos':   '/book/confirm',
}

const PREV_PATH: Record<string, string> = {
  '/book':          '/home',
  '/book/when':     '/book',
  '/book/vehicle':  '/book/when',
  '/book/history':  '/book/vehicle',
  '/book/notes':    '/book/history',
  '/book/photos':   '/book/notes',
  '/book/confirm':  '/book/photos',
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BookingFooter() {
  const pathname            = usePathname()
  const router              = useRouter()
  const { canProceed }      = useBooking()

  const stepIdx = STEPS.findIndex(s => s.path === pathname)
  if (stepIdx === -1) return null  // done page or unknown path

  const step        = STEPS[stepIdx]
  const displayStep = stepIdx + 1

  function handleBack() {
    const prev = PREV_PATH[pathname]
    if (prev) router.push(prev)
  }

  function handleNext() {
    const next = NEXT_PATH[pathname]
    if (next) router.push(next)
  }

  return (
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-ink"
      style={{ borderTop: '1px solid #2A2F33', zIndex: 50 }}
    >
      {/* 8-segment progress bar */}
      <div className="flex">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex-1"
            style={{ height: 2, background: i < displayStep ? '#FF5A1F' : '#2A2F33' }}
          />
        ))}
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between px-5 py-4">
        <button
          type="button"
          onClick={handleBack}
          className="font-mono text-[10px] tracking-mono uppercase text-steel2 hover:text-bone transition-colors duration-120"
        >
          ← BACK
        </button>

        <span className="font-mono text-[9px] tracking-mono uppercase text-steel3">
          STEP {displayStep} OF 8 · {step.name}
        </span>

        {step.showNext ? (
          <button
            type="button"
            disabled={!canProceed}
            onClick={handleNext}
            className="font-mono text-[10px] tracking-mono uppercase text-orange hover:text-orangeDeep transition-colors duration-120 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            NEXT →
          </button>
        ) : (
          <div style={{ width: 48 }} aria-hidden />
        )}
      </div>
    </div>
  )
}
