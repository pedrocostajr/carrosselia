import { z } from "zod";

import { strategyInputSchema, slideImprovementActionSchema, structurePreviewSchema } from "@/lib/schemas/ai";
import { slideFormatSchema } from "@/lib/schemas/slide";

const MAX_SOURCE_TEXT = 12000;

export const generationContextRequestSchema = z.object({
  sourceText: z.string().min(1).max(MAX_SOURCE_TEXT),
  sourceTitle: z.string().max(300).nullable().optional(),
  sourceUrl: z.string().max(2048).nullable().optional(),
  strategy: strategyInputSchema,
});

export const structurePreviewRequestSchema = generationContextRequestSchema;

export const generateRequestSchema = generationContextRequestSchema.extend({
  chosenHook: z.string().max(300).optional(),
  structure: structurePreviewSchema.optional(),
  brandKitId: z.string().uuid().nullable().optional(),
  templateId: z.string().min(1),
  format: slideFormatSchema,
  projectTitle: z.string().max(200).optional(),
  contentSourceType: z.enum(["url", "text", "topic"]),
  generateBackgroundImages: z.boolean().optional(),
});

export const slideImproveRequestSchema = z.object({
  action: slideImprovementActionSchema,
  slide: z.object({
    headline: z.string().max(500).optional(),
    body: z.string().max(2000).optional(),
  }),
  carouselTitle: z.string().max(200),
  tone: z.string().max(50),
});

export const splitSlideRequestSchema = z.object({
  slide: z.object({
    headline: z.string().max(500).optional(),
    body: z.string().max(2000).optional(),
  }),
  tone: z.string().max(50),
});

export const scoreRequestSchema = z.object({
  slides: z
    .array(
      z.object({
        headline: z.string().max(500).optional(),
        body: z.string().max(2000).optional(),
        type: z.string(),
      })
    )
    .min(1),
  audience: z.string().max(500),
});
