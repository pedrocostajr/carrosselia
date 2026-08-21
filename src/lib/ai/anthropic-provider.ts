import Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";

import type {
  AIProvider,
  GenerationContext,
  SlideImprovementContext,
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
import type { Slide } from "@/lib/schemas/slide";
import {
  SYSTEM_PROMPT,
  buildStructurePreviewPrompt,
  buildGenerationPrompt,
  buildSlideImprovementPrompt,
  buildSplitSlidePrompt,
  buildScorePrompt,
} from "@/lib/ai/prompts";
import { parseAndValidate, AiResponseValidationError } from "@/lib/ai/json-repair";

const MAX_REPAIR_ATTEMPTS = 1;

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
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new AiGenerationError(
        "empty_response",
        "A IA não retornou uma resposta válida. Tente novamente."
      );
    }
    return textBlock.text;
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
          currentPrompt = `${prompt}\n\nSua resposta anterior não seguiu o formato JSON exigido (${err.message}). Responda novamente APENAS com o JSON válido, corrigindo o problema.`;
          continue;
        }
        break;
      }
    }

    throw new AiGenerationError(
      lastError instanceof Error ? lastError.message : "unknown",
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

  async scoreCarousel(
    slides: Pick<Slide, "headline" | "body" | "type">[],
    ctx: Pick<GenerationContext, "strategy">
  ): Promise<EditorialScore> {
    return this.completeAndValidate(
      buildScorePrompt(slides, ctx.strategy.audience),
      editorialScoreSchema
    );
  }
}
