-- ============================================================================
-- Run in Supabase → SQL Editor (two steps — do NOT wrap in a transaction)
-- ============================================================================
--
-- STEP 1 — paste and run this alone, then click Run:
--
alter type appointment_status add value if not exists 'rescheduled';
--
-- STEP 2 — after step 1 succeeds, paste and run this:
--
drop index if exists public.appointments_no_double_book;

create unique index appointments_no_double_book
  on public.appointments (dentist_id, starts_at)
  where status in ('pending', 'confirmed', 'rescheduled');
