export interface GeneratedImage {
  bytes: Buffer;
  mimeType: string;
}

/**
 * Abstraction over an image-generation backend, kept separate from
 * AIProvider (text/copy generation) since it is an independent, optional
 * capability - the app works fully without any implementation configured.
 */
export interface ImageProvider {
  readonly id: string;
  generateImage(prompt: string, aspectRatio: "portrait" | "square"): Promise<GeneratedImage>;
}

export class ImageGenerationError extends Error {
  constructor(message: string, public readonly userMessage: string) {
    super(message);
    this.name = "ImageGenerationError";
  }
}
