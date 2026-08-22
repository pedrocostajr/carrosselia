import { PDFDocument } from "pdf-lib";

import { SLIDE_DIMENSIONS, type SlideFormat } from "@/lib/schemas/slide";

export async function buildCarouselPdf(
  pngDataUrls: string[],
  format: SlideFormat
): Promise<Uint8Array> {
  const { width, height } = SLIDE_DIMENSIONS[format];
  const pdfDoc = await PDFDocument.create();

  for (const dataUrl of pngDataUrls) {
    const base64 = dataUrl.split(",")[1] ?? "";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const image = await pdfDoc.embedPng(bytes);
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(image, { x: 0, y: 0, width, height });
  }

  return pdfDoc.save();
}
