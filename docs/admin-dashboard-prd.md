# PRD — Admin Dashboard (Staff Console)

**Product:** DentistNearMe — Dental Booking Platform
**Document owner:** Engineering
**Status:** Draft v1 · 2026-06-13
**Related code:** `supabase/schema.sql`, `lib/supabase.ts`, `lib/email.ts`, `app/api/*`

---

## 1. Summary

The public site lets patients book appointments (4-step flow → `public.appointments`).
There is currently **no interface for clinic staff** to see or manage those bookings — the
schema already grants authenticated users full read/update on appointments, but nothing
consumes it.

This PRD specifies an **authenticated admin dashboard** at `/admin` where front-desk staff
and dentists can view, filter, confirm, reschedule, cancel, and complete appointments;
manage the waitlist; track no-shows; and see basic operational reporting.

### Goals

1. Give staff a single screen to triage today's and upcoming appointments.
2. Let staff change appointment status and details safely (no double-booking).
3. Surface the operational metrics the business cares about (no-show rate, popular
   services, busiest days).
4. Reuse existing infrastructure — Supabase (DB + Auth), Resend (email), the Next.js
   App Router, and the Tailwind design tokens — with zero new external services.

### Non-goals (this version)

- Billing / payments / insurance claim management.
- Patient-facing self-service reschedule (handled today via email links → staff action).
- Multi-tenant / multi-clinic org management beyond the existing `locations` rows.
- SMS (email only for now, via existing Resend integration).
- Editing the services / dentists / availability catalogue (read-only here; managed in
  Supabase directly for v1 — see §11 Future).

---

## 2. Users & roles

| Role | Who | Capabilities |
|------|-----|--------------|
| **Staff / Front desk** | Reception | Full appointment management, waitlist, reporting. Default role. |
| **Dentist** (optional v1.1) | Practitioners | Same as staff but dashboard defaults to *their own* appointments. |
| **Admin** (optional v1.1) | Practice owner | Everything + manage staff accounts. |

For **v1**, treat every authenticated user as **Staff** (single role). Roles are a v1.1
enhancement (see §7.3). Access is gated purely on "is the user logged in".

---

## 3. Tech stack & constraints

- **Framework:** Next.js 14 App Router (Server Components + Route Handlers), TypeScript strict.
- **Auth:** Supabase Auth (email + password). The dashboard runs **server-side with the
  user's session**, so existing RLS policies apply automatically — see §6.
- **DB:** Supabase Postgres. Schema in `supabase/schema.sql`. Do **not** use the
  service-role key in the dashboard; use the authenticated user session so RLS is enforced.
- **Styling:** Tailwind + existing brand tokens (`deep`, `teal`, `mint`, `cream`, `ink`).
- **Email:** Reuse `lib/email.ts` (Resend) for status-change notifications.
- **Hosting:** Vercel. Admin routes must be `dynamic` (never statically cached).

---

## 4. Data model (already in place)

From `supabase/schema.sql` — the dashboard reads/writes these. **No migration required for
v1 core**; the waitlist table (§8.2) is the one additive migration.

`public.appointments`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `service_id / dentist_id / location_id` | uuid FK | resolved by trigger on insert |
| `service_slug / dentist_name / location_city` | text | denormalised, display-ready |
| `starts_at` | timestamptz | |
| `ends_at` | timestamptz | computed from service duration |
| `status` | enum | `pending` → `confirmed` → `completed` / `cancelled` |
| `patient_name / patient_email / patient_phone` | text | |
| `notes` | text | patient-supplied |
| `reminder_sent_at` | timestamptz | set by reminder cron |
| `created_at` | timestamptz | |

Status lifecycle (enum `appointment_status`):

```
pending ──confirm──▶ confirmed ──complete──▶ completed
   │                     │
   └────── cancel ───────┴──▶ cancelled        (terminal)
                              no_show *         (* see §8.3 — added via migration)
```

Catalogue tables (read-only in dashboard): `locations`, `services`, `dentists`,
`dentist_services`, `dentist_availability`.

---

## 5. Information architecture / routes

```
/admin/login            Public — Supabase email+password sign-in
/admin                  Redirects → /admin/appointments
/admin/appointments     Main queue: filter + table/list of appointments
/admin/appointments/[id]  Detail drawer/page: full record + actions
/admin/calendar         Day/week calendar view by dentist (v1.1, optional)
/admin/waitlist         Waitlist management
/admin/reports          Operational metrics
/admin/settings         Profile + sign-out (catalogue mgmt is v1.1)
```

