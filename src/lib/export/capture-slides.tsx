"use client";

import { createRoot } from "react-dom/client";
import type Konva from "konva";

import { ExportCapture } from "@/components/editor/export-capture";
import { preloadImages } from "@/lib/render/use-konva-image";
import { ensureFontsLoaded } from "@/lib/fonts/google-fonts";
import { collectImageSources } from "@/lib/export/collect-image-sources";
import { QUALITY_PIXEL_RATIO, type ExportQuality } from "@/lib/export/types";
import type { Slide } from "@/lib/schemas/slide";

/**
 * Renders every slide to a PNG data URL at the requested quality. Waits for
 * every font (document.fonts) and every image referenced by the slides to
 * finish loading before capturing, so the export never silently ships with
 * missing assets or fallback fonts.
 */
export async function captureSlidesAsPngDataUrls(
  slides: Slide[],
  quality: ExportQuality
): Promise<Map<string, string>> {
  const fonts = Array.from(new Set(slides.flatMap((s) => s.fontsUsed)));
  await ensureFontsLoaded(fonts);
  await preloadImages(collectImageSources(slides));

  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  try {
    const stages = await new Promise<Record<string, Konva.Stage>>((resolve) => {
      root.render(<ExportCapture slides={slides} onReady={resolve} />);
    });

    const pixelRatio = QUALITY_PIXEL_RATIO[quality];
    const result = new Map<string, string>();
    for (const slide of slides) {
      const stage = stages[slide.id];
      if (stage) {
        result.set(slide.id, stage.toDataURL({ pixelRatio, mimeType: "image/png" }));
      }
    }
    return result;
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
}
