-- ============================================================================
-- 0004_rescheduled_status.sql — add the 'rescheduled' appointment status
-- ----------------------------------------------------------------------------
-- Run as its OWN step (same rules as 0003_no_show_status.sql).
-- ============================================================================

alter type appointment_status add value if not exists 'rescheduled';
