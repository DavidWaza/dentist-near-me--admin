"use client";

import { useCallback, useRef, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ALL_STATUSES, STATUS_META } from "@/lib/appointments";
import type { RangeKey } from "@/lib/queries/appointments";

interface Option {
  value: string;
  label: string;
}

const RANGE_CHIPS: { key: RangeKey; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "week", label: "This week" },
  { key: "all", label: "All" },
  { key: "custom", label: "Custom" },
];

export function Filters({
  dentists,
  locations,
}: {
  dentists: Option[];
  locations: Option[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const range = (searchParams.get("range") as RangeKey) ?? "upcoming";
  const activeStatuses = (searchParams.get("status") ?? "")
    .split(",")
    .filter(Boolean);
  const dentist = searchParams.get("dentist") ?? "";
  const location = searchParams.get("location") ?? "";

  /** Build a new URL from a set of param mutations and navigate. */
  const apply = useCallback(
    (mutations: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(mutations)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      }
      // Any filter change returns to page 1.
      params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams],
  );

  const toggleStatus = (status: string) => {
    const set = new Set(activeStatuses);
    if (set.has(status)) set.delete(status);
    else set.add(status);
    apply({ status: Array.from(set).join(",") || null });
  };

  // Debounced search box. Uncontrolled + keyed on the URL value so it resets
  // when the query changes externally (e.g. back button) without a sync effect.
  const urlQ = searchParams.get("q") ?? "";
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSearchChange = (value: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      if (value.trim() !== urlQ) apply({ q: value.trim() || null });
    }, 350);
  };

  return (
    <div
      className="space-y-3 rounded-xl border border-mint bg-white p-3 md:p-4"
      aria-busy={isPending}
    >
      {/* Date range chips */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Date range">
        {RANGE_CHIPS.map((chip) => {
          const active = range === chip.key;
          return (
            <button
              key={chip.key}
              type="button"
              aria-pressed={active}
              onClick={() => apply({ range: chip.key })}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-deep text-cream"
                  : "bg-cream text-ink hover:bg-mint/50"
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Custom date range inputs */}
      {range === "custom" ? (
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-ink/70">From</span>
            <input
              type="date"
              defaultValue={searchParams.get("from") ?? ""}
              onChange={(e) => apply({ from: e.target.value || null })}
              className="rounded-lg border border-mint px-2 py-1.5"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink/70">To</span>
            <input
              type="date"
              defaultValue={searchParams.get("to") ?? ""}
              onChange={(e) => apply({ to: e.target.value || null })}
              className="rounded-lg border border-mint px-2 py-1.5"
            />
          </label>
        </div>
      ) : null}

      {/* Status multi-select */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Status">
        {ALL_STATUSES.map((status) => {
          const active = activeStatuses.includes(status);
          return (
            <button
              key={status}
              type="button"
              aria-pressed={active}
              onClick={() => toggleStatus(status)}
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
                active
                  ? `${STATUS_META[status].badge} border-transparent ring-1 ring-deep/30`
                  : "border-mint bg-white text-ink/60 hover:bg-cream"
              }`}
            >
              {STATUS_META[status].label}
            </button>
          );
        })}
      </div>

      {/* Dropdowns + search */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block text-ink/70">Dentist</span>
          <select
            value={dentist}
            onChange={(e) => apply({ dentist: e.target.value || null })}
            className="w-full rounded-lg border border-mint bg-white px-2 py-2"
          >
            <option value="">All dentists</option>
            {dentists.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-ink/70">Location</span>
          <select
            value={location}
            onChange={(e) => apply({ location: e.target.value || null })}
            className="w-full rounded-lg border border-mint bg-white px-2 py-2"
          >
            <option value="">All locations</option>
            {locations.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-ink/70">Search patient</span>
          <input
            key={urlQ}
            type="search"
            defaultValue={urlQ}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Name, email, or phone"
            className="w-full rounded-lg border border-mint bg-white px-3 py-2"
          />
        </label>
      </div>
    </div>
  );
}
