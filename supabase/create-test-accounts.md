# Jekotech — Create Test Accounts

Run these steps **after** applying `schema.sql` and `seed.sql` in your Supabase project.

---

## 1. Create the auth users in Supabase Dashboard

Go to **Authentication → Users → Add User** for each account below.
Use "Email + Password" mode. Confirm the email manually (tick "Auto Confirm").

| Email                         | Password       | Role to set |
|-------------------------------|----------------|-------------|
| owner@jekotechltd.com         | Test1234!      | owner       |
| mechanic@jekotechltd.com      | Test1234!      | mechanic    |
| customer@test.com             | Test1234!      | customer    |

> The `clients` row is created automatically by the Supabase auth hook **only if**
> you have a trigger wired. If not, the signup flow (`/signup`) creates it.
> For test accounts created directly in the dashboard, insert the `clients` rows manually
> using the SQL below.

---

## 2. Insert clients rows for each test account

Open **SQL Editor** in Supabase and run:

```sql
-- Replace the UUIDs with the actual IDs from Authentication → Users
insert into public.clients (id, name, email, phone, role, whatsapp_opt_in)
values
  (
    '<uuid-of-owner>',
    'Owner Admin',
    'owner@jekotechltd.com',
    '+23057000001',
    'owner',
    false
  ),
  (
    '<uuid-of-mechanic>',
    'Test Mechanic',
    'mechanic@jekotechltd.com',
    '+23057000002',
    'mechanic',
    false
  ),
  (
    '<uuid-of-customer>',
    'Test Customer',
    'customer@test.com',
    '+23057000003',
    'customer',
    false
  )
on conflict (id) do update
  set role = excluded.role,
      name = excluded.name;
```

---

## 3. Set roles (if rows already exist from the signup flow)

```sql
update public.clients set role = 'owner'
  where email = 'owner@jekotechltd.com';

update public.clients set role = 'mechanic'
  where email = 'mechanic@jekotechltd.com';
```

---

## 4. Create the mechanic record for the mechanic account

```sql
insert into public.mechanics (client_id, name, initials, specialties, active, color_hex)
select
  id,
  'Test Mechanic',
  'TM',
  array['brakes', 'tyres'],
  true,
  '#FF5A1F'
from public.clients
where email = 'mechanic@jekotechltd.com'
on conflict do nothing;
```

---

## 5. Expected redirect behaviour after login

| Account                  | Lands on         |
|--------------------------|------------------|
| owner@jekotechltd.com    | /admin           |
| mechanic@jekotechltd.com | /mechanic/dashboard |
| customer@test.com        | /home            |

---

## 6. Supabase Storage — create the bucket

The photos upload step requires a `booking-photos` bucket.

1. Go to **Storage → New Bucket**
2. Name: `booking-photos`
3. Public: **Yes** (so `getPublicUrl` works without auth tokens)
4. No file size limit set (or set 10 MB per file)
