-- ============================================================
-- Jekotech Garage — Supabase schema
-- Run once against a fresh Supabase project via the SQL editor
-- or `supabase db push` if using the CLI.
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Helpers ───────────────────────────────────────────────────────────────────
-- Automatically updates updated_at on any table that has the column.
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- CLIENTS
-- mirrors auth.users; one row per registered user.
-- ============================================================
create table if not exists public.clients (
  id               uuid primary key references auth.users(id) on delete cascade,
  name             text        not null,
  email            text        not null,
  phone            text        not null,           -- E.164  e.g. +23057001234
  role             text        not null default 'customer'
                               check (role in ('customer','mechanic','owner','delegate')),
  whatsapp_opt_in  boolean     not null default false,
  qb_customer_id   text,                           -- QuickBooks Online reference
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger clients_updated_at
  before update on public.clients
  for each row execute function set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.clients enable row level security;

-- Users can read and update their own row
create policy "clients: own row read"
  on public.clients for select
  using (auth.uid() = id);

create policy "clients: own row update"
  on public.clients for update
  using (auth.uid() = id);

-- Users can insert their own row on sign-up
create policy "clients: own row insert"
  on public.clients for insert
  with check (auth.uid() = id);

-- Owner/delegate can read all clients
create policy "clients: admin read all"
  on public.clients for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = auth.uid()
        and c.role in ('owner', 'delegate')
    )
  );

-- ============================================================
-- VEHICLES
-- ============================================================
create table if not exists public.vehicles (
  id               uuid primary key default uuid_generate_v4(),
  owner_client_id  uuid        not null references public.clients(id) on delete cascade,
  registration     text        not null,           -- normalised uppercase, no spaces
  make             text        not null,
  model            text        not null,
  year             integer     not null,
  colour           text,
  vin              text,
  mileage          integer     not null default 0,
  mot_due_date     date,
  qb_vehicle_id    text,                           -- QuickBooks reference
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger vehicles_updated_at
  before update on public.vehicles
  for each row execute function set_updated_at();

alter table public.vehicles enable row level security;

create policy "vehicles: owner read"
  on public.vehicles for select
  using (owner_client_id = auth.uid());

create policy "vehicles: owner insert"
  on public.vehicles for insert
  with check (owner_client_id = auth.uid());

create policy "vehicles: owner update"
  on public.vehicles for update
  using (owner_client_id = auth.uid());

create policy "vehicles: admin read all"
  on public.vehicles for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = auth.uid()
        and c.role in ('owner', 'delegate', 'mechanic')
    )
  );

-- ============================================================
-- MECHANICS
-- ============================================================
create table if not exists public.mechanics (
  id                  uuid primary key default uuid_generate_v4(),
  client_id           uuid references public.clients(id) on delete set null,
  name                text        not null,
  initials            char(2)     not null,
  specialties         text[]      not null default '{}',
  max_concurrent_jobs integer     not null default 3,
  active              boolean     not null default true,
  color_hex           text        not null default '#FF5A1F',
  created_at          timestamptz not null default now()
);

alter table public.mechanics enable row level security;

create policy "mechanics: authenticated read"
  on public.mechanics for select
  using (auth.role() = 'authenticated');

create policy "mechanics: admin write"
  on public.mechanics for all
  using (
    exists (
      select 1 from public.clients c
      where c.id = auth.uid()
        and c.role in ('owner', 'delegate')
    )
  );

-- ============================================================
-- SERVICES  (catalogue — populated by seed.sql)
-- ============================================================
create table if not exists public.services (
  id                    uuid primary key default uuid_generate_v4(),
  type                  text        not null
                                    check (type in (
                                      'full_service','interim_service','mot','diagnostics',
                                      'brakes','tyres','aircon','bodywork','other'
                                    )),
  name                  text        not null,
  description           text        not null default '',
  base_price_mur        integer     not null,       -- Mauritius Rupees (no decimals)
  estimated_duration_min integer    not null,
  active                boolean     not null default true,
  created_at            timestamptz not null default now()
);

alter table public.services enable row level security;

-- Anyone authenticated can read the service catalogue
create policy "services: authenticated read"
  on public.services for select
  using (auth.role() = 'authenticated');

create policy "services: admin write"
  on public.services for all
  using (
    exists (
      select 1 from public.clients c
      where c.id = auth.uid()
        and c.role in ('owner', 'delegate')
    )
  );

