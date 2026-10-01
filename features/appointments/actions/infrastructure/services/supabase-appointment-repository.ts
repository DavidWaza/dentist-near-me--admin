import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Appointment } from "@/lib/types";
import type { AppointmentRepositoryPort } from "../../ports/appointment-repository.port";

/** Throws on read errors; maps write errors to a typed outcome. */
export function createSupabaseAppointmentRepository(
  supabase: SupabaseClient,
): AppointmentRepositoryPort {
  return {
    async findById(id) {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data as Appointment | null) ?? null;
    },

    async update(id, patch) {
      const { data, error } = await supabase
        .from("appointments")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();

      if (!error) return { ok: true, appointment: data as Appointment };

      // The partial unique index raises 23505 on a double-book.
      if (error.code === "23505") return { ok: false, reason: "conflict" };
      if (error.code === "22P02" && String(error.message).includes("rescheduled")) {
        return { ok: false, reason: "migration_required" };
      }
      console.error(`[appointments.update ${id}]`, error);
      return { ok: false, reason: "failed" };
    },
  };
}
