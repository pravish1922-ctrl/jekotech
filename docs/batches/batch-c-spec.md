# Batch C — Admin Portal & Mechanic Portal

**Status:** COMPLETE  
**Merged:** main branch  
**Commits:** a139d48 → fd3653c

---

## Scope (What Was Built)

### Admin Portal (`/admin/*`)
- Layout with role-aware sidebar (AdminSidebar) and mobile bottom nav
- `/admin/bookings` — full bookings list with search + status filter tabs
- `/admin/bookings/:id` — booking detail editor (status transitions, mechanic assign, bay, costs, notes)
- `/admin/analytics` — KPI cards, 14-day bar chart, revenue by service, recent activity
- `/admin/mechanics` — mechanic list with job counts, owner-only invite form + active toggle
- `/admin/settings` — fully editable: services pricing, business hours, garage info, password change

### Mechanic Portal (`/mechanic/*`)
- Layout with MechanicTopBar
- `/mechanic/jobs` — active/done tabs, expandable cards, status transitions, notes save

### API Routes (Service Role)
- `POST /api/admin/invite-mechanic` — creates client + mechanics row
- `POST|PATCH /api/admin/services` — create/update service catalogue
- `PATCH /api/admin/garage-config` — upsert garage_config table

### Middleware
- Added `staff` to admin roles
- Fixed `roleHome()`: all admin roles → `/admin/bookings`, mechanic → `/mechanic/jobs`

### Database (batch-c.sql)
- Added `mechanic_notes` column to bookings
- Created `mechanics` table (new schema: id FK→clients.id, name, phone, active)
- RLS policies for staff, mechanics (assigned jobs only)
- garage_config table (requires separate SQL run)
- Set pravish email to role='owner'

---

## Bugs Found During QA & Fixes Applied

| Bug | Fix | Commit |
|-----|-----|--------|
| Analytics/Mechanics/Settings returned 404 | Created stub pages at correct paths | 4dd0168 |
| Route groups (admin)/(mechanic) not adding URL segments — pages at wrong URLs | Moved all files to include real URL segment (`app/(admin)/admin/...`) | a139d48 |
| roleHome() sent owner/delegate to `/admin` (no page) | Changed to `/admin/bookings` | 9ebffaf |
| Client names showing "Unknown" — RLS blocked reads | Replaced createServerSupabaseClient with service role client in all admin server pages | 346c55f |
| Mechanic invite failed — RLS blocked browser insert to clients | Moved invite to `POST /api/admin/invite-mechanic` using service role | 346c55f |
| Mechanic invite inserted `email` into mechanics table (column doesn't exist) | Removed email from mechanics upsert | fd3653c |
| Add service failed: "null value in column type" | Added `type` derived from `name_en.toLowerCase().replace(/\s+/g, '_')` | fd3653c |
| Booking status change not visible after save | Replaced `router.refresh()` with `router.push('/admin/bookings')` | fd3653c |
| Staff could set status to `in_progress` | Filtered `nextStatuses` to confirmed/cancelled for staff role | 346c55f |

---

## Key Technical Decisions Made

1. **Service role client pattern** — all admin server components use `createClient(url, SERVICE_KEY)` for DB reads, `createServerSupabaseClient` only for `auth.getUser()`. This bypasses RLS cleanly.

2. **Mechanics schema** — the `batch-c.sql` mechanics table uses `id FK→clients.id` (mechanic IS a client), not a separate UUID. No email column — email lives only in `clients`.

3. **Invite via API route** — browser clients cannot insert into `clients` with arbitrary roles. The invite flow goes through `/api/admin/invite-mechanic` which uses service role.

4. **`router.push` vs `router.refresh`** — `router.refresh()` does not force server component re-fetch reliably after Supabase writes. `router.push('/admin/bookings')` ensures fresh data.

5. **Status value `completed`** — schema.sql incorrectly defines `complete`. All code uses `completed`. This is the source of truth.

---

## Files Created/Modified

```
apps/web/
├── app/(admin)/
│   ├── layout.tsx                          (new)
│   ├── admin/page.tsx                      (new — redirect)
│   ├── admin/bookings/page.tsx             (new)
│   ├── admin/bookings/admin-bookings-list.tsx (new)
│   ├── admin/bookings/[id]/page.tsx        (new)
│   ├── admin/bookings/[id]/booking-detail-editor.tsx (new)
│   ├── admin/analytics/page.tsx            (new)
│   ├── admin/mechanics/page.tsx            (new)
│   ├── admin/mechanics/mechanics-client.tsx (new)
│   ├── admin/settings/page.tsx             (new)
│   └── admin/settings/settings-client.tsx  (new)
├── app/(mechanic)/
│   ├── layout.tsx                          (new)
│   ├── mechanic/page.tsx                   (new — redirect)
│   ├── mechanic/jobs/page.tsx              (new)
│   └── mechanic/jobs/mechanic-jobs-client.tsx (new)
├── app/api/admin/
│   ├── invite-mechanic/route.ts            (new)
│   ├── services/route.ts                   (new)
│   └── garage-config/route.ts             (new)
├── components/admin/admin-sidebar.tsx      (new)
├── components/mechanic/mechanic-top-bar.tsx (new)
└── middleware.ts                           (modified)
supabase/batch-c.sql                        (new)
```

---

## SQL Required in Supabase (run manually)

The `garage_config` table must be created separately before Settings page works:

```sql
CREATE TABLE IF NOT EXISTS garage_config (
  id          int PRIMARY KEY DEFAULT 1,
  hours       jsonb,
  slots       text[],
  bays        int,
  garage_name text DEFAULT 'JEKOTECH Car Services Ltd',
  address     text DEFAULT 'Savanne Road, Nouvelle France, Mauritius',
  phone       text DEFAULT '+230 5709 9631',
  email       text DEFAULT 'info@jekotechltd.com'
);

INSERT INTO garage_config (id, hours, slots, bays, garage_name, address, phone, email)
VALUES (1,
  '{"mon_fri":{"open":"08:00","close":"17:00"},"sun":{"open":"08:00","close":"13:00"},"sat":"closed"}',
  ARRAY['08:30','10:30','13:00','15:30'], 4,
  'JEKOTECH Car Services Ltd', 'Savanne Road, Nouvelle France, Mauritius',
  '+230 5709 9631', 'info@jekotechltd.com'
) ON CONFLICT (id) DO NOTHING;
```
