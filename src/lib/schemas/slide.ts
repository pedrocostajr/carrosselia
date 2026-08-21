import { z } from "zod";

export const SLIDE_FORMATS = ["1080x1350", "1080x1080"] as const;
export type SlideFormat = (typeof SLIDE_FORMATS)[number];

export const SLIDE_DIMENSIONS: Record<SlideFormat, { width: number; height: number }> = {
  "1080x1350": { width: 1080, height: 1350 },
  "1080x1080": { width: 1080, height: 1080 },
};

export const slideFormatSchema = z.enum(SLIDE_FORMATS);

export const slideTypeSchema = z.enum([
  "hook",
  "context",
  "body",
  "conclusion",
  "cta",
  "social-post",
]);
export type SlideType = z.infer<typeof slideTypeSchema>;

export const emphasisRangeSchema = z.object({
  start: z.number().int().min(0),
  end: z.number().int().min(0),
});
export type EmphasisRange = z.infer<typeof emphasisRangeSchema>;

export const shadowStyleSchema = z.object({
  color: z.string().default("#000000"),
  blur: z.number().min(0).default(12),
  offsetX: z.number().default(0),
  offsetY: z.number().default(4),
  opacity: z.number().min(0).max(1).default(0.25),
});
export type ShadowStyle = z.infer<typeof shadowStyleSchema>;

const baseElementSchema = z.object({
  id: z.string(),
  zIndex: z.number().int().default(0),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  rotation: z.number().default(0),
  opacity: z.number().min(0).max(1).default(1),
  locked: z.boolean().default(false),
  hidden: z.boolean().default(false),
});

export const textElementSchema = baseElementSchema.extend({
  type: z.literal("text"),
  text: z.string(),
  role: z
    .enum(["headline", "body", "label", "caption", "handle", "displayName", "footer"])
    .default("body"),
  fontFamily: z.string().default("Inter"),
  fontSize: z.number().positive().default(48),
  fontWeight: z.number().int().default(600),
  fontStyle: z.enum(["normal", "italic"]).default("normal"),
  color: z.string().default("#111111"),
  align: z.enum(["left", "center", "right"]).default("left"),
  lineHeight: z.number().positive().default(1.2),
  letterSpacing: z.number().default(0),
  emphasisColor: z.string().optional(),
  emphasisRanges: z.array(emphasisRangeSchema).default([]),
  autoFit: z.boolean().default(true),
  minFontSize: z.number().positive().default(20),
});
export type TextElement = z.infer<typeof textElementSchema>;

export const imageElementSchema = baseElementSchema.extend({
  type: z.literal("image"),
  assetId: z.string().nullable().default(null),
  src: z.string().nullable().default(null),
  cropX: z.number().min(0).max(1).default(0),
  cropY: z.number().min(0).max(1).default(0),
  cropWidth: z.number().min(0).max(1).default(1),
  cropHeight: z.number().min(0).max(1).default(1),
  borderRadius: z.number().min(0).default(0),
  shadow: shadowStyleSchema.nullable().default(null),
});
export type ImageElement = z.infer<typeof imageElementSchema>;

export const shapeElementSchema = baseElementSchema.extend({
  type: z.literal("shape"),
  shape: z.enum(["rect", "ellipse", "line"]).default("rect"),
  fill: z.string().default("#000000"),
  stroke: z.string().nullable().default(null),
  strokeWidth: z.number().min(0).default(0),
  borderRadius: z.number().min(0).default(0),
});
export type ShapeElement = z.infer<typeof shapeElementSchema>;

export const avatarElementSchema = baseElementSchema.extend({
  type: z.literal("avatar"),
  assetId: z.string().nullable().default(null),
  src: z.string().nullable().default(null),
  borderColor: z.string().nullable().default(null),
  borderWidth: z.number().min(0).default(0),
});
export type AvatarElement = z.infer<typeof avatarElementSchema>;

export const logoElementSchema = baseElementSchema.extend({
  type: z.literal("logo"),
  assetId: z.string().nullable().default(null),
  src: z.string().nullable().default(null),
  variant: z.enum(["primary", "alternate"]).default("primary"),
});
export type LogoElement = z.infer<typeof logoElementSchema>;

export const slideElementSchema = z.discriminatedUnion("type", [
  textElementSchema,
  imageElementSchema,
  shapeElementSchema,
  avatarElementSchema,
  logoElementSchema,
]);
export type SlideElement = z.infer<typeof slideElementSchema>;

export const slideBackgroundSchema = z.object({
  type: z.enum(["color", "image", "gradient"]).default("color"),
  color: z.string().default("#FFFFFF"),
  gradientFrom: z.string().optional(),
  gradientTo: z.string().optional(),
  gradientAngle: z.number().default(180),
  imageAssetId: z.string().nullable().default(null),
  imageSrc: z.string().nullable().default(null),
  overlayColor: z.string().nullable().default(null),
  overlayOpacity: z.number().min(0).max(1).default(0),
});
export type SlideBackground = z.infer<typeof slideBackgroundSchema>;

export const slideSchema = z.object({
  id: z.string(),
  order: z.number().int().min(1),
  type: slideTypeSchema,
  template: z.string().default("minimal"),
  format: slideFormatSchema.default("1080x1350"),
  background: slideBackgroundSchema,
  elements: z.array(slideElementSchema).default([]),
  layerOrder: z.array(z.string()).default([]),
  locked: z.boolean().default(false),
  hidden: z.boolean().default(false),
  fontsUsed: z.array(z.string()).default([]),
  headline: z.string().optional(),
  body: z.string().optional(),
  transitionNote: z.string().optional(),
  safeMarginPx: z.number().min(0).default(64),
});
export type Slide = z.infer<typeof slideSchema>;

export const carouselSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string(),
  framework: z.string(),
  format: slideFormatSchema,
  brandKitId: z.string().nullable(),
  slides: z.array(slideSchema),
});
export type Carousel = z.infer<typeof carouselSchema>;