-- ============================================================
-- BOOKINGS
-- ============================================================
create table if not exists public.bookings (
  id                    uuid primary key default uuid_generate_v4(),
  reference             text        not null unique,  -- e.g. JK-1212
  client_id             uuid        not null references public.clients(id),
  vehicle_id            uuid        not null references public.vehicles(id),
  service_ids           uuid[]      not null default '{}',
  bay_number            integer     not null check (bay_number between 1 and 4),
  scheduled_start       timestamptz not null,
  scheduled_end         timestamptz not null,
  status                text        not null default 'pending'
                                    check (status in (
                                      'pending','confirmed','in_progress','complete','cancelled'
                                    )),
  assigned_mechanic_id  uuid references public.mechanics(id) on delete set null,
  customer_notes        text,
  photo_urls            text[]      not null default '{}',
  estimated_cost_mur    integer     not null default 0,
  final_cost_mur        integer,
  qb_invoice_id         text,
  airtable_record_id    text,
  whatsapp_thread_id    text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create trigger bookings_updated_at
  before update on public.bookings
  for each row execute function set_updated_at();

alter table public.bookings enable row level security;

create policy "bookings: own read"
  on public.bookings for select
  using (client_id = auth.uid());

create policy "bookings: own insert"
  on public.bookings for insert
  with check (client_id = auth.uid());

create policy "bookings: mechanic read assigned"
  on public.bookings for select
  using (
    exists (
      select 1 from public.mechanics m
      where m.id = assigned_mechanic_id
        and m.client_id = auth.uid()
    )
  );

create policy "bookings: admin all"
  on public.bookings for all
  using (
    exists (
      select 1 from public.clients c
      where c.id = auth.uid()
        and c.role in ('owner', 'delegate')
    )
  );

-- ============================================================
-- WHATSAPP_MESSAGES
-- ============================================================
create table if not exists public.whatsapp_messages (
  id            uuid primary key default uuid_generate_v4(),
  direction     text        not null check (direction in ('in','out')),
  to_number     text        not null,              -- E.164
  body_text     text        not null,
  template_name text,
  status        text        not null default 'sent'
                            check (status in ('sent','delivered','read','failed')),
  booking_ref   text,
  sent_at       timestamptz not null default now()
);

alter table public.whatsapp_messages enable row level security;

create policy "whatsapp_messages: admin read"
  on public.whatsapp_messages for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = auth.uid()
        and c.role in ('owner', 'delegate')
    )
  );

create policy "whatsapp_messages: service role insert"
  on public.whatsapp_messages for insert
  with check (true);  -- insert only from server-side (service key)

-- ============================================================
-- INVOICES
-- ============================================================
create table if not exists public.invoices (
  id              uuid primary key default uuid_generate_v4(),
  booking_id      uuid        not null references public.bookings(id),
  qb_invoice_id   text        not null,
  amount_mur      integer     not null,
  pdf_url         text,
  issued_at       timestamptz not null default now()
);

alter table public.invoices enable row level security;

create policy "invoices: own read"
  on public.invoices for select
  using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and b.client_id = auth.uid()
    )
  );

create policy "invoices: admin all"
  on public.invoices for all
  using (
    exists (
      select 1 from public.clients c
      where c.id = auth.uid()
        and c.role in ('owner', 'delegate')
    )
  );

-- ============================================================
-- AUDIT_LOG  (append-only; no RLS deletes)
-- ============================================================
create table if not exists public.audit_log (
  id          bigserial primary key,
  actor_id    uuid references auth.users(id) on delete set null,
  action      text        not null,  -- e.g. 'booking.status_changed'
  table_name  text        not null,
  row_id      uuid,
  payload     jsonb,
  created_at  timestamptz not null default now()
);

alter table public.audit_log enable row level security;

create policy "audit_log: admin read"
  on public.audit_log for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = auth.uid()
        and c.role in ('owner', 'delegate')
    )
  );

-- Inserts only allowed from server-side (service key / triggers)
create policy "audit_log: service insert"
  on public.audit_log for insert
  with check (true);

-- ============================================================
-- Realtime — enable for admin dashboard live updates
-- ============================================================
alter publication supabase_realtime add table public.bookings;
alter publication supabase_realtime add table public.whatsapp_messages;
