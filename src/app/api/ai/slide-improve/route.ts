import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireUser } from "@/lib/api/auth";
import { apiError, apiRateLimited, apiUnauthorized, apiValidationError, logServerError } from "@/lib/api/response";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { slideImproveRequestSchema } from "@/lib/schemas/api-requests";
import { getAIProvider } from "@/lib/ai";
import { AiGenerationError } from "@/lib/ai/anthropic-provider";
import { logAiGeneration } from "@/lib/ai/log-generation";

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
    const input = slideImproveRequestSchema.parse(body);
    const provider = getAIProvider();

    const result = await provider.improveSlide({
      action: input.action,
      slide: input.slide,
      carouselTitle: input.carouselTitle,
      tone: input.tone,
    });

    await logAiGeneration(auth.supabase, {
      userId: auth.user.id,
      kind: "slide_improvement",
      provider: provider.id,
      inputSummary: { action: input.action },
      succeeded: true,
    });

    return NextResponse.json({ result, isDemo: provider.isDemo });
  } catch (err) {
    if (err instanceof ZodError) return apiValidationError(err);
    if (err instanceof AiGenerationError) {
      return apiError("ai_error", err.userMessage, 502);
    }
    logServerError("api/ai/slide-improve", err);
    return apiError("internal_error", "Não foi possível melhorar o slide.", 500);
  }
}
