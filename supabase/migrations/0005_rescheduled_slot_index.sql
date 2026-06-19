-- ============================================================================
-- 0005_rescheduled_slot_index.sql — rescheduled appointments still hold a slot
-- ----------------------------------------------------------------------------
-- Run AFTER 0004_rescheduled_status.sql.
-- ============================================================================

drop index if exists public.appointments_no_double_book;

create unique index appointments_no_double_book
  on public.appointments (dentist_id, starts_at)
  where status in ('pending', 'confirmed', 'rescheduled');
