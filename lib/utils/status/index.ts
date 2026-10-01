export * from "./types";
export * from "./palette";
export * from "./registry";
export * from "./resolver";

import { STATUS_REGISTRY, UNKNOWN_STATUS, type StatusDefinition } from "./registry";
import { resolveStatus } from "./resolver";
import type { StatusKind } from "./types";

/** Raw string → display definition in one call. */
export function describeStatus(
  raw: string | null | undefined,
  kind: StatusKind,
): StatusDefinition {
  const canonical = resolveStatus(raw, kind);
  if (!canonical) return UNKNOWN_STATUS;
  return (STATUS_REGISTRY[kind] as Record<string, StatusDefinition>)[canonical];
}
