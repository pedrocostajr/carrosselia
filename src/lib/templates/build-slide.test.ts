import { describe, expect, it } from "vitest";

import { buildSlideFromAi } from "@/lib/templates/build-slide";
import { DEFAULT_BRAND_CONTEXT } from "@/lib/templates/types";
import { slideSchema } from "@/lib/schemas/slide";
import type { AiSlide } from "@/lib/schemas/ai";

const aiSlide: AiSlide = {
  order: 1,
  type: "hook",
  headline: "Pare de fazer isso no Instagram",
  body: "Um erro simples que afasta seguidores.",
  emphasis: ["Instagram"],
  visualSuggestion: "Título grande",
  transition: "Continue lendo",
};

describe("buildSlideFromAi", () => {
  for (const templateId of ["minimal", "editorial", "social-post"]) {
    it(`produces a schema-valid slide for the "${templateId}" template`, () => {
      const slide = buildSlideFromAi(aiSlide, {
        id: "slide-1",
        templateId,
        format: "1080x1350",
        brand: DEFAULT_BRAND_CONTEXT,
        isFirst: true,
        isLast: false,
      });

      expect(() => slideSchema.parse(slide)).not.toThrow();
      expect(slide.template).toBe(templateId);
      expect(slide.order).toBe(1);
      expect(slide.type).toBe("hook");
      expect(slide.elements.length).toBeGreaterThan(0);
      expect(slide.layerOrder).toEqual(slide.elements.map((e) => e.id));
    });
  }

  it("includes the brand's instagram handle in a text element", () => {
    const slide = buildSlideFromAi(aiSlide, {
      id: "slide-1",
      templateId: "social-post",
      format: "1080x1350",
      brand: { ...DEFAULT_BRAND_CONTEXT, instagramHandle: "@minhamarca" },
      isFirst: true,
      isLast: true,
    });

    const handleTexts = slide.elements
      .filter((e) => e.type === "text" && e.role === "handle")
      .map((e) => (e.type === "text" ? e.text : ""));
    expect(handleTexts).toContain("@minhamarca");
  });
});
