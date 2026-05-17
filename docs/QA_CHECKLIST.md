# QA Checklist — JEKOTECH PWA

All test cases use GIVEN / WHEN / THEN format, organized by portal and role.

---

## Auth & Routing

**TC-AUTH-01**
GIVEN an unauthenticated user  
WHEN they visit `/admin/bookings`  
THEN they are redirected to `/login?next=/admin/bookings`

**TC-AUTH-02**
GIVEN a logged-in customer (role: customer)  
WHEN they visit `/admin/bookings`  
THEN they are redirected to `/home`

**TC-AUTH-03**
GIVEN a logged-in mechanic (role: mechanic)  
WHEN they visit `/admin/bookings`  
THEN they are redirected to `/mechanic/jobs`

**TC-AUTH-04**
GIVEN a logged-in owner  
WHEN login completes  
THEN they land at `/admin/bookings`

**TC-AUTH-05**
GIVEN a logged-in mechanic  
WHEN login completes  
THEN they land at `/mechanic/jobs`

**TC-AUTH-06**
GIVEN a logged-in staff member  
WHEN login completes  
THEN they land at `/admin/bookings`

---

## Admin Portal — Bookings List (`/admin/bookings`)

**TC-BOOK-01**
GIVEN bookings exist in the database  
WHEN an admin visits `/admin/bookings`  
THEN all bookings appear with client names (not "Unknown") and vehicle registrations

**TC-BOOK-02**
GIVEN bookings with different statuses  
WHEN the admin clicks the "PENDING" filter tab  
THEN only pending bookings are shown

**TC-BOOK-03**
GIVEN bookings from multiple clients  
WHEN the admin types a client name in the search box  
THEN only matching bookings appear

**TC-BOOK-04**
GIVEN a booking with reference "JK-1001"  
WHEN the admin searches "JK-1001"  
THEN that booking appears in results

**TC-BOOK-05**
GIVEN a booking exists  
WHEN the admin clicks on it  
THEN they navigate to `/admin/bookings/:id` with full booking details visible

---

## Admin Portal — Booking Detail (`/admin/bookings/:id`)

**TC-DETAIL-01**
GIVEN a pending booking  
WHEN an owner views the booking detail  
THEN status buttons "CONFIRMED" and "CANCELLED" are visible  
AND "IN PROGRESS" is NOT visible

**TC-DETAIL-02**
GIVEN a confirmed booking  
WHEN a staff member views the booking detail  
THEN only "CONFIRMED" and "CANCELLED" status buttons are visible  
AND "IN PROGRESS" is NOT shown

**TC-DETAIL-03**
GIVEN a confirmed booking  
WHEN an owner views the booking detail  
THEN "IN PROGRESS" and "CANCELLED" buttons are visible

**TC-DETAIL-04**
GIVEN a booking viewed by staff  
WHEN the staff member looks at the form  
THEN mechanic assignment, bay selector, and cost fields are NOT visible  
AND mechanic notes textarea IS visible

**TC-DETAIL-05**
GIVEN an owner changes booking status to "IN PROGRESS" and clicks SAVE  
WHEN the save completes  
THEN the page navigates to `/admin/bookings`  
AND the booking now shows "IN PROGRESS" in the list

**TC-DETAIL-06**
GIVEN a booking with services  
WHEN the detail page loads  
THEN each service shows its `name_en` (not raw ID) and base price in ₨

---

## Admin Portal — Analytics (`/admin/analytics`)

**TC-ANAL-01**
GIVEN completed bookings with `final_cost_mur` values  
WHEN an owner views analytics  
THEN the TOTAL REVENUE card shows the correct sum in ₨

**TC-ANAL-02**
GIVEN 5 bookings created in the last 14 days  
WHEN the bar chart renders  
THEN 5 bars have orange fill (matching booking dates)

**TC-ANAL-03**
GIVEN a delegate is logged in  
WHEN they visit `/admin/analytics`  
THEN the page loads (not redirected)

**TC-ANAL-04**
GIVEN staff is logged in  
WHEN they visit `/admin/analytics`  
THEN the analytics link does NOT appear in the sidebar

---

## Admin Portal — Mechanics (`/admin/mechanics`)

**TC-MECH-01**
GIVEN mechanics are registered  
WHEN an owner views `/admin/mechanics`  
THEN each mechanic shows name, email (from clients), and job count

**TC-MECH-02**
GIVEN an owner fills in the Add Mechanic form with name + email  
WHEN they click "ADD MECHANIC"  
THEN the API creates a clients row (role='mechanic') and mechanics row  
AND the new mechanic appears in the list after refresh

**TC-MECH-03**
GIVEN the Add Mechanic API is called  
WHEN the mechanics table insert runs  
THEN only { id, name, phone, active } are inserted (no email column)

**TC-MECH-04**
GIVEN a mechanic is currently ACTIVE  
WHEN an owner clicks their status badge  
THEN it toggles to INACTIVE and persists on reload

**TC-MECH-05**
GIVEN a delegate is viewing mechanics  
WHEN the page loads  
THEN no "ADD MECHANIC" form is visible (owner-only)

---

## Admin Portal — Settings (`/admin/settings`)

**TC-SET-01**
GIVEN a delegate is logged in  
WHEN they navigate to `/admin/settings`  
THEN they are redirected to `/admin/bookings`

**TC-SET-02**
GIVEN an owner edits a service price to 2500  
WHEN they click SAVE  
THEN the API PATCHes the service  
AND the price persists on page reload

**TC-SET-03**
GIVEN an owner adds a new service "Wheel Alignment" at ₨1500  
WHEN they click ADD SERVICE  
THEN the API POSTs with `{ name_en: "Wheel Alignment", type: "wheel_alignment", base_price_mur: 1500 }`  
AND the new service appears in the list

