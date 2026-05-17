import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'

// ── Route config ──────────────────────────────────────────────────────────────

const PUBLIC_PATHS  = ['/login', '/signup', '/otp', '/forgot', '/auth', '/staff-login', '/staff-change-pin']
const CUSTOMER_PATHS = ['/home', '/book', '/history', '/account']
const MECHANIC_PATHS = ['/mechanic']
const ADMIN_PATHS    = ['/admin']

// Roles allowed for each protected area
const ADMIN_ROLES    = new Set(['owner', 'delegate', 'staff'])
const MECHANIC_ROLES = new Set(['mechanic'])

// ── Middleware ────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Pass through Next.js internals and static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Preview mode — bypass role-based redirects so admin can view customer portal
  const isPreview = request.nextUrl.searchParams.get('preview') === 'customer'
  if (isPreview) {
    const response = NextResponse.next()
    response.cookies.set('preview_mode', 'true', { maxAge: 3600, path: '/' })
    return response
  }

  // Build a response we can mutate (needed to refresh the session cookie)
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    },
  )

  // Refresh the session (rotates the access token if expired)
  const { data: { user } } = await supabase.auth.getUser()

  // ── Public paths ───────────────────────────────────────────────────────────
  // If already authenticated, redirect to the right dashboard
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    if (user) {
      const role = await getClientRole(supabase, user.id)
      return NextResponse.redirect(new URL(roleHome(role), request.url))
    }
    return response
  }

  // ── Protected paths — require session ─────────────────────────────────────
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = await getClientRole(supabase, user.id)

  // Admin routes — owner + delegate only
  if (ADMIN_PATHS.some(p => pathname.startsWith(p))) {
    if (!ADMIN_ROLES.has(role ?? '')) {
      return NextResponse.redirect(new URL(roleHome(role), request.url))
    }
    return response
  }

  // Mechanic routes — mechanic only
  if (MECHANIC_PATHS.some(p => pathname.startsWith(p))) {
    if (!MECHANIC_ROLES.has(role ?? '')) {
      return NextResponse.redirect(new URL(roleHome(role), request.url))
    }
    return response
  }

  // Customer routes — any authenticated user
  if (CUSTOMER_PATHS.some(p => pathname.startsWith(p))) {
    return response
  }

  return response
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getClientRole(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('clients')
    .select('role')
    .eq('id', userId)
    .single()
  return data?.role ?? null
}

function roleHome(role: string | null): string {
  switch (role) {
    case 'owner':
    case 'delegate':
    case 'staff':    return '/admin/bookings'
    case 'mechanic': return '/mechanic/jobs'
    default:         return '/home'
  }
}

// ── Matcher ───────────────────────────────────────────────────────────────────
// Run on every route except Next.js internals (handled above in the function)
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
