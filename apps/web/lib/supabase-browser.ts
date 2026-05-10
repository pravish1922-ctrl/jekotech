import { createBrowserClient } from '@supabase/ssr'

function env(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing env var: ${key}`)
  return value
}

export function createBrowserSupabaseClient() {
  return createBrowserClient(
    env('NEXT_PUBLIC_SUPABASE_URL'),
    env('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  )
}
