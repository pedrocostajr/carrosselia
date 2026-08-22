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

const MARGIN = 64;
const AVATAR_SIZE = 88;

function build(content: SlideContent, ctx: TemplateBuildContext): SlideElements {
  const { width, height } = SLIDE_DIMENSIONS[ctx.format];
  const { brand } = ctx;
  const elements: SlideElement[] = [];

  if (brand.avatarUrl) {
    elements.push({
      id: elementId("avatar"),
      type: "avatar",
      zIndex: 0,
      x: MARGIN,
      y: MARGIN,
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
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

  const textX = brand.avatarUrl ? MARGIN + AVATAR_SIZE + 20 : MARGIN;

  elements.push({
    id: elementId("displayName"),
    type: "text",
    role: "displayName",
    zIndex: 1,
    x: textX,
    y: MARGIN + 4,
    width: width - textX - MARGIN,
    height: 44,
    rotation: 0,
    opacity: 1,
    locked: false,
    hidden: false,
    text: brand.displayName,
    fontFamily: brand.fontBody,
    fontSize: 32,
    fontWeight: 700,
    fontStyle: "normal",
    color: brand.colorText,
    align: "left",
    lineHeight: 1.2,
    letterSpacing: 0,
    emphasisRanges: [],
    autoFit: false,
    minFontSize: 22,
  });

  elements.push({
    id: elementId("handle"),
    type: "text",
    role: "handle",
    zIndex: 2,
    x: textX,
    y: MARGIN + 48,
    width: width - textX - MARGIN,
    height: 36,
    rotation: 0,
    opacity: 0.7,
    locked: false,
    hidden: false,
    text: brand.instagramHandle,
    fontFamily: brand.fontBody,
    fontSize: 26,
    fontWeight: 400,
    fontStyle: "normal",
    color: brand.colorSecondary,
    align: "left",
    lineHeight: 1.2,
    letterSpacing: 0,
    emphasisRanges: [],
    autoFit: false,
    minFontSize: 18,
  });

  const bodyY = MARGIN + AVATAR_SIZE + 40;
  elements.push({
    id: elementId("body"),
    type: "text",
    role: "body",
    zIndex: 3,
    x: MARGIN,
    y: bodyY,
    width: width - MARGIN * 2,
    height: height - bodyY - MARGIN - 60,
    rotation: 0,
    opacity: 1,
    locked: false,
    hidden: false,
    text: content.isFirst && content.headline ? `${content.headline}\n\n${content.body}` : content.body,
    fontFamily: brand.fontBody,
    fontSize: 42,
    fontWeight: 400,
    fontStyle: "normal",
    color: brand.colorText,
    align: "left",
    lineHeight: 1.35,
    letterSpacing: 0,
    emphasisColor: brand.colorAccent,
    emphasisRanges: findEmphasisRanges(content.body, content.emphasis),
    autoFit: true,
    minFontSize: 26,
  });

  if (!content.isLast) {
    elements.push({
      id: elementId("continuation"),
      type: "text",
      role: "label",
      zIndex: 4,
      x: width - MARGIN - 160,
      y: height - MARGIN - 40,
      width: 160,
      height: 32,
      rotation: 0,
      opacity: 0.6,
      locked: false,
      hidden: false,
      text: "continua →",
      fontFamily: brand.fontBody,
      fontSize: 22,
      fontWeight: 500,
      fontStyle: "normal",
      color: brand.colorSecondary,
      align: "right",
      lineHeight: 1.2,
      letterSpacing: 0,
      emphasisRanges: [],
      autoFit: false,
      minFontSize: 16,
    });
  }

  if (brand.logoUrl) {
    elements.push({
      id: elementId("logo"),
      type: "logo",
      zIndex: 5,
      x: MARGIN,
      y: height - MARGIN - 40,
      width: 40,
      height: 40,
      rotation: 0,
      opacity: 0.9,
      locked: false,
      hidden: false,
      assetId: null,
      src: brand.logoUrl,
      variant: "primary",
    });
  }

  return {
    background: { type: "color", color: brand.colorBackground, gradientAngle: 180, imageAssetId: null, imageSrc: null, overlayColor: null, overlayOpacity: 0 },
    elements,
    layerOrder: elements.map((e) => e.id),
    locked: false,
    hidden: false,
    fontsUsed: [brand.fontBody],
    headline: content.headline,
    body: content.body,
    safeMarginPx: MARGIN,
  };
}

export const socialPostTemplate: TemplateDefinition = {
  id: "social-post",
  name: "Post social",
  description:
    "Inspirado na estrutura de uma postagem de rede social: foto de perfil, nome, @usuário e corpo do texto. Sem métricas falsas.",
  recommendedFor: ["social-post", "hook", "body"],
  build,
};
