import type { Slide } from "@/lib/schemas/slide";

/**
 * Applies new headline/body text to a slide, updating both the slide-level
 * fields (used for search/AI context) and the matching text elements so the
 * change is immediately visible on the canvas.
 */
export function applyContentToSlide(
  slide: Slide,
  content: { headline?: string; body?: string }
): Slide {
  return {
    ...slide,
    headline: content.headline ?? slide.headline,
    body: content.body ?? slide.body,
    elements: slide.elements.map((el) => {
      if (el.type !== "text") return el;
      if (el.role === "headline" && content.headline !== undefined) {
        return { ...el, text: content.headline };
      }
      if (el.role === "body" && content.body !== undefined) {
        return { ...el, text: content.body };
      }
      return el;
    }),
  };
}
