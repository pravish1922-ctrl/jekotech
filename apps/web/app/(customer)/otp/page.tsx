'use client'

import { Suspense, useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { JKMark } from '../../../components/ui/jk-mark'
import { createBrowserSupabaseClient as createBrowserClient } from '../../../lib/supabase-browser'

const DIGIT_COUNT    = 6
const RESEND_SECONDS = 45

function OtpContent() {
  const router       = useRouter()
  const [supabase]   = useState(() => createBrowserClient())
  const searchParams = useSearchParams()
  const email        = searchParams.get('email') ?? ''
  const maskedEmail  = email.includes('@')
    ? `${email.slice(0, 3)}***@${email.split('@')[1]}`
    : '***'

  const [digits, setDigits]       = useState<string[]>(Array(DIGIT_COUNT).fill(''))
  const [activeIdx, setActiveIdx] = useState(0)
  const [seconds, setSeconds]     = useState(RESEND_SECONDS)
  const [canResend, setCanResend] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(DIGIT_COUNT).fill(null))

  useEffect(() => {
    if (seconds <= 0) { setCanResend(true); return }
    const id = setTimeout(() => setSeconds(s => s - 1), 1000)
    return () => clearTimeout(id)
  }, [seconds])

  const countdown =
    String(Math.floor(seconds / 60)).padStart(2, '0') +
    ':' +
    String(seconds % 60).padStart(2, '0')

  const code       = digits.join('')
  const isComplete = digits.every(d => d !== '')

  function focusAt(idx: number) {
    inputRefs.current[idx]?.focus()
    setActiveIdx(idx)
  }

  function handleChange(idx: number, raw: string) {
    const digit = raw.replace(/\D/g, '').slice(-1)
    const next  = digits.map((d, i) => (i === idx ? digit : d))
    setDigits(next)
    setError(null)
    if (digit && idx < DIGIT_COUNT - 1) focusAt(idx + 1)
  }

  function handleKeyDown(idx: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        setDigits(d => d.map((v, i) => (i === idx ? '' : v)))
      } else if (idx > 0) {
        focusAt(idx - 1)
        setDigits(d => d.map((v, i) => (i === idx - 1 ? '' : v)))
      }
    }
    if (e.key === 'ArrowLeft'  && idx > 0)              focusAt(idx - 1)
    if (e.key === 'ArrowRight' && idx < DIGIT_COUNT - 1) focusAt(idx + 1)
  }

  function handlePaste(e: ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, DIGIT_COUNT)
    if (!pasted) return
    const next = Array(DIGIT_COUNT).fill('').map((_, i) => pasted[i] ?? '')
    setDigits(next)
    focusAt(Math.min(pasted.length, DIGIT_COUNT - 1))
  }

  async function handleVerify() {
    if (!isComplete) return
    setError(null)
    setLoading(true)

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type:  'email',
    })

    if (verifyError || !data.user) {
      setError(verifyError?.message ?? 'Verification failed. Please try again.')
      setLoading(false)
      return
    }

    // Insert clients row now that email is confirmed
    const { error: insertError } = await supabase.from('clients').insert({
      id:              data.user.id,
      name:            (data.user.user_metadata?.name as string | undefined) ?? '',
      email:           data.user.email ?? email,
      role:            'customer',
      whatsapp_opt_in: false,
    })

    if (insertError && insertError.code !== '23505') {
      // 23505 = unique_violation (row already exists — that's fine)
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/home')
  }

  async function handleResend() {
    if (!canResend) return
    setSeconds(RESEND_SECONDS)
    setCanResend(false)
    setDigits(Array(DIGIT_COUNT).fill(''))
    focusAt(0)
    await supabase.auth.resend({ email, type: 'signup' })
  }

  return (
    <main className="min-h-screen bg-ink flex flex-col px-6 py-10 max-w-md mx-auto">

      {/* Wordmark */}
      <JKMark size={22} variant="light" />

      {/* Step indicator */}
      <div className="mt-10 mb-8 flex items-center gap-3">
        <div className="flex gap-1" aria-hidden>
          <span className="w-8 h-0.5 bg-bone3" />
          <span className="w-8 h-0.5 bg-orange" />
        </div>
        <p className="font-mono text-[10px] tracking-mono uppercase text-steel3">
          Step 2/2 · Verify
        </p>
      </div>

      {/* Heading + sub */}
      <h1 className="font-display text-[28px] font-bold text-bone tracking-tighter mb-2">
        Check your email.
      </h1>
      <p className="font-sans text-[14px] text-steel3 mb-10">
        We sent a 6-digit code to{' '}
        <span className="font-mono text-bone">{maskedEmail}</span>
      </p>

      {/* 6-digit OTP input row */}
      <div
        className="flex gap-3"
        role="group"
        aria-label="One-time password"
        onPaste={handlePaste}
      >
        {digits.map((digit, idx) => (
          <input
            key={idx}
            ref={el => { inputRefs.current[idx] = el }}
            type="text"
            inputMode="numeric"
            pattern="\d"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(idx, e.target.value)}
            onKeyDown={e => handleKeyDown(idx, e)}
            onFocus={() => setActiveIdx(idx)}
            aria-label={`Digit ${idx + 1}`}
            className="text-center bg-ink2 text-bone font-mono font-semibold outline-none caret-orange shrink-0"
            style={{
              width: 44,
              height: 56,
              fontSize: 22,
              border: `1.5px solid ${activeIdx === idx ? '#FF5A1F' : digit ? '#5C6369' : '#2A2F33'}`,
            }}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="font-mono text-[10px] tracking-mono uppercase text-red mt-3" role="alert">
          {error}
        </p>
      )}

      {/* Resend */}
      <div className="mt-5 flex items-center justify-center">
        {canResend ? (
          <button
            type="button"
            onClick={handleResend}
            className="font-mono text-[10px] tracking-mono uppercase text-orange hover:text-orangeDeep transition-colors duration-120 underline underline-offset-2"
          >
            Resend Code
          </button>
        ) : (
          <p className="font-mono text-[10px] tracking-mono uppercase text-steel2">
            Resend in{' '}
            <span className="text-steel3 tabular-nums">{countdown}</span>
          </p>
        )}
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={handleVerify}
        disabled={!isComplete || loading}
        className="w-full flex items-center justify-center gap-2 bg-orange hover:bg-orangeDeep text-white font-display font-semibold text-[15px] tracking-[0.06em] uppercase transition-colors duration-120 disabled:opacity-40 disabled:cursor-not-allowed mt-8"
        style={{ height: 56 }}
      >
        {loading ? (
          <span className="font-mono text-[11px] tracking-mono">Verifying…</span>
        ) : (
          <>Verify &amp; Continue <span aria-hidden>→</span></>
        )}
      </button>

      {/* Back */}
      <p className="mt-auto pt-10 text-center font-mono text-[10px] tracking-mono uppercase text-steel2">
        Wrong email?{' '}
        <button
          type="button"
          onClick={() => router.back()}
          className="text-bone hover:text-orange underline underline-offset-2 transition-colors duration-120"
        >
          Go back
        </button>
      </p>
    </main>
  )
}

export default function OtpPage() {
  return (
    <Suspense>
      <OtpContent />
    </Suspense>
  )
}