All `/admin/**` routes except `/admin/login` are protected by middleware (§6.2).

---

## 6. Authentication & authorization

### 6.1 Sign-in
- Use `@supabase/ssr` (or `@supabase/auth-helpers-nextjs`) so the Supabase session lives in
  cookies and is readable by Server Components + Route Handlers.
- `/admin/login`: email + password form → `supabase.auth.signInWithPassword`.
- **No public sign-up.** Staff accounts are created by an admin in the Supabase dashboard
  (Auth → Users) for v1. Document this in the README.

### 6.2 Route protection
- Add `middleware.ts` matching `/admin/:path*` (excluding `/admin/login`). If there is no
  valid session, redirect to `/admin/login?next=<path>`.
- Server Components additionally call `supabase.auth.getUser()` and redirect if null — never
  rely on middleware alone for data access.

### 6.3 RLS is the real guard
Existing policies already enforce the security model:
- `staff read appointments` — `for select to authenticated using (true)`
- `staff update appointments` — `for update to authenticated using (true) with check (true)`

⚠️ **Gaps to close with a migration** (`supabase/migrations/0002_admin.sql`):
- No **DELETE** policy → deletion is impossible by design. Keep it that way; "cancel" sets
  status, it does not delete. (Good — preserves audit trail.)
- Catalogue tables are readable; that's fine for the read-only pickers.
- If roles are introduced (§7.3), tighten policies to check a `staff` table / JWT claim.

---

## 7. Functional requirements

### 7.1 Appointments queue (`/admin/appointments`) — **P0**

**Display** a list/table of appointments with columns:
`Time` (date + start–end) · `Patient` (name, phone) · `Service` (+ duration) · `Dentist` ·
`Location` · `Status` (colored badge) · `Actions`.

**Default view:** today + upcoming, soonest first, excluding `cancelled`.

**Filters (combinable, reflected in URL query params):**
- Date range — quick chips: *Today*, *Tomorrow*, *This week*, *Custom*.
- Status — multi-select (`pending`, `confirmed`, `completed`, `cancelled`, `no_show`).
- Dentist — dropdown (from `dentists`).
- Location — dropdown (from `locations`).
- Search — free text over `patient_name` / `patient_email` / `patient_phone`.

**Sorting:** by `starts_at` (default asc), `created_at`, `status`.

**Pagination:** server-side, page size 25. Use Supabase `.range()`; show total count.

**Empty / loading / error states** required for each.

**Row actions** (status-dependent — see §7.2). Bulk-select is v1.1.

**Highlights:**
- Flag rows where the patient is a **returning patient** (same email seen in ≥1 prior
  completed appointment).
- Flag **unconfirmed** appointments starting within 24h (need attention).

### 7.2 Status management & rescheduling — **P0**

Allowed transitions and the action button shown:

| Current | Actions available |
|---------|-------------------|
| `pending` | **Confirm**, **Reschedule**, **Cancel** |
| `confirmed` | **Mark completed**, **Mark no-show**, **Reschedule**, **Cancel** |
| `completed` | (read-only) |
| `cancelled` | **Reopen** → back to `pending` (re-validates slot) |

- **Confirm:** `status = 'confirmed'`. Sends a confirmation email (optional, behind a
  "notify patient" checkbox, default on).
- **Cancel:** `status = 'cancelled'`, capture a **cancellation reason** (free text, stored
  in `notes` append or a new `staff_notes` column — see migration §8.1). Optionally email
  the patient. Frees the slot (the double-booking unique index only counts pending/confirmed,
  so a cancel automatically releases it).
- **Reschedule:** open a date/time picker reusing `lib/scheduling.ts` slot logic; on save,
  update `starts_at` (+ recompute `ends_at`). Must **re-check the double-booking guard** —
  catch unique-violation `23505` and surface "slot just taken", exactly like the public flow.
  Email the patient the new time.
- **No-show:** `status = 'no_show'` (enum value added in migration). Increments no-show
  metrics; counts toward the cancellation policy.

**Concurrency:** all writes go through a server Route Handler (`PATCH
/api/admin/appointments/[id]`) that performs the update under the user's session. Surface
the 23505 conflict. Use optimistic UI with rollback on error.

