import type { AuditEntry } from "../../domain/appointment-detail";

export function AdAuditTrail({ entries }: { entries: AuditEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-base-500">No activity recorded yet.</p>;
  }
  return (
    <ol className="flex flex-col">
      {entries.map((entry, index) => (
        <li key={index} className="relative flex gap-3 pb-4 last:pb-0">
          {/* rail */}
          {index < entries.length - 1 ? (
            <span
              aria-hidden
              className="absolute left-[5px] top-4 h-full w-px bg-base-150"
            />
          ) : null}
          <span
            aria-hidden
            className="relative mt-1.5 size-[11px] shrink-0 rounded-full border-2 border-accent-500 bg-base-0"
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="break-words text-sm font-semibold text-base-900 first-letter:uppercase">
              {entry.text.replace(/^no_show/, "no-show")}
            </p>
            {entry.stamp || entry.actor ? (
              <p className="text-xs text-base-500">
                {entry.stamp}
                {entry.actor ? <> · {entry.actor}</> : null}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
