import type { Slide } from "@/lib/schemas/slide";

export function collectImageSources(slides: Slide[]): string[] {
  const sources: string[] = [];
  for (const slide of slides) {
    if (slide.background.type === "image" && slide.background.imageSrc) {
      sources.push(slide.background.imageSrc);
    }
    for (const el of slide.elements) {
      if ((el.type === "image" || el.type === "avatar" || el.type === "logo") && el.src) {
        sources.push(el.src);
      }
    }
  }
  return sources;
}
