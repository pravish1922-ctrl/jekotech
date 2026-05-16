-- ============================================================
-- Jekotech Batch C — Admin & Mechanic Portal migrations
-- Run once via Supabase SQL editor.
-- ============================================================

-- 1. Add 'staff' to clients role check
ALTER TABLE public.clients
DROP CONSTRAINT IF EXISTS clients_role_check;

ALTER TABLE public.clients
ADD CONSTRAINT clients_role_check
CHECK (role IN ('customer', 'mechanic', 'owner', 'delegate', 'staff'));

-- 2. Add mechanic_notes to bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS mechanic_notes text;

-- 3. Admin RLS — staff can read all bookings
DROP POLICY IF EXISTS "bookings: staff read all" ON public.bookings;

CREATE POLICY "bookings: staff read all"
ON public.bookings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = auth.uid()
    AND c.role IN ('owner', 'delegate', 'staff')
  )
);

-- 4. Admin RLS — owner/delegate can update all bookings
DROP POLICY IF EXISTS "bookings: admin update all" ON public.bookings;

CREATE POLICY "bookings: admin update all"
ON public.bookings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = auth.uid()
    AND c.role IN ('owner', 'delegate')
  )
);

-- 5. Mechanic RLS — see and update assigned bookings
DROP POLICY IF EXISTS "bookings: mechanic select assigned" ON public.bookings;
DROP POLICY IF EXISTS "bookings: mechanic update assigned" ON public.bookings;

CREATE POLICY "bookings: mechanic select assigned"
ON public.bookings FOR SELECT
USING (assigned_mechanic_id = auth.uid());

CREATE POLICY "bookings: mechanic update assigned"
ON public.bookings FOR UPDATE
USING (assigned_mechanic_id = auth.uid());

-- 6. Mechanics table
CREATE TABLE IF NOT EXISTS public.mechanics (
  id uuid PRIMARY KEY REFERENCES public.clients(id),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.mechanics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_mechanics" ON public.mechanics;
DROP POLICY IF EXISTS "owner_manage_mechanics" ON public.mechanics;
DROP POLICY IF EXISTS "mechanic_select_own" ON public.mechanics;

CREATE POLICY "admin_select_mechanics" ON public.mechanics
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = auth.uid()
    AND c.role IN ('owner', 'delegate', 'staff')
  )
);

CREATE POLICY "owner_manage_mechanics" ON public.mechanics
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = auth.uid()
    AND c.role = 'owner'
  )
);

CREATE POLICY "mechanic_select_own" ON public.mechanics
FOR SELECT TO authenticated
USING (id = auth.uid());

-- 7. Set pravish as owner for testing
UPDATE public.clients
SET role = 'owner'
WHERE email = 'pravish1922@gmail.com';