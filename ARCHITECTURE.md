# Design System & Architecture Blueprint

How this dashboard is built, written so it can be rebuilt. Everything here is
taken from the running codebase, not from an idealised version of it — including
the parts that are awkward and the parts you should deliberately not copy.

**Audience.** Two readers. A developer standing up a new dashboard who wants the
same bones, and a technical lead who wants to understand what decisions were
made and why before approving them for a second project.

**How to use it.** Part I is the design system (tokens, components, the visual
rules). Part II is the application architecture (data flow, slices, routing,
HTTP). Part III is an ordered bootstrap checklist for a new project. Part IV is
the list of things that will bite you. Read I and II for understanding; work
from III when you actually start.

---

## The stack

Versions are the ones this project runs, from `package.json`.

| Concern           | Choice                                                     |
| ----------------- | ---------------------------------------------------------- |
| Framework         | Nuxt `^4.5.1` (SPA-style, SSR on but no query dehydration)  |
| UI                | Vue `^3.5.40`, `<script setup lang="ts">` everywhere        |
| Language          | TypeScript `^6.0.3`, `vue-tsc` via `nuxt typecheck`         |
| Styling           | Tailwind CSS `^4.3.3` (CSS-first `@theme`), CVA `^0.7.1`    |
| Component base    | Reka UI `^2.10.1` (headless), Vuetify `^4.1.5` (overlays)   |
| Server data       | TanStack Vue Query `^5.101.4` via `@peterbud/nuxt-query`    |
| Client state      | Pinia `^4.0.2` + `pinia-plugin-persistedstate`              |
| HTTP              | axios `^1.18.1` behind a Nitro same-origin proxy            |
| Auth              | `@sidebase/nuxt-auth` `^1.1.0`, local provider, manual gate |
| Forms             | vee-validate `^4.15.1` + yup `^1.7.1`                       |
| Tables            | TanStack Vue Table `^8.21.3`                                |
| Icons             | Phosphor `^2.2.1`, via a name→component map                 |
| Dates             | Luxon `^3.7.2`, one display zone                            |
| Charts            | ECharts `^6.1.0` + `vue-echarts`                            |
| Toasts            | Notivue `^2.4.5`                                            |
| Lint / format     | oxlint + oxfmt (Oxc), knip for dead code                    |

Two deliberate oddities worth knowing up front: `xlsx` is installed from a
SheetJS CDN tarball rather than from the npm registry, and a
handful of packages are exact-pinned with no `^` — `@formkit/auto-animate`,
`@vee-validate/nuxt`, `vuetify-nuxt-module`, `@pinia/nuxt`. An exact pin in this
repo means a later version broke something. Treat changing one as a decision,
not maintenance.

---

# Part I — The design system

## 1. The governing idea: composition over configuration

A component in the library is **a set of small parts a screen arranges**, not
one part with a prop for every arrangement.

```
Wrong                                Right
<NCard                               <NCard>
  title="Filings"                      <NCardHeader>
  description="All filings"              <NCardTitle>Filings</NCardTitle>
  :show-footer="true"                    <NCardDescription>All filings</NCardDescription>
  footer-align="right"                 </NCardHeader>
/>                                     <NCardContent>…</NCardContent>
                                       <NCardFooter class="justify-end">…</NCardFooter>
                                     </NCard>
```

The rule for deciding:

- **Reach for a prop** when it changes one part's own appearance — `size`,
  `variant`, `color`.
- **Reach for a new part** when it changes what the thing is made of.
- **A boolean that swaps out a chunk of template is the smell this avoids.**
  `:show-footer` is a footer part that hasn't been extracted yet.

Where the common case deserves a single tag, add an *assembled default* built
from the same parts — this project has `NCalendarV2` and `NRangeCalendar` — but
keep the parts exported, so a screen needing a different arrangement composes
rather than waiting for a new prop.

`n/calendar/` is the reference implementation: `cell`, `cell-trigger`, `grid`,
`grid-row`, `head-cell`. Each part wraps one Reka primitive, styles it, forwards
the rest, and accepts a `class`.

## 2. Tokens: one CSS file is the design system's source of truth

Tailwind v4 is configured in CSS, not in `tailwind.config.ts`. The entry file is
`app/assets/css/tailwind.css`.

### 2.1 The palette reset

```css
@theme inline {
  --color-*: initial;          /* ← wipes every Tailwind default colour */
  --color-base-900: var(--base-900);
  --color-accent-500: var(--accent-500);
  /* …only what the design system defines… */
}
```

`--color-*: initial` deletes Tailwind's entire stock palette. **`bg-violet-500`,
`text-slate-700` and `bg-amber-50` render nothing at all** — no error, no
warning, just an element with no background. This is intentional: it makes it
impossible to quietly ship an off-palette colour. It is also the single most
common source of "why is my component invisible" in this codebase.

The same pattern resets breakpoints (`--breakpoint-*: initial`) so the six
Vuetify breakpoints are the only ones that exist.

### 2.2 The palette itself

Raw hex lives in `:root` under `@layer base`; `@theme inline` maps it to
Tailwind utilities. Five ramps plus a brand flow:

| Ramp      | Steps                          | Used for                      |
| --------- | ------------------------------ | ----------------------------- |
| `base`    | 0, 50, 100, 150, 400, 500, 550, 600, 900, 950 | Text, borders, surfaces |
| `accent`  | 50, 100, 150, 500, 600         | Primary actions, links        |
| `green`   | 50, 100, 150, 500, 600         | Success                       |
| `red`     | 50, 100, 150, 500, 600         | Destructive, errors           |
| `yellow`  | 50, 100, 150, 500, 600         | Warning, pending              |
| `flow-*`  | primary, secondary, s2–s6, stroke | Brand gradient / document chrome |

The step scale is deliberately not Tailwind's 50–950. Each ramp carries exactly
the five or so stops the design actually uses: `50` background, `100`/`150`
border, `500` solid, `600` hover. When you port this, keep the *shape* of the
ramp and change the hex — every CVA variant in the library is written against
those step names.

### 2.3 Radius and spacing

`--spacing: 0.25rem` (so `p-4` = 1rem) and a radius scale derived by arithmetic
from one `--radius` value:

```css
--radius-sm: calc(var(--radius) - 4px);
--radius-lg: var(--radius);
--radius-xl: calc(var(--radius) + 4px);
```

Change `--radius` once and the whole product's corner language moves with it.

## 3. The cascade-layer contract (Tailwind + Vuetify in one app)

This is the part most likely to break if you copy carelessly. Two styling
systems share one document, and the peace is kept entirely by explicit cascade
layers declared in `app/assets/css/layers.css`:

```css
@layer tailwind-theme;
@layer tailwind-reset;

@layer vuetify-core;
@layer vuetify-components;
@layer vuetify-overrides;
@layer vuetify-utilities;

@layer tailwind-utilities;   /* ← after Vuetify, so utilities win */

@layer vuetify-final;
```

Declaration order *is* priority order. Tailwind utilities are declared after
Vuetify's component styles, which is what lets `class="bg-accent-500"` override
a Vuetify component's own background without `!important`.

Three things must stay in lockstep or the app loses its styling:

1. **The first three `css` entries in `nuxt.config.ts`** — `layers.css`,
   `vuetify/styles`, `tailwind.css`, in that order. Add new stylesheets after.
2. **`vuetify-nuxt-module`'s position in the `modules` array.** Moving it breaks
   styles. The config carries a shouty comment saying so.
3. **The breakpoint values, defined in three places** —
   `tailwind.css` (`--breakpoint-*`), `app/vuetify.config.ts` (`display.thresholds`)
   and `app/assets/css/settings.scss` (`$grid-breakpoints`). They must agree.
   A gap between `md:hidden` and the sidebar provider's media query is a viewport
   where the mobile sheet has no trigger.

Vuetify is configured to contribute as little as possible:
`disableVuetifyStyles: true`, `$color-pack: false`, `$utilities: false`,
`theme.utilities: false`. It is there for overlay behaviour (dialogs, menus,
tooltips) — not for looks. Component-level adoption is done with CSS variables
in `app/assets/css/components/vuetify.css`.

**If you are starting fresh and don't need Vuetify's overlays, drop it.** Half
this complexity disappears: no layers file, no settings.scss, no module-order
hazard, no third copy of the breakpoints.

## 4. Component anatomy

### 4.1 A styled primitive: CVA + `cn`

Variants live in a sibling `*-variants.ts`, never inline in the template.

```ts
// app/components/n/button/button-variants.ts
export const buttonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg …",
  {
    variants: {
      color: { primary: "", secondary: "", destructive: "", success: "", … },
      variant: { solid: "", ghost: "", outline: "", link: "…" },
      size: { sm: "h-10 px-3.5 text-sm", default: "h-11 px-4", icon: "size-11", … },
    },
    compoundVariants: [
      { color: "primary", variant: "solid",
        class: "bg-accent-500 border-accent-500 text-base-0 hover:bg-accent-600" },
      …
    ],
  }
);
```

Note the shape: `color` and `variant` are declared with **empty strings** and the
actual classes live in `compoundVariants`. That is what lets `color` and
`variant` be genuinely orthogonal — seven colours × four variants without
twenty-eight named options.

Sizes are exhaustive by design (`4xs` through `xl`, plus an `icon-*` mirror of
each). Extracting the sibling file also means table column definitions and other
plain `.ts` can import the variants — impossible if they lived in the SFC.

### 4.2 A structural part: `cn` and class forwarding

```vue
<!-- app/components/n/card/NCard.vue -->
<template>
  <div
    data-slot="card"
    :class="cn('bg-base-0 text-base-900 flex flex-col gap-4 rounded-xl border py-6', props.class)"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
  import type { HTMLAttributes } from "vue";
  const props = defineProps<{ class?: HTMLAttributes["class"] }>();
</script>
```

Every part follows this four-part pattern:

1. **`data-slot="…"`** — a stable hook for descendant selectors. `NCardHeader`
   uses `has-data-[slot=card-action]:grid-cols-[1fr_auto]` to restructure itself
   when an action is present, with no prop and no JavaScript.
2. **`cn(defaults, props.class)`** — `twMerge(clsx(…))`. Later classes win
   *by Tailwind semantics*, so a caller passing `py-2` genuinely replaces the
   default `py-6` instead of colliding with it.
3. **`class` accepted as a real prop**, typed `HTMLAttributes["class"]`.
4. **A slot, not a content prop.**

Get `cn` from `app/utils/utils.ts`; it is the one helper every component needs.

### 4.3 Registration and naming

Components under `app/components/` auto-register. The library lives in
`app/components/n/` and is usable as `<NCard />` or `<n-card />`. The `N` prefix
marks "design system" and keeps library components visually distinct from
feature components in a template.

**Component resolution is compile-time only.** `<component :is="'SomeName'">`
with a *name string* silently renders an unknown element. Import the component
and bind the reference. Native tags as strings are fine.

## 5. The three cross-cutting systems

These are the parts that stop a dashboard drifting as it grows. All three follow
the same shape: **one registry, one resolver, one component** — never a `v-if`
chain at the call site.

### 5.1 Status rendering — `app/utils/status/`

Backends emit dozens of state strings. Screens must not each decide what they
look like.

| File          | Responsibility                                                    |
| ------------- | ----------------------------------------------------------------- |
| `types.ts`    | Canonical statuses, grouped by kind (`application`, `check`, `sla`, `stage`, `compliance`) |
| `registry.ts` | Canonical status → `{ label, icon, tone }`                         |
| `resolver.ts` | Raw backend string → canonical status, via an alias table          |
| `palette.ts`  | Tone name → `{ fg, bg, bd }`, plus variants and sizes              |
| `index.ts`    | The barrel everything imports                                     |

The resolver is what makes this survive contact with a real backend:

```ts
const GLOBAL_N_STATUS_ALIASES = {
  processing: "in_progress",
  debit_note_issued: "awaiting_payment",
  demand_notes_issued: "awaiting_payment",   // same thing, different spelling
  head_of_registry_checks: "registry_review",
  …
};
```

When a backend invents a new spelling, you add one alias line and every screen
updates. Without this layer the state arrives unrecognised and the UI reads
"Unknown" — which is exactly the bug the comments in that file document.

Tones are semantic, not colours: `neutral`, `info`, `pending`, `attention`,
`success`, `danger`, plus workflow-stage tones (`stage_registry`,
`stage_director`, `stage_dg`). A stage tone means "which desk holds this", so a
design change to that hue is one edit.

Call site: `<NStatus :status="row.appState" kind="stage" />`.

### 5.2 Icons — `app/utils/icons.ts`

A name→component map over Phosphor, so templates use semantic names
(`icon="pending"`, `icon="complete"`) rather than importing `PhHourglassHigh`.
Renaming the underlying icon is one map entry.

The same map is handed to Vuetify as a custom icon set in `app/plugins/icons.ts`
(`vuetify:before-create`), so Vuetify's internal chevrons and close buttons draw
from the same family. Vuetify's config declares `icons.defaultSet: "custom"` and
the plugin fills it in.

### 5.3 Dates — `app/utils/date-formatters.ts`

Luxon, with two invariants:

- **One display zone.** `APP_TIME_ZONE = "Africa/Lagos"`. Every formatter shifts
  into it.
- **One time pattern**, resolved *at call time* by `appTimePattern()` — 12-hour
  by default, 24-hour if the user switches it in settings.

The rule that follows: **never write `h:mm a`, `HH:mm` or a bare
`toLocaleTimeString` at a call site.** A pinned pattern is a screen the setting
cannot reach.

The second rule: **pass raw timestamps down to the component that prints them.**
A label built inside a transformer is frozen in whichever format was active when
the response landed, and TanStack caches it for five minutes.

`parseToLuxonDate` reconciles the two shapes a backend sends: a date-time with
no offset is UTC with the `Z` dropped; a bare `YYYY-MM-DD` is a calendar date
anchored in the display zone; anything with an offset is honoured as sent.

## 6. Tables

`app/components/n/data-table/` wraps TanStack Vue Table: `NDataTable`,
`NDataTableSearch`, `NDataTablePagination`, `NDataTableTopBar` and a skeleton.

Columns are defined in a sibling `table-columns.ts` as a **factory taking
handlers**:

```ts
export function createSurchargeFilingsColumns(
  handlers: TypeSurchargeFilingsColumnHandlers
): ColumnDef<TypeSurchargeFilings>[] { … }
```

A factory rather than a constant because cells need to navigate or open panels,
and the table exposes a single `cell` slot across all columns — overriding it
would mean one long `v-if` chain in the template. In a plain `.ts` file
auto-imports don't apply, so components are imported explicitly and cells are
built with `h()`.

---

# Part II — Application architecture

## 7. Two data layers, one direction of travel

The codebase holds a legacy layer and a target layer, and work migrates one page
at a time. Know which you're in.

```
app/infra/          ← legacy: shared pipeline, imported directly by pages
app/features/       ← target: self-contained hexagonal slices
```

New work goes in `app/features/`. Slices may reuse `~/infra` transformers and
API types, but **a slice needing a different projection of the same payload owns
its own narrow read model** rather than widening a shared DTO other screens read.

## 8. The infra pipeline

Five folders, one direction:

```
api/          raw backend response types (snake_case, mirrors the wire)
  ↓
transformers/ api → dto; null-handling, formatting, envelope helpers
  ↓
dto/          the shape the app wants (camelCase)
  ↓
services/     the actual fetch calls
  ↓
queries/      TanStack wrappers: loading, error, dedup, cache
```

This vocabulary is shared with PM and QA at this org, which is why release notes
name the layer. It is worth keeping for that reason alone: "the transformer
drops the field" and "the service calls the wrong endpoint" are different bug
reports, and a shared word for each shortens every conversation.

What each layer is *for*, as a debugging heuristic:

| Symptom                                    | Layer to open   |
| ------------------------------------------ | --------------- |
| Field blank, "Invalid Date", wrong format   | `transformers/` |
| 404 / 400 / wrong URL / missing param       | `services/`     |
| Stale data, no refetch, cache not clearing  | `queries/`      |
| TypeScript disagrees with the wire          | `api/`          |
| TypeScript disagrees with the component     | `dto/`          |

### 8.1 The response envelope — and its trap

Every endpoint answers with:

```ts
interface ApiResponse<T> {
  status: boolean;      // false = the operation failed; read `message`
  data: T;
  message?: string;
  meta?: PaginationMeta;
}
```

Helpers in `app/infra/transformers/response.helpers.ts` map it:
`transformApiResponse`, `transformPaginatedApiResponse`, `handleApiResponse`,
`handlePaginatedApiResponse`, `handleEmptyApiResponse`.

**The trap, and it is the single highest-value thing in this document:**
`status: false` arrives on an HTTP **200**. Nothing in the fetch layer throws for
it, no interceptor fires, no toast appears. A call site that asks only "did a
response come back?" reads a rejection as a success — the backend refuses the
user's file with a perfectly good explanation and the screen shows a green tick.

The fix is one helper, applied at every write call site:

```ts
// app/utils/api-envelope.ts
export function unwrapApiResponse<T>(
  res: ApiResponse<T> | undefined,
  fallback: string
): ApiResponse<T> {
  if (!res) throw new Error(fallback);                    // request never completed
  if (!res.status) throw new Error(res.message?.trim() || fallback);
  return res;
}
```

Throwing rather than returning a flag leaves each existing `catch` in charge of
presentation, and the toast layer already knows how to turn an `Error` into its
message. Build this on day one; retrofitting it means auditing every call site.

Also note: **a service returning `undefined` is not an API answer.** It means the
request never completed — network failure, cancellation, unreachable backend —
and is a different case from `status: false`.

### 8.2 Query parameters

`buildSearchParams` + `baseApiRequestSearchParamsPreset` build URLs from a
`RequestFilters` object and **drop every `undefined` key**. One shared preset
carries more keys than any single endpoint reads; each endpoint gets only what
it was given. This is why filter objects can be passed around freely without
each service hand-rolling its query string.

## 9. The feature slice

A slice is a vertical, self-contained feature: one screen or one tightly bound
pair. The canonical small example is
`app/features/officer/verification/queue` — read it before writing a new one.

```
domain/          pure entities, label/state maps, route paths, filter definitions
ports/           interfaces: *-service.port.ts (HTTP), *-query.port.ts (TanStack)
adapters/        query/mutation port implementations
application/     use cases taking a `deps` bag; framework-agnostic
composition/     use-<x>-deps.ts (wiring) + use-<x>.ts (root); auto-imported
infrastructure/  query keys, services/*-service-adapter.ts, transformers/
ui/<prefix>-<slice>/   index.vue + presentational children
index.ts         barrel: domain, query keys, port *types* only
```

### 9.1 The loop, end to end

**Port** — the interface. Note reactive inputs crossing as **zero-arg thunks**:

```ts
interface TypeVerificationQueueQueryOptions {
  filters: () => RequestFilters;
  enabled: () => boolean;
}

interface TypeVerificationQueueQueryPort {
  useProfilesQuery: (options) => UseQueryReturnType<TypeResponse, Error>;
}
```

The thunk is the key trick: the port stays framework-agnostic (no `Ref`, no
`ComputedRef` in its signature) while staying fully reactive once the adapter
wraps it in `computed()`.

**Adapter** — the TanStack implementation:

```ts
export default function useVerificationQueueQueryAdapter(
  deps: UseVerificationQueueServiceAdapter
): TypeVerificationQueueQueryPort {
  return {
    useProfilesQuery(options) {
      const filters = computed(() => options.filters());
      return useQuery({
        queryKey: computed(() => buildVerificationQueueQueryKey(filters.value)),
        queryFn: () => deps.getProfiles(filters.value),
        enabled: computed(() => options.enabled()),
        placeholderData: keepPreviousData,
      });
    },
  };
}
```

`keepPreviousData` is not decoration: without it the table empties on every page
and chip change, the card collapses to its loading height, and the viewport
jumps as the user pages through.

**Application** — the use case. Takes a `deps` bag, returns plain reactive state.
No Vue Router, no fetch, no component imports:

```ts
export default function useOvQueue(options: TypeUseOvQueueOptions) {
  const { queryPort } = options.deps;

  const activeFilterId = ref(options.initialFilterId ?? VERIFICATION_DEFAULT_FILTER_ID);
  const page = ref(DEFAULT_PAGINATION_OPTIONS.page);

  const filters = computed<RequestFilters>(() => ({
    status: resolveVerificationFilterStatus(activeFilterId.value),
    search: search(), page: page.value, limit: limit.value,
  }));

  const profilesQuery = queryPort.useProfilesQuery({ filters: () => filters.value, enabled });

  const rows = computed(() => {
    const response = profilesQuery.data.value;
    if (!response?.status || !Array.isArray(response.data)) return [];
    return response.data;
  });

  return { chips, rows, meta, activeFilterId, onSelectFilter, setPage, … };
}
```

Note `if (!response?.status …) return []` — the envelope check again, on the read
side.

**Composition** — two files, both auto-imported. One wires ports to adapters, one
is the root the UI calls:

```ts
// composition/use-ov-queue-deps.ts — the only place adapters are named
export default function useOvQueueDeps(context): TypeVerificationQueueDeps {
  return { queryPort: useVerificationQueueQueryAdapter(context.deps) };
}

// composition/use-ov-queue.ts — what the component mounts
export default function useOvQueue(options = {}) {
  return useOvQueueApp({
    deps: useOvQueueDeps({ deps: useVerificationQueueServiceAdapter() }),
    ...options,
  });
}
```

**This file is the swap point.** Mock and HTTP transports are separate adapter
files exchanged in exactly one line here. Mock backends should fake latency
(`MOCK_LIST_LATENCY_MS = 400`, 650 for mutations) — without it a fixture
resolves in the same tick and the loading branch never renders, so you ship a
loading state nobody has seen.

**UI** — the root mounts the composition root and hands results to
presentational children:

```vue
<template>
  <n-page-container>
    <n-page-content>
      <n-page-header>…</n-page-header>
      <ov-queue-filters :chips="chips" :active-filter-id="activeFilterId" @select="onSelectFilter" />
      <ov-queue-table :rows="rows" :meta="meta" :loading="isLoading" @update:page="setPage" />
    </n-page-content>
  </n-page-container>
</template>
```

### 9.2 Rules that are load-bearing

- **The barrel exports domain, query keys and port *types* only.** Never
  adapters, application, composition or mocks — so deleting a mock stays a
  one-line change.
- **Nothing inside a slice imports its own barrel.** `import/no-cycle` is an
  error.
