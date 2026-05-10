'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { JKMark } from '../../../components/ui/jk-mark'

export default function ForgotPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)

    // TODO: call Supabase resetPasswordForEmail
    // await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password` })

    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    setSent(true)
  }

  return (
    <main className="min-h-screen bg-ink flex flex-col px-6 py-10 max-w-md mx-auto">

      {/* Wordmark */}
      <JKMark size={22} variant="light" />

      {sent ? (
        // ── Confirmation state ──────────────────────────────────────────────
        <div className="mt-14">
          {/* Orange square checkmark stamp */}
          <div
            className="flex items-center justify-center mb-8"
            style={{ width: 56, height: 56, border: '1.5px solid #FF5A1F' }}
            aria-hidden
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 12L9 17L20 7"
                stroke="#FF5A1F"
                strokeWidth="2.5"
                strokeLinecap="square"
                strokeLinejoin="miter"
              />
            </svg>
          </div>

          <p className="font-mono text-[10px] tracking-mono uppercase text-steel3 mb-3">
            Email sent
          </p>
          <h1 className="font-display text-[28px] font-bold text-bone tracking-tighter mb-4">
            Check your inbox.
          </h1>
          <p className="font-sans text-[14px] text-steel3 leading-relaxed mb-10">
            We sent a reset link to{' '}
            <span className="font-mono text-bone">{email}</span>.
            {' '}Check your spam folder if it doesn't arrive within a minute.
          </p>

          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 font-display font-semibold text-[14px] tracking-[0.06em] uppercase text-bone hover:text-orange transition-colors duration-120"
          >
            ← Back to Sign In
          </Link>
        </div>
      ) : (
        // ── Form state ─────────────────────────────────────────────────────
        <>
          <div className="mt-14 mb-10">
            <p className="font-mono text-[10px] tracking-mono uppercase text-steel3 mb-3">
              Password Reset
            </p>
            <h1 className="font-display text-[28px] font-bold text-bone tracking-tighter mb-3">
              Forgot your password?
            </h1>
            <p className="font-sans text-[14px] text-steel3 leading-relaxed">
              Enter your email and we'll send a reset link.
            </p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label
                htmlFor="email"
                className="block font-mono text-[10px] tracking-mono uppercase text-steel3 mb-1.5"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                required
                autoFocus
                className="w-full bg-ink2 text-bone font-sans text-[15px] placeholder:text-steel px-3.5 outline-none transition-colors duration-120"
                style={{ height: 50, border: '1.5px solid #2A2F33' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#FF5A1F')}
                onBlur={e => (e.currentTarget.style.borderColor = '#2A2F33')}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full flex items-center justify-center gap-2 bg-orange hover:bg-orangeDeep text-white font-display font-semibold text-[15px] tracking-[0.06em] uppercase transition-colors duration-120 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              style={{ height: 56 }}
            >
              {loading ? (
                <span className="font-mono text-[11px] tracking-mono">Sending…</span>
              ) : (
                <>Send Reset Link <span aria-hidden>→</span></>
              )}
            </button>
          </form>

          <p className="mt-auto pt-10 text-center font-mono text-[10px] tracking-mono uppercase text-steel3">
            <Link
              href="/login"
              className="text-steel2 hover:text-bone underline underline-offset-2 transition-colors duration-120"
            >
              ← Back to Sign In
            </Link>
          </p>
        </>
      )}
    </main>
  )
}
