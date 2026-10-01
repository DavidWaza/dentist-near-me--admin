"use client";

import { useId } from "react";
import {
  NCard,
  NChip,
  NChipGroup,
  NField,
  NFieldLabel,
  NInput,
} from "@/components/n";
import { REPORT_PRESETS, type ReportRange } from "../../domain/report-range";

export function RpDashboardRangeBar({
  range,
  activePreset,
  onPreset,
  onFrom,
  onTo,
}: {
  range: ReportRange;
  activePreset: number | null;
  onPreset: (days: number) => void;
  onFrom: (value: string) => void;
  onTo: (value: string) => void;
}) {
  const fromId = useId();
  const toId = useId();
  return (
    <NCard className="flex-col gap-4 p-4 md:flex-row md:items-end md:justify-between md:p-5">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-base-500">
          Period · includes the next 90 days
        </span>
        <NChipGroup aria-label="Report period">
          {REPORT_PRESETS.map((preset) => (
            <NChip
              key={preset.days}
              size="sm"
              aria-pressed={activePreset === preset.days}
              onClick={() => onPreset(preset.days)}
            >
              {preset.label}
            </NChip>
          ))}
        </NChipGroup>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <NField>
          <NFieldLabel htmlFor={fromId} className="text-xs">
            From
          </NFieldLabel>
          <NInput
            id={fromId}
            type="date"
            size="sm"
            value={range.from}
            max={range.to}
            onChange={(e) => onFrom(e.target.value)}
            className="w-40"
          />
        </NField>
        <NField>
          <NFieldLabel htmlFor={toId} className="text-xs">
            To
          </NFieldLabel>
          <NInput
            id={toId}
            type="date"
            size="sm"
            value={range.to}
            min={range.from}
            onChange={(e) => onTo(e.target.value)}
            className="w-40"
          />
        </NField>
      </div>
    </NCard>
  );
}