- **Features do not import each other.** The one deliberate exception here is
  `app/features/audit-trail/trail`, which exists to be shared. When two features
  need the same rules and neither is a shared feature, **the rules are
  duplicated and both copies say so in their headers** — this project's worked
  example is `domain/approval-sla` and `domain/cabotage-sla`.
- **Query keys are slice-owned.** Never reuse an `~/infra/queries` key from a
  feature. Two features shaping one cache entry is how a list and a detail
  screen start disagreeing. Keys hang off a `root` so another slice can
  invalidate by prefix.
- **Routing is not a port.** Links are `NLink` in markup; paths live in
  `domain/*-routes.ts`.
- **Depth is two, occasionally three.** An area may hold a *slice group* when two
  slices only make sense together (`officer/verification/{queue,review}` — a
  queue and the review screen it opens). A group is a directory and nothing
  more. `officer/dashboard` sits flat beside it. Don't reach for a group to tidy
  an area.

### 9.3 Auto-registration

Configured in `nuxt.config.ts`:

```ts
const uiDirs = await glob("features/**/ui", { cwd: join(configDir, "app"), onlyDirectories: true });

components: [...uiDirs.map((path) => ({ path: `~/${path}`, extensions: ["vue"] })), "~/components"],
imports: { dirs: ["features/**/composition"] },
```

- `ui/ov-queue/filters.vue` → `<ov-queue-filters />`.
- **Adding a new `ui/` directory requires a dev-server restart** — the glob runs
  once at config load. This surprises everyone once.
- `extensions: ["vue"]` is pinned so co-located `.ts` helpers aren't registered
  as phantom components typed over a module with no default export.
- Composition roots are auto-imported, so they're called without an import.

UI folder prefixes follow the top-level feature directory: `a-` account, `at-`
audit-trail, `c-` capacity/compliance, `f-` finance, `o-` operator, `of-`
officer, `ov-` officer verification, `s-` stakeholder/surcharge, `sh-` shell.

## 10. HTTP and the server boundary

### 10.1 axios, not `$fetch`

Requests go through `app/composables/useCustomFetch.ts`, built on axios.
**Anything intercepting network traffic must patch XHR, not `fetch`.**

The module exports the client (`useCustomFetch`, `useCustomFetchNoAuth`), thin
TanStack wrappers (`useCustomFetchQuery`, `useCustomFetchMutation`), and
purpose-built multipart helpers for uploads.

Errors are normalised to `NormalizedApiError` with an `ApiErrorKind` of
`client` / `server` / `network` / `unknown`, and a central `handleApiError`
decides which raise a toast. Note that **400 is deliberately silent** there —
which is precisely why `unwrapApiResponse` (§8.1) matters at call sites.

### 10.2 The same-origin proxy

The browser never talks to the backend directly:

```
browser → /backend/**  (NUXT_PUBLIC_API_BASE_URL)
        → server/routes/backend/[...path].ts
        → NUXT_API_PROXY_TARGET
```

The proxy rewrites upstream `Set-Cookie` headers so the session cookie is issued
for this origin. This is what makes cookie auth work across two hosts without
`SameSite=None`.

### 10.3 The document proxy

`server/routes/document-proxy.ts` re-serves remote documents from this origin,
for renderers that must read bytes in JavaScript (spreadsheets, text) and are
otherwise blocked by CORS. `<img>`/`<iframe>` fetch opaquely and never need it.

Two safeguards, both essential to copy:

- **A host allowlist** (`NUXT_DOCUMENT_PROXY_ALLOWED_HOSTS`) is the only thing
  stopping this being an open proxy (SSRF). Keep it as tight as the bucket
  allows.
- **No caller headers are forwarded upstream** — no cookies, no `Authorization`.
  Forwarding them would leak the session to a third-party host.

A size cap (`MAX_BYTES`) refuses the absurd.

## 11. Auth and routing

`app/middleware/auth.global.ts` is a single global gate. `@sidebase/nuxt-auth`
runs with `globalAppMiddleware: false` — this middleware replaces it. Its order
matters:

1. Exempt public system routes (`sitemap.xml`, `robots.txt`). A login redirect
   there writes HTML into `sitemap.xml/index.html` and breaks the XML build.
2. Await any in-flight session before deciding anything.
3. `to.meta.auth === false` opts a page out; everything else is protected by
   default.
4. Unauthenticated → the login path for that area.
5. Shared routes (`/settings`, `/notifications`) skip role confinement.
6. Cross-area access (operator in officer area, or the reverse) is aborted 403.
7. Each role is confined to its own prefixes, and redirected home if outside
   them.
8. A page-level role gate (`definePageMeta({ roles: [...] })`) runs last.

