# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Architecture

This app follows `ARCHITECTURE.md` (written for Nuxt/Vue), adapted to Next 16 + React + Supabase. Read it first; the notes below cover only where the port differs.

## Where things live

| Concern | Path |
| --- | --- |
| Design tokens (palette reset, ramps, radius, breakpoints) | `app/globals.css` |
| Component library (`N*` parts, CVA `*-variants.ts`) | `components/n/` (barrel: `@/components/n`) |
| `cn` | `lib/utils/cn.ts` |
| Icon map (Phosphor `/ssr`) | `lib/utils/icons.ts` → `<NIcon name="…" />` |
| Status registry / resolver / tones | `lib/utils/status/` → `<NStatus status kind />` |
| Display dates (one zone, one time pattern) | `lib/utils/date-formatters.ts` |
| API envelope + `unwrapApiResponse` | `lib/utils/api-envelope.ts` |
| TanStack provider + shared key roots | `lib/query/` |
| Shared domain (status transitions, audit line) | `lib/appointments.ts` |
| Clinic wall-clock ↔ UTC conversion | `lib/scheduling.ts` |
| Feature slices | `features/<area>/<slice>/` |

## Rules that bite

- `--color-*: initial` — stock Tailwind colours (`bg-white`, `text-gray-500`) render **nothing**. Use `base-*`, `accent-*`, `green-*`, `red-*`, `yellow-*`, `flow-*`.
- Never format a date at a call site (`toLocaleTimeString`, `h:mm a`). Use `date-formatters`. `CLINIC_TIMEZONE` is inlined into client bundles by `next.config.ts` `env`.
- Statuses reach the screen only through `<NStatus>`; new backend spellings go in the alias table in `lib/utils/status/resolver.ts`.
- Admin API routes answer with the `ApiResponse` envelope (`apiOk` / `apiFail`). Client write calls go through `unwrapApiResponse`, which throws on `status: false`.
- `<NButton asChild>` wraps a plain `next/link` `<Link>`, not `<NLink>` (Slot concatenates classes).
- Error boundaries receive `unstable_retry`, not `reset` (Next 16).

## Slices (React/Next mapping)

```
domain/          pure types, rules, route paths
ports/           interfaces (*-service.port.ts, *-query.port.ts)
adapters/        TanStack implementations of query ports
application/     use cases / screen hooks taking a deps bag — no router, no fetch
composition/     the swap point: get-*.ts (server roots), use-*.ts (client roots), *.action.ts (server actions)
infrastructure/  services/*-adapter.ts (Supabase / HTTP), transformers/, query-keys.ts
ui/<prefix>-<slice>/  index.tsx (feature root) + presentational parts
index.ts         barrel: domain, query keys, port *types* only
```

- No auto-registration: import feature roots explicitly from `features/…/ui/<prefix>-<slice>`. Pages stay thin and only mount a root.
- Server-rendered screens (queue, detail) have no query port — the Server Component request is the cache unit, and filters live in the URL.
- Client-fetched screens (reports) use TanStack with `keepPreviousData`. Query ports take plain values rather than thunks, because hooks re-run on every render. The **page** wraps these roots in `<NClientOnly>`, since no dehydration is configured.
- Mutations invalidate `ADMIN_APPOINTMENTS_ROOT` and call `router.refresh()`. Slice keys hang off that root.
- Server-only modules start with `import "server-only"`.
- Features don't import each other. The one shared slice is `features/appointments/actions`, mounted by the queue and detail screens. Cross-slice UI (e.g. the sign-out button on Settings) is composed in by the page through a slot prop.
- Prefixes: `aa-` appointment actions, `aq-` appointment queue, `ad-` appointment detail, `rp-` reports, `sh-` shell, `au-` auth, `ac-` account.

## Verification loop

`npx tsc --noEmit` → `npx eslint .` → `npx next build`. There is no test suite; the `application/` use cases are pure over a deps bag if one is added.
