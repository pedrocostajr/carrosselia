import { GoogleImageProvider } from "@/lib/ai/image/google-image-provider";
import type { ImageProvider } from "@/lib/ai/image/provider";

export function isImageGenConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

let cachedProvider: ImageProvider | null | undefined;

/** Server-only factory. Returns null when no image-generation provider is configured. */
export function getImageProvider(): ImageProvider | null {
  if (cachedProvider !== undefined) return cachedProvider;

  const apiKey = process.env.GEMINI_API_KEY;
  cachedProvider = apiKey
    ? new GoogleImageProvider(apiKey, process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image")
    : null;

  return cachedProvider;
}

export type { ImageProvider } from "@/lib/ai/image/provider";
export { ImageGenerationError } from "@/lib/ai/image/provider";
