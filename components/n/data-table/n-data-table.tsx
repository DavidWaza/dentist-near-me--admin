import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { NIcon } from "../icon/n-icon";
import { NSkeleton } from "../skeleton/n-skeleton";

/**
 * Server-rendered data table. Columns are plain objects built by a factory in
 * the slice (`table-columns.tsx`) that receives handlers, so cells can link or
 * mount client islands without a `switch` in this component.
 *
 * Sorting is URL-driven: a column with `sort` renders its header as a link
 * built by the caller, which keeps the table a Server Component.
 */

export interface NColumnSort {
  href: string;
  direction: "asc" | "desc" | null;
}

export interface NColumnDef<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  sort?: NColumnSort;
}

export function NDataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  className,
}: {
  columns: NColumnDef<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  caption?: string;
  className?: string;
}) {
  return (
    <div
      data-slot="data-table"
      className={cn(
        "overflow-x-auto rounded-xl border border-base-150 bg-base-0",
        className,
      )}
    >
      <table className="w-full border-collapse text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr className="border-b border-base-150 bg-base-50/60">
            {columns.map((col) => (
              <th
                key={col.id}
                scope="col"
                aria-sort={
                  col.sort?.direction === "asc"
                    ? "ascending"
                    : col.sort?.direction === "desc"
                      ? "descending"
                      : undefined
                }
                className={cn(
                  "px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-base-500",
                  col.headerClassName,
                )}
              >
                {col.sort ? (
                  <Link
                    href={col.sort.href}
                    scroll={false}
                    className="inline-flex items-center gap-1 rounded-sm hover:text-base-900"
                  >
                    {col.header}
                    <NIcon
                      name={
                        col.sort.direction === "asc"
                          ? "sortAsc"
                          : col.sort.direction === "desc"
                            ? "sortDesc"
                            : "sortNone"
                      }
                      className={cn(
                        "size-3.5",
                        col.sort.direction ? "text-accent-500" : "text-base-400",
                      )}
                    />
                  </Link>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="border-b border-base-100 transition-colors last:border-0 hover:bg-base-50"
            >
              {columns.map((col) => (
                <td
                  key={col.id}
                  className={cn("px-4 py-3 align-top", col.cellClassName)}
                >
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function NDataTableSkeleton({
  rows = 6,
  columns = 6,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "overflow-hidden rounded-xl border border-base-150 bg-base-0",
        className,
      )}
    >
      <div className="flex gap-4 border-b border-base-150 bg-base-50/60 px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <NSkeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex gap-4 border-b border-base-100 px-4 py-4 last:border-0"
        >
          {Array.from({ length: columns }).map((_, c) => (
            <NSkeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Link-based pagination: zero client JS, works with the back button. */
export function NDataTablePagination({
  page,
  pageCount,
  summary,
  hrefFor,
  className,
}: {
  page: number;
  pageCount: number;
  summary: ReactNode;
  hrefFor: (page: number) => string;
  className?: string;
}) {
  const prev = page > 1 ? hrefFor(page - 1) : null;
  const next = page < pageCount ? hrefFor(page + 1) : null;
  return (
    <nav
      aria-label="Pagination"
      data-slot="data-table-pagination"
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 text-sm text-base-500",
        className,
      )}
    >
      <span>{summary}</span>
      <div className="flex items-center gap-2">
        <span className="tabular-nums text-base-600">
          Page {page} of {pageCount}
        </span>
        <PageLink href={prev} rel="prev" label="Previous page" icon="prev" />
        <PageLink href={next} rel="next" label="Next page" icon="next" />
      </div>
    </nav>
  );
}

function PageLink({
  href,
  rel,
  label,
  icon,
}: {
  href: string | null;
  rel: string;
  label: string;
  icon: "prev" | "next";
}) {
  const cls =
    "inline-flex size-9 items-center justify-center rounded-lg border border-base-150 bg-base-0 text-base-900";
  if (!href) {
    return (
      <span aria-disabled className={cn(cls, "text-base-400 opacity-60")}>
        <NIcon name={icon} className="size-4" />
        <span className="sr-only">{label}</span>
      </span>
    );
  }
  return (
    <Link href={href} rel={rel} className={cn(cls, "hover:bg-base-50")}>
      <NIcon name={icon} className="size-4" />
      <span className="sr-only">{label}</span>
    </Link>
  );
}

export function NDataTableTopBar({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="data-table-top-bar"
      className={cn("flex flex-wrap items-center justify-between gap-3", className)}
      {...props}
    />
  );
}
