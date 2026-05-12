'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { JKMark } from '../../../components/ui/jk-mark'
import { createBrowserSupabaseClient as createBrowserClient } from '../../../lib/supabase-browser'

interface PasswordRule {
  id: string
  label: string
  test: (p: string) => boolean
}

const PASSWORD_RULES: PasswordRule[] = [
  { id: 'length',  label: '8+ chars',   test: p => p.length >= 8 },
  { id: 'upper',   label: 'Uppercase',  test: p => /[A-Z]/.test(p) },
  { id: 'number',  label: 'Number',     test: p => /[0-9]/.test(p) },
  { id: 'symbol',  label: 'Symbol',     test: p => /[^A-Za-z0-9]/.test(p) },
]

function RuleCheck({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="shrink-0 flex items-center justify-center transition-colors duration-180"
        style={{
          width: 14,
          height: 14,
          background: passed ? '#2F9E5A' : 'transparent',
          border: passed ? '1px solid transparent' : '1px solid #5C6369',
        }}
        aria-hidden
      >
        {passed && (
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
            <path
              d="M1 3L3 5L7 1"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className="font-mono text-[10px] tracking-mono uppercase text-steel">
        {label}
      </span>
    </div>
  )
}

function FieldInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  id: string
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block font-mono text-[10px] tracking-mono uppercase text-steel mb-1.5"
      >
        {label}
      </label>
      <div
        className="flex items-center bg-white transition-colors duration-120"
        style={{ height: 50, border: '1.5px solid #0B0D0E' }}
        onFocusCapture={e => {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = '#FF5A1F'
        }}
        onBlurCapture={e => {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = '#0B0D0E'
        }}
      >
        <input
          id={id}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="flex-1 h-full bg-transparent text-ink font-sans text-[15px] font-medium outline-none px-3.5 placeholder:text-bone3"
        />
      </div>
    </div>
  )
}

export default function SignupPage() {
  const router     = useRouter()
  const [supabase] = useState(() => createBrowserClient())
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const ruleResults  = PASSWORD_RULES.map(r => ({ ...r, passed: r.test(password) }))
  const allRulesPass = ruleResults.every(r => r.passed)
  const canSubmit    = name.trim() && email.trim() && allRulesPass

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    setLoading(true)

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name.trim() } },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push(`/otp?email=${encodeURIComponent(email.trim())}&type=email`)
  }

  return (
    <main className="min-h-screen bg-bone flex flex-col px-6 py-10 max-w-md mx-auto">

      {/* Wordmark */}
      <JKMark size={22} variant="dark" />

      {/* Step indicator */}
      <div className="mt-10 mb-8 flex items-center gap-3">
        <div className="flex gap-1" aria-hidden>
          <span className="w-8 h-0.5 bg-ink" />
          <span className="w-8 h-0.5 bg-bone3" />
        </div>
        <p className="font-mono text-[10px] tracking-mono uppercase text-steel">
          Step 1/2 · Details
        </p>
      </div>

      {/* Heading */}
      <h1 className="font-display text-[28px] font-bold text-ink tracking-tighter mb-8">
        Open an account.
      </h1>

      {/* Form */}
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <FieldInput
          id="name"
          label="Full Name"
          value={name}
          onChange={setName}
          placeholder="Marcus Bell"
          autoComplete="name"
        />

        <FieldInput
          id="email"
          label="Email Address"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="marcus@email.com"
          autoComplete="email"
        />

        {/* Password + rules */}
        <div>
          <FieldInput
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Create a strong password"
            autoComplete="new-password"
          />

          {/* 2×2 password rule grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mt-3">
            {ruleResults.map(r => (
              <RuleCheck key={r.id} label={r.label} passed={r.passed} />
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="font-mono text-[10px] tracking-mono uppercase text-red" role="alert">
            {error}
          </p>
        )}

        {/* CTA */}
        <button
          type="submit"
          disabled={!canSubmit || loading}
          className="w-full flex items-center justify-center gap-2 bg-orange hover:bg-orangeDeep text-white font-display font-semibold text-[15px] tracking-[0.06em] uppercase transition-colors duration-120 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
          style={{ height: 56 }}
        >
          {loading ? (
            <span className="font-mono text-[11px] tracking-mono">Sending code…</span>
          ) : (
            <>Continue <span aria-hidden>→</span></>
          )}
        </button>
      </form>

      {/* Footer */}
      <p className="mt-auto pt-10 text-center font-mono text-[11px] tracking-mono uppercase text-steel">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-orange hover:text-orangeDeep underline underline-offset-2 transition-colors duration-120"
        >
          Sign In
        </Link>
      </p>
    </main>
  )
}
