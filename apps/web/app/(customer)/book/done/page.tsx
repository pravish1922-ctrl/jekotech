'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function DoneContent() {
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref') ?? '—'

  return (
    <main className="min-h-screen bg-ink max-w-md mx-auto flex flex-col items-center justify-center px-6 text-center">

      {/* Check circle */}
      <div
        className="rounded-full bg-orange flex items-center justify-center mb-8"
        style={{ width: 64, height: 64 }}
        aria-hidden
      >
        <svg width="28" height="22" viewBox="0 0 28 22" fill="none">
          <path
            d="M2 11L10 19L26 3"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        </svg>
      </div>

      <h1 className="font-display text-[28px] font-bold text-bone tracking-tighter mb-3">
        Booking received!
      </h1>
      <p className="font-mono text-[10px] tracking-mono uppercase text-steel3 mb-8">
        We&apos;ll confirm your slot shortly.
      </p>

      {/* Reference badge */}
      <div
        className="inline-flex items-center justify-center px-5 py-3 mb-10 bg-ink4"
        aria-label={`Booking reference ${ref}`}
      >
        <span className="font-mono text-[22px] font-bold text-bone tracking-mono">
          {ref}
        </span>
      </div>

      {/* CTAs */}
      <div className="w-full flex flex-col gap-3">
        <Link
          href="/home"
          className="w-full flex items-center justify-center gap-2 bg-orange hover:bg-orangeDeep text-white font-display font-semibold text-[15px] tracking-[0.06em] uppercase transition-colors duration-120"
          style={{ height: 56 }}
        >
          BACK TO DASHBOARD →
        </Link>
        <button
          type="button"
          onClick={() => {
            // Calendar stub — deep link to native calendar on mobile
            const url = `webcal://`
            window.open(url, '_blank')
          }}
          className="w-full flex items-center justify-center gap-2 bg-transparent text-bone font-display font-semibold text-[13px] tracking-[0.04em] uppercase transition-colors duration-120 hover:bg-ink2"
          style={{ height: 52, border: '1.5px solid #2A2F33' }}
        >
          ADD TO CALENDAR
        </button>
      </div>
    </main>
  )
}

export default function DonePage() {
  return (
    <Suspense>
      <DoneContent />
    </Suspense>
  )
}
