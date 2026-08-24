import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export async function getUserAnthropicKey(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("user_api_keys")
    .select("anthropic_api_key")
    .eq("user_id", userId)
    .maybeSingle();

  return data?.anthropic_api_key || null;
}

export async function setUserAnthropicKey(
  supabase: SupabaseClient<Database>,
  userId: string,
  apiKey: string | null
): Promise<void> {
  const { error } = await supabase
    .from("user_api_keys")
    .upsert({ user_id: userId, anthropic_api_key: apiKey });
  if (error) throw error;
}
