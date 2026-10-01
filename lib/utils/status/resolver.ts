import { STATUS_REGISTRY } from "./registry";
import type { StatusKind, StatusKinds } from "./types";

/**
 * Raw backend spelling → canonical status, per kind. When the database or an
 * integration invents a new spelling, add one alias line and every screen
 * updates. Unrecognised input resolves to `null` (rendered as "Unknown").
 */
const STATUS_ALIASES: { [K in StatusKind]: Record<string, StatusKinds[K]> } = {
  appointment: {
    "no-show": "no_show",
    noshow: "no_show",
    canceled: "cancelled",
    done: "completed",
    complete: "completed",
  },
  response: {
    confirmed: "patient_confirmed",
    self_rescheduled: "patient_picked_time",
    awaiting: "awaiting_patient",
  },
  flag: {
    attention: "needs_attention",
  },
};

function normalise(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "_");
}

export function resolveStatus<K extends StatusKind>(
  raw: string | null | undefined,
  kind: K,
): StatusKinds[K] | null {
  if (!raw) return null;
  const key = normalise(raw);
  const registry = STATUS_REGISTRY[kind] as Record<string, unknown>;
  if (key in registry) return key as StatusKinds[K];
  const alias = (STATUS_ALIASES[kind] as Record<string, StatusKinds[K]>)[key];
  return alias ?? null;
}
