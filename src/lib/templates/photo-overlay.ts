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

const MARGIN = 72;

/**
 * Designed for a full-bleed photo background with a dark gradient overlay
 * for legibility - background.type defaults to "color" (a dark neutral) so
 * the slide still looks intentional even before/without an AI-generated
 * image; the generation route swaps in background.imageSrc when available.
 */
function build(content: SlideContent, ctx: TemplateBuildContext): SlideElements {
  const { width, height } = SLIDE_DIMENSIONS[ctx.format];
  const { brand } = ctx;
  const elements: SlideElement[] = [];

  elements.push({
    id: elementId("headline"),
    type: "text",
    role: "headline",
    zIndex: 0,
    x: MARGIN,
    y: height * 0.58,
    width: width - MARGIN * 2,
    height: height * 0.22,
    rotation: 0,
    opacity: 1,
    locked: false,
    hidden: false,
    text: content.headline,
    fontFamily: brand.fontHeading,
    fontSize: content.isFirst ? 68 : 52,
    fontWeight: 700,
    fontStyle: "normal",
    color: "#FFFFFF",
    align: "left",
    lineHeight: 1.15,
    letterSpacing: -0.5,
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
      zIndex: 1,
      x: MARGIN,
      y: height * 0.58 + height * 0.22 + 12,
      width: width - MARGIN * 2,
      height: height * 0.14,
      rotation: 0,
      opacity: 0.92,
      locked: false,
      hidden: false,
      text: content.body,
      fontFamily: brand.fontBody,
      fontSize: 30,
      fontWeight: 400,
      fontStyle: "normal",
      color: "#F5F5F5",
      align: "left",
      lineHeight: 1.3,
      letterSpacing: 0,
      emphasisRanges: [],
      autoFit: true,
      minFontSize: 20,
    });
  }

  const footerY = height - MARGIN - 40;
  if (brand.avatarUrl) {
    elements.push({
      id: elementId("avatar"),
      type: "avatar",
      zIndex: 2,
      x: MARGIN,
      y: footerY,
      width: 40,
      height: 40,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      assetId: null,
      src: brand.avatarUrl,
      borderColor: "#FFFFFF",
      borderWidth: 2,
    });
  }

  elements.push({
    id: elementId("handle"),
    type: "text",
    role: "handle",
    zIndex: 3,
    x: brand.avatarUrl ? MARGIN + 52 : MARGIN,
    y: footerY + 8,
    width: 400,
    height: 28,
    rotation: 0,
    opacity: 0.9,
    locked: false,
    hidden: false,
    text: brand.siteOrHandle || brand.instagramHandle,
    fontFamily: brand.fontBody,
    fontSize: 22,
    fontWeight: 500,
    fontStyle: "normal",
    color: "#FFFFFF",
    align: "left",
    lineHeight: 1.2,
    letterSpacing: 0,
    emphasisRanges: [],
    autoFit: false,
    minFontSize: 16,
  });

  return {
    background: {
      type: "color",
      color: "#111111",
      gradientAngle: 180,
      imageAssetId: null,
      imageSrc: null,
      overlayColor: "#000000",
      overlayOpacity: 0.55,
    },
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

export const photoOverlayTemplate: TemplateDefinition = {
  id: "photo-overlay",
  name: "Fotográfico com sobreposição",
  description:
    "Texto claro sobre uma imagem de fundo com camada escura para legibilidade. Pode usar imagem gerada por IA (Google) ou uma foto sua.",
  recommendedFor: ["hook", "context", "body", "conclusion", "cta"],
  build,
};
