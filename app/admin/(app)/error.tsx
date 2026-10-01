"use client";

import { useEffect } from "react";
import {
  NButton,
  NEmptyState,
  NEmptyStateActions,
  NEmptyStateDescription,
  NEmptyStateIcon,
  NEmptyStateTitle,
  NIcon,
  NPageContainer,
  NPageContent,
} from "@/components/n";

export default function AdminError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <NPageContainer>
      <NPageContent width="default">
        <NEmptyState tone="danger">
          <NEmptyStateIcon name="error" tone="danger" />
          <NEmptyStateTitle>Something went wrong</NEmptyStateTitle>
          <NEmptyStateDescription>
            This page couldn’t be loaded. Try again, and if it keeps happening
            share reference {error.digest ?? "—"} with support.
          </NEmptyStateDescription>
          <NEmptyStateActions>
            <NButton size="sm" color="secondary" variant="outline" onClick={() => unstable_retry()}>
              <NIcon name="refresh" />
              Try again
            </NButton>
          </NEmptyStateActions>
        </NEmptyState>
      </NPageContent>
    </NPageContainer>
  );
}
