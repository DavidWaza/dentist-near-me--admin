"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const subscribe = () => () => {};

/**
 * Renders `fallback` on the server and during hydration, then `children`.
 * Rule: a feature root fed by client-resolved queries (no dehydration) is
 * wrapped in this by the PAGE, not inside the feature.
 */
export function NClientOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return mounted ? children : fallback;
}
