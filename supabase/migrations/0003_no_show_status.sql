-- ============================================================================
-- 0003_no_show_status.sql — add the 'no_show' appointment status (PRD §8.3)
-- ----------------------------------------------------------------------------
-- Must run as its OWN migration step, BEFORE any code/migration that uses the
-- value. `ALTER TYPE ... ADD VALUE` cannot run in the same transaction as
-- statements that use the new value, and cannot be undone. Most migration
-- runners wrap each file in a transaction; if yours does, run this statement
-- outside a transaction (e.g. psql with --single-transaction disabled, or the
-- Supabase SQL editor which auto-commits).
-- ============================================================================

alter type appointment_status add value if not exists 'no_show';
