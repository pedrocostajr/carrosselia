import { getTemplate } from "@/lib/templates/registry";
import type { BrandContext } from "@/lib/templates/types";
import type { Slide } from "@/lib/schemas/slide";

/**
 * Re-lays out an existing slide with a different template while keeping its
 * headline/body content and position in the carousel - used by "Alterar o
 * template de um slide" in the editor.
 */
export function rebuildSlideWithTemplate(
  slide: Slide,
  templateId: string,
  brand: BrandContext,
  isFirst: boolean,
  isLast: boolean
): Slide {
  const template = getTemplate(templateId);
  const built = template.build(
    {
      headline: slide.headline ?? "",
      body: slide.body ?? "",
      emphasis: [],
      type: slide.type,
      isFirst,
      isLast,
    },
    { brand, format: slide.format }
  );

  return {
    ...slide,
    template: template.id,
    ...built,
  };
}
