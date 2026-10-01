"use client";

import { useId, useRef, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ALL_STATUSES } from "@/lib/appointments";
import { STATUS_REGISTRY, TONES } from "@/lib/utils/status";
import { cn } from "@/lib/utils/cn";
import {
  NButton,
  NCard,
  NChip,
  NChipGroup,
  NField,
  NFieldLabel,
  NIcon,
  NInput,
  NSelect,
} from "@/components/n";
import {
  DEFAULT_RANGE,
  FILTER_PARAMS,
  QUEUE_PARAM,
  RANGE_OPTIONS,
  hasActiveFilters,
  type RawSearchParams,
} from "../../domain/queue-filters";
import { queueHref } from "../../domain/queue-routes";
import type { QueueFilterOptions } from "../../domain/queue-row";

const SEARCH_DEBOUNCE_MS = 350;

export function AqQueueFilters({ options }: { options: QueueFilterOptions }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const ids = { search: useId(), dentist: useId(), location: useId(), from: useId(), to: useId() };

  const params: RawSearchParams = Object.fromEntries(searchParams.entries());
  const range = searchParams.get(QUEUE_PARAM.range) ?? DEFAULT_RANGE;
  const activeStatuses = (searchParams.get(QUEUE_PARAM.status) ?? "")
    .split(",")
    .filter(Boolean);
  const urlSearch = searchParams.get(QUEUE_PARAM.search) ?? "";

  function apply(mutations: Record<string, string | null>) {
    const href = queueHref(params, mutations);
    startTransition(() => router.push(href, { scroll: false }));
  }

  function toggleStatus(status: string) {
    const next = new Set(activeStatuses);
    if (next.has(status)) next.delete(status);
    else next.add(status);
    apply({ [QUEUE_PARAM.status]: [...next].join(",") || null });
  }

  // Uncontrolled + keyed on the URL value, so back/forward resets the box
  // without a sync effect.
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function onSearchChange(value: string) {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      if (value.trim() !== urlSearch) apply({ [QUEUE_PARAM.search]: value.trim() || null });
    }, SEARCH_DEBOUNCE_MS);
  }

  return (
    <NCard
      className="gap-4 p-4 md:p-5"
      aria-busy={isPending}
      aria-label="Filter appointments"
      role="search"
    >
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem_12rem]">
        <NField>
          <NFieldLabel htmlFor={ids.search}>Search patients</NFieldLabel>
          <div className="relative">
            <NIcon
              name="search"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-base-400"
            />
            <NInput
              id={ids.search}
              key={urlSearch}
              type="search"
              defaultValue={urlSearch}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Name, email or phone"
              className="pl-9"
            />
          </div>
        </NField>
        <NField>
          <NFieldLabel htmlFor={ids.dentist}>Dentist</NFieldLabel>
          <NSelect
            id={ids.dentist}
            value={searchParams.get(QUEUE_PARAM.dentist) ?? ""}
            onChange={(e) => apply({ [QUEUE_PARAM.dentist]: e.target.value || null })}
          >
            <option value="">All dentists</option>
            {options.dentists.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </NSelect>
        </NField>
        <NField>
          <NFieldLabel htmlFor={ids.location}>Location</NFieldLabel>
          <NSelect
            id={ids.location}
            value={searchParams.get(QUEUE_PARAM.location) ?? ""}
            onChange={(e) => apply({ [QUEUE_PARAM.location]: e.target.value || null })}
          >
            <option value="">All locations</option>
            {options.locations.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </NSelect>
        </NField>
      </div>

      <div className="flex flex-col gap-3 border-t border-base-100 pt-4 lg:flex-row lg:items-start lg:gap-6">
        <FilterGroup label="When">
          <NChipGroup aria-label="Date range">
            {RANGE_OPTIONS.map((option) => (
              <NChip
                key={option.key}
                size="sm"
                aria-pressed={range === option.key}
                onClick={() => apply({ [QUEUE_PARAM.range]: option.key })}
              >
                {option.label}
              </NChip>
            ))}
          </NChipGroup>
          {range === "custom" ? (
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <NField>
                <NFieldLabel htmlFor={ids.from} className="text-xs">
                  From
                </NFieldLabel>
                <NInput
                  id={ids.from}
                  type="date"
                  size="sm"
                  defaultValue={searchParams.get(QUEUE_PARAM.from) ?? ""}
                  onChange={(e) => apply({ [QUEUE_PARAM.from]: e.target.value || null })}
                  className="w-40"
                />
              </NField>
              <NField>
                <NFieldLabel htmlFor={ids.to} className="text-xs">
                  To
                </NFieldLabel>
                <NInput
                  id={ids.to}
                  type="date"
                  size="sm"
                  defaultValue={searchParams.get(QUEUE_PARAM.to) ?? ""}
                  onChange={(e) => apply({ [QUEUE_PARAM.to]: e.target.value || null })}
                  className="w-40"
                />
              </NField>
            </div>
          ) : null}
        </FilterGroup>

        <FilterGroup label="Status" className="lg:flex-1">
          <NChipGroup aria-label="Status">
            {ALL_STATUSES.map((status) => {
              const def = STATUS_REGISTRY.appointment[status];
              return (
                <NChip
                  key={status}
                  size="sm"
                  aria-pressed={activeStatuses.includes(status)}
                  onClick={() => toggleStatus(status)}
                >
                  <span
                    aria-hidden
                    className={cn("size-2 rounded-full", TONES[def.tone].solid)}
                  />
                  {def.label}
                </NChip>
              );
            })}
          </NChipGroup>
        </FilterGroup>

        <div className="flex items-center gap-3 lg:self-end">
          {isPending ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-base-500" role="status">
              <NIcon name="refresh" className="size-3.5 animate-spin" />
              Updating…
            </span>
          ) : null}
          {hasActiveFilters(params) ? (
            <NButton
              size="sm"
              color="secondary"
              variant="ghost"
              onClick={() =>
                apply(Object.fromEntries(FILTER_PARAMS.map((key) => [key, null])))
              }
            >
              <NIcon name="close" />
              Clear filters
            </NButton>
          ) : null}
        </div>
      </div>
    </NCard>
  );
}

function FilterGroup({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <span className="text-xs font-semibold uppercase tracking-wide text-base-500">
        {label}
      </span>
      {children}
    </div>
  );
}
