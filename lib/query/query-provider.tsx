"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * App-wide TanStack defaults: 5-minute stale/gc time, no retry, refetch on
 * focus. Remounting does NOT refetch inside the stale window — invalidate
 * explicitly after a mutation (see ADMIN_QUERY_ROOT).
 *
 * No dehydration is configured: client queries resolve in the browser only,
 * so feature roots fed by them render their loading state on the server.
 */
export function AppQueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60_000,
            gcTime: 5 * 60_000,
            retry: 0,
            refetchOnWindowFocus: true,
          },
          mutations: { retry: 0 },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
