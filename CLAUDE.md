# CLAUDE.md — JEKOTECH Project

## Project Identity

**Client:** JEKOTECH Car Services Ltd, Savanne Road, Nouvelle France, Mauritius  
**Owner contact:** Pravish's cousin (garage proprietor)  
**Builder:** Pravish Ajay Kona Sunnassee  
**Stack:** Next.js 14 (App Router) · TypeScript 5.9 · Supabase (PostgreSQL + Auth) · Tailwind CSS  
**Deploy:** Netlify (primary)  
**Repo root:** `jekotech/`  
**App root:** `jekotech/apps/web/`

---

## MANDATORY AUTOMATED CHECKS
These run automatically via hooks — do NOT skip:
1. After every file write: review against design system + RLS rules
2. After npx next build: `scripts/post-build-qa.sh` runs automatically
   - If it returns FAIL, fix all issues before proceeding
   - Never commit with a failing QA script
3. Before git commit: `scripts/pre-commit-security.sh` runs automatically
   - If it returns FAIL, fix all violations before committing

## KNOWN SCHEMA FACTS (verified in DB — never deviate)
- **mechanics** table columns: `id`, `initials`, `active`, `specialties`, `max_concurrent_jobs`, `color_hex` — NO `name`/`email`/`phone`
- mechanics `name`/`email`/`phone` → always join with `clients` table: `.select('id, clients(name)')`
- `garage_config`: single row `id=1`, use `ON CONFLICT (id) DO NOTHING` on insert
- `clients` role values: `owner` / `delegate` / `staff` / `mechanic` / `customer` only

---

## Pre-Task Workflow (MANDATORY — 5 steps before writing code)

1. **Read the batch spec** — `docs/batches/batch-[current]-spec.md`
2. **Read TECH_SPEC.md** — confirm exact column names before any DB query
3. **Read the file you are about to edit** — never write without reading first
4. **Identify the Supabase client to use** — service role for admin DB, auth client for getUser() only
5. **Check role permissions** — confirm which roles can perform the action being built

---

## Design Tokens (EXACT — do not approximate)

```
Colors:
  ink:    #0B0D0E  (primary dark background)
  ink2:   #15181A
  ink3:   #1E2225
  ink4:   #2A2F33
  bone:   #F2EFEA  (light surface)
  orange: #FF5A1F  (primary accent)
  yellow: #F5C518
  green:  #2F9E5A
  blue:   #3B82F6
  red:    #E8412B

Typography:
  display: 'Space Grotesk', sans-serif
  body:    'Inter', sans-serif
  mono:    'JetBrains Mono', monospace

Shadows:
  card:    4px 4px 0 #0B0D0E  (ticket/card shadow)

Radius:
  ALL:     0  (zero border-radius everywhere — no exceptions)

Currency:
  Symbol:  ₨
  Format:  integer only, no decimals
  Example: ₨2,500

Dates:
  Same year:  "14 MAY · 10:30"
  Prior year: "3 JAN 2024 · 09:00"
```

---

## 16 Key Learnings from Build History

1. **Route groups add ZERO URL segments** — `(admin)`, `(customer)`, `(mechanic)` are transparent. A file at `app/(admin)/bookings/` resolves to `/bookings`, NOT `/admin/bookings`. Always add the real URL segment: `app/(admin)/admin/bookings/`.

2. **SUPABASE_SERVICE_KEY is server-side only** — never in browser components, never in files with `'use client'`, never in anything that ships to the browser.

3. **No `@/` alias imports** — use relative paths everywhere (`'../../../lib/supabase'`, not `'@/lib/supabase'`).

4. **Services table: `name_en` not `name`** — the column is `name_en`. Writing `service.name` is always wrong.

5. **Mechanics table (batch-c.sql schema):** `id` (FK→clients.id), `name`, `phone`, `active`, `created_at`. NO `email` column, NO `color_hex`, NO `initials`, NO `specialties`. The email lives in `clients` only.

6. **Booking status is `completed` (with d)** — schema.sql incorrectly has `complete`. All code uses `completed`.

7. **`bay_number` is integer 1–4** — CHECK constraint enforces this range.

8. **Currency: MUR integer, ₨ symbol** — no floats, no `.toFixed(2)`, never decimal values.

9. **Smart date formatting** — same year omits year, prior year includes it.

10. **Admin server pages: two clients** — `createServerSupabaseClient()` for auth.getUser() only; `createClient(url, SUPABASE_SERVICE_KEY)` for all DB reads/writes.

11. **Browser client** — `createBrowserClient` imported directly from `@supabase/ssr` (not via a lib wrapper).

