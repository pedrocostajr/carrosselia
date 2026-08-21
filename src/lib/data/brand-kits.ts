import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type BrandKitRow = Database["public"]["Tables"]["brand_kits"]["Row"];

export async function listBrandKits(): Promise<BrandKitRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brand_kits")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getBrandKit(id: string): Promise<BrandKitRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brand_kits")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}
