# Technical Specification — JEKOTECH PWA

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5.9 |
| Database | Supabase (PostgreSQL 15) |
| Auth | Supabase Auth (email OTP, Google OAuth) |
| Styling | Tailwind CSS + inline styles (design system tokens) |
| Hosting | Netlify (primary) |
| Storage | Supabase Storage (`booking-photos` bucket, public) |

---

## Database Tables

### `clients`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, references auth.users |
| `name` | text | NOT NULL |
| `email` | text | NOT NULL |
| `phone` | text | NOT NULL, E.164 format |
| `role` | text | NOT NULL, default 'customer'. CHECK: customer, mechanic, owner, delegate, staff |
| `whatsapp_opt_in` | boolean | NOT NULL, default false |
| `qb_customer_id` | text | nullable, QuickBooks reference |
| `created_at` | timestamptz | NOT NULL, default now() |
| `updated_at` | timestamptz | NOT NULL, default now() |

### `vehicles`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, default uuid_generate_v4() |
| `owner_client_id` | uuid | NOT NULL, FK → clients.id |
| `registration` | text | NOT NULL, normalized uppercase no spaces |
| `make` | text | NOT NULL |
| `model` | text | NOT NULL |
| `year` | integer | NOT NULL |
| `colour` | text | nullable |
| `vin` | text | nullable |
| `mileage` | integer | NOT NULL, default 0 |
| `mot_due_date` | date | nullable |
| `qb_vehicle_id` | text | nullable |
| `created_at` | timestamptz | NOT NULL, default now() |
| `updated_at` | timestamptz | NOT NULL, default now() |

### `mechanics` ⚠️ ACTIVE SCHEMA (batch-c.sql, NOT original schema.sql)
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, FK → clients(id) — mechanic IS a client |
| `name` | text | NOT NULL |
| `phone` | text | nullable — email lives in clients table only |
| `active` | boolean | NOT NULL, default true |
| `created_at` | timestamptz | default now() |

> **CRITICAL:** No `email` column on mechanics. No `initials`, `color_hex`, `specialties`, `max_concurrent_jobs`. Those were in the original schema.sql which was superseded by batch-c.sql.

### `services`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, default uuid_generate_v4() |
| `type` | text | NOT NULL. CHECK: full_service, interim_service, mot, diagnostics, brakes, tyres, aircon, bodywork, other |
| `name_en` | text | NOT NULL — **use `name_en`, not `name`** |
| `description` | text | NOT NULL, default '' |
| `base_price_mur` | integer | NOT NULL — ₨ MUR, integer, no decimals |
| `estimated_duration_min` | integer | NOT NULL |
| `active` | boolean | NOT NULL, default true |
| `created_at` | timestamptz | NOT NULL, default now() |

> When inserting a new service, derive `type` from name: `name_en.toLowerCase().replace(/\s+/g, '_')`

### `bookings`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, default uuid_generate_v4() |
| `reference` | text | NOT NULL, UNIQUE, e.g. "JK-1212" |
| `client_id` | uuid | NOT NULL, FK → clients.id |
| `vehicle_id` | uuid | NOT NULL, FK → vehicles.id |
| `service_ids` | uuid[] | NOT NULL, default '{}' |
| `bay_number` | integer | NOT NULL, CHECK: 1–4 |
| `scheduled_start` | timestamptz | NOT NULL |
| `scheduled_end` | timestamptz | NOT NULL |
| `status` | text | NOT NULL, default 'pending'. CHECK: pending, confirmed, in_progress, completed, cancelled |
| `assigned_mechanic_id` | uuid | nullable, FK → mechanics.id |
| `customer_notes` | text | nullable |
| `mechanic_notes` | text | nullable — added by batch-c.sql |
| `photo_urls` | text[] | NOT NULL, default '{}' |
| `estimated_cost_mur` | integer | NOT NULL, default 0 |
| `final_cost_mur` | integer | nullable |
| `qb_invoice_id` | text | nullable |
| `airtable_record_id` | text | nullable |
| `whatsapp_thread_id` | text | nullable |
| `created_at` | timestamptz | NOT NULL, default now() |
| `updated_at` | timestamptz | NOT NULL, default now() |

> **Note:** Status value `completed` (with 'd') — schema.sql incorrectly has `complete`. Always use `completed` in code.

### `whatsapp_messages`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK |
| `direction` | text | NOT NULL. CHECK: in, out |
| `to_number` | text | NOT NULL, E.164 |
| `body_text` | text | NOT NULL |
| `template_name` | text | nullable |
| `status` | text | NOT NULL, default 'sent'. CHECK: sent, delivered, read, failed |
| `booking_ref` | text | nullable |
| `sent_at` | timestamptz | NOT NULL, default now() |

### `invoices`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK |
| `booking_id` | uuid | NOT NULL, FK → bookings.id |
| `qb_invoice_id` | text | NOT NULL |
| `amount_mur` | integer | NOT NULL |
| `pdf_url` | text | nullable |
| `issued_at` | timestamptz | NOT NULL, default now() |

### `audit_log`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | bigserial | PK |
| `actor_id` | uuid | FK → auth.users.id, on delete set null |
| `action` | text | NOT NULL, e.g. 'booking.status_changed' |
| `table_name` | text | NOT NULL |
| `row_id` | uuid | nullable |
| `payload` | jsonb | nullable |
| `created_at` | timestamptz | NOT NULL, default now() |

