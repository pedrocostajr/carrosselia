import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireUser } from "@/lib/api/auth";
import { apiError, apiRateLimited, apiUnauthorized, apiValidationError, logServerError } from "@/lib/api/response";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { structurePreviewRequestSchema } from "@/lib/schemas/api-requests";
import { getAIProvider } from "@/lib/ai";
import { AiGenerationError } from "@/lib/ai/anthropic-provider";
import { logAiGeneration } from "@/lib/ai/log-generation";

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth) return apiUnauthorized();

  const rateLimit = checkRateLimit(`ai:${auth.user.id}`, RATE_LIMITS.aiGeneration);
  if (!rateLimit.allowed) return apiRateLimited(rateLimit.resetInMs);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("validation_error", "Corpo da requisição inválido.", 400);
  }

  try {
    const input = structurePreviewRequestSchema.parse(body);
    const provider = getAIProvider();

    const structure = await provider.generateStructurePreview({
      sourceText: input.sourceText,
      sourceTitle: input.sourceTitle,
      sourceUrl: input.sourceUrl,
      strategy: input.strategy,
    });

    await logAiGeneration(auth.supabase, {
      userId: auth.user.id,
      kind: "structure_preview",
      provider: provider.id,
      inputSummary: { sourceLength: input.sourceText.length, objective: input.strategy.objective },
      succeeded: true,
    });

    return NextResponse.json({ structure, isDemo: provider.isDemo });
  } catch (err) {
    if (err instanceof ZodError) return apiValidationError(err);
    if (err instanceof AiGenerationError) {
      return apiError("ai_error", err.userMessage, 502);
    }
    logServerError("api/ai/structure-preview", err);
    return apiError("internal_error", "Não foi possível gerar a prévia estratégica.", 500);
  }
}
