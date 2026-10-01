import "server-only";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { AuthServicePort } from "../../ports/auth-service.port";

export function createSupabaseAuthService(): AuthServicePort {
  return {
    isConfigured: () => isSupabaseConfigured,
    async signInWithPassword({ email, password }) {
      const supabase = await createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return !error;
    },
  };
}
