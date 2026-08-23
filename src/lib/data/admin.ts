import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin/config";
import type { Database } from "@/lib/supabase/database.types";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Verifies the current session belongs to the fixed admin account. Always
 * re-derives this from the authenticated session server-side - never trust
 * a client-supplied "isAdmin" flag for anything that reads/mutates other
 * users' data.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) return null;
  return { supabase, user };
}

export interface UserWithActivity extends ProfileRow {
  projectCount: number;
}

export async function listUsersWithActivity(): Promise<UserWithActivity[]> {
  const admin = await requireAdmin();
  if (!admin) return [];

  const { data: profiles, error: profilesError } = await admin.supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (profilesError) throw profilesError;

  const { data: projects, error: projectsError } = await admin.supabase
    .from("projects")
    .select("user_id");
  if (projectsError) throw projectsError;

  const countByUser = new Map<string, number>();
  for (const row of projects ?? []) {
    countByUser.set(row.user_id, (countByUser.get(row.user_id) ?? 0) + 1);
  }

  return (profiles ?? []).map((profile) => ({
    ...profile,
    projectCount: countByUser.get(profile.id) ?? 0,
  }));
}
