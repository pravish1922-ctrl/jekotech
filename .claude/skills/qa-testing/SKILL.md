# Skill: QA Testing

**Trigger:** `/qa-testing`  
**Purpose:** Generate GIVEN/WHEN/THEN test cases for any feature, organized by role and portal.

---

## Test Case Format

```
**TC-[AREA]-[NUMBER]**
GIVEN [precondition/context]
WHEN [action or trigger]
THEN [expected outcome]
AND [additional outcome if needed]
```

---

## Coverage Requirements

For every feature, write test cases covering:

1. **Happy path** — the primary success flow
2. **Role restrictions** — what each role CAN and CANNOT do
3. **Auth guards** — unauthenticated access, wrong-role access
4. **Edge cases** — empty states, missing data, boundary conditions
5. **Design system** — visual correctness (border-radius, shadow, currency format, date format)

---

## Roles and Their Portals

| Role | Portal | Auth Redirect |
|------|--------|---------------|
| owner | `/admin/*` | `/admin/bookings` after login |
| delegate | `/admin/*` | `/admin/bookings` after login |
| staff | `/admin/*` | `/admin/bookings` after login |
| mechanic | `/mechanic/*` | `/mechanic/jobs` after login |
| customer | `/home`, `/book/*`, `/history` | `/home` after login |
| unauthenticated | — | `/login?next=[attempted-url]` |

---

## Status Transition Test Matrix

For any booking status feature, cover:

| Transition | Owner | Delegate | Staff | Mechanic |
|------------|-------|----------|-------|----------|
| pending → confirmed | ✓ | ✓ | ✓ | — |
| pending → cancelled | ✓ | ✓ | ✓ | — |
| confirmed → in_progress | ✓ | ✓ | — | ✓ |
| confirmed → cancelled | ✓ | ✓ | ✓ | — |
| in_progress → completed | ✓ | ✓ | — | ✓ |
| in_progress → cancelled | ✓ | ✓ | — | — |

---

## Design System Test Cases (always include)

```
GIVEN any page in [portal]
WHEN inspected
THEN border-radius is 0 everywhere (no rounded corners)

GIVEN any card component
WHEN inspected
THEN it has boxShadow: '4px 4px 0 #0B0D0E'

GIVEN any monetary value displayed
WHEN inspected
THEN it uses ₨ prefix and integer formatting (no decimals)

GIVEN a booking from the current year
WHEN the date is formatted
THEN it shows "14 MAY · 10:30" (no year)

GIVEN a booking from a previous year
WHEN the date is formatted
THEN it shows "3 JAN 2024 · 09:00" (with year)
```

---

## Numbering Convention

| Area Code | Portal/Feature |
|-----------|----------------|
| AUTH | Authentication and routing |
| BOOK | Admin bookings list |
| DETAIL | Admin booking detail |
| ANAL | Analytics |
| MECH | Mechanics management |
| SET | Settings |
| JOB | Mechanic jobs portal |
| CUST | Customer portal |
| DS | Design system |
| WA | WhatsApp integration (Batch D) |
| AT | Airtable integration (Batch D) |

---

## Output Format

Add new test cases to `docs/QA_CHECKLIST.md` under the appropriate section header, following the existing GIVEN/WHEN/THEN format. Do not duplicate existing cases.
