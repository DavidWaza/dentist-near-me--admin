import {
  NCard,
  NPageContainer,
  NPageContent,
  NSkeleton,
  NStat,
} from "@/components/n";

function Body() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <NStat key={i}>
            <NSkeleton className="h-4 w-28" />
            <NSkeleton className="h-8 w-16" />
            <NSkeleton className="h-3 w-36" />
          </NStat>
        ))}
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <NCard className="h-64 p-5">
          <NSkeleton className="h-4 w-24" />
        </NCard>
        <NCard className="h-80 p-5">
          <NSkeleton className="h-4 w-36" />
        </NCard>
      </div>
      <span className="sr-only">Loading reports…</span>
    </div>
  );
}

/** `bare` renders only the body (inside an already-mounted dashboard). */
export function RpDashboardSkeleton({ bare = false }: { bare?: boolean }) {
  if (bare) return <Body />;
  return (
    <NPageContainer>
      <NPageContent>
        <div className="flex flex-col gap-2">
          <NSkeleton className="h-8 w-40" />
          <NSkeleton className="h-4 w-full max-w-md" />
        </div>
        <NCard className="h-24 p-5">
          <NSkeleton className="h-7 w-72" />
        </NCard>
        <Body />
      </NPageContent>
    </NPageContainer>
  );
}
