import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireUser } from "@/lib/api/auth";
import { apiError, apiRateLimited, apiUnauthorized, apiValidationError, logServerError } from "@/lib/api/response";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { extractRequestSchema } from "@/lib/schemas/content-source";
import { extractContentFromUrl, ContentExtractionError } from "@/lib/content/extract";

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth) return apiUnauthorized();

  const rateLimit = checkRateLimit(`extract:${auth.user.id}`, RATE_LIMITS.urlImport);
  if (!rateLimit.allowed) return apiRateLimited(rateLimit.resetInMs);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("validation_error", "Corpo da requisição inválido.", 400);
  }

  try {
    const { url } = extractRequestSchema.parse(body);
    const content = await extractContentFromUrl(url);
    return NextResponse.json({ content });
  } catch (err) {
    if (err instanceof ZodError) return apiValidationError(err);
    if (err instanceof ContentExtractionError) {
      return apiError("extraction_failed", err.userMessage, 422);
    }
    logServerError("api/extract", err);
    return apiError("internal_error", "Não foi possível processar esta URL.", 500);
  }
}
