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

function build(content: SlideContent, ctx: TemplateBuildContext): SlideElements {
  const { width, height } = SLIDE_DIMENSIONS[ctx.format];
  const { brand } = ctx;
  const elements: SlideElement[] = [];

  const isCta = content.type === "cta";
  const headlineSize = content.isFirst ? 76 : isCta ? 60 : 52;

  elements.push({
    id: elementId("headline"),
    type: "text",
    role: "headline",
    zIndex: 0,
    x: MARGIN,
    y: content.isFirst ? height * 0.32 : MARGIN + 40,
    width: width - MARGIN * 2,
    height: content.isFirst ? height * 0.3 : 260,
    rotation: 0,
    opacity: 1,
    locked: false,
    hidden: false,
    text: content.headline,
    fontFamily: brand.fontHeading,
    fontSize: headlineSize,
    fontWeight: 700,
    fontStyle: "normal",
    color: isCta ? brand.colorBackground : brand.colorText,
    align: content.isFirst ? "left" : "left",
    lineHeight: 1.12,
    letterSpacing: -0.5,
    emphasisColor: brand.colorAccent,
    emphasisRanges: findEmphasisRanges(content.headline, content.emphasis),
    autoFit: true,
    minFontSize: 32,
  });

  if (content.body) {
    elements.push({
      id: elementId("body"),
      type: "text",
      role: "body",
      zIndex: 1,
      x: MARGIN,
      y: content.isFirst ? height * 0.32 + height * 0.3 + 24 : MARGIN + 40 + 280,
      width: width - MARGIN * 2,
      height: height * 0.32,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      text: content.body,
      fontFamily: brand.fontBody,
      fontSize: 34,
      fontWeight: 400,
      fontStyle: "normal",
      color: isCta ? brand.colorBackground : brand.colorSecondary,
      align: "left",
      lineHeight: 1.35,
      letterSpacing: 0,
      emphasisColor: brand.colorAccent,
      emphasisRanges: [],
      autoFit: true,
      minFontSize: 22,
    });
  }

  const footerY = height - MARGIN - 48;
  if (brand.avatarUrl) {
    elements.push({
      id: elementId("avatar"),
      type: "avatar",
      zIndex: 2,
      x: MARGIN,
      y: footerY,
      width: 48,
      height: 48,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      assetId: null,
      src: brand.avatarUrl,
      borderColor: null,
      borderWidth: 0,
    });
  }

  elements.push({
    id: elementId("handle"),
    type: "text",
    role: "handle",
    zIndex: 3,
    x: brand.avatarUrl ? MARGIN + 64 : MARGIN,
    y: footerY + 12,
    width: 400,
    height: 32,
    rotation: 0,
    opacity: 0.85,
    locked: false,
    hidden: false,
    text: brand.siteOrHandle || brand.instagramHandle,
    fontFamily: brand.fontBody,
    fontSize: 24,
    fontWeight: 500,
    fontStyle: "normal",
    color: isCta ? brand.colorBackground : brand.colorText,
    align: "left",
    lineHeight: 1.2,
    letterSpacing: 0,
    emphasisRanges: [],
    autoFit: false,
    minFontSize: 18,
  });

  if (brand.logoUrl) {
    elements.push({
      id: elementId("logo"),
      type: "logo",
      zIndex: 4,
      x: width - MARGIN - 56,
      y: footerY,
      width: 56,
      height: 56,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      assetId: null,
      src: brand.logoUrl,
      variant: "primary",
    });
  }

  return {
    background: { type: "color", color: isCta ? brand.colorPrimary : brand.colorBackground, gradientAngle: 180, imageAssetId: null, imageSrc: null, overlayColor: null, overlayOpacity: 0 },
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

export const minimalTemplate: TemplateDefinition = {
  id: "minimal",
  name: "Minimalista",
  description: "Título grande, texto de apoio e rodapé discreto com sua marca.",
  recommendedFor: ["hook", "context", "body", "conclusion", "cta"],
  build,
};
