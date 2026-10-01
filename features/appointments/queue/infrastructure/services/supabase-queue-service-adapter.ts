import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Appointment } from "@/lib/types";
import type { QueueServicePort } from "../../ports/queue-service.port";

export function createSupabaseQueueService(
  supabase: SupabaseClient,
): QueueServicePort {
  return {
    async listAppointments(q) {
      let query = supabase.from("appointments").select("*", { count: "exact" });

      if (q.gte) query = query.gte("starts_at", q.gte);
      if (q.lt) query = query.lt("starts_at", q.lt);
      if (q.statuses.length > 0) query = query.in("status", q.statuses);
      if (q.dentistId) query = query.eq("dentist_id", q.dentistId);
      if (q.locationCity) query = query.eq("location_city", q.locationCity);

      if (q.search) {
        // Free text over name / email / phone. Strip PostgREST `or` delimiters.
        const safe = q.search.replace(/[(),*]/g, " ").trim();
        if (safe) {
          query = query.or(
            `patient_name.ilike.%${safe}%,patient_email.ilike.%${safe}%,patient_phone.ilike.%${safe}%`,
          );
        }
      }

      query = query.order(q.sort, { ascending: q.dir === "asc" });
      // Stable tiebreakers so pagination is deterministic.
      if (q.sort !== "starts_at") query = query.order("starts_at", { ascending: true });
      query = query.order("id", { ascending: true });
      query = query.range(q.offset, q.offset + q.limit - 1);

      const { data, count, error } = await query;
      if (error) throw error;
      return { rows: (data ?? []) as Appointment[], total: count ?? 0 };
    },

    async findReturningEmails(emails) {
      if (emails.length === 0) return new Set();
      const { data, error } = await supabase
        .from("appointments")
        .select("patient_email")
        .eq("status", "completed")
        .in("patient_email", emails);
      if (error) {
        console.error("[queue.findReturningEmails]", error);
        return new Set();
      }
      return new Set(
        (data ?? []).map((r: { patient_email: string }) => r.patient_email.toLowerCase()),
      );
    },

    async listFilterOptions() {
      const [dentists, locations] = await Promise.all([
        supabase.from("dentists").select("id,name").order("name"),
        supabase.from("locations").select("city").order("city"),
      ]);
      if (dentists.error) console.error("[queue.dentists]", dentists.error);
      if (locations.error) console.error("[queue.locations]", locations.error);

      const cities = new Set(
        ((locations.data ?? []) as { city: string }[]).map((l) => l.city),
      );
      return {
        dentists: ((dentists.data ?? []) as { id: string; name: string }[]).map(
          (d) => ({ value: d.id, label: d.name }),
        ),
        locations: Array.from(cities, (city) => ({ value: city, label: city })),
      };
    },
  };
}
