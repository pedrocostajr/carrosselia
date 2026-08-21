import { z } from "zod";

export const contentSourceTypeSchema = z.enum(["url", "text", "topic"]);
export type ContentSourceType = z.infer<typeof contentSourceTypeSchema>;

export const extractRequestSchema = z.object({
  url: z
    .string()
    .url("Informe uma URL válida")
    .max(2048),
});
export type ExtractRequest = z.infer<typeof extractRequestSchema>;

export const extractedContentSchema = z.object({
  url: z.string(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  author: z.string().nullable(),
  imageUrl: z.string().nullable(),
  textContent: z.string(),
  siteName: z.string().nullable(),
  wordCount: z.number().int().min(0),
});
export type ExtractedContent = z.infer<typeof extractedContentSchema>;

export const contentOriginSchema = z.object({
  type: contentSourceTypeSchema,
  url: z.string().url().optional().or(z.literal("")),
  rawText: z.string().max(20000).optional(),
  topic: z.string().max(500).optional(),
  editedText: z.string().max(20000),
});
export type ContentOrigin = z.infer<typeof contentOriginSchema>;