**Audit:** every status change appends a structured line to `staff_notes`
(`[2026-06-13 14:02 by jane@clinic] confirmed`) — lightweight audit without a separate table
for v1. (A proper `appointment_events` table is a v1.1 option.)

### 7.3 Roles (optional, v1.1) — **P2**
Introduce a `staff` table keyed by `auth.uid()` with a `role` column
(`staff | dentist | admin`) and a `dentist_id` link. Update RLS to read role from this table.
Dentist accounts default the queue filter to their own `dentist_id`.

### 7.4 Notifications — **P1**
- Reuse `lib/email.ts`. Add two templates: **reschedule notice** and **cancellation notice**
  (the booking-confirmation + reminder templates already exist).
- Each staff action that notifies the patient passes through the existing Resend client;
  failures are logged, never block the status change (match current booking behavior).

---

## 8. Schema changes (migration `0002_admin.sql`)

### 8.1 Staff notes (audit + cancellation reason)
```sql
alter table public.appointments
  add column if not exists staff_notes text;
```

### 8.2 Waitlist
```sql
create table if not exists public.waitlist (
  id            uuid primary key default gen_random_uuid(),
  service_slug  text not null,
  dentist_name  text,                       -- null = any dentist
  location_city text not null,
  preferred_from timestamptz,               -- earliest acceptable
  preferred_to   timestamptz,               -- latest acceptable
  patient_name  text not null,
  patient_email text not null,
  patient_phone text not null,
  notes         text,
  status        text not null default 'waiting'
                check (status in ('waiting','offered','booked','expired')),
  created_at    timestamptz not null default now()
);
alter table public.waitlist enable row level security;
create policy "staff manage waitlist" on public.waitlist
  for all to authenticated using (true) with check (true);
-- (Optional) allow anon to self-add to the waitlist from the public site later.
```

### 8.3 No-show status
Postgres enums can't easily add values inside a transaction with other DDL; run separately:
```sql
alter type appointment_status add value if not exists 'no_show';
```
> Note: `add value` cannot run in the same transaction as statements that use the new value,
> and cannot be undone. Run it as its own migration step, then deploy code that uses it.

### 8.4 Reporting view (optional convenience)
```sql
create or replace view public.appointment_stats as
select
  date_trunc('day', starts_at) as day,
  status,
  service_slug,
  dentist_name,
  count(*) as total
from public.appointments
group by 1,2,3,4;
-- expose to authenticated only; views inherit RLS of base tables.
```

---

## 9. Waitlist (`/admin/waitlist`) — **P1**

- List `waiting` entries with patient + preferences.
- When an appointment is **cancelled**, prompt staff: *"Offer this slot to the waitlist?"* —
  show matching entries (same service/location, time within preferred window).
- **Offer** action emails the matched patient a booking link and sets entry → `offered`.
- Manual **mark booked / expired**.
- (v1.1) Auto-match + auto-email on cancellation.

---

## 10. Reporting (`/admin/reports`) — **P1**

Server-computed metrics over a selectable date range (default last 30 days):

- **Volume:** appointments per day (bar/line), total in range.
- **No-show rate:** `no_show / (completed + no_show)` %, trend over time.
- **Cancellation rate.**
- **Popular services:** count + % by `service_slug`.
- **Busiest days / hours:** heatmap or bar by weekday and hour.
- **Per-dentist load:** appointments by `dentist_name`.
- **New vs returning** patient split (by distinct `patient_email`).

Implement as a single Route Handler (`GET /api/admin/reports?from=&to=`) returning JSON, or
Server Component queries against the `appointment_stats` view. Keep charts dependency-light
(simple CSS/SVG bars are fine; only add a chart lib if justified).

---

## 11. API surface (Route Handlers)

All under `app/api/admin/**`, `runtime = "nodejs"`, `dynamic = "force-dynamic"`, and they
**must** verify `supabase.auth.getUser()` and operate under the user session (RLS enforced).

| Method & path | Purpose |
|---------------|---------|
| `GET /api/admin/appointments` | Filtered, paginated list (query params per §7.1). |
| `GET /api/admin/appointments/[id]` | Single record. |
| `PATCH /api/admin/appointments/[id]` | Status change / reschedule / edit. Body: `{action, starts_at?, reason?, notify?}`. Returns 409 on slot conflict. |
| `GET /api/admin/waitlist` / `POST` / `PATCH /[id]` | Waitlist CRUD. |
| `GET /api/admin/reports` | Aggregated metrics for a date range. |

