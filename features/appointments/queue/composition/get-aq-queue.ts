import "server-only";
import { createClient } from "@/lib/supabase/server";
import { loadQueue } from "../application/load-queue";
import { parseQueueFilters, type RawSearchParams } from "../domain/queue-filters";
import { createSupabaseQueueService } from "../infrastructure/services/supabase-queue-service-adapter";

/** Server composition root for the queue — the adapter swap point. */
export async function getAqQueue(params: RawSearchParams) {
  const supabase = await createClient();
  return loadQueue(
    { service: createSupabaseQueueService(supabase), now: () => new Date() },
    parseQueueFilters(params),
  );
}
