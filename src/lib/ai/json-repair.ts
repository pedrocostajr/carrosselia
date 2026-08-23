import type { z } from "zod";

/** Extracts the first top-level JSON object/array from free-form text. */
export function extractJson(text: string): string {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1] : trimmed;

  const firstBrace = candidate.search(/[{[]/);
  if (firstBrace === -1) return candidate;

  const openChar = candidate[firstBrace];
  const closeChar = openChar === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = firstBrace; i < candidate.length; i++) {
    const ch = candidate[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === openChar) {
      depth++;
    } else if (ch === closeChar) {
      depth--;
      if (depth === 0) return candidate.slice(firstBrace, i + 1);
    }
  }
  return candidate.slice(firstBrace);
}

export class AiResponseValidationError extends Error {
  constructor(message: string, public readonly issues: unknown) {
    super(message);
    this.name = "AiResponseValidationError";
  }
}

/**
 * Parses and validates a JSON string returned by an LLM against a Zod
 * schema. Never trusts unvalidated JSON: on failure, throws a typed error
 * that callers can use to trigger a single controlled repair attempt
 * (re-prompting the model with the validation issues) before giving up.
 */
export function parseAndValidate<T>(raw: string, schema: z.ZodType<T>): T {
  const jsonSlice = extractJson(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonSlice);
  } catch (err) {
    throw new AiResponseValidationError(
      "A resposta da IA não é um JSON válido.",
      err instanceof Error ? err.message : String(err)
    );
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new AiResponseValidationError(
      "A resposta da IA não corresponde ao formato esperado.",
      result.error.flatten()
    );
  }

  return result.data;
}
