-- ============================================================
-- Jekotech Batch C — Admin & Mechanic Portal migrations
-- Run once via Supabase SQL editor.
-- ============================================================

-- ── 1. Add 'staff' to clients role check ─────────────────────────────────────
alter table public.clients
  drop constraint if exists clients_role_check;

alter table public.clients
  add constraint clients_role_check
  check (role in ('customer', 'mechanic', 'owner', 'delegate', 'staff'));

-- ── 2. Add mechanic_notes to bookings ────────────────────────────────────────
alter table public.bookings
  add column if not exists mechanic_notes text;

-- ── 3. Admin RLS — staff can read all bookings ────────────────────────────────
drop policy if exists "bookings: staff read all" on public.bookings;
create policy "bookings: staff read all"
  on public.bookings for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = auth.uid()
        and c.role in ('owner', 'delegate', 'staff')
    )
  );

-- ── 4. Admin RLS — owner/delegate can update any booking ─────────────────────
drop policy if exists "bookings: owner delegate update all" on public.bookings;
create policy "bookings: owner delegate update all"
  on public.bookings for update
  using (
    exists (
      select 1 from public.clients c
      where c.id = auth.uid()
        and c.role in ('owner', 'delegate')
    )
  );

-- ── 5. Staff RLS — staff can update status on bookings (limited fields) ───────
drop policy if exists "bookings: staff update status" on public.bookings;
create policy "bookings: staff update status"
  on public.bookings for update
  using (
    exists (
      select 1 from public.clients c
      where c.id = auth.uid()
        and c.role = 'staff'
    )
  );

-- ── 6. Mechanic RLS — mechanic can update their assigned bookings ─────────────
drop policy if exists "bookings: mechanic update assigned" on public.bookings;
create policy "bookings: mechanic update assigned"
  on public.bookings for update
  using (
    exists (
      select 1 from public.mechanics m
      where m.id = assigned_mechanic_id
        and m.client_id = auth.uid()
    )
  );

-- ── 7. Ensure admin read-all policy exists (replaces existing if needed) ──────
drop policy if exists "bookings: admin all" on public.bookings;
create policy "bookings: admin all"
  on public.bookings for all
  using (
    exists (
      select 1 from public.clients c
      where c.id = auth.uid()
        and c.role in ('owner', 'delegate')
    )
  );

-- ── 8. Vehicles — allow admin/staff to read all vehicles ─────────────────────
drop policy if exists "vehicles: staff read all" on public.vehicles;
create policy "vehicles: staff read all"
  on public.vehicles for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = auth.uid()
        and c.role in ('owner', 'delegate', 'staff')
    )
  );
