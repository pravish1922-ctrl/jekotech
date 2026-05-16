# Business Requirements Document — JEKOTECH PWA

## Business Context

**Client:** JEKOTECH Car Services Ltd  
**Location:** Savanne Road, Nouvelle France, Mauritius  
**Contact:** +230 5709 9631 | info@jekotechltd.com  
**Owner:** Pravish's cousin (garage proprietor)  
**Builder:** Pravish Ajay Kona Sunnassee (PMO Lead, Mauritius)

JEKOTECH is a car service workshop that currently runs on WhatsApp and phone calls for booking management. This PWA replaces that with a structured digital system — mobile-first for customers, admin dashboard for the owner/staff, and a job view for mechanics.

---

## 5 Roles & Permissions

| Role | Description | Home Route | Key Permissions |
|------|-------------|------------|-----------------|
| `owner` | Garage proprietor | `/admin/bookings` | Full access: all admin + settings + mechanics + analytics |
| `delegate` | Trusted manager | `/admin/bookings` | All admin except settings |
| `staff` | Counter staff | `/admin/bookings` | View bookings, confirm/cancel only |
| `mechanic` | Workshop technician | `/mechanic/jobs` | View own assigned jobs, update status + notes |
| `customer` | Vehicle owner | `/home` | Book appointments, view history, manage vehicles |

### Booking Status Permissions by Role

| Status Transition | Owner | Delegate | Staff | Mechanic |
|-------------------|-------|----------|-------|----------|
| pending → confirmed | ✓ | ✓ | ✓ | — |
| pending → cancelled | ✓ | ✓ | ✓ | — |
| confirmed → in_progress | ✓ | ✓ | — | ✓ |
| confirmed → cancelled | ✓ | ✓ | ✓ | — |
| in_progress → completed | ✓ | ✓ | — | ✓ |
| in_progress → cancelled | ✓ | ✓ | — | — |

---

## Customer Booking Flow (8 Steps)

1. **Login / Sign Up** — Email OTP or Google OAuth
2. **Vehicle Selection** — Pick existing vehicle or add new (reg, make, model, year, colour, mileage)
3. **Service Selection** — Choose one or more services from active catalogue
4. **Date & Slot Selection** — Pick available date + time slot (08:30 / 10:30 / 13:00 / 15:30)
5. **Photo Upload** — Optional pre-service photos (stored in Supabase `booking-photos` bucket)
6. **Customer Notes** — Free-text notes for mechanic
7. **Confirmation Review** — Summary of booking details before submission
8. **Done** — Booking reference shown, WhatsApp confirmation sent (future)

---

## Admin Capabilities

### Bookings Management (`/admin/bookings`)
- View all bookings with search (reference, client name, vehicle reg) and status filter tabs
- Click into any booking to see full detail: client info, vehicle, services, photos, notes
- Change booking status within allowed transitions
- Assign mechanic and bay number
- Set estimated cost and final cost (₨ MUR)
- Edit mechanic notes (internal)

### Analytics (`/admin/analytics`) — Owner + Delegate only
- KPI cards: total revenue, total bookings, pending count, completed count
- 14-day bookings bar chart (CSS, no library)
- Revenue by service (horizontal bar chart)
- Recent activity feed (last 10 bookings)

### Mechanics Management (`/admin/mechanics`) — Owner + Delegate only
- List registered mechanics with job counts and active/inactive status
- Owner-only: toggle mechanic active/inactive
- Owner-only: add mechanic via invite form (creates client + mechanics record via service role API)

### Settings (`/admin/settings`) — Owner only
- Account info display (read-only)
- Services & Pricing: edit name, price, active toggle, add new service
- Business Hours: per-day open/close time or closed toggle; time slots; bay count
- Garage Info: name, address, phone, email (editable, saved to garage_config table)
- Password change (via Supabase auth.updateUser)

---

## Mechanic Capabilities (`/mechanic/jobs`)

- View own assigned jobs split into Active (pending/confirmed/in_progress) and Done (completed/cancelled)
- Expand job card to see: customer notes, vehicle, services, photos, mechanic notes input
- Save mechanic notes
- Advance job status: confirmed → in_progress → completed

---

## Business Hours

| Day | Hours |
|-----|-------|
| Mon – Fri | 08:00 – 17:00 |
| Sunday | 08:00 – 13:00 |
| Saturday | Closed |

**Time Slots:** 08:30, 10:30, 13:00, 15:30  
**Service Bays:** 4

---

## Future Integrations (Batch D+)

| Integration | Purpose | Status |
|-------------|---------|--------|
| **WhatsApp Business API** | Booking confirmations, status updates, reminders | API route stub exists (`/api/whatsapp/send`) |
| **Airtable** | Parallel bookings table, owner's existing workflow | API route stub exists (`/api/availability`, `/api/bookings`) |
| **QuickBooks Online** | Invoice generation, customer sync, vehicle history | API route stub exists (`/api/qb/vehicle`) |
| **Claude AI** | Booking summaries for WhatsApp messages | API route stub exists (`/api/claude/summarize`) |

---

## Non-Functional Requirements

- **Mobile-first:** Designed for 375px+ screens, PWA installable
- **Offline resilience:** Future consideration
- **Currency:** Mauritius Rupee (₨ MUR), integer values, no decimals
- **Language:** English UI, future French/Creole possible
- **Auth:** Supabase Auth (email OTP, Google OAuth, Apple planned)
- **Hosting:** Netlify (primary), Vercel config also present
- **Database:** Supabase (PostgreSQL + RLS)