`app/utils/routing.ts` owns the maps this reads: `OFFICER_ROLE_ROUTE_MAP` and
`OPERATOR_ROLE_ROUTE_MAP` (role → label, home path, prefixes), plus
`SHARED_AUTHENTICATED_PREFIXES`. **Adding a role is a data change in that file,
not a change to the middleware.** That is the property to preserve.

Two audiences means two login pages (`/admin/auth/login`, `/auth/login`) and two
sign-in endpoints (`auth/officer/login`, `auth/login`).

Pages are grouped on disk: `app/pages/(auth-pages)`, `(guest-pages)`,
`(protected-pages)`.

## 12. SSR, hydration and `<client-only>`

**No vue-query dehydration is configured.** Nothing resolves during SSR, and
Nuxt's async layout leaves a window where a query can settle before hydration
compares against the server DOM.

The rule: **a feature root fed by client-resolved queries is wrapped in
`<client-only>` by the page, not inside the feature.** SEO is unaffected because
`usePageMetaHead` runs in the page.

```vue
<template>
  <client-only>
    <c-kts-calendar />
  </client-only>
</template>
```

Be aware this rule is **applied inconsistently in the current codebase** — 50
of 124 pages use the wrapper, and at least one slice (`ov-queue`) documents the
page as owning a wrapper that page does not actually have. If you are starting fresh, either apply it uniformly or configure
dehydration properly and drop the rule.

## 13. State: what goes where

| Kind of state                        | Home                                  |
| ------------------------------------ | ------------------------------------- |
| Anything from the server             | TanStack Query                        |
| Cross-screen client state            | Pinia store (`app/stores/`)           |
| One screen's own state               | `ref` in the application layer        |
| Survives reload, per-user preference | `localStorage` via a composable       |
| Survives a navigation, one tab       | `sessionStorage`, keyed by owner id   |

App-wide TanStack defaults: `staleTime` and `gcTime` of **5 minutes**,
`retry: 0`, `refetchOnWindowFocus: true`. Remounting a component does **not**
refetch inside that window — a common source of "my change isn't showing".
Invalidate explicitly after a mutation.

One caution learned here: module-scoped state in a composable is shared for the
tab's lifetime. If it belongs to a record, key it by that record's id and clear
it when the id changes — otherwise opening a second application shows the first
one's data.

## 14. Tooling and the verification loop

```bash
npm run dev          # localhost:6300
npm run typecheck    # vue-tsc via nuxt typecheck
npm run lint         # oxlint
npm run format:fix   # oxfmt
npm run knip         # unused files / exports / deps
npm run build        # ~10 min, takes a lock — not a routine check
```

**The loop is `oxfmt` → `oxlint` → `typecheck`**, scoped to the paths you
touched (`npx oxfmt app/features/x`). `husky` + `nano-staged` run `oxfmt` on
staged files pre-commit.

Two things to know: **there is no test suite** in this project — behaviour is
verified by a developer, and nothing should be stood up in place of that. And
`npm run build` catches nothing `typecheck` does not, while blocking other
builds.

`knip.json` declares the entry points that keep dead-code detection honest —
including `app/features/*/*/index.ts` and `app/features/*/*/*/index.ts` for both
slice depths. Keep it current or knip will report half your slices as unused.

---

# Part III — Bootstrapping a new dashboard

An order that works, each step leaving the app runnable.

1. **Scaffold Nuxt 4 + TypeScript.** Set `compatibilityDate`, `devServer.port`.
2. **Decide on Vuetify now.** If you don't need its overlays, skip it and skip
   step 3 entirely — you will save real complexity.
3. **Styling foundation, in this order:** `layers.css` (cascade layers) →
   `vuetify/styles` → `tailwind.css`. Copy `@theme inline` including
   `--color-*: initial`, then replace the hex in `:root`. Keep the ramp shape
   (`50/100/150/500/600`); the whole library is written against those steps.
   Mirror the breakpoints into the Vuetify config and `settings.scss`.
4. **`cn` helper**, then port the primitives you need in dependency order:
   `button` → `input`/`field` → `card` → `page` → `data-table`. Take the
   `*-variants.ts` sibling convention with them.
5. **The three cross-cutting systems**, early — they are far cheaper now than
   retrofitted: the icon map, `utils/status/` (start with your own statuses and
   an empty alias table), and `date-formatters` with your zone.
6. **The HTTP boundary:** the Nitro proxy route, `useCustomFetch`, the
   `ApiResponse` envelope, `response.helpers`, and `unwrapApiResponse` on day
   one.
7. **Auth:** the global middleware and the role→route maps. Get the eight-step
   order right; it is fiddly and you will not want to revisit it.
