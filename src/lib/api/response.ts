import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiErrorCode =
  | "unauthorized"
  | "validation_error"
  | "rate_limited"
  | "not_found"
  | "forbidden"
  | "extraction_failed"
  | "ai_error"
  | "internal_error";

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: unknown
): NextResponse<ApiErrorBody> {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

export function apiUnauthorized(message = "Você precisa estar autenticado.") {
  return apiError("unauthorized", message, 401);
}

export function apiForbidden(message = "Você não tem acesso a este recurso.") {
  return apiError("forbidden", message, 403);
}

export function apiNotFound(message = "Recurso não encontrado.") {
  return apiError("not_found", message, 404);
}

export function apiValidationError(error: ZodError) {
  return apiError(
    "validation_error",
    "Os dados enviados são inválidos.",
    400,
    error.flatten()
  );
}

export function apiRateLimited(resetInMs: number) {
  return apiError(
    "rate_limited",
    "Você atingiu o limite de solicitações. Aguarde um instante e tente novamente.",
    429,
    { resetInMs }
  );
}

/**
 * Logs technical errors server-side without ever including secrets (API
 * keys, service-role tokens) or raw AI prompts that might carry sensitive
 * user content. Only structural information is logged.
 */
export function logServerError(scope: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${scope}]`, message);
}
