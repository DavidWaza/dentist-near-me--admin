export default function Loading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite">
      <div className="h-8 w-48 animate-pulse rounded bg-mint/60" />
      <div className="h-40 animate-pulse rounded-xl bg-white" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-white" />
        ))}
      </div>
      <span className="sr-only">Loading appointments…</span>
    </div>
  );
}