8. **The app shell:** layouts (`admin`, `operator`, `auth`, `empty`) and the
   sidebar slice. Build the sidebar as a slice from the start — its navigation
   registry is role-dependent and grows fast.
9. **The first feature slice**, copied wholesale from a small read-only one.
   Resist starting with your hardest screen; get the loop right on a list first.
10. **Wire the tooling:** oxlint, oxfmt, knip entry points, husky.
11. **Write the `AGENTS.md`.** Whatever you learned in steps 1–10 that surprised
    you is exactly what needs to be written down.

**What to copy verbatim:** `layers.css`, the `@theme` block structure, `cn`,
`response.helpers.ts`, `api-envelope.ts`, the slice skeleton, `knip.json`.

**What to adapt:** the palette hex, status registry and aliases, role maps, icon
map, breakpoints.

**What to leave behind:** see Part IV.

---

# Part IV — Pitfalls, and what not to copy

Honest list, from this codebase as it stands.

### Will bite you

- **`--color-*: initial`.** Stock Tailwind colours render nothing, silently.
  Every "my component is invisible" bug starts here.
- **Module and CSS ordering.** Move `vuetify-nuxt-module` in `modules`, or
  reorder the first three `css` entries, and styling breaks in ways that look
  unrelated to the change.
- **New `ui/` directory needs a dev-server restart.** The glob runs once.
- **`status: false` on HTTP 200.** No throw, no toast. See §8.1.
- **400s are silent** by design in `handleApiError`.
- **5-minute `staleTime`.** Remounting doesn't refetch; invalidate explicitly.
- **`<component :is="'Name'">`** silently renders nothing.
- **Three copies of the breakpoints** that must agree.
- **Module-scoped composable state** outlives the record it describes.

### Do not copy

- **The dev mock-auth block in `server/routes/backend/[...path].ts`.** It is
  marked "TEMPORARY — REVERT BEFORE MERGE" and is currently committed. It
  fabricates signed sessions for any address on a list with one shared password,
  `admin` role included. It is guarded three ways (`import.meta.dev`,
  `NODE_ENV !== "production"`, and an explicit `NUXT_DEV_MOCK_AUTH=1` opt-in) —
  but a new project should not start with a back door in it at all.
- **The inconsistent `<client-only>` discipline** (§12). Pick one approach.
- **Two data layers.** `infra/` and `features/` coexist here only because of an
  in-progress migration. A new project should have exactly one — the slice
  architecture, with shared transformers in a common module if genuinely shared.
- **`app/components/n/README.md`.** It lists 32 components; there are 63
  directories holding 337 component files. Use `docs/index.md`, which is
  current, and don't create a second index that will drift.

### Judgement calls worth revisiting

- **Vuetify alongside Tailwind.** Justified here by overlay behaviour and
  migration history. For a greenfield dashboard, Reka UI alone covers most of it
  and removes the entire cascade-layer apparatus.
- **No test suite.** Deliberate here. If your project can afford one, the
  application layer — pure functions over a `deps` bag — is unusually easy to
  test, and that is most of the argument for the slice shape in the first place.
- **`xlsx` from a CDN tarball.** It won't appear in `npm outdated`; someone must
  watch SheetJS's own release channel.

---

## Reference map

Where to look when you need the real thing:

| Concern                 | Path                                              |
| ----------------------- | ------------------------------------------------- |
| Agent/contributor rules | `AGENTS.md` (and `CLAUDE.md`, which defers to it)  |
| Component catalogue     | `docs/index.md`, `docs/components/*.md`            |
| Composable docs         | `docs/composables/*.md`                            |
| Design tokens           | `app/assets/css/tailwind.css`                      |
| Cascade layers          | `app/assets/css/layers.css`                        |
| Component library       | `app/components/n/`                                |
| Canonical small slice   | `app/features/officer/verification/queue`          |
| Canonical large slice   | `app/features/operator/surcharge`                  |
| Shared slice (the one)  | `app/features/audit-trail/trail`                   |
| Legacy data pipeline    | `app/infra/`                                       |
| Envelope helpers        | `app/infra/transformers/response.helpers.ts`       |
| HTTP client             | `app/composables/useCustomFetch.ts`                |
| Envelope unwrapping     | `app/utils/api-envelope.ts`                        |
| Status system           | `app/utils/status/`                                |
| Dates                   | `app/utils/date-formatters.ts`                     |
| Routing and roles       | `app/utils/routing.ts`                             |
| Auth gate               | `app/middleware/auth.global.ts`                    |
| Server proxies          | `server/routes/`                                   |
| Build config            | `nuxt.config.ts`, `app/vuetify.config.ts`          |
| Dead-code entry points  | `knip.json`                                        |
