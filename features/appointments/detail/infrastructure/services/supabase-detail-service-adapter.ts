import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Appointment } from "@/lib/types";
import type { DetailServicePort } from "../../ports/detail-service.port";

export function createSupabaseDetailService(
  supabase: SupabaseClient,
): DetailServicePort {
  return {
    async getAppointment(id) {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data as Appointment | null) ?? null;
    },
  };
}
