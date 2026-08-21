import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { getSupabaseUrl } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Service-role Supabase client. Bypasses Row Level Security - only ever
 * import this from server-only code (API routes / server actions) that has
 * already authenticated the caller and scoped the operation manually.
 * The `server-only` import above makes any accidental client-side import
 * fail at build time.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não está configurada.");
  }

  return createSupabaseClient<Database>(getSupabaseUrl(), serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
