-- ============================================================
-- Jekotech Garage — Seed data
-- Run after schema.sql via the SQL editor or `supabase db reset`.
-- ============================================================

insert into public.services (type, name, description, base_price_mur, estimated_duration_min, active)
values
  (
    'full_service',
    'Full Service',
    'Complete vehicle service including oil change, filters, spark plugs, fluid top-ups, and a full safety check.',
    2500,
    120,
    true
  ),
  (
    'interim_service',
    'Interim Service',
    'Essential mid-interval service covering oil, oil filter, and key safety checks to keep your vehicle running smoothly.',
    1500,
    60,
    true
  ),
  (
    'brakes',
    'Brake Repair',
    'Inspection and replacement of brake pads, discs, or drums as required. Includes brake fluid check.',
    800,
    90,
    true
  ),
  (
    'tyres',
    'Tyre Service',
    'Tyre fitting, balancing, and pressure check. Price per tyre; bulk fitting available on request.',
    600,
    45,
    true
  );
