import { SLIDE_DIMENSIONS } from "@/lib/schemas/slide";
import type { SlideElement } from "@/lib/schemas/slide";
import {
  elementId,
  findEmphasisRanges,
  type SlideContent,
  type TemplateBuildContext,
  type TemplateDefinition,
  type SlideElements,
} from "@/lib/templates/types";

const MARGIN = 96;

function build(content: SlideContent, ctx: TemplateBuildContext): SlideElements {
  const { width, height } = SLIDE_DIMENSIONS[ctx.format];
  const { brand } = ctx;
  const elements: SlideElement[] = [];

  elements.push({
    id: elementId("rule"),
    type: "shape",
    zIndex: 0,
    x: width / 2 - 40,
    y: MARGIN,
    width: 80,
    height: 4,
    rotation: 0,
    opacity: 1,
    locked: false,
    hidden: false,
    shape: "rect",
    fill: brand.colorAccent,
    stroke: null,
    strokeWidth: 0,
    borderRadius: 2,
  });

  elements.push({
    id: elementId("headline"),
    type: "text",
    role: "headline",
    zIndex: 1,
    x: MARGIN,
    y: MARGIN + 48,
    width: width - MARGIN * 2,
    height: height * 0.38,
    rotation: 0,
    opacity: 1,
    locked: false,
    hidden: false,
    text: content.headline,
    fontFamily: brand.fontHeading,
    fontSize: content.isFirst ? 68 : 50,
    fontWeight: 600,
    fontStyle: "normal",
    color: brand.colorText,
    align: "center",
    lineHeight: 1.25,
    letterSpacing: 0,
    emphasisColor: brand.colorAccent,
    emphasisRanges: findEmphasisRanges(content.headline, content.emphasis),
    autoFit: true,
    minFontSize: 30,
  });

  if (content.body) {
    elements.push({
      id: elementId("body"),
      type: "text",
      role: "body",
      zIndex: 2,
      x: MARGIN + 24,
      y: MARGIN + 48 + height * 0.38 + 16,
      width: width - (MARGIN + 24) * 2,
      height: height * 0.28,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      text: content.body,
      fontFamily: brand.fontBody,
      fontSize: 30,
      fontWeight: 400,
      fontStyle: "italic",
      color: brand.colorSecondary,
      align: "center",
      lineHeight: 1.4,
      letterSpacing: 0,
      emphasisRanges: [],
      autoFit: true,
      minFontSize: 20,
    });
  }

  elements.push({
    id: elementId("handle"),
    type: "text",
    role: "handle",
    zIndex: 3,
    x: MARGIN,
    y: height - MARGIN - 32,
    width: width - MARGIN * 2,
    height: 32,
    rotation: 0,
    opacity: 0.8,
    locked: false,
    hidden: false,
    text: brand.siteOrHandle || brand.instagramHandle,
    fontFamily: brand.fontBody,
    fontSize: 22,
    fontWeight: 500,
    fontStyle: "normal",
    color: brand.colorText,
    align: "center",
    lineHeight: 1.2,
    letterSpacing: 2,
    emphasisRanges: [],
    autoFit: false,
    minFontSize: 16,
  });

  return {
    background: { type: "color", color: brand.colorBackground, gradientAngle: 180, imageAssetId: null, imageSrc: null, overlayColor: null, overlayOpacity: 0 },
    elements,
    layerOrder: elements.map((e) => e.id),
    locked: false,
    hidden: false,
    fontsUsed: [brand.fontHeading, brand.fontBody],
    headline: content.headline,
    body: content.body,
    safeMarginPx: MARGIN,
  };
}

export const editorialTemplate: TemplateDefinition = {
  id: "editorial",
  name: "Editorial",
  description: "Composição centralizada com serifa e tratamento de revista.",
  recommendedFor: ["hook", "context", "body", "conclusion", "cta"],
  build,
};
