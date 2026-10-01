import { NCard, NPageContainer, NPageContent, NSkeleton } from "@/components/n";

export function AdDetailSkeleton() {
  return (
    <NPageContainer aria-busy="true" aria-live="polite">
      <NPageContent className="max-w-5xl">
        <NSkeleton className="h-4 w-40" />
        <div className="flex flex-col gap-2">
          <NSkeleton className="h-8 w-64" />
          <NSkeleton className="h-4 w-52" />
        </div>
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex flex-col gap-5">
            <NCard className="h-40 p-5">
              <NSkeleton className="h-4 w-32" />
            </NCard>
            <NCard className="h-40 p-5">
              <NSkeleton className="h-4 w-32" />
            </NCard>
          </div>
          <NCard className="h-56 p-5">
            <NSkeleton className="h-4 w-24" />
          </NCard>
        </div>
        <span className="sr-only">Loading appointment…</span>
      </NPageContent>
    </NPageContainer>
  );
}
