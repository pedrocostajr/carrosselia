import type { Slide, SlideFormat, SlideType } from "@/lib/schemas/slide";

export interface BrandContext {
  displayName: string;
  instagramHandle: string;
  avatarUrl: string | null;
  logoUrl: string | null;
  logoAltUrl: string | null;
  colorPrimary: string;
  colorSecondary: string;
  colorAccent: string;
  colorBackground: string;
  colorText: string;
  fontHeading: string;
  fontBody: string;
  cornerRadius: number;
  footerText: string | null;
  siteOrHandle: string | null;
}

export const DEFAULT_BRAND_CONTEXT: BrandContext = {
  displayName: "Sua marca",
  instagramHandle: "@suamarca",
  avatarUrl: null,
  logoUrl: null,
  logoAltUrl: null,
  colorPrimary: "#111111",
  colorSecondary: "#4B5563",
  colorAccent: "#2563EB",
  colorBackground: "#FFFFFF",
  colorText: "#111111",
  fontHeading: "Playfair Display",
  fontBody: "Inter",
  cornerRadius: 16,
  footerText: null,
  siteOrHandle: null,
};

export interface SlideContent {
  headline: string;
  body: string;
  emphasis: string[];
  type: SlideType;
  isFirst: boolean;
  isLast: boolean;
}

export interface TemplateBuildContext {
  brand: BrandContext;
  format: SlideFormat;
}

export type SlideElements = Omit<Slide, "id" | "order" | "template" | "type" | "format">;

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  recommendedFor: SlideType[];
  build: (content: SlideContent, ctx: TemplateBuildContext) => SlideElements;
}

let elementCounter = 0;
export function elementId(prefix: string): string {
  elementCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${elementCounter}`;
}

export function findEmphasisRanges(text: string, emphasis: string[]) {
  const ranges: { start: number; end: number }[] = [];
  for (const term of emphasis) {
    if (!term) continue;
    const idx = text.toLowerCase().indexOf(term.toLowerCase());
    if (idx >= 0) {
      ranges.push({ start: idx, end: idx + term.length });
    }
  }
  return ranges;
}
