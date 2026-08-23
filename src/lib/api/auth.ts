import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin/config";

/**
 * Authenticates the request and rejects it unless the account is approved
 * (or is the fixed admin, who is always approved) - this is the API-route
 * mirror of the page-level ApprovalGate, since a pending user could
 * otherwise call these routes directly, bypassing the UI.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  if (!isAdminEmail(user.email)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("approval_status")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.approval_status !== "approved") return null;
  }

  return { supabase, user };
}
