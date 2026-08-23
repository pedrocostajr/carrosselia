const STYLE_HINTS: Record<string, string> = {
  minimalista: "minimalist, clean, lots of negative space, soft natural light",
  elegante: "elegant, refined, soft cinematic lighting, muted palette",
  forte: "bold, high contrast, dramatic lighting, strong composition",
  editorial: "editorial photography style, magazine-quality, sophisticated",
  descontraido: "candid, warm, approachable, natural lighting",
};

/**
 * Builds a text-to-image prompt for a slide's background photo. Explicitly
 * forbids rendering text/letters in the image itself, since the slide's own
 * text elements are drawn on top by the app - an AI-generated image with
 * garbled embedded text would look broken.
 */
export function buildImagePrompt(params: {
  headline: string;
  visualSuggestion: string;
  niche: string;
  visualStyle: string;
}): string {
  const styleHint = STYLE_HINTS[params.visualStyle] || STYLE_HINTS.minimalista;

  return [
    `A high-quality background photograph for a social media post about "${params.headline}",`,
    `in the "${params.niche}" niche.`,
    params.visualSuggestion ? `Visual direction: ${params.visualSuggestion}.` : "",
    `Style: ${styleHint}.`,
    "Portrait-friendly composition with clear, uncluttered space in the lower half of the frame for text overlay.",
    "Absolutely no text, no letters, no words, no typography, no watermarks, no logos anywhere in the image.",
    "Photorealistic or tasteful illustration, no people's faces in close-up unless essential to the subject.",
  ]
    .filter(Boolean)
    .join(" ");
}
