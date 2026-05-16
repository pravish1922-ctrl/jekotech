# Batch D — WhatsApp + Airtable Integration

**Status:** NOT STARTED  
**Prerequisite:** Batch C fully QA-passed and deployed

---

## Overview

Connect the booking flow to external systems:
1. **WhatsApp Business API** — confirmations and status updates to customers
2. **Airtable** — sync bookings to owner's existing Airtable base
3. **Claude AI** — generate WhatsApp message content from booking data
4. **QuickBooks Online** — invoice generation (stretch goal)

---

## Existing Stubs (ready for implementation)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/whatsapp/send` | POST | Send WhatsApp template message |
| `/api/whatsapp/send` | GET | Meta webhook challenge/response |
| `/api/availability` | GET | Query Airtable for date/slot availability |
| `/api/bookings` | POST | Create booking (Supabase + Airtable mirror) |
| `/api/bookings` | PATCH | Update booking status |
| `/api/bookings` | GET | Fetch single booking |
| `/api/claude/summarize` | POST | Generate message content via Claude |
| `/api/qb/vehicle` | GET | Lookup vehicle in QuickBooks |
| `/api/qb/vehicle` | POST | Create QB customer + vehicle |

---

## Environment Variables Required

```
ANTHROPIC_API_KEY=
AIRTABLE_API_KEY=
AIRTABLE_BASE_ID=
AIRTABLE_TABLE_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_ID=
WHATSAPP_VERIFY_TOKEN=
QB_CLIENT_ID=
QB_CLIENT_SECRET=
QB_REALM_ID=
QB_ACCESS_TOKEN=
QB_REFRESH_TOKEN=
```

---

## Feature Breakdown (BA Analyst to Complete Before Build)

### D1 — WhatsApp Booking Confirmation

**Description:** When a booking moves from `pending` → `confirmed`, send a WhatsApp template message to the customer.

**User Stories (DRAFT — BA to refine):**
- AS A customer, I WANT to receive a WhatsApp confirmation when my booking is confirmed, SO THAT I have the details without logging in
- AS AN owner, I WANT WhatsApp messages to be logged in the database, SO THAT I can track communication history

**Acceptance Criteria (DRAFT):**
- [ ] Template message includes: reference, date, time, service list
- [ ] Message sent via Meta Graph API using approved template
- [ ] Message logged in `whatsapp_messages` table with status
- [ ] Failed sends do not break the status change flow
- [ ] Owner can re-trigger send from booking detail

**DB Changes:** None (whatsapp_messages table already exists)  
**RLS:** Service role for inserts to whatsapp_messages  
**Gap Analysis:** Pending BA sign-off

---

### D2 — Airtable Sync

**Description:** Mirror booking creation and status changes to owner's Airtable base.

**User Stories (DRAFT):**
- AS AN owner, I WANT all bookings to appear in my Airtable base, SO THAT I can use my existing reporting workflows
- AS AN owner, I WANT booking status to sync to Airtable, SO THAT my Airtable records stay up to date

**Acceptance Criteria (DRAFT):**
- [ ] New booking → Airtable record created, `airtable_record_id` stored in bookings table
- [ ] Status change → Airtable record updated
- [ ] Airtable availability endpoint used in booking flow date selection
- [ ] Failure to sync does not block booking creation

**DB Changes:** `bookings.airtable_record_id` already exists  
**Gap Analysis:** Pending — need Airtable base schema from owner

---

### D3 — Claude AI Message Generation

**Description:** Use Claude to generate human-friendly WhatsApp messages from booking data.

**User Stories (DRAFT):**
- AS AN owner, I WANT WhatsApp messages to sound natural and professional, SO THAT customers have a good experience

**Acceptance Criteria (DRAFT):**
- [ ] `/api/claude/summarize` accepts booking + vehicle history
- [ ] Returns: customerWhatsApp (message text), adminWhatsApp (summary), internalNotes
- [ ] Uses claude-sonnet-4-6 model
- [ ] Gracefully handles API errors (falls back to template)

**Model:** claude-sonnet-4-6  
**Gap Analysis:** Pending BA sign-off

---

### D4 — QuickBooks Online (Stretch)

**Description:** Generate invoices in QuickBooks when booking is completed.

**Status:** Stretch goal — de-prioritize until D1-D3 are stable  
**Gap Analysis:** Pending — need QB sandbox credentials from owner

---

## Pre-Build Checklist (BA Analyst must complete before Batch D coding starts)

- [ ] WhatsApp Business account approved and templates submitted to Meta
- [ ] Airtable base schema documented (field names, types)
- [ ] Airtable API key and base ID provided
- [ ] WhatsApp phone number ID and access token provided
- [ ] All D1-D3 user stories have acceptance criteria signed off
- [ ] DB changes identified and migration SQL written
- [ ] RLS implications reviewed
- [ ] Batch D spec updated with final details
