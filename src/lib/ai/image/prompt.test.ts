import { describe, expect, it } from "vitest";

import { buildImagePrompt } from "@/lib/ai/image/prompt";

describe("buildImagePrompt", () => {
  it("includes the headline and niche and forbids embedded text", () => {
    const prompt = buildImagePrompt({
      headline: "Pare de fazer isso no Instagram",
      visualSuggestion: "Uma mesa de trabalho minimalista",
      niche: "marketing digital",
      visualStyle: "minimalista",
    });

    expect(prompt).toContain("Pare de fazer isso no Instagram");
    expect(prompt).toContain("marketing digital");
    expect(prompt).toContain("Uma mesa de trabalho minimalista");
    expect(prompt.toLowerCase()).toContain("no text");
  });

  it("falls back to a sensible style hint for an unknown visual style", () => {
    const prompt = buildImagePrompt({
      headline: "Tema",
      visualSuggestion: "",
      niche: "moda",
      visualStyle: "estilo-inexistente",
    });
    expect(prompt.length).toBeGreaterThan(0);
    expect(prompt).not.toContain("undefined");
  });
});