> Reads can also be done directly in Server Components via the Supabase server client;
> Route Handlers are mainly for mutations and for the report JSON. Pick one pattern and be
> consistent — recommended: **Server Components for reads, Route Handlers for writes.**

---

## 12. UX & design

- Match the public brand: tokens `deep/teal/mint/cream/ink`, Plus Jakarta Sans, rounded
  cards, the same focus-ring + `aria-*` accessibility standard already used in `BookingForm`.
- **Layout:** left sidebar nav (Appointments · Waitlist · Reports · Settings) + top bar with
  clinic/location switcher and the signed-in user. Collapses to a bottom tab bar on mobile —
  staff use phones too.
- **Status badges:** `pending` amber · `confirmed` teal · `completed` green/deep ·
  `cancelled` gray · `no_show` red.
- **Appointment detail:** a slide-over drawer on desktop, full page on mobile, showing all
  fields, the `staff_notes` audit trail, and contextual action buttons.
- Respect `prefers-reduced-motion` (consistent with existing Framer Motion usage).
- Every destructive action (cancel, no-show) requires a confirm step.

---

## 13. Non-functional requirements

- **Security:** no service-role key in client/admin bundle; all data access RLS-enforced;
  admin routes never cached; CSRF-safe (Supabase cookie auth + same-site).
- **Performance:** queue query < 300ms typical; indexed on `starts_at` (exists) and
  `patient_email` (exists). Paginate; never `select *` without limit.
- **Reliability:** email failures never block a DB write (match booking flow).
- **Accessibility:** WCAG AA — keyboard nav, visible focus, labelled controls, color-contrast
  on badges.
- **Observability:** `console.error` on failed mutations/emails with appointment id.
- **Privacy/compliance:** patient health-adjacent data — restrict to authenticated staff,
  no analytics on PII, align with NDPR/GDPR notes in the project's compliance considerations.

---

## 14. Acceptance criteria (P0 — must ship)

1. An un-authenticated visit to any `/admin/**` route (except login) redirects to
   `/admin/login`.
2. A staff member can sign in with a Supabase-created account and reach `/admin/appointments`.
3. The queue lists real appointments from the database, defaulting to today + upcoming,
   with working status / dentist / date filters and patient search.
4. Staff can **confirm**, **cancel**, **reschedule**, **mark completed**, and **mark no-show**
   an appointment; the change persists and the badge updates.
5. Rescheduling into an already-booked dentist slot is rejected with a clear "slot taken"
   message (no double-booking created).
6. Cancelling frees the slot and (when "notify patient" is checked) sends a cancellation email
   via Resend.
7. All admin data access is enforced by RLS under the user session (verified: signing out
   and calling the API returns 401/redirect).

### P1 (fast-follow)
Waitlist screen + offer-on-cancellation prompt; reports page with no-show rate, popular
services, busiest days; reschedule/cancellation email templates.

### P2 (later)
Roles (staff/dentist/admin), calendar view, catalogue management, bulk actions, full
`appointment_events` audit table, SMS.

---

## 15. Build order (suggested)

1. **Auth scaffold** — `@supabase/ssr` server client, `middleware.ts`, `/admin/login`,
   sign-out. *(Foundation for everything.)*
2. **Migration `0002_admin.sql`** — `staff_notes`, `no_show` enum value, waitlist table.
3. **Appointments queue** (read) — Server Component list + filters + pagination.
4. **Mutations** — `PATCH /api/admin/appointments/[id]` with the transition rules + 23505
   handling; wire row/detail actions.
5. **Email templates** — reschedule + cancellation in `lib/email.ts`; hook into mutations.
6. **Waitlist** screen + offer-on-cancel.
7. **Reports** view/endpoint.
8. **Polish** — empty/loading/error states, mobile nav, a11y pass.

---

## 16. Open questions

- Which **timezone** do staff operate in per location? Emails use `CLINIC_TIMEZONE`; the
  dashboard should render times in the location's local zone (NY/LA/Chicago differ). Decide:
  single configured tz vs. per-location tz.
- **Cancellation policy** specifics (cutoff window, fee) — needed before enforcing no-show
  consequences.
- Staff account provisioning: Supabase dashboard only (v1) vs. an in-app invite flow (v1.1)?
- Do dentists get their own logins in v1.1, or is it staff-only indefinitely?
```
