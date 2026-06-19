-- ============================================================================
-- 0002_admin.sql — additive changes for the admin dashboard (PRD §8)
-- Safe to run after supabase/schema.sql. Idempotent.
-- NOTE: the 'no_show' enum value is added separately in 0003 (Postgres cannot
-- add an enum value and use it in the same transaction).
-- ============================================================================

-- 8.1 Staff notes — lightweight audit trail + cancellation reason.
alter table public.appointments
  add column if not exists staff_notes text;

-- 8.2 Waitlist
create table if not exists public.waitlist (
  id             uuid primary key default gen_random_uuid(),
  service_slug   text not null,
  dentist_name   text,                       -- null = any dentist
  location_city  text not null,
  preferred_from timestamptz,                -- earliest acceptable
  preferred_to   timestamptz,               -- latest acceptable
  patient_name   text not null,
  patient_email  text not null,
  patient_phone  text not null,
  notes          text,
  status         text not null default 'waiting'
                 check (status in ('waiting','offered','booked','expired')),
  created_at     timestamptz not null default now()
);

create index if not exists waitlist_status_idx on public.waitlist (status);

alter table public.waitlist enable row level security;

drop policy if exists "staff manage waitlist" on public.waitlist;
create policy "staff manage waitlist"
  on public.waitlist for all
  to authenticated
  using (true)
  with check (true);
-- (Optional later: allow anon to self-add to the waitlist from the public site.)

-- 8.4 Reporting convenience view. Views inherit the RLS of their base table,
-- so only authenticated staff can read it (appointments has no anon SELECT).
create or replace view public.appointment_stats
with (security_invoker = true) as
select
  date_trunc('day', starts_at) as day,
  status,
  service_slug,
  dentist_name,
  count(*) as total
from public.appointments
group by 1, 2, 3, 4;
