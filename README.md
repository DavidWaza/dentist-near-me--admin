# DentistNearMe — Admin Dashboard (Staff Console)

Authenticated staff console for managing dental appointments, built per
`docs/admin-dashboard-prd.md`. Next.js 16 (App Router) · React 19 · Tailwind v4 ·
Supabase (DB + Auth, RLS-enforced) · Resend (email).

> **Note on stack:** the PRD references "Next.js 14" and existing booking-site
> infrastructure. This repo was a fresh scaffold, so the supporting backend
> (schema, Supabase/email/scheduling libs) is bootstrapped here, and the code
> targets the **Next.js 16** conventions actually installed (e.g. `proxy.ts`
> instead of `middleware.ts`, async `params`/`searchParams`).

## 1. Setup

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Open http://localhost:3000 → **Go to staff console** → `/admin/login`.

### Environment variables (`.env.local`)

| Var | Required | Purpose |
|-----|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase **anon** key (never the service-role key) |
| `RESEND_API_KEY` | ➖ | Resend key. If unset, emails are logged to the console instead of sent. |
| `RESEND_FROM_EMAIL` or `EMAIL_FROM` | ➖ | Verified sender, e.g. `DentistNearMe <appts@clinic.com>` |
| `RESEND_SANDBOX_TO` | ➖ | **Required for local dev** with `onboarding@resend.dev` — Resend only delivers to this inbox until your domain is verified. |
| `CLINIC_TIMEZONE` | ➖ | IANA zone the dashboard renders times in (default `America/New_York`) |
| `NEXT_PUBLIC_SITE_URL` | ➖ | Public booking URL used in emails |

## 2. Database

Apply, in order, against your Supabase project (SQL editor or `psql`):

1. `supabase/schema.sql` — base tables, RLS, triggers, double-booking index.
2. `supabase/migrations/0002_admin.sql` — `staff_notes`, `waitlist`, stats view.
3. `supabase/migrations/0003_no_show_status.sql` — adds the `no_show` enum value
   (**run on its own**, outside a transaction — see the file header).
4. `supabase/migrations/0004_rescheduled_status.sql` — adds the `rescheduled` enum
   value (**required for reschedule** — run on its own, same rules as 0003).
5. `supabase/migrations/0005_rescheduled_slot_index.sql` — includes `rescheduled`
   in the double-booking index (run after 0004).
6. `supabase/seed.sql` — *optional* sample data for local development.

> **Reschedule returns 500?** You skipped step 4. Run
> `supabase/migrations/RUN_RESCHEDULED_MIGRATION.sql` in the Supabase SQL editor.

The dashboard runs under the **signed-in user's session**, so all access is
governed by RLS. The service-role key is never used.

## 3. Staff accounts (no public sign-up)

Create accounts in **Supabase → Authentication → Users → Add user** (email +
password). There is intentionally no self-service sign-up. Roles
(staff/dentist/admin) are a v1.1 enhancement; v1 treats every authenticated user
as staff.

## 4. What's implemented (P0)

- **Auth**: `proxy.ts` gates `/admin/**` (except `/admin/login`); Server
  Components re-verify with `getUser()`; email+password sign-in; sign-out.
- **Appointments queue** (`/admin/appointments`): server-side filtering (date
  chips, status multi-select, dentist, location, patient search), sorting,
  pagination (25/page with total count), returning-patient & "needs attention"
  (unconfirmed < 24h) flags, empty/loading/error states.
- **Status management**: confirm · reschedule · cancel · mark completed ·
  mark no-show · reopen, with server-validated transitions, double-booking
  conflict handling (HTTP 409), a `staff_notes` audit trail, and patient email
  notifications via Resend. Destructive actions require a confirm step.
- **Detail page** (`/admin/appointments/[id]`): full record + audit trail.
- **Settings**: profile + sign-out.

Waitlist and Reports are scaffolded (schema + nav) and land in the P1
fast-follow.

## 5. API

| Method & path | Purpose |
|---------------|---------|
| `GET /api/admin/reports?from=&to=` | Live metrics (completed, rescheduled, cancelled, no-show) |
| `GET /api/admin/appointments/[id]` | Single record (auth required) |
| `PATCH /api/admin/appointments/[id]` | `{ action, starts_at?, reason?, notify? }` — status change / reschedule. Returns `409` on slot conflict, `401` when signed out. |

Reads for the queue are done directly in Server Components; mutations go through
the Route Handler (reads = RSC, writes = handlers).

## 6. Notes / decisions

- **Timezone (PRD §16):** v1 uses a single clinic-wide `CLINIC_TIMEZONE`.
  Reschedule times are entered as clinic wall-clock and converted to UTC on the
  server, so the browser timezone never matters.
- **Mutations** use a pending state + `router.refresh()` to reconcile with
  server truth (the badge always matches the DB), and surface errors inline
  rather than risk an optimistic/DB divergence.
- **Email failures never block a DB write** (matches the booking flow).
