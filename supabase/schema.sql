-- ============================================================================
-- DentistNearMe — base schema
-- ----------------------------------------------------------------------------
-- This is the foundational schema the public booking flow and the admin
-- dashboard both read/write. Apply this first, then the migrations in
-- supabase/migrations/ in numeric order.
--
-- Security model: the admin dashboard runs under the signed-in user's session,
-- so every table below has RLS enabled. Authenticated staff get full read +
-- the writes they need; anon gets only what the public booking flow requires.
-- The service-role key is never used by the app.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ── Enums ──────────────────────────────────────────────────────────────────
-- Lifecycle: pending → confirmed → completed | cancelled (terminal).
-- 'no_show' and 'rescheduled' are added in migrations/0003 and 0004.
-- Postgres cannot add an enum value in the same transaction that uses it.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'appointment_status') then
    create type appointment_status as enum ('pending', 'confirmed', 'completed', 'cancelled');
  end if;
end$$;

-- ── Catalogue tables (read-only in the dashboard) ──────────────────────────
create table if not exists public.locations (
  id          uuid primary key default gen_random_uuid(),
  city        text not null,
  name        text not null,
  address     text,
  timezone    text not null default 'America/New_York',
  created_at  timestamptz not null default now()
);

create table if not exists public.services (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  name             text not null,
  duration_minutes int  not null default 30 check (duration_minutes > 0),
  created_at       timestamptz not null default now()
);

create table if not exists public.dentists (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  location_id uuid references public.locations(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists public.dentist_services (
  dentist_id uuid not null references public.dentists(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  primary key (dentist_id, service_id)
);

create table if not exists public.dentist_availability (
  id          uuid primary key default gen_random_uuid(),
  dentist_id  uuid not null references public.dentists(id) on delete cascade,
  weekday     int  not null check (weekday between 0 and 6), -- 0 = Sunday
  start_time  time not null,
  end_time    time not null,
  check (end_time > start_time)
);

-- ── Appointments ───────────────────────────────────────────────────────────
create table if not exists public.appointments (
  id              uuid primary key default gen_random_uuid(),

  -- Foreign keys (resolved from the denormalised slugs by trigger on insert)
  service_id      uuid references public.services(id)  on delete set null,
  dentist_id      uuid references public.dentists(id)  on delete set null,
  location_id     uuid references public.locations(id) on delete set null,

  -- Denormalised, display-ready copies
  service_slug    text not null,
  dentist_name    text not null,
  location_city   text not null,

  starts_at       timestamptz not null,
  ends_at         timestamptz not null,

  status          appointment_status not null default 'pending',

  patient_name    text not null,
  patient_email   text not null,
  patient_phone   text not null,
  notes           text,                 -- patient-supplied

  reminder_sent_at timestamptz,         -- set by the reminder cron
  created_at      timestamptz not null default now()
);

-- Indexes the dashboard relies on (PRD §13)
create index if not exists appointments_starts_at_idx     on public.appointments (starts_at);
create index if not exists appointments_patient_email_idx on public.appointments (lower(patient_email));
create index if not exists appointments_status_idx        on public.appointments (status);
create index if not exists appointments_dentist_idx       on public.appointments (dentist_id);

-- Double-booking guard: a dentist cannot hold two *active* appointments at the
-- same start time. Cancelled/completed/no_show rows are excluded; rescheduled
-- still holds the slot. See migrations/0005_rescheduled_slot_index.sql.
create unique index if not exists appointments_no_double_book
  on public.appointments (dentist_id, starts_at)
  where status in ('pending', 'confirmed', 'rescheduled');

-- ── Triggers ────────────────────────────────────────────────────────────────
-- Resolve FK ids from the denormalised slugs/names, and compute ends_at from
-- the service duration whenever starts_at changes (covers admin reschedule).
create or replace function public.appointments_resolve_and_compute()
returns trigger
language plpgsql
as $$
declare
  v_duration int;
begin
  -- Resolve service
  if new.service_id is null and new.service_slug is not null then
    select id into new.service_id from public.services where slug = new.service_slug;
  end if;

  -- Resolve dentist (by name within the resolved/known location when possible)
  if new.dentist_id is null and new.dentist_name is not null then
    select id into new.dentist_id from public.dentists where name = new.dentist_name limit 1;
  end if;

  -- Resolve location
  if new.location_id is null and new.location_city is not null then
    select id into new.location_id from public.locations where city = new.location_city limit 1;
  end if;

  -- Compute ends_at from the service duration when missing or when starts_at moved
  if new.ends_at is null
     or (tg_op = 'UPDATE' and new.starts_at is distinct from old.starts_at) then
    select duration_minutes into v_duration from public.services where id = new.service_id;
    new.ends_at := new.starts_at + make_interval(mins => coalesce(v_duration, 30));
  end if;

  return new;
end;
$$;

drop trigger if exists trg_appointments_resolve on public.appointments;
create trigger trg_appointments_resolve
  before insert or update on public.appointments
  for each row execute function public.appointments_resolve_and_compute();

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table public.locations            enable row level security;
alter table public.services             enable row level security;
alter table public.dentists             enable row level security;
alter table public.dentist_services     enable row level security;
alter table public.dentist_availability enable row level security;
alter table public.appointments         enable row level security;

-- Catalogue is publicly readable (powers the booking site + dashboard pickers).
do $$
declare t text;
begin
  foreach t in array array[
    'locations','services','dentists','dentist_services','dentist_availability'
  ]
  loop
    execute format(
      'drop policy if exists "public read %1$s" on public.%1$s', t);
    execute format(
      'create policy "public read %1$s" on public.%1$s for select using (true)', t);
  end loop;
end$$;

-- Appointments:
--   • anon may INSERT (public booking) and SELECT nothing.
--   • authenticated staff may SELECT and UPDATE everything.
--   • nobody may DELETE — "cancel" sets status; the audit trail is preserved.
drop policy if exists "public create appointments" on public.appointments;
create policy "public create appointments"
  on public.appointments for insert
  to anon, authenticated
  with check (true);

drop policy if exists "staff read appointments" on public.appointments;
create policy "staff read appointments"
  on public.appointments for select
  to authenticated
  using (true);

drop policy if exists "staff update appointments" on public.appointments;
create policy "staff update appointments"
  on public.appointments for update
  to authenticated
  using (true)
  with check (true);
-- (No DELETE policy by design — PRD §6.3.)
