import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  findReturningEmails,
  parseFilters,
  queryAppointments,
} from "@/lib/queries/appointments";
import { Filters } from "../../_components/Filters";
import { AppointmentsTable } from "../../_components/AppointmentsTable";
import { Pagination } from "../../_components/Pagination";
import type { Appointment } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Appointments · Staff console" };

export default async function AppointmentsPage({
  searchParams,
}: PageProps<"/admin/appointments">) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const supabase = await createClient();

  // Filter option sources (catalogue is RLS-readable).
  const [dentistsRes, locationsRes] = await Promise.all([
    supabase.from("dentists").select("id,name").order("name"),
    supabase.from("locations").select("city").order("city"),
  ]);

  const dentistOptions = (dentistsRes.data ?? []).map(
    (d: { id: string; name: string }) => ({ value: d.id, label: d.name }),
  );
  const locationOptions = Array.from(
    new Set((locationsRes.data ?? []).map((l: { city: string }) => l.city)),
  ).map((city) => ({ value: city, label: city }));

  // Fetch data first (no JSX inside try/catch), then render below.
  const now = new Date();
  let view:
    | {
        kind: "list";
        rows: Appointment[];
        returning: Set<string>;
        page: number;
        pageCount: number;
        total: number;
      }
    | { kind: "empty" }
    | { kind: "error" };

  try {
    const result = await queryAppointments(supabase, filters, now);
    const returning = await findReturningEmails(supabase, result.rows);
    view =
      result.rows.length === 0
        ? { kind: "empty" }
        : {
            kind: "list",
            rows: result.rows,
            returning,
            page: result.page,
            pageCount: result.pageCount,
            total: result.total,
          };
  } catch (err) {
    console.error("[appointments] query failed:", err);
    view = { kind: "error" };
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-deep">Appointments</h1>
          <p className="text-sm text-ink/60">
            Triage today’s and upcoming bookings. Cancelled appointments remain in
            the list — only their status changes.
          </p>
        </div>
      </div>

      <Filters dentists={dentistOptions} locations={locationOptions} />

      {view.kind === "error" ? (
        <div className="rounded-xl border border-status-no_show-bg bg-status-no_show-bg/40 p-8 text-center">
          <p className="text-lg font-semibold text-status-no_show">
            Couldn’t load appointments
          </p>
          <p className="mt-1 text-sm text-ink/70">
            There was a problem reaching the database. Refresh to try again.
          </p>
        </div>
      ) : view.kind === "empty" ? (
        <div className="rounded-xl border border-dashed border-mint bg-white p-10 text-center">
          <p className="text-lg font-semibold text-deep">No appointments found</p>
          <p className="mt-1 text-sm text-ink/60">
            Try widening the date range or clearing filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AppointmentsTable
            rows={view.rows}
            returningEmails={view.returning}
            now={now}
          />
          <Pagination
            page={view.page}
            pageCount={view.pageCount}
            total={view.total}
            params={params}
          />
        </div>
      )}
    </div>
  );
}
