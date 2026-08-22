import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type AiGenerationKind = Database["public"]["Tables"]["ai_generations"]["Row"]["kind"];

/**
 * Persists a minimal, non-sensitive record of an AI call: kind, provider,
 * model and small counts only - never the raw prompt or source text, so
 * this table is safe even in production logs/exports.
 */
export async function logAiGeneration(
  supabase: SupabaseClient<Database>,
  params: {
    userId: string;
    projectId?: string | null;
    kind: AiGenerationKind;
    provider: string;
    model?: string | null;
    inputSummary: Record<string, unknown>;
    succeeded: boolean;
  }
) {
  await supabase.from("ai_generations").insert({
    user_id: params.userId,
    project_id: params.projectId ?? null,
    kind: params.kind,
    provider: params.provider,
    model: params.model ?? null,
    input_summary: params.inputSummary,
    succeeded: params.succeeded,
  });
}
