-- ============================================================================
-- 0006_patient_confirmation.sql — patient self-service confirm / reschedule
-- ----------------------------------------------------------------------------
-- Safe to run after 0005. Idempotent.
--
-- Closes the reschedule loop: after an admin reschedules, the patient gets an
-- email with two actions — "this time works" (auto-confirm) and "pick another
-- time" (self-reschedule onto a genuinely open slot). Both are driven from
-- un-authenticated public pages.
--
-- Security model: appointments RLS gives `anon` INSERT only (no SELECT/UPDATE)
-- and the app never uses the service-role key. The public flow therefore goes
-- exclusively through the SECURITY DEFINER functions below, each of which is
-- gated by an unguessable, time-limited `confirmation_token`. They are the only
-- way an anonymous caller can read or mutate a single appointment row.
-- ============================================================================

-- ── Columns ──────────────────────────────────────────────────────────────────
alter table public.appointments
  add column if not exists confirmation_token   uuid,
  add column if not exists token_expires_at      timestamptz,
  add column if not exists patient_response       text
    check (patient_response in ('confirmed', 'self_rescheduled')),
  add column if not exists patient_responded_at   timestamptz;

-- The token is the bearer secret for the public links — must be unique.
create unique index if not exists appointments_confirmation_token_idx
  on public.appointments (confirmation_token)
  where confirmation_token is not null;

-- ── Public read (token-scoped) ───────────────────────────────────────────────
-- Returns a minimal projection for exactly the row matching the token, plus an
-- `expired` flag and the resolved service duration. Never more than one row.
create or replace function public.appt_public_get(p_token uuid)
returns table (
  id                uuid,
  patient_name      text,
  service_slug      text,
  dentist_name      text,
  dentist_id        uuid,
  location_city     text,
  starts_at         timestamptz,
  ends_at           timestamptz,
  status            appointment_status,
  patient_response  text,
  duration_minutes  int,
  expired           boolean
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    a.id,
    a.patient_name,
    a.service_slug,
    a.dentist_name,
    a.dentist_id,
    a.location_city,
    a.starts_at,
    a.ends_at,
    a.status,
    a.patient_response,
    coalesce(
      s.duration_minutes,
      round(extract(epoch from (a.ends_at - a.starts_at)) / 60)::int
    ) as duration_minutes,
    (a.token_expires_at is not null and a.token_expires_at <= now()) as expired
  from public.appointments a
  left join public.services s on s.id = a.service_id
  where a.confirmation_token = p_token;
$$;

-- ── Patient confirms the rescheduled time ───────────────────────────────────-
-- Idempotent: only flips status while the appointment is still actionable and
-- the token is unexpired; otherwise returns the row unchanged so the caller can
-- inspect status. Returns zero rows for an unknown token.
create or replace function public.appt_confirm(p_token uuid)
returns setof public.appointments
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v public.appointments;
begin
  select * into v
    from public.appointments
   where confirmation_token = p_token
   for update;

  if not found then
    return; -- zero rows → caller responds 404
  end if;

  if (v.token_expires_at is null or v.token_expires_at > now())
     and v.status in ('pending', 'rescheduled', 'confirmed') then
    update public.appointments
       set status               = 'confirmed',
           patient_response     = 'confirmed',
           patient_responded_at = now()
     where id = v.id
     returning * into v;
  end if;

  return next v;
end;
$$;

-- ── Patient picks a new slot themselves ─────────────────────────────────────-
-- Enforces the security-critical invariants: valid unexpired token, actionable
-- status, not in the past, and no double-book (the partial unique index
-- `appointments_no_double_book` surfaces as SQLSTATE 23505). Business-hours
-- availability is enforced by the calling route (TS), which generates the
-- offered slots in CLINIC_TIMEZONE — the single zone the rest of the app uses —
-- and rejects any requested instant that isn't one of them. Auto-confirms onto
-- the new time; `ends_at` is recomputed by the trg_appointments_resolve trigger.
create or replace function public.appt_self_reschedule(
  p_token     uuid,
  p_starts_at timestamptz
)
returns setof public.appointments
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v public.appointments;
begin
  select * into v
    from public.appointments
   where confirmation_token = p_token
   for update;

  if not found then
    return; -- zero rows → 404
  end if;

  -- Expired token or non-actionable status → return unchanged for inspection.
  if (v.token_expires_at is not null and v.token_expires_at <= now())
     or v.status not in ('pending', 'rescheduled', 'confirmed') then
    return next v;
    return;
  end if;

  if p_starts_at <= now() then
    raise exception 'slot_in_past' using errcode = 'check_violation';
  end if;

  update public.appointments
     set starts_at            = p_starts_at,
         status               = 'confirmed',
         patient_response     = 'self_rescheduled',
         patient_responded_at = now(),
         token_expires_at     = p_starts_at  -- keep the link valid until the new time
   where id = v.id
   returning * into v;  -- may raise 23505 on a concurrent double-book

  return next v;
end;
$$;

-- ── Busy intervals for the token's dentist ──────────────────────────────────-
-- Lets the public slot generator subtract booked times without granting anon a
-- SELECT on appointments. Exposes only [starts_at, ends_at) blocks (no PII).
create or replace function public.appt_busy_intervals(
  p_token uuid,
  p_from  timestamptz,
  p_to    timestamptz
)
returns table (starts_at timestamptz, ends_at timestamptz)
language sql
security definer
set search_path = public, pg_temp
as $$
  select a.starts_at, a.ends_at
    from public.appointments a
   where a.dentist_id = (
           select dentist_id
             from public.appointments
            where confirmation_token = p_token
         )
     and a.status in ('pending', 'confirmed', 'rescheduled')
     and a.starts_at < p_to
     and a.ends_at   > p_from;
$$;

-- ── Grants ───────────────────────────────────────────────────────────────────
-- The public flow runs as the anon role (no user session); authority comes from
-- the token argument validated inside each definer function above.
grant execute on function public.appt_public_get(uuid)                          to anon, authenticated;
grant execute on function public.appt_confirm(uuid)                             to anon, authenticated;
grant execute on function public.appt_self_reschedule(uuid, timestamptz)        to anon, authenticated;
grant execute on function public.appt_busy_intervals(uuid, timestamptz, timestamptz) to anon, authenticated;
