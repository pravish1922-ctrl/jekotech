'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { JKMark } from '@/components/ui/jk-mark'
import { createBrowserClient } from '@/lib/supabase'
import { getRole, redirectByRole } from '@/lib/auth'

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M11.182 0c.05.6-.148 1.197-.484 1.645-.34.45-.888.8-1.452.757-.065-.563.18-1.15.49-1.565C10.07.405 10.67.07 11.182 0zm1.968 5.403c-.093.05-1.72.988-1.7 2.96.022 2.36 2.073 3.143 2.098 3.155-.02.06-.328 1.127-1.078 2.22-.65.96-1.327 1.913-2.407 1.932-1.06.019-1.4-.628-2.614-.628-1.21 0-1.59.61-2.59.647-1.04.036-1.833-1.035-2.488-1.99C.72 11.48-.382 8.438.48 5.717c.425-1.32 1.49-2.416 2.523-2.42 1.02-.003 1.666.667 2.513.667.85 0 1.37-.668 2.592-.668.53 0 1.96.145 2.886 1.478-.076.048-.772.451-.764 1.348.009 1.07.978 1.427.92 1.28z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2-.28 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z" fill="#F2EFEA" />
    </svg>
  )
}

export default function LoginPage() {
  const router  = useRouter()
  const [supabase] = useState(() => createBrowserClient())
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [socialToast, setSocialToast] = useState(false)

  function handleSocialClick() {
    setSocialToast(true)
    setTimeout(() => setSocialToast(false), 3500)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    const role = await getRole(supabase)
    router.push(redirectByRole(role))
  }

  return (
    <main className="min-h-screen bg-ink flex flex-col px-6 py-10 max-w-md mx-auto">

      {/* Wordmark */}
      <JKMark size={22} variant="light" />

      {/* Hero copy */}
      <div className="mt-14 mb-10">
        <p className="font-mono text-[10px] tracking-mono uppercase text-steel3 mb-3">
          Customer Portal
        </p>
        <h1 className="font-display text-[34px] font-bold text-bone leading-tight tracking-tighter">
          Pull in.
        </h1>
        <h1 className="font-display text-[34px] font-bold text-orange leading-tight tracking-tighter">
          Sign in.
        </h1>
      </div>

      {/* Form */}
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>

        {/* Email */}
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
            className="w-full bg-ink2 text-bone font-sans text-[15px] placeholder:text-steel px-3.5 outline-none focus:border-orange transition-colors duration-120"
            style={{ height: 50, border: '1.5px solid #2A2F33' }}
            onFocus={e => (e.currentTarget.style.borderColor = '#FF5A1F')}
            onBlur={e => (e.currentTarget.style.borderColor = '#2A2F33')}
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label
              htmlFor="password"
              className="font-mono text-[10px] tracking-mono uppercase text-steel3"
            >
              Password
            </label>
            <Link
              href="/forgot"
              className="font-mono text-[10px] tracking-mono uppercase text-steel2 hover:text-bone transition-colors duration-120"
            >
              Forgot?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            className="w-full bg-ink2 text-bone font-sans text-[15px] placeholder:text-steel px-3.5 outline-none transition-colors duration-120"
            style={{ height: 50, border: '1.5px solid #2A2F33' }}
            onFocus={e => (e.currentTarget.style.borderColor = '#FF5A1F')}
            onBlur={e => (e.currentTarget.style.borderColor = '#2A2F33')}
          />
        </div>

        {/* Error */}
        {error && (
          <p className="font-mono text-[10px] tracking-mono uppercase text-red" role="alert">
            {error}
          </p>
        )}

        {/* Primary CTA */}
        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full flex items-center justify-center gap-2 bg-orange hover:bg-orangeDeep text-white font-display font-semibold text-[15px] tracking-[0.06em] uppercase transition-colors duration-120 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
          style={{ height: 56 }}
        >
          {loading ? (
            <span className="font-mono text-[11px] tracking-mono">Verifying…</span>
          ) : (
            <>Enter Workshop <span aria-hidden>→</span></>
          )}
        </button>
      </form>

      {/* OR divider */}
      <div className="flex items-center gap-4 my-7" aria-hidden>
        <div className="flex-1 h-px bg-ink4" />
        <span className="font-mono text-[10px] tracking-mono uppercase text-steel2">Or</span>
        <div className="flex-1 h-px bg-ink4" />
      </div>

      {/* Social login */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleSocialClick}
          className="w-full flex items-center justify-center gap-2.5 bg-transparent text-bone font-display font-semibold text-[13px] tracking-[0.04em] uppercase hover:bg-ink2 transition-colors duration-120"
          style={{ height: 48, border: '1.5px solid #2A2F33' }}
        >
          <AppleIcon />
          Continue with Apple
        </button>
        <button
          type="button"
          onClick={handleSocialClick}
          className="w-full flex items-center justify-center gap-2.5 bg-transparent text-bone font-display font-semibold text-[13px] tracking-[0.04em] uppercase hover:bg-ink2 transition-colors duration-120"
          style={{ height: 48, border: '1.5px solid #2A2F33' }}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        {/* Coming-soon notice */}
        {socialToast && (
          <p
            role="status"
            className="text-center font-mono text-[10px] tracking-mono uppercase text-steel3 pt-1"
          >
            Coming soon — use email login for now
          </p>
        )}
      </div>

      {/* Footer */}
      <p className="mt-auto pt-10 text-center font-mono text-[11px] tracking-mono uppercase text-steel3">
        New here?{' '}
        <Link
          href="/signup"
          className="text-orange hover:text-orangeDeep underline underline-offset-2 transition-colors duration-120"
        >
          Open an Account
        </Link>
      </p>
    </main>
  )
}
