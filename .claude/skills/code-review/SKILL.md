# Skill: Code Review

**Trigger:** `/code-review`  
**Purpose:** Review code against JEKOTECH design system, RLS rules, and architecture standards.

---

## Review Checklist

### Security (check first — BLOCKING)

- [ ] No `SUPABASE_SERVICE_KEY` in client components or any file with `'use client'`
- [ ] No `SUPABASE_SERVICE_KEY` in any file that could be bundled to the browser
- [ ] No hardcoded API keys, tokens, or credentials
- [ ] All `/api/admin/*` routes check auth and role before any DB operation
- [ ] External API calls (WhatsApp, Airtable, QB) are server-side only

### Database Access Pattern

- [ ] Admin server pages use service role client for ALL DB reads
- [ ] Auth check uses `createServerSupabaseClient().auth.getUser()` only
- [ ] Browser components use `createBrowserClient` from `@supabase/ssr`
- [ ] No browser component calls service role client directly

Correct pattern for admin server pages:
```typescript
const authClient = createServerSupabaseClient()
const supabase = createClient(url, SERVICE_KEY)
const { data: { user } } = await authClient.auth.getUser()
// use supabase for all DB queries
```

### Schema Correctness

- [ ] Services: uses `name_en` not `name`
- [ ] Mechanics: no `email` column — email lives in `clients` only
- [ ] Mechanics: `id` is FK→clients.id, not a new UUID
- [ ] Bookings status: `completed` (with d), never `complete`
- [ ] Currency: integer MUR values, no decimals, ₨ symbol

### Design System

- [ ] `borderRadius: 0` everywhere — no rounded corners at all
- [ ] Shadow on cards: `boxShadow: '4px 4px 0 #0B0D0E'`
- [ ] Orange accent: `#FF5A1F` — no other oranges
- [ ] Background: `#0B0D0E` (ink) or `#F2EFEA` (bone) for light surfaces
- [ ] Currency display: `₨{amount.toLocaleString()}` integer format
- [ ] Date format: same year → "14 MAY · 10:30", different year → "3 JAN 2024 · 09:00"
- [ ] Fonts: Space Grotesk (headings), Inter (body), JetBrains Mono (code/mono)

### Route Groups

- [ ] Files in `(admin)` route group include real `/admin/` segment in path
- [ ] Files in `(mechanic)` route group include real `/mechanic/` segment
- [ ] No file at `app/(admin)/bookings/` — correct is `app/(admin)/admin/bookings/`

### Navigation After Writes

- [ ] After Supabase writes in admin pages, use `router.push('/admin/bookings')` not `router.refresh()`

### Role Restrictions

- [ ] Staff cannot trigger `in_progress` status
- [ ] Settings page redirects non-owners to `/admin/bookings`
- [ ] Mechanic portal only shows jobs assigned to that mechanic
- [ ] Add Mechanic form only visible to owner role

### Import Conventions

- [ ] No `@/` alias imports — use relative paths (e.g., `'../../../lib/supabase'`)
- [ ] No unused imports

---

## Severity Levels

| Level | Action |
|-------|--------|
| CRITICAL | Service key exposed, SQL injection, auth bypass — STOP, fix now |
| HIGH | Wrong schema column, missing role check, broken nav — fix before commit |
| MEDIUM | Design token mismatch, non-relative import — fix in same PR |
| LOW | Style suggestion — optional |

---

## Output Format

List findings by severity. For each:
```
[SEVERITY] File:line — Description
Fix: what to change
```
