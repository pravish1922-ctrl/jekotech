# Handoff: Jekotech Garage PWA

## Overview
A Progressive Web App for Jekotech Garage that lets customers book service appointments and gives the garage owner an admin dashboard to manage bookings, mechanics, and integrations. The app has two surfaces:

1. **Customer mobile PWA** — login/signup, 8-step booking flow, vehicle history, account.
2. **Admin desktop console** — schedule, mechanic roster, customer/vehicle lookup, WhatsApp message log, analytics, QuickBooks sync.

The design uses a bold, industrial workshop aesthetic — graphite + signal orange, hairline borders, monospaced metadata strips, no decorative gradients.

## About the Design Files
The files in this bundle are **design references created in HTML/JSX** — high-fidelity prototypes showing the intended look and behavior. They are **not production code to copy directly**. The task is to recreate these designs in the target codebase's environment.

The recommended stack (per the user's brief) is:
- **Frontend:** Next.js 14 (App Router) + React + TypeScript + Tailwind, deployed to Netlify
- **Backend:** Netlify serverless functions (`/netlify/functions/*.ts`)
- **Database:** Supabase (Postgres + Auth + Storage)
- **Booking calendar:** Airtable (source of truth for slot availability)
- **Vehicle/customer data:** QuickBooks Online API
- **Notifications:** WhatsApp Business Cloud API
- **AI:** Claude API for summary generation, customer support, smart triage

## Fidelity
**High-fidelity.** All colors, typography, spacing, and interaction behavior are final. Recreate pixel-perfectly using Tailwind utility classes that map to the design tokens below.

## Tech Stack Recommendation

```
apps/
  web/                 # Next.js 14 (App Router) — customer + admin
    app/
      (customer)/      # /login, /book, /history, /account, /(home)
      (admin)/         # /admin/*  protected by middleware
      api/             # thin proxy routes if needed
netlify/
  functions/
    airtable-availability.ts
    airtable-create-booking.ts
    quickbooks-lookup-vehicle.ts
    quickbooks-create-customer.ts
    quickbooks-create-invoice.ts
    whatsapp-send.ts
    whatsapp-webhook.ts
    claude-summarize.ts
    supabase-mirror.ts
packages/
  ui/                  # shared design system components
  types/               # shared TS types (Booking, Client, Vehicle, Service)
```

PWA basics: `manifest.json` + service worker (`next-pwa`) for offline shell, install prompt, push notifications.

---

## Design Tokens

### Colors
```ts
export const colors = {
  // Surfaces
  ink:        '#0B0D0E',  // graphite (primary dark surface)
  ink2:       '#15181A',  // raised graphite
  ink3:       '#1E2225',  // panel
  ink4:       '#2A2F33',  // border-on-dark
  steel:      '#3D4348',
  steel2:     '#5C6369',
  steel3:     '#8B9197',
  bone:       '#F2EFEA',  // off-white (primary light surface)
  bone2:      '#E5E1D8',
  bone3:      '#D4CFC2',
  paper:      '#FBFAF6',

  // Signal
  orange:     '#FF5A1F',  // primary action / brand accent
  orangeDeep: '#D9430C',
  yellow:     '#F5C518',  // availability / warning
  lime:       '#C8FF3A',  // status accent / live
  red:        '#E8412B',  // error / urgent
  green:      '#2F9E5A',  // success
};
```

### Typography
```ts
export const fonts = {
  display: '"Space Grotesk", "Helvetica Neue", Arial, sans-serif', // headings, buttons
  body:    '"Inter", "Helvetica Neue", Arial, sans-serif',        // paragraphs, inputs
  mono:    '"JetBrains Mono", "SF Mono", Menlo, monospace',       // metadata, refs, time
};

// Scale
// display:  28-38px / weight 700 / letter-spacing -0.02em
// h1:       22-26px / weight 700 / letter-spacing -0.02em
// h2:       16-18px / weight 700 / letter-spacing -0.01em
// body:     13-15px / weight 400-500 / line-height 1.4-1.5
// mono lbl: 9-11px  / weight 600    / letter-spacing 0.08-0.12em / UPPERCASE
```

### Spacing & shape
- 4px base scale (4, 8, 12, 14, 16, 18, 22, 24, 28, 32)
- **Border radius: 0** (industrial, sharp corners are part of the language)
- Borders: 1px hairlines (`bone3` on light, `ink4` on dark) and 1.5px on inputs/buttons
- Shadows: rare. Used only on "ticket" cards as a flat `4px 4px 0 #0B0D0E` offset (no blur)

### Motion
- Transitions: 0.12s for hover, 0.18s for state changes, 0.2s easing
- Animations: `scan` (1.4s linear) for QB lookup, `pulse` for live indicators, `blink` for cursor

---

## Data Shapes (TypeScript)

```ts
// packages/types/index.ts

export type ServiceType =
  | 'full_service' | 'interim_service' | 'mot' | 'diagnostics'
  | 'brakes' | 'tyres' | 'aircon' | 'bodywork' | 'other';

export interface Service {
  id: string;
  type: ServiceType;
  name: string;             // e.g. "Full Service"
  description: string;
  basePriceGbp: number;
  estimatedDurationMin: number;
}

export interface Vehicle {
  id: string;               // local id
  qbVehicleId?: string;     // QuickBooks vehicle reference
  registration: string;     // UK plate, normalized uppercase no spaces
  make: string;
  model: string;
  year: number;
  colour?: string;
  vin?: string;
  mileage: number;          // last known
  ownerClientId: string;    // FK -> Client.id
  motDueDate?: string;      // ISO date
}

export interface Client {
  id: string;               // supabase auth.users.id
  qbCustomerId?: string;    // QuickBooks customer reference
  name: string;
  email: string;
  phone: string;            // E.164
  whatsappOptIn: boolean;
  vehicles: Vehicle[];
  createdAt: string;
}

export interface Mechanic {
  id: string;
  name: string;
  initials: string;         // 2 chars for avatar
  specialties: string[];    // e.g. ["diagnostics", "engine"]
  maxConcurrentJobs: number;// usually 3-4
  active: boolean;
  colorHex: string;
}

export type BookingStatus =
  | 'pending'      // submitted by customer, not confirmed
  | 'confirmed'    // admin confirmed, slot locked in Airtable
  | 'in_progress'  // mechanic started work
  | 'complete'     // work done, awaiting payment
  | 'cancelled';

export interface Booking {
  id: string;                 // local UUID
  reference: string;          // human-readable e.g. "JK-1212"
  clientId: string;
  vehicleId: string;
  serviceIds: string[];       // can stack services
  bayNumber: 1 | 2 | 3 | 4;
  scheduledStart: string;     // ISO datetime
  scheduledEnd: string;       // ISO datetime
  status: BookingStatus;
  assignedMechanicId?: string;
  customerNotes?: string;
  photoUrls: string[];        // Supabase Storage URLs
  estimatedCostGbp: number;
  finalCostGbp?: number;
  qbInvoiceId?: string;
  airtableRecordId?: string;  // source of truth for slot
  whatsappThreadId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilityDay {
  date: string;               // ISO date
  totalSlots: number;         // always 4
  bookedSlots: number;        // 0..4
  slots: Array<{
    time: string;             // 'HH:mm'
    bay: 1 | 2 | 3 | 4;
    available: boolean;
    bookingRef?: string;      // if taken
  }>;
}

export interface WhatsAppMessage {
  id: string;
  direction: 'in' | 'out';
  to: string;                 // E.164
  bodyText: string;
  templateName?: string;      // e.g. 'confirm_v3'
  status: 'sent' | 'delivered' | 'read' | 'failed';
  bookingRef?: string;
  sentAt: string;
}
```

---

## Screens

### Customer (mobile, 390×844 baseline)

#### 1. Auth — Login
- Dark `ink` background, `bone` text
- JKMark wordmark at top
- Hero: "Pull in. **Sign in.**" (orange accent on second line)
- Email + password inputs (50px tall, 1.5px ink4 border, ink2 fill)
- "Forgot?" mono link, right-aligned
- Primary CTA: "ENTER WORKSHOP →" (full-width orange, 56px tall, uppercase)
- Divider "OR" then Apple + Google ghost buttons
- Footer: "New here? OPEN AN ACCOUNT" (orange link)

#### 2. Auth — Signup
- Light bone background
- Step indicator "STEP 1/2 · DETAILS" mono
- Inputs: full name, email, mobile, password
- Live password-rule grid (2×2): 8+ chars, uppercase, number, symbol
- Each rule: 14px square checkbox that flips green when satisfied
- CTA "VERIFY MOBILE →" enabled only when all rules pass

#### 3. Auth — OTP
- 6 individual digit boxes, 56px tall, mono 22px
- Active box gets orange border
- "RESEND IN 00:45" countdown
- CTA "VERIFY & CONTINUE →"

#### 4. Home dashboard
- Dark header section with welcome + avatar (orange MB initials)
- "Next booking" ticket card overlapping header, flat shadow `6px 6px 0 ink`
- Big orange "Book the workshop →" CTA card
- "Your fleet" — car cards with UK plate badge (28px ink rectangle, yellow UK + reg)
- "Recent visits" list (last 3) → "See all" link to Service Log

#### 5. Booking flow (8 steps, see Booking Flow section below)

#### 6. Service log
- Header with stats: visits / lifetime spend / last in
- List of jobs as ticket cards (mono ref, service title, mechanic, mileage, £)

#### 7. Account
- Profile header (avatar + name + email)
- Account info KV table (email, mobile, QB ID)
- Notification toggles (WhatsApp confirmations, service reminders, marketing)
- Sign out (red, underlined, mono)

#### 8. Bottom nav (4 items: HOME, BOOK, LOG, ME)
- Dark bar, mono 10px uppercase labels
- Active: orange + 2px top border

### Booking Flow (8 steps)

| Step | Title | Inputs / behavior |
|---|---|---|
| 0 | Service | List of 6 services, each with price + duration. Single select. |
| 1 | When | 14-day date strip (one per day, shows X/4 slot dot color-coded). 4 time slots per selected day (08:30, 10:30, 13:00, 15:30). Pulled from Airtable. |
| 2 | Vehicle | UK reg plate input (yellow + ink-tab UK badge). Tap "LOOK UP IN QUICKBOOKS" → animated scan card → either FoundCard (year/make/model/mileage/colour/VIN) or ManualEntry form. |
| 3 | History | Mileage gauge with MOT countdown, then last 4 service entries from QB. |
| 4 | Notes | Toggle preset chips ("Strange noise on braking" etc.) + free textarea (500 char limit). |
| 5 | Photos | Grid of photo placeholders + add button. Camera or gallery. Stored to Supabase Storage. |
| 6 | Confirm | Receipt-style summary card (ticket shadow), KV table, WhatsApp message preview in green. CTA "CONFIRM BOOKING ✓". |
| 7 | Done | Big orange checkmark, ref number ("JK-1212"), confirmation copy, "Back to dashboard" + "Add to calendar". |

Footer with progress bar (8 segments) is sticky across all steps.

### Admin (desktop, 1280×820 baseline)

#### Layout
- Left sidebar 220px (`ink`): logo, nav (Schedule, Mechanics, Customers, WhatsApp, Analytics, Sync), user footer
- Main column: top bar (live status dot, search, +NEW BOOKING button) + content area (`ink2`)

#### Schedule tab
- 4 KPI cards (BAYS BOOKED, IN PROGRESS, UNASSIGNED, REVENUE TODAY) — each with 2px top accent bar
- Day strip (5 days), selected = bone fill
- **Bay timeline**: 4 rows × 11 hours (08:00-18:00). Each booking is a colored block positioned by start time × duration:
  - in_progress: orange fill
  - confirmed: ink fill, ink4 border
  - unassigned: yellow fill
  - complete: steel
- Now-line: 2px orange vertical line with timestamp pill
- Booking list table below (time, status pill, service+customer, car, ref, mechanic avatar)
- Right rail: full booking detail panel with mechanic assignment list (load/max indicator) + "UPDATE STATUS" + "WHATSAPP →"

#### Mechanics tab
- 2-column grid of mechanic cards
- Each: 56px circle avatar (color-coded), name, specialties, OPEN/FULL pill, big load/max number, progress bar, weekly stats (jobs, avg £, rating)

#### Customers tab
- Searchable table: QB sync icon · Name + QBO ID · Last reg · Cars · Last in · Lifetime spend · OPEN

#### WhatsApp tab
- Message log table (direction arrow, time, recipient, body, status pill DELIVERED/READ)
- Right rail: business profile (number, status, sent 24h, delivered, failed, template) + manage templates CTA

#### Analytics tab
- 4 KPI cards (MTD revenue, jobs done, utilisation, repeat rate)
- 7-day jobs bar chart (last bar = orange highlight)
- Service mix horizontal bars by percentage

#### QB Sync tab
- Left: connection status card (realm ID, env, last sync, queue, reconnect button)
- Right: scrolling event log table (timestamp, source pill QB→PWA / PWA→QB / CRON, description, OK/ERR)

---

## Netlify Function Endpoints (planned)

```
# Booking & availability
GET    /api/availability?from=YYYY-MM-DD&to=YYYY-MM-DD
       → AvailabilityDay[] (reads Airtable Bookings table)

POST   /api/bookings
       body: { clientId, vehicleId, serviceIds, scheduledStart, notes, photoUrls }
       → { booking: Booking }
       Side effects:
         - Creates Airtable record (locks slot)
         - Mirrors to Supabase 'bookings' table
         - Triggers WhatsApp confirmation to customer
         - Triggers WhatsApp summary to admin number
         - Calls Claude API to generate friendly summary text

PATCH  /api/bookings/:id
       body: { status?, assignedMechanicId?, finalCostGbp? }
       → { booking: Booking }

GET    /api/bookings/:id
       → { booking: Booking }

# QuickBooks
GET    /api/qb/vehicle?registration=XX00XXX
       → { vehicle: Vehicle, history: ServiceRecord[] } | { found: false }

POST   /api/qb/customer
       body: { name, email, phone, vehicle: VehicleInput }
       → { qbCustomerId, qbVehicleId }

POST   /api/qb/invoice
       body: { bookingId }
       → { qbInvoiceId, pdfUrl }

POST   /api/qb/sync
       → { synced: number, errors: number }   # nightly cron + manual

# WhatsApp
POST   /api/whatsapp/send
       body: { to, template, vars }
       → { messageId, status }

POST   /api/whatsapp/webhook
       (Meta delivery + read receipts → updates message status in Supabase)

# Claude API
POST   /api/claude/summarize-booking
       body: { booking, vehicleHistory }
       → { customerWhatsApp: string, adminWhatsApp: string, internalNotes: string }

POST   /api/claude/triage-message
       body: { incomingMessage, recentHistory }
       → { suggestedReply: string, urgency: 'low'|'med'|'high', tags: string[] }

# Auth
POST   /api/auth/otp/send       (Twilio Verify or Supabase OTP)
POST   /api/auth/otp/verify
```

Auth: Supabase Auth (email + password, phone OTP). Admin route protected by Supabase RLS + custom `role = 'owner'` claim. PIN gate on admin app is a UX layer on top.

---

## Integration Notes

### Airtable
- Table: `Bookings` with fields: `Date`, `Time`, `Bay`, `Status`, `Reference`, `Customer`, `Service`
- Max 4 records per date (enforced in function)
- Use Airtable as the slot source of truth so non-developers can also block off days manually

### QuickBooks Online
- OAuth 2.0 — store realm + refresh token in Supabase
- Customer lookup by phone or registration custom field
- Auto-refresh token (100-day window)
- Vehicle history = Customer's invoice line items filtered by vehicle reference

### WhatsApp Business Cloud API
- Pre-approved templates: `confirm_v3`, `mechanic_assigned`, `ready_for_collection`, `reminder_24h`
- Webhook for incoming + delivery status

### Claude API
- Model: `claude-sonnet-4-5` (or latest)
- Used to generate human-friendly WhatsApp copy from booking JSON, triage incoming messages, and draft reply suggestions for admin

### Supabase
- Tables: `clients`, `vehicles`, `bookings`, `mechanics`, `whatsapp_messages`, `audit_log`
- Storage bucket: `booking-photos` (RLS: only owner + assigned mechanic + admin)
- Row-level security on every table
- Realtime channels for admin dashboard live updates

---

## Files in This Bundle

| File | Purpose |
|---|---|
| `index.html` | Entry point, mounts the app inside a design canvas with Tweaks panel |
| `shared.jsx` | Design tokens (`JK`), shared components (JKButton, JKInput, MonoStrip, KV, Pill, Dot, JKMark, ImgPlaceholder), fixture data |
| `customer-app.jsx` | Customer mobile app: auth screens, home, history, account, bottom nav |
| `booking-flow.jsx` | The 8-step booking flow with all step components |
| `admin-app.jsx` | Admin desktop console: sidebar, top bar, all 6 tabs |
| `design-canvas.jsx` | Pan/zoom canvas wrapper (presentation only — not part of production app) |
| `ios-frame.jsx` | iPhone bezel for the mobile prototype |
| `tweaks-panel.jsx` | Live tweak controls for the prototype |

The `*-app.jsx` and `booking-flow.jsx` files contain the actual UI to recreate. The `shared.jsx` file has every design token and shared atom.

---

## Implementation Plan (suggested order)

1. **Scaffold** Next.js + Tailwind + Supabase + types package
2. **Design tokens** — port `JK` to Tailwind `theme.extend.colors`/`fontFamily`; build atomic components (Button, Input, Pill, KV, MonoStrip, Dot, JKMark)
3. **Auth** — Supabase email + phone OTP, replicating the dark login + light signup screens
4. **Customer home + booking flow** with mocked data first; wire to Netlify functions one step at a time:
   - Step 1 → `/api/availability`
   - Step 2 → `/api/qb/vehicle`
   - Step 3 → derived from QB vehicle history
   - Step 6 → `/api/bookings` (creates Airtable + Supabase + triggers WA)
5. **PWA shell** — manifest + service worker + install prompt
6. **Admin console** — schedule tab first (highest value), then pipeline, then the rest
7. **Realtime** — Supabase channel subscriptions on admin dashboard
8. **Cron** — nightly QB reconciliation function (Netlify scheduled functions)

## Out of Scope for This Handoff
- Production logo/wordmark (use the JKMark in `shared.jsx` as a placeholder until brand asset is finalized)
- Pricing engine beyond base prices (parts markup, labour rates, VAT — to be defined with the owner)
- Payment processing (Stripe? GoCardless? — decide with owner)
- Multi-location support (current design assumes one workshop)
