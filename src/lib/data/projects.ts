import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectWithBrandKit = ProjectRow & {
  brand_kits: { id: string; name: string } | null;
};

export interface ProjectFilters {
  search?: string;
  status?: ProjectRow["status"] | "all";
  format?: ProjectRow["format"] | "all";
  brandKitId?: string | "all";
  page?: number;
  pageSize?: number;
}

export async function listProjects(filters: ProjectFilters = {}) {
  const supabase = await createClient();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 12;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("projects")
    .select("*, brand_kits(id, name)", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (filters.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }
  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters.format && filters.format !== "all") {
    query = query.eq("format", filters.format);
  }
  if (filters.brandKitId && filters.brandKitId !== "all") {
    query = query.eq("brand_kit_id", filters.brandKitId);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    projects: (data ?? []) as unknown as ProjectWithBrandKit[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getProject(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, brand_kits(id, name)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as ProjectWithBrandKit | null;
}

export async function countProjectsByStatus() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("projects").select("status");
  if (error) throw error;

  const counts = { draft: 0, ready: 0, exported: 0 };
  for (const row of data ?? []) {
    if (row.status in counts) {
      counts[row.status as keyof typeof counts] += 1;
    }
  }
  return counts;
}
