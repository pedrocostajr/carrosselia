import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireUser } from "@/lib/api/auth";
import {
  apiError,
  apiForbidden,
  apiRateLimited,
  apiUnauthorized,
  apiValidationError,
  logServerError,
} from "@/lib/api/response";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { generateRequestSchema } from "@/lib/schemas/api-requests";
import { getAIProvider } from "@/lib/ai";
import { AiGenerationError } from "@/lib/ai/anthropic-provider";
import { logAiGeneration } from "@/lib/ai/log-generation";
import { buildSlideFromAi } from "@/lib/templates/build-slide";
import { brandKitToContext } from "@/lib/templates/brand-context";
import { getImageProvider } from "@/lib/ai/image";
import { buildImagePrompt } from "@/lib/ai/image/prompt";
import { uploadGeneratedImage } from "@/lib/storage/upload-generated-image";
import type { Slide } from "@/lib/schemas/slide";

// Generating a background image per slide (Gemini) can take longer than the
// default serverless timeout when several slides are requested.
export const maxDuration = 60;

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
    const input = generateRequestSchema.parse(body);
    const { supabase, user } = auth;

    let brandKit = null;
    if (input.brandKitId) {
      const { data, error } = await supabase
        .from("brand_kits")
        .select("*")
        .eq("id", input.brandKitId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return apiForbidden("Kit de marca não encontrado.");
      brandKit = data;
    }

    const provider = getAIProvider();
    const result = await provider.generateCarousel({
      sourceText: input.sourceText,
      sourceTitle: input.sourceTitle,
      sourceUrl: input.sourceUrl,
      strategy: input.strategy,
      chosenHook: input.chosenHook,
      structure: input.structure,
    });

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        brand_kit_id: input.brandKitId ?? null,
        title: input.projectTitle || result.carousel.title,
        format: input.format,
        status: "ready",
      })
      .select()
      .single();
    if (projectError) throw projectError;

    const { error: sourceError } = await supabase.from("content_sources").insert({
      user_id: user.id,
      project_id: project.id,
      type: input.contentSourceType,
      url: input.sourceUrl || null,
      title: input.sourceTitle || null,
      raw_text: input.sourceText,
      edited_text: input.sourceText,
      summary: result.analysis.centralThesis,
      central_thesis: result.analysis.centralThesis,
      patterns: result.analysis.originalityNotes,
    });
    if (sourceError) throw sourceError;

    const { data: carousel, error: carouselError } = await supabase
      .from("carousels")
      .insert({
        user_id: user.id,
        project_id: project.id,
        brand_kit_id: input.brandKitId ?? null,
        title: result.carousel.title,
        framework: result.analysis.recommendedFramework,
        format: input.format,
        strategy: input.strategy,
        caption: result.caption,
        editorial_score: result.editorialScore,
      })
      .select()
      .single();
    if (carouselError) throw carouselError;

    const brandContext = brandKitToContext(brandKit);
    const slideCount = result.carousel.slides.length;
    const slides: Slide[] = result.carousel.slides.map((aiSlide, index) =>
      buildSlideFromAi(aiSlide, {
        id: crypto.randomUUID(),
        templateId: input.templateId,
        format: input.format,
        brand: brandContext,
        isFirst: index === 0,
        isLast: index === slideCount - 1,
      })
    );

    const imageProvider = getImageProvider();
    if (input.generateBackgroundImages && input.templateId === "photo-overlay" && imageProvider) {
      const aspectRatio = input.format === "1080x1080" ? "square" : "portrait";
      await Promise.all(
        slides.map(async (slide, index) => {
          try {
            const aiSlide = result.carousel.slides[index];
            const prompt = buildImagePrompt({
              headline: aiSlide.headline,
              visualSuggestion: aiSlide.visualSuggestion,
              niche: input.strategy.niche,
              visualStyle: brandKit?.visual_style ?? "minimalista",
            });
            const image = await imageProvider.generateImage(prompt, aspectRatio);
            const imageSrc = await uploadGeneratedImage(supabase, {
              userId: user.id,
              projectId: project.id,
              slideId: slide.id,
              bytes: image.bytes,
              mimeType: image.mimeType,
            });
            slide.background = {
              ...slide.background,
              type: "image",
              imageSrc,
            };
          } catch (err) {
            // A single failed image should not fail the whole generation -
            // that slide simply keeps its solid dark fallback background.
            logServerError("api/ai/generate:image", err);
          }
        })
      );
    }

    const slideRows = slides.map((slide) => ({
      id: slide.id,
      user_id: user.id,
      carousel_id: carousel.id,
      order_index: slide.order,
      type: slide.type,
      template: slide.template,
      format: slide.format,
      slide_data: slide,
    }));

    const { error: slidesError } = await supabase.from("slides").insert(slideRows);
    if (slidesError) throw slidesError;

    await logAiGeneration(supabase, {
      userId: user.id,
      projectId: project.id,
      kind: "generation",
      provider: provider.id,
      inputSummary: {
        sourceLength: input.sourceText.length,
        slideCount: input.strategy.slideCount,
        objective: input.strategy.objective,
      },
      succeeded: true,
    });

    return NextResponse.json({
      projectId: project.id as string,
      carouselId: carousel.id as string,
      isDemo: provider.isDemo,
    });
  } catch (err) {
    if (err instanceof ZodError) return apiValidationError(err);
    if (err instanceof AiGenerationError) {
      return apiError("ai_error", err.userMessage, 502);
    }
    logServerError("api/ai/generate", err);
    return apiError("internal_error", "Não foi possível gerar o carrossel.", 500);
  }
}
