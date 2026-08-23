import "server-only";

import type { ImageProvider, GeneratedImage } from "@/lib/ai/image/provider";
import { ImageGenerationError } from "@/lib/ai/image/provider";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

interface GeminiInlineDataPart {
  inlineData?: { mimeType: string; data: string };
}

interface GeminiGenerateContentResponse {
  candidates?: {
    content?: { parts?: GeminiInlineDataPart[] };
    finishReason?: string;
  }[];
  promptFeedback?: { blockReason?: string };
}

/**
 * Generates images with Google's Gemini image-generation model via the
 * Generative Language REST API (a plain API key, no service account/Vertex
 * setup required). Returns raw PNG/JPEG bytes so the caller can upload them
 * to Supabase Storage like any other asset.
 */
export class GoogleImageProvider implements ImageProvider {
  readonly id = "google-gemini";

  constructor(private apiKey: string, private model: string) {}

  async generateImage(
    prompt: string,
    aspectRatio: "portrait" | "square"
  ): Promise<GeneratedImage> {
    const url = `${API_BASE}/${this.model}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["IMAGE"],
        imageConfig: {
          aspectRatio: aspectRatio === "portrait" ? "4:5" : "1:1",
        },
      },
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      throw new ImageGenerationError(
        "network_error",
        "Não foi possível conectar ao serviço de geração de imagem do Google."
      );
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new ImageGenerationError(
        `gemini_http_${response.status}: ${errorText.slice(0, 300)}`,
        "O serviço de geração de imagem retornou um erro. Verifique se a GEMINI_API_KEY e o modelo configurados estão corretos."
      );
    }

    const json = (await response.json()) as GeminiGenerateContentResponse;

    if (json.promptFeedback?.blockReason) {
      throw new ImageGenerationError(
        `blocked: ${json.promptFeedback.blockReason}`,
        "A imagem não pôde ser gerada porque o pedido foi bloqueado pelo filtro de conteúdo do Google."
      );
    }

    const imagePart = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
    if (!imagePart?.inlineData) {
      throw new ImageGenerationError(
        "no_image_in_response",
        "O serviço de geração de imagem não retornou uma imagem. Tente novamente."
      );
    }

    return {
      bytes: Buffer.from(imagePart.inlineData.data, "base64"),
      mimeType: imagePart.inlineData.mimeType || "image/png",
    };
  }
}