**TC-SET-04**
GIVEN an owner edits business hours (Mon–Fri close to 16:00) and clicks SAVE HOURS  
WHEN the save completes  
THEN garage_config row is updated  
AND the new close time persists on reload

**TC-SET-05**
GIVEN an owner enters a new password (≥8 chars) matching confirm field  
WHEN they click UPDATE PASSWORD  
THEN `supabase.auth.updateUser({ password })` is called  
AND a "✓ PASSWORD UPDATED" confirmation appears

**TC-SET-06**
GIVEN an owner enters mismatched passwords  
WHEN they click UPDATE PASSWORD  
THEN an error "Passwords do not match" appears  
AND no API call is made

---

## Mechanic Portal — Jobs (`/mechanic/jobs`)

**TC-JOB-01**
GIVEN a mechanic has 2 confirmed bookings assigned  
WHEN they view `/mechanic/jobs`  
THEN both appear in the ACTIVE tab with customer name and vehicle reg

**TC-JOB-02**
GIVEN a mechanic taps a job card  
WHEN it expands  
THEN customer notes, service list, photos (if any), and mechanic notes textarea are visible

**TC-JOB-03**
GIVEN a job is in "confirmed" status  
WHEN the mechanic clicks "START JOB"  
THEN status updates to "in_progress" in Supabase  
AND the button changes to "COMPLETE JOB"

**TC-JOB-04**
GIVEN a job is in "in_progress" status  
WHEN the mechanic clicks "COMPLETE JOB"  
THEN status updates to "completed"  
AND the job moves to the DONE tab

**TC-JOB-05**
GIVEN a mechanic types internal notes and clicks SAVE NOTES  
WHEN the save completes  
THEN `mechanic_notes` is updated in Supabase  
AND the notes persist on next load

**TC-JOB-06**
GIVEN a completed booking  
WHEN the mechanic views the DONE tab  
THEN it appears with a green COMPLETED badge

---

## Customer Portal — Booking Flow

**TC-CUST-01**
GIVEN a logged-in customer with a registered vehicle  
WHEN they complete all 8 booking steps  
THEN a booking is created with status "pending"  
AND a reference number (JK-XXXX) is shown on the done screen

**TC-CUST-02**
GIVEN a customer visits `/book` without a vehicle registered  
WHEN they reach the vehicle step  
THEN they can add a new vehicle inline

**TC-CUST-03**
GIVEN a customer has past bookings  
WHEN they visit `/history`  
THEN all their bookings appear with correct status badges

**TC-CUST-04**
GIVEN a customer visits `/admin/bookings` (wrong portal)  
WHEN the middleware runs  
THEN they are redirected to `/home`

---

## Design System Checks

**TC-DS-01**
GIVEN any page in the admin portal  
WHEN inspected  
THEN border-radius is 0 everywhere (no rounded corners)

**TC-DS-02**
GIVEN any card component  
WHEN inspected  
THEN it has `boxShadow: '4px 4px 0 #0B0D0E'`

**TC-DS-03**
GIVEN any monetary value displayed  
WHEN inspected  
THEN it uses ₨ prefix and integer formatting (no decimals)

**TC-DS-04**
GIVEN a booking from the current year  
WHEN the date is formatted  
THEN it shows "14 MAY · 10:30" (no year)

**TC-DS-05**
GIVEN a booking from a previous year  
WHEN the date is formatted  
THEN it shows "3 JAN 2024 · 09:00" (with year)

---

## Batch G Regression Tests

**TC-G-01 — Preview banner must not appear on auth pages**
GIVEN the admin is in preview mode (`preview_mode` cookie set)  
WHEN they are redirected to `/login` (e.g. after sign out)  
THEN the orange PREVIEW MODE banner does NOT appear on the login page

**TC-G-02 — Preview banner hidden inside phone mockup**
GIVEN an owner visits `/admin/preview`  
WHEN the customer portal loads inside the phone mockup iframe  
THEN the orange EXIT PREVIEW banner does NOT appear inside the iframe

**TC-G-03 — Sign out clears preview cookie**
GIVEN the admin is in preview mode (`preview_mode` cookie set)  
WHEN they click SIGN OUT in the admin sidebar  
THEN they are redirected to `/login`  
AND the `preview_mode` cookie is cleared (banner does not reappear on next login)

**TC-G-04 — Mechanic sign out clears preview cookie**
GIVEN a mechanic is logged in  
WHEN they tap the initials button in the top bar  
THEN they are redirected to `/login`  
AND the `preview_mode` cookie is cleared

**TC-G-05 — Mechanic dropdown shows names**
GIVEN mechanics exist with rows in both `mechanics` and `clients` tables  
WHEN an owner opens a booking detail page (`/admin/bookings/:id`)  
THEN the ASSIGN MECHANIC dropdown shows mechanic names (not blank or "(unknown)")

**TC-G-06 — Auth callback redirects by role**
GIVEN a mechanic completes Google OAuth login  
WHEN the `/auth/callback` route runs  
THEN they are redirected to `/mechanic/jobs` (not `/home`)

**TC-G-07 — Auth callback redirects owner to admin**
GIVEN an owner completes Google OAuth login  
WHEN the `/auth/callback` route runs  
THEN they are redirected to `/admin/bookings` (not `/home`)

**TC-G-08 — roleHome always includes subpath**
GIVEN any code path that redirects by role  
WHEN the role is `owner`, `delegate`, or `staff`  
THEN the redirect URL is `/admin/bookings` (never bare `/admin`)

**TC-G-09 — roleHome mechanic subpath**
GIVEN any code path that redirects by role  
WHEN the role is `mechanic`  
THEN the redirect URL is `/mechanic/jobs` (never bare `/mechanic`)
