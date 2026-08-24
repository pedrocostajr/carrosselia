import Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";

import type {
  AIProvider,
  GenerationContext,
  SlideImprovementContext,
  ScoreableSlide,
} from "@/lib/ai/provider";
import {
  structurePreviewSchema,
  generationResultSchema,
  slideImprovementResultSchema,
  splitSlideResultSchema,
  editorialScoreSchema,
  type StructurePreview,
  type GenerationResult,
  type SlideImprovementResult,
  type EditorialScore,
} from "@/lib/schemas/ai";
import {
  SYSTEM_PROMPT,
  buildStructurePreviewPrompt,
  buildGenerationPrompt,
  buildSlideImprovementPrompt,
  buildSplitSlidePrompt,
  buildScorePrompt,
} from "@/lib/ai/prompts";
import { parseAndValidate, AiResponseValidationError } from "@/lib/ai/json-repair";

const MAX_REPAIR_ATTEMPTS = 2;
const MAX_TOKENS = 8192;

export class AiGenerationError extends Error {
  constructor(message: string, public readonly userMessage: string) {
    super(message);
    this.name = "AiGenerationError";
  }
}

export class AnthropicProvider implements AIProvider {
  readonly id = "anthropic";
  readonly isDemo = false;

  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  private async complete(userPrompt: string): Promise<string> {
    let response: Anthropic.Messages.Message;
    try {
      response = await this.client.messages.create({
        model: this.model,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: [
          { role: "user", content: userPrompt },
          // Prefilling the assistant turn with "{" strongly biases the model
          // toward emitting raw JSON as its very first character, instead of
          // a markdown fence or a prose preamble - the response continues
          // from this prefix, so it is not repeated in textBlock.text and
          // must be re-added before parsing.
          { role: "assistant", content: "{" },
        ],
      });
    } catch (err) {
      // Surface real API failures (invalid key, no credits, rate limit,
      // outage) as their own clear error instead of letting them fall
      // through to the generic "unexpected format" message below - those
      // are a completely different problem and retrying the JSON-repair
      // loop can never fix them.
      if (err instanceof Anthropic.APIError) {
        throw new AiGenerationError(
          `anthropic_api_error_${err.status}: ${err.message}`,
          `A IA da Anthropic retornou um erro: ${err.message}`
        );
      }
      throw new AiGenerationError(
        "anthropic_network_error",
        "Não foi possível conectar ao serviço de IA da Anthropic. Tente novamente."
      );
    }

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new AiGenerationError(
        "empty_response",
        "A IA não retornou uma resposta válida. Tente novamente."
      );
    }

    if (response.stop_reason === "max_tokens") {
      // The JSON was cut off mid-stream - never worth trying to parse.
      throw new AiResponseValidationError(
        "A resposta da IA foi cortada por exceder o limite de tamanho.",
        { stopReason: response.stop_reason }
      );
    }

    return `{${textBlock.text}`;
  }

  private async completeAndValidate<T>(
    prompt: string,
    schema: z.ZodType<T>
  ): Promise<T> {
    let lastError: unknown;
    let currentPrompt = prompt;

    for (let attempt = 0; attempt <= MAX_REPAIR_ATTEMPTS; attempt++) {
      try {
        const raw = await this.complete(currentPrompt);
        return parseAndValidate(raw, schema);
      } catch (err) {
        lastError = err;
        if (err instanceof AiResponseValidationError && attempt < MAX_REPAIR_ATTEMPTS) {
          const wasTruncated =
            typeof err.issues === "object" &&
            err.issues !== null &&
            (err.issues as { stopReason?: string }).stopReason === "max_tokens";

          const guidance = wasTruncated
            ? "Sua resposta anterior foi cortada por ficar longa demais antes de terminar o JSON. Responda de novo bem mais concisa - frases mais curtas em cada campo de texto - mas SEM remover nenhum campo obrigatório, até caber inteira."
            : `Sua resposta anterior não seguiu o formato exigido. Detalhes do erro: ${JSON.stringify(
                err.issues
              ).slice(0, 1500)}. Responda novamente APENAS com o JSON válido, corrigindo exatamente esse problema.`;

          currentPrompt = `${prompt}\n\n${guidance}`;
          continue;
        }
        break;
      }
    }

    // A real API failure (bad key, no credits, rate limit, network) already
    // carries its own specific, useful userMessage from complete() above -
    // never overwrite it with the generic "unexpected format" message below,
    // which only makes sense for actual JSON/validation failures.
    if (lastError instanceof AiGenerationError) {
      throw lastError;
    }

    const technicalDetail =
      lastError instanceof AiResponseValidationError
        ? `${lastError.message} ${JSON.stringify(lastError.issues)}`
        : lastError instanceof Error
          ? lastError.message
          : "unknown";

    throw new AiGenerationError(
      technicalDetail,
      "A IA retornou uma resposta em um formato inesperado. Tente gerar novamente."
    );
  }

  async generateStructurePreview(ctx: GenerationContext): Promise<StructurePreview> {
    return this.completeAndValidate(
      buildStructurePreviewPrompt(ctx),
      structurePreviewSchema
    );
  }

  async generateCarousel(ctx: GenerationContext): Promise<GenerationResult> {
    return this.completeAndValidate(buildGenerationPrompt(ctx), generationResultSchema);
  }

  async improveSlide(ctx: SlideImprovementContext): Promise<SlideImprovementResult> {
    return this.completeAndValidate(
      buildSlideImprovementPrompt(ctx),
      slideImprovementResultSchema
    );
  }

  async splitSlide(
    ctx: Pick<SlideImprovementContext, "slide" | "tone">
  ): Promise<{ slides: { headline: string; body: string }[] }> {
    return this.completeAndValidate(buildSplitSlidePrompt(ctx), splitSlideResultSchema);
  }

  async scoreCarousel(slides: ScoreableSlide[], audience: string): Promise<EditorialScore> {
    return this.completeAndValidate(buildScorePrompt(slides, audience), editorialScoreSchema);
  }
}
