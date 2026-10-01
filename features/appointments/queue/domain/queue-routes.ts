import { QUEUE_PARAM, type RawSearchParams, firstParam } from "./queue-filters";

/*
 * Route paths for the queue. The detail slice keeps its own copy of
 * QUEUE_PATH (features don't import each other) — keep the two in sync.
 */
export const QUEUE_PATH = "/admin/appointments";

export function appointmentDetailPath(id: string): string {
  return `${QUEUE_PATH}/${encodeURIComponent(id)}`;
}

/**
 * Build a queue URL from the current params plus mutations. `null`/"" deletes a
 * key. Any filter change returns to page 1 unless `page` is being set.
 */
export function queueHref(
  params: RawSearchParams,
  mutations: Record<string, string | null>,
): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const v = firstParam(value);
    if (v) sp.set(key, v);
  }
  if (!(QUEUE_PARAM.page in mutations)) sp.delete(QUEUE_PARAM.page);
  for (const [key, value] of Object.entries(mutations)) {
    if (value === null || value === "") sp.delete(key);
    else sp.set(key, value);
  }
  const qs = sp.toString();
  return qs ? `${QUEUE_PATH}?${qs}` : QUEUE_PATH;
}
