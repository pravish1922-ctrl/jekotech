import { createBrowserClient as ssrBrowserClient } from '@supabase/ssr'
import { createServerClient as ssrServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { CookieOptions } from '@supabase/ssr'

function env(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing env var: ${key}`)
  return value
}

// ── Browser client ────────────────────────────────────────────────────────────
// Used in Client Components ('use client'). Creates one instance per call;
// call this inside a component or custom hook, not at module level.
export function createBrowserClient() {
  return ssrBrowserClient(
    env('NEXT_PUBLIC_SUPABASE_URL'),
    env('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  )
}

// ── Server client ─────────────────────────────────────────────────────────────
// Used in Server Components, Route Handlers, and middleware.
// Reads and writes cookies via next/headers so the session is propagated.
export function createServerClient() {
  const cookieStore = cookies()

  return ssrServerClient(
    env('NEXT_PUBLIC_SUPABASE_URL'),
    env('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    },
  )
}
