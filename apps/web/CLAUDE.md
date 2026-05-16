# CLAUDE.md — apps/web (Next.js App)

> Extends root `jekotech/CLAUDE.md`. Rules here are specific to the Next.js app layer.

---

## App Router Conventions

### Server vs Client Components

- **Default:** all components are server components (no directive needed)
- **Client component:** add `'use client'` as first line when using hooks, event handlers, or browser APIs
- **Never mix:** a client component cannot import a server-only module (like `SUPABASE_SERVICE_KEY`)

### Route Group Transparency (CRITICAL)

Route groups `(admin)`, `(mechanic)`, `(customer)` are **URL-transparent** — they appear in the file path but NOT in the URL.

```
app/(admin)/admin/bookings/page.tsx  →  /admin/bookings  ✓
app/(admin)/bookings/page.tsx        →  /bookings        ✗ WRONG
```

Always add the real URL segment inside the route group folder.

### Layouts

- `app/(admin)/layout.tsx` — wraps all `/admin/*` pages, checks admin roles, renders `AdminSidebar`
- `app/(mechanic)/layout.tsx` — wraps all `/mechanic/*` pages, checks mechanic role, renders `MechanicTopBar`
- `app/(customer)/layout.tsx` — wraps customer pages

### Page Pattern

```typescript
// Server component (no 'use client')
import { createServerSupabaseClient } from '../../../lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

export default async function MyPage() {
  const authClient = createServerSupabaseClient()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/login')

  const { data: records } = await supabase.from('table').select('*')

  return <ClientComponent records={records ?? []} />
}
```

---

## Supabase Client Usage

### In Server Pages / API Routes

```typescript
import { createServerSupabaseClient } from '../../../lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

// auth check only
const authClient = createServerSupabaseClient()
const { data: { user } } = await authClient.auth.getUser()

// all DB operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)
```

### In Client Components

```typescript
'use client'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

---

## Import Conventions

**No `@/` alias.** Use relative paths:

```typescript
// ✓ correct
import { AdminSidebar } from '../../../components/admin/admin-sidebar'
import { createServerSupabaseClient } from '../../lib/supabase-server'

// ✗ wrong
import { AdminSidebar } from '@/components/admin/admin-sidebar'
```

---

## TypeScript Patterns

### Supabase Conditional Query Fallback

Ternary with Supabase queries fails TypeScript type inference. Use this pattern instead:

```typescript
// ✗ type error
const result = condition
  ? await supabase.from('table').select('*')
  : Promise.resolve({ data: [] })

// ✓ correct
const result = condition
  ? await supabase.from('table').select('*')
  : { data: [] as { id: string; name: string }[] }
```

### Null coalescing for Supabase data

```typescript
const { data: records } = await supabase.from('table').select('*')
// always use ?? [] fallback
return <Component records={records ?? []} />
```

---

## API Route Pattern

```typescript
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '../../../../lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

const serviceDb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: Request) {
  // 1. Auth check
  const authClient = createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. Role check (for owner-only routes)
  const db = serviceDb()
  const { data: clientRow } = await db
    .from('clients')
    .select('role')
    .eq('id', user.id)
    .single()
  if (clientRow?.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 3. Parse body + execute
  const body = await req.json()
  // ... DB operations using db (service role)

  return NextResponse.json({ ok: true })
}
```

---

## Navigation After Supabase Writes

```typescript
// ✓ correct — forces fresh server fetch
router.push('/admin/bookings')

// ✗ unreliable after Supabase writes
router.refresh()
```

---

## Known Deployment Notes

- **Netlify** is primary deploy target
- `netlify.toml` and `vercel.json` both present — Vercel config is legacy/backup
- `next.config.js` must not require env vars at build time that aren't available in CI
- Image domains may need adding to `next.config.js` if external images used
