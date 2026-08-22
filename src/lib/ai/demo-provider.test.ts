import { describe, expect, it } from "vitest";

import { DemoProvider } from "@/lib/ai/demo-provider";
import { generationResultSchema, structurePreviewSchema } from "@/lib/schemas/ai";
import type { GenerationContext } from "@/lib/ai/provider";

const baseContext: GenerationContext = {
  sourceText:
    "Consistência nas redes sociais é sobre aparecer com regularidade, não sobre perfeição. Pequenos hábitos diários superam grandes esforços esporádicos.",
  sourceTitle: "Consistência no Instagram",
  sourceUrl: null,
  strategy: {
    audience: "criadores de conteúdo iniciantes",
    niche: "marketing digital",
    objective: "educar",
    tone: "direto",
    awarenessLevel: "consciente_do_problema",
    slideCount: 6,
    creativity: 0.5,
  },
};

describe("DemoProvider", () => {
  const provider = new DemoProvider();

  it("is flagged as demo and never calls external services", () => {
    expect(provider.isDemo).toBe(true);
    expect(provider.id).toBe("demo");
  });

  it("generates a structure preview matching the schema with exactly 3 hooks", async () => {
    const preview = await provider.generateStructurePreview(baseContext);
    expect(() => structurePreviewSchema.parse(preview)).not.toThrow();
    expect(preview.hooks).toHaveLength(3);
    expect(preview.slideOutline).toHaveLength(baseContext.strategy.slideCount);
  });

  it("generates a full carousel with exactly slideCount slides, validating the AI schema", async () => {
    const result = await provider.generateCarousel(baseContext);
    expect(() => generationResultSchema.parse(result)).not.toThrow();
    expect(result.carousel.slides).toHaveLength(baseContext.strategy.slideCount);

    const orders = result.carousel.slides.map((s) => s.order);
    expect(orders).toEqual([1, 2, 3, 4, 5, 6]);
    expect(result.carousel.slides[0].type).toBe("hook");
    expect(result.carousel.slides.at(-1)?.type).toBe("cta");
  });

  it("produces the same output for the same input (deterministic)", async () => {
    const a = await provider.generateCarousel(baseContext);
    const b = await provider.generateCarousel(baseContext);
    expect(a.carousel.title).toBe(b.carousel.title);
    expect(a.editorialScore.total).toBe(b.editorialScore.total);
  });

  it("never fabricates fact-check claims for demo content", async () => {
    const result = await provider.generateCarousel(baseContext);
    expect(result.analysis.factsToVerify).toEqual([]);
  });
});