12. **After booking saves: `router.push('/admin/bookings')`** — NOT `router.refresh()`. The refresh does not force server re-fetch reliably after Supabase writes.

13. **Mechanic invite via API route** — browser clients cannot insert into `clients` with arbitrary roles. Always go through `/api/admin/invite-mechanic` which uses service role.

14. **`garage_config` requires manual SQL** — this table is not in schema.sql. Run the SQL in `supabase/batch-c.sql` (garage_config section) before using Settings page.

15. **TypeScript ternary with Supabase responses** — `condition ? await supabase.from(...) : Promise.resolve({ data: [] })` fails type checking. Use `{ data: [] as SpecificType[] }` as the fallback instead.

16. **Staff status restriction** — staff can only move bookings to `confirmed` or `cancelled`. They cannot set `in_progress`. Filter `nextStatuses` for staff role in the booking detail editor.

---

## Supabase Client Rules

| Context | Client to use | Import |
|---------|---------------|--------|
| Admin server page — auth check | `createServerSupabaseClient()` | `lib/supabase-server` |
| Admin server page — DB queries | `createClient(url, SERVICE_KEY)` | `@supabase/supabase-js` |
| API route — auth check | `createServerSupabaseClient()` | `lib/supabase-server` |
| API route — DB writes | `createClient(url, SERVICE_KEY)` | `@supabase/supabase-js` |
| Client component — DB queries | `createBrowserClient(url, ANON_KEY)` | `@supabase/ssr` |
| Client component — auth | `createBrowserClient(url, ANON_KEY)` | `@supabase/ssr` |

---

## Role Permissions Summary

| Action | owner | delegate | staff | mechanic | customer |
|--------|-------|----------|-------|----------|----------|
| View admin portal | ✓ | ✓ | ✓ | — | — |
| View analytics | ✓ | ✓ | — | — | — |
| Edit settings | ✓ | — | — | — | — |
| Manage mechanics | ✓ | ✓ | — | — | — |
| Add mechanic | ✓ | — | — | — | — |
| pending → confirmed | ✓ | ✓ | ✓ | — | — |
| confirmed → in_progress | ✓ | ✓ | — | ✓ | — |
| in_progress → completed | ✓ | ✓ | — | ✓ | — |

---

## API Routes

### Implemented
- `POST /api/admin/invite-mechanic` — service role, owner only
- `POST /api/admin/services` — create service (derives `type` from `name_en`)
- `PATCH /api/admin/services` — update service fields
- `PATCH /api/admin/garage-config` — upsert garage_config (id=1)
- `GET /auth/callback` — Supabase OAuth callback

### Stubs (Batch D)
- `GET|POST|PATCH /api/bookings`
- `GET /api/availability`
- `POST /api/claude/summarize`
- `POST|GET /api/whatsapp/send`
- `GET|POST /api/qb/vehicle`

---

## File Structure

```
jekotech/
├── apps/web/
│   ├── app/
│   │   ├── (admin)/admin/         ← /admin/* routes
│   │   ├── (mechanic)/mechanic/   ← /mechanic/* routes
│   │   ├── (customer)/            ← /home, /book/*, /history, etc.
│   │   └── api/                   ← API routes
│   ├── components/
│   │   ├── admin/
│   │   └── mechanic/
│   └── lib/                       ← supabase clients, utils
├── supabase/                      ← SQL migrations
├── docs/                          ← BRD, TECH_SPEC, QA_CHECKLIST, batches/
└── .claude/
    ├── skills/                    ← ba-analyst, code-review, qa-testing, batch-builder
    └── settings.json
```

---

## Skills Available

| Skill | Trigger | Purpose |
|-------|---------|---------|
| BA Analyst | `/ba-analyst` | Write user stories + acceptance criteria before build |
| Code Review | `/code-review` | Review against design system + RLS rules |
| QA Testing | `/qa-testing` | Generate GIVEN/WHEN/THEN test cases |
| Batch Builder | `/batch-builder` | Full build cycle orchestration |

---

## Environment Variables

Required in `apps/web/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Batch D (not yet required):
```
ANTHROPIC_API_KEY=
AIRTABLE_API_KEY=
AIRTABLE_BASE_ID=
AIRTABLE_TABLE_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_ID=
WHATSAPP_VERIFY_TOKEN=
```

---

## Batch Status

| Batch | Status | Description |
|-------|--------|-------------|
| A | COMPLETE | Auth, customer booking flow, vehicle management |
| B | COMPLETE | Customer portal — history, photos, PWA |
| C | COMPLETE | Admin portal, mechanic portal |
| D | NOT STARTED | WhatsApp, Airtable, Claude AI, QB |
