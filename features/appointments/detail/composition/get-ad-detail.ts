import "server-only";
import { createClient } from "@/lib/supabase/server";
import { loadDetail } from "../application/load-detail";
import { createSupabaseDetailService } from "../infrastructure/services/supabase-detail-service-adapter";

/** Server composition root for the detail screen. */
export async function getAdDetail(id: string) {
  const supabase = await createClient();
  return loadDetail({ service: createSupabaseDetailService(supabase) }, id);
}
