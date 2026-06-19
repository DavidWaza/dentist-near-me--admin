import Link from "next/link";

/**
 * Server-rendered pagination. Builds page links from the current params so it
 * needs no client JS. `params` is the page's resolved searchParams.
 */
export function Pagination({
  page,
  pageCount,
  total,
  params,
}: {
  page: number;
  pageCount: number;
  total: number;
  params: Record<string, string | string[] | undefined>;
}) {
  const hrefFor = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (k === "page") continue;
      if (typeof v === "string" && v) sp.set(k, v);
      else if (Array.isArray(v) && v[0]) sp.set(k, v[0]);
    }
    sp.set("page", String(p));
    return `/admin/appointments?${sp.toString()}`;
  };

  const prevDisabled = page <= 1;
  const nextDisabled = page >= pageCount;

  const linkCls =
    "rounded-lg border border-mint px-3 py-1.5 text-sm font-medium text-ink hover:bg-mint/40";
  const disabledCls =
    "rounded-lg border border-mint/60 px-3 py-1.5 text-sm font-medium text-ink/30 pointer-events-none";

  return (
    <div className="flex items-center justify-between gap-3 text-sm text-ink/70">
      <span>
        Page {page} of {pageCount} · {total}{" "}
        {total === 1 ? "appointment" : "appointments"}
      </span>
      <div className="flex gap-2">
        {prevDisabled ? (
          <span className={disabledCls} aria-disabled>
            Previous
          </span>
        ) : (
          <Link href={hrefFor(page - 1)} className={linkCls} rel="prev">
            Previous
          </Link>
        )}
        {nextDisabled ? (
          <span className={disabledCls} aria-disabled>
            Next
          </span>
        ) : (
          <Link href={hrefFor(page + 1)} className={linkCls} rel="next">
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
