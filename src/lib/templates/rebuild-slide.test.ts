import { describe, expect, it } from "vitest";

import { buildSlideFromAi } from "@/lib/templates/build-slide";
import { rebuildSlideWithTemplate } from "@/lib/templates/rebuild-slide";
import { brandKitToContext } from "@/lib/templates/brand-context";
import { DEFAULT_BRAND_CONTEXT } from "@/lib/templates/types";
import type { BrandKitRow } from "@/lib/data/brand-kits";
import type { AiSlide } from "@/lib/schemas/ai";

describe("brandKitToContext", () => {
  it("falls back to the default context when no kit is provided", () => {
    expect(brandKitToContext(null)).toEqual(DEFAULT_BRAND_CONTEXT);
  });

  it("maps a brand kit row's columns onto the render context", () => {
    const kit = {
      display_name: "Ana Silva",
      instagram_handle: "@anasilva",
      avatar_url: "https://example.com/avatar.png",
      logo_url: "https://example.com/logo.png",
      logo_alt_url: null,
      color_primary: "#123456",
      color_secondary: "#654321",
      color_accent: "#ABCDEF",
      color_background: "#FFFFFF",
      color_text: "#000000",
      font_heading: "Playfair Display",
      font_body: "Inter",
      corner_radius: 12,
      footer_text: null,
      site_or_handle: "anasilva.com",
    } as unknown as BrandKitRow;

    const ctx = brandKitToContext(kit);
    expect(ctx.displayName).toBe("Ana Silva");
    expect(ctx.instagramHandle).toBe("@anasilva");
    expect(ctx.colorAccent).toBe("#ABCDEF");
    expect(ctx.siteOrHandle).toBe("anasilva.com");
  });
});

describe("rebuildSlideWithTemplate", () => {
  const aiSlide: AiSlide = {
    order: 2,
    type: "body",
    headline: "Ponto importante",
    body: "Detalhe do ponto importante para o público.",
    emphasis: [],
    visualSuggestion: "",
    transition: "",
  };

  it("keeps headline/body but switches the layout template", () => {
    const original = buildSlideFromAi(aiSlide, {
      id: "slide-2",
      templateId: "minimal",
      format: "1080x1350",
      brand: DEFAULT_BRAND_CONTEXT,
      isFirst: false,
      isLast: false,
    });

    const rebuilt = rebuildSlideWithTemplate(original, "editorial", DEFAULT_BRAND_CONTEXT, false, false);

    expect(rebuilt.template).toBe("editorial");
    expect(rebuilt.headline).toBe(aiSlide.headline);
    expect(rebuilt.body).toBe(aiSlide.body);
    expect(rebuilt.id).toBe(original.id);
  });
});
