import {
  NCard,
  NDataTableSkeleton,
  NPageContainer,
  NPageContent,
  NSkeleton,
} from "@/components/n";

export function AqQueueSkeleton() {
  return (
    <NPageContainer aria-busy="true" aria-live="polite">
      <NPageContent>
        <div className="flex flex-col gap-2">
          <NSkeleton className="h-8 w-48" />
          <NSkeleton className="h-4 w-full max-w-md" />
        </div>
        <NCard className="gap-4 p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_12rem_12rem]">
            <NSkeleton className="h-10" />
            <NSkeleton className="h-10" />
            <NSkeleton className="h-10" />
          </div>
          <NSkeleton className="h-7 w-2/3" />
        </NCard>
        <NDataTableSkeleton />
        <span className="sr-only">Loading appointments…</span>
      </NPageContent>
    </NPageContainer>
  );
}