### `garage_config` ⚠️ REQUIRES MANUAL SQL SETUP
| Column | Type | Default |
|--------|------|---------|
| `id` | integer | PK, always 1 |
| `hours` | jsonb | `{"mon_fri":{"open":"08:00","close":"17:00"},"sun":{"open":"08:00","close":"13:00"},"sat":"closed"}` |
| `slots` | text[] | `['08:30','10:30','13:00','15:30']` |
| `bays` | integer | 4 |
| `garage_name` | text | 'JEKOTECH Car Services Ltd' |
| `address` | text | 'Savanne Road, Nouvelle France, Mauritius' |
| `phone` | text | '+230 5709 9631' |
| `email` | text | 'info@jekotechltd.com' |

> Run SQL in `supabase/batch-c.sql` section for garage_config creation + seed before using Settings page.

---

## RLS Policies (Key Rules)

| Table | Policy | Condition |
|-------|--------|-----------|
| clients | customer reads own row | `id = auth.uid()` |
| clients | admin reads all | role IN (owner, delegate, staff) |
| bookings | customer reads own | `client_id = auth.uid()` |
| bookings | staff reads all | authenticated + role is admin |
| bookings | owner/delegate update all | role IN (owner, delegate) |
| bookings | mechanic reads assigned | `assigned_mechanic_id = auth.uid()` |
| bookings | mechanic updates assigned | `assigned_mechanic_id = auth.uid()` |
| mechanics | admin selects all | authenticated admin role |
| mechanics | owner manages | role = owner |
| mechanics | mechanic reads own | `id = auth.uid()` |

> Admin server components bypass RLS by using `SUPABASE_SERVICE_KEY`. This is intentional and correct.

---

## API Routes

### Implemented

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/admin/invite-mechanic` | owner | Create client + mechanics row via service role |
| POST | `/api/admin/services` | owner | Create new service (derives `type` from `name_en`) |
| PATCH | `/api/admin/services` | owner | Update service name, price, active |
| PATCH | `/api/admin/garage-config` | owner | Upsert garage_config row (id=1) |
| GET | `/auth/callback` | — | Supabase OAuth callback handler |

### Stubs (Not Implemented — Batch D)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/availability` | Query Airtable for available slots |
| POST/PATCH/GET | `/api/bookings` | Create/update/fetch bookings (Airtable + Supabase) |
| POST | `/api/claude/summarize` | Generate WhatsApp-ready booking summary via Claude |
| POST | `/api/whatsapp/send` | Send WhatsApp template message via Meta Graph API |
| GET | `/api/whatsapp/send` | Meta webhook verification |
| GET/POST | `/api/qb/vehicle` | QuickBooks vehicle lookup + create |

---

## Environment Variables

| Variable | Used In | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Anon key (respects RLS) |
| `SUPABASE_SERVICE_KEY` | Server only | Service role key (bypasses RLS) |
| `GOOGLE_CLIENT_ID` | Auth | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Auth | Google OAuth |
| `ANTHROPIC_API_KEY` | Server | Claude AI for summaries (Batch D) |
| `AIRTABLE_API_KEY` | Server | Airtable bookings sync (Batch D) |
| `AIRTABLE_BASE_ID` | Server | Airtable base (Batch D) |
| `QB_CLIENT_ID` | Server | QuickBooks OAuth (Batch D) |
| `QB_CLIENT_SECRET` | Server | QuickBooks OAuth (Batch D) |
| `WHATSAPP_ACCESS_TOKEN` | Server | Meta Graph API (Batch D) |
| `WHATSAPP_PHONE_ID` | Server | WhatsApp Business phone ID (Batch D) |

---

## Service Role Key Rules

**ALWAYS use `SUPABASE_SERVICE_KEY` for:**
- All DB reads in admin server pages (bookings, analytics, mechanics, settings)
- All DB writes in `/api/admin/*` routes
- Any cross-user data read (e.g., reading another user's clients record)

**NEVER use `SUPABASE_SERVICE_KEY` in:**
- Client components (`'use client'`)
- Browser-side code
- Any component that ships to the browser

**Pattern for server pages that need both auth + DB:**
```typescript
const authClient = createServerSupabaseClient()          // session only
const supabase   = createClient(url, SERVICE_KEY)        // DB reads
const { data: { user } } = await authClient.auth.getUser()
// use supabase for all DB queries
```

---

## Route Group Structure

```
app/
├── (admin)/          ← URL-transparent. Pages inside serve /admin/*
│   ├── layout.tsx    ← Checks admin roles, renders AdminSidebar
│   └── admin/
│       ├── page.tsx                    → redirect('/admin/bookings')
│       ├── bookings/page.tsx           → /admin/bookings
│       ├── bookings/[id]/page.tsx      → /admin/bookings/:id
│       ├── analytics/page.tsx          → /admin/analytics
│       ├── mechanics/page.tsx          → /admin/mechanics
│       └── settings/page.tsx           → /admin/settings
├── (mechanic)/       ← URL-transparent
│   ├── layout.tsx    ← Checks mechanic role, renders MechanicTopBar
│   └── mechanic/
│       ├── page.tsx                    → redirect('/mechanic/jobs')
│       └── jobs/page.tsx               → /mechanic/jobs
└── (customer)/       ← URL-transparent
    └── [home, book/*, history/*, fleet/*, account, login, signup, otp, forgot]
```

> **CRITICAL:** `(admin)` is a route group, not a URL segment. A file at `app/(admin)/bookings/page.tsx` would resolve to `/bookings`, not `/admin/bookings`. Always add the real URL segment: `app/(admin)/admin/bookings/page.tsx` → `/admin/bookings`.
