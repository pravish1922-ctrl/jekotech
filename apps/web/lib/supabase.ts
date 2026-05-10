// Browser-only client — safe to import from 'use client' components.
// Server components must import from @/lib/supabase-server instead.
export { createBrowserSupabaseClient as createBrowserClient } from './supabase-browser'
