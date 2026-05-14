-- =============================================================================
-- Run this entire file in Supabase SQL Editor (Dashboard → SQL Editor → New)
-- =============================================================================

-- ── 1. BOOKINGS TABLE — Row-Level Security ─────────────────────────────────

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts (safe to re-run)
DROP POLICY IF EXISTS "Customers can read own bookings"  ON bookings;
DROP POLICY IF EXISTS "Customers can create bookings"    ON bookings;
DROP POLICY IF EXISTS "Customers can update own bookings" ON bookings;

-- Customers can SELECT their own bookings
CREATE POLICY "Customers can read own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = client_id);

-- Customers can INSERT bookings where they are the client
CREATE POLICY "Customers can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- Customers can UPDATE their own bookings (e.g. add notes, photos)
CREATE POLICY "Customers can update own bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = client_id);


-- ── 2. STORAGE BUCKET — booking-photos ────────────────────────────────────

-- Create the bucket (public so uploaded photos can be displayed without signed URLs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('booking-photos', 'booking-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing storage policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can upload booking photos" ON storage.objects;
DROP POLICY IF EXISTS "Booking photos are publicly readable"          ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own booking photos"           ON storage.objects;

-- Authenticated users can upload to their own user-id folder only
-- Upload path in app: `${user.id}/${timestamp}-${filename}`
CREATE POLICY "Authenticated users can upload booking photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'booking-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read access (bucket is public — photos shown as <img> tags)
CREATE POLICY "Booking photos are publicly readable"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'booking-photos');

-- Users can delete their own photos
CREATE POLICY "Users can delete own booking photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'booking-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
