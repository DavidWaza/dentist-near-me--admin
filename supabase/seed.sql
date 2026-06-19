-- ============================================================================
-- seed.sql — optional sample data for local development / demos.
-- Run AFTER schema.sql + all migrations. Safe to re-run (uses fixed UUIDs).
-- Appointment times are relative to now() so the default "today + upcoming"
-- queue always has rows to show.
-- ============================================================================

insert into public.locations (id, city, name, address, timezone) values
  ('11111111-1111-1111-1111-111111111111', 'New York',   'Midtown Dental',   '500 5th Ave, New York, NY',   'America/New_York'),
  ('22222222-2222-2222-2222-222222222222', 'Chicago',    'Loop Dental Care', '120 N LaSalle St, Chicago, IL','America/Chicago')
on conflict (id) do nothing;

insert into public.services (id, slug, name, duration_minutes) values
  ('aaaaaaa1-0000-0000-0000-000000000001', 'cleaning',     'Routine Cleaning',  30),
  ('aaaaaaa1-0000-0000-0000-000000000002', 'checkup',      'Exam & Checkup',    45),
  ('aaaaaaa1-0000-0000-0000-000000000003', 'whitening',    'Teeth Whitening',   60),
  ('aaaaaaa1-0000-0000-0000-000000000004', 'root-canal',   'Root Canal',        90)
on conflict (id) do nothing;

insert into public.dentists (id, name, location_id) values
  ('bbbbbbb1-0000-0000-0000-000000000001', 'Dr. Amara Okafor', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbb1-0000-0000-0000-000000000002', 'Dr. Liam Chen',    '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbb1-0000-0000-0000-000000000003', 'Dr. Sofia Rossi',  '22222222-2222-2222-2222-222222222222')
on conflict (id) do nothing;

-- A spread of appointments around "now" so filters/flags are demonstrable.
insert into public.appointments
  (id, service_slug, dentist_name, location_city, starts_at, ends_at, status,
   patient_name, patient_email, patient_phone, notes, created_at)
values
  -- Unconfirmed, starting within 24h → "needs attention" flag
  ('cccccccc-0000-0000-0000-000000000001', 'cleaning', 'Dr. Amara Okafor', 'New York',
   now() + interval '3 hours', now() + interval '3 hours 30 minutes', 'pending',
   'Jordan Blake', 'jordan.blake@example.com', '+1 212 555 0101', 'First visit', now() - interval '1 day'),

  ('cccccccc-0000-0000-0000-000000000002', 'checkup', 'Dr. Liam Chen', 'New York',
   now() + interval '1 day 2 hours', now() + interval '1 day 2 hours 45 minutes', 'confirmed',
   'Priya Nair', 'priya.nair@example.com', '+1 212 555 0102', null, now() - interval '2 days'),

  ('cccccccc-0000-0000-0000-000000000003', 'whitening', 'Dr. Sofia Rossi', 'Chicago',
   now() + interval '4 hours', now() + interval '5 hours', 'confirmed',
   'Marcus Webb', 'marcus.webb@example.com', '+1 312 555 0103', null, now() - interval '5 days'),

  -- A completed past appointment for "marcus.webb" → returning-patient flag
  ('cccccccc-0000-0000-0000-000000000004', 'cleaning', 'Dr. Sofia Rossi', 'Chicago',
   now() - interval '40 days', now() - interval '40 days' + interval '30 minutes', 'completed',
   'Marcus Webb', 'marcus.webb@example.com', '+1 312 555 0103', null, now() - interval '45 days'),

  ('cccccccc-0000-0000-0000-000000000005', 'root-canal', 'Dr. Amara Okafor', 'New York',
   now() + interval '2 days 5 hours', now() + interval '2 days 6 hours 30 minutes', 'pending',
   'Elena Duarte', 'elena.duarte@example.com', '+1 212 555 0105', 'Anxious patient', now() - interval '3 hours'),

  ('cccccccc-0000-0000-0000-000000000006', 'checkup', 'Dr. Liam Chen', 'New York',
   now() - interval '2 days', now() - interval '2 days' + interval '45 minutes', 'no_show',
   'Tom Hardy', 'tom.hardy@example.com', '+1 212 555 0106', null, now() - interval '6 days')
on conflict (id) do nothing;
