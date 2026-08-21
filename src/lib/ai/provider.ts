import type { StrategyInput, StructurePreview, GenerationResult, SlideImprovementAction, SlideImprovementResult, EditorialScore } from "@/lib/schemas/ai";
import type { BrandKit } from "@/lib/schemas/brand-kit";
import type { Slide } from "@/lib/schemas/slide";

export interface GenerationContext {
  sourceText: string;
  sourceTitle?: string | null;
  sourceUrl?: string | null;
  strategy: StrategyInput;
  brandKit?: Pick<BrandKit, "displayName" | "instagramHandle" | "visualStyle"> | null;
  chosenHook?: string;
  structure?: StructurePreview;
}

export interface SlideImprovementContext {
  action: SlideImprovementAction;
  slide: Pick<Slide, "headline" | "body">;
  carouselTitle: string;
  tone: string;
}

/**
 * Abstraction over any generative-AI backend used by the app. Nothing in
 * the application talks to a vendor SDK directly outside of an
 * implementation of this interface, so switching providers (or adding a
 * second one) never touches calling code.
 */
export interface AIProvider {
  readonly id: string;
  readonly isDemo: boolean;

  generateStructurePreview(ctx: GenerationContext): Promise<StructurePreview>;

  generateCarousel(ctx: GenerationContext): Promise<GenerationResult>;

  improveSlide(ctx: SlideImprovementContext): Promise<SlideImprovementResult>;

  splitSlide(ctx: Pick<SlideImprovementContext, "slide" | "tone">): Promise<{
    slides: { headline: string; body: string }[];
  }>;

  scoreCarousel(
    slides: Pick<Slide, "headline" | "body" | "type">[],
    ctx: Pick<GenerationContext, "strategy">
  ): Promise<EditorialScore>;
}
