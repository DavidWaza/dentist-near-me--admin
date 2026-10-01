import Link from "next/link";
import {
  NButton,
  NDataTable,
  NDataTablePagination,
  NEmptyState,
  NEmptyStateActions,
  NEmptyStateDescription,
  NEmptyStateIcon,
  NEmptyStateTitle,
  NIcon,
  NPageContainer,
  NPageContent,
  NPageDescription,
  NPageHeader,
  NPageHeading,
  NPageTitle,
} from "@/components/n";
import { getAqQueue } from "../../composition/get-aq-queue";
import {
  QUEUE_PARAM,
  hasActiveFilters,
  type RawSearchParams,
  type SortKey,
} from "../../domain/queue-filters";
import {
  QUEUE_PATH,
  appointmentDetailPath,
  queueHref,
} from "../../domain/queue-routes";
import { AqQueueFilters } from "./filters";
import { AqQueueMobileList } from "./mobile-list";
import { createQueueColumns } from "./table-columns";

/** Appointments queue — feature root (Server Component). */
export async function AqQueue({ params }: { params: RawSearchParams }) {
  const { filters, view, options } = await getAqQueue(params);

  const sortFor = (key: SortKey) => {
    const active = filters.sort === key;
    const direction = active ? filters.dir : null;
    // asc → desc → default
    const next: Record<string, string | null> =
      !active
        ? { [QUEUE_PARAM.sort]: key, [QUEUE_PARAM.dir]: "asc" }
        : filters.dir === "asc"
          ? { [QUEUE_PARAM.sort]: key, [QUEUE_PARAM.dir]: "desc" }
          : { [QUEUE_PARAM.sort]: null, [QUEUE_PARAM.dir]: null };
    return { href: queueHref(params, next), direction };
  };

  const columns = createQueueColumns({
    sortFor,
    detailHref: appointmentDetailPath,
  });

  return (
    <NPageContainer>
      <NPageContent>
        <NPageHeader>
          <NPageHeading>
            <NPageTitle>Appointments</NPageTitle>
            <NPageDescription>
              Triage today’s and upcoming bookings. Cancelled appointments stay
              in the list — only their status changes.
            </NPageDescription>
          </NPageHeading>
        </NPageHeader>

        <AqQueueFilters options={options} />

        {view.kind === "error" ? (
          <NEmptyState tone="danger">
            <NEmptyStateIcon name="error" tone="danger" />
            <NEmptyStateTitle>Couldn’t load appointments</NEmptyStateTitle>
            <NEmptyStateDescription>
              There was a problem reaching the database. Refresh to try again.
            </NEmptyStateDescription>
            <NEmptyStateActions>
              <NButton asChild color="secondary" variant="outline" size="sm">
                {/* Full reload: a soft navigation to the same URL may not refetch. */}
                <a href={queueHref(params, {})}>
                  <NIcon name="refresh" />
                  Retry
                </a>
              </NButton>
            </NEmptyStateActions>
          </NEmptyState>
        ) : view.kind === "empty" ? (
          <NEmptyState>
            <NEmptyStateIcon name="appointments" />
            <NEmptyStateTitle>No appointments found</NEmptyStateTitle>
            <NEmptyStateDescription>
              {hasActiveFilters(params)
                ? "Nothing matches these filters. Try widening the date range or clearing filters."
                : "There are no upcoming bookings yet."}
            </NEmptyStateDescription>
            {hasActiveFilters(params) ? (
              <NEmptyStateActions>
                <NButton asChild color="secondary" variant="outline" size="sm">
                  <Link href={QUEUE_PATH}>Clear filters</Link>
                </NButton>
              </NEmptyStateActions>
            ) : null}
          </NEmptyState>
        ) : (
          <div className="flex flex-col gap-4">
            <NDataTable
              className="hidden md:block"
              caption="Appointments"
              columns={columns}
              rows={view.rows}
              rowKey={(row) => row.id}
            />
            <AqQueueMobileList rows={view.rows} detailHref={appointmentDetailPath} />
            <NDataTablePagination
              page={view.page}
              pageCount={view.pageCount}
              hrefFor={(page) => queueHref(params, { [QUEUE_PARAM.page]: String(page) })}
              summary={
                <>
                  Showing{" "}
                  <span className="font-semibold text-base-900 tabular-nums">
                    {view.rangeStart}–{view.rangeEnd}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-base-900 tabular-nums">{view.total}</span>{" "}
                  {view.total === 1 ? "appointment" : "appointments"}
                </>
              }
            />
          </div>
        )}
      </NPageContent>
    </NPageContainer>
  );
}
