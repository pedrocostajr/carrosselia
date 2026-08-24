import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireUser } from "@/lib/api/auth";
import { apiError, apiRateLimited, apiUnauthorized, apiValidationError, logServerError } from "@/lib/api/response";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { scoreRequestSchema } from "@/lib/schemas/api-requests";
import { getAIProvider } from "@/lib/ai";
import { AiGenerationError } from "@/lib/ai/anthropic-provider";
import { logAiGeneration } from "@/lib/ai/log-generation";
import { getUserAnthropicKey } from "@/lib/data/user-api-key";

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth) return apiUnauthorized();

  const rateLimit = checkRateLimit(`ai-slide:${auth.user.id}`, RATE_LIMITS.aiSlideAction);
  if (!rateLimit.allowed) return apiRateLimited(rateLimit.resetInMs);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("validation_error", "Corpo da requisição inválido.", 400);
  }

  try {
    const input = scoreRequestSchema.parse(body);
    const userApiKey = await getUserAnthropicKey(auth.supabase, auth.user.id);
    const provider = getAIProvider(userApiKey);

    const score = await provider.scoreCarousel(input.slides, input.audience);

    await logAiGeneration(auth.supabase, {
      userId: auth.user.id,
      kind: "score",
      provider: provider.id,
      inputSummary: { slideCount: input.slides.length },
      succeeded: true,
    });

    return NextResponse.json({ score, isDemo: provider.isDemo });
  } catch (err) {
    if (err instanceof ZodError) return apiValidationError(err);
    if (err instanceof AiGenerationError) {
      return apiError("ai_error", err.userMessage, 502);
    }
    logServerError("api/ai/score", err);
    return apiError("internal_error", "Não foi possível calcular a pontuação editorial.", 500);
  }
}
