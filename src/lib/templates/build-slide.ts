import { getTemplate } from "@/lib/templates/registry";
import type { BrandContext } from "@/lib/templates/types";
import type { AiSlide } from "@/lib/schemas/ai";
import type { Slide, SlideFormat } from "@/lib/schemas/slide";

export function buildSlideFromAi(
  aiSlide: AiSlide,
  opts: {
    id: string;
    templateId: string;
    format: SlideFormat;
    brand: BrandContext;
    isFirst: boolean;
    isLast: boolean;
  }
): Slide {
  const template = getTemplate(opts.templateId);
  const built = template.build(
    {
      headline: aiSlide.headline,
      body: aiSlide.body,
      emphasis: aiSlide.emphasis,
      type: aiSlide.type,
      isFirst: opts.isFirst,
      isLast: opts.isLast,
    },
    { brand: opts.brand, format: opts.format }
  );

  return {
    id: opts.id,
    order: aiSlide.order,
    type: aiSlide.type,
    template: template.id,
    format: opts.format,
    transitionNote: aiSlide.transition,
    ...built,
  };
}
