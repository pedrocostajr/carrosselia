import JSZip from "jszip";

export async function buildSlidesZip(
  pngs: { name: string; dataUrl: string }[],
  extra?: { name: string; bytes: Uint8Array }
): Promise<Blob> {
  const zip = new JSZip();
  for (const png of pngs) {
    const base64 = png.dataUrl.split(",")[1] ?? "";
    zip.file(png.name, base64, { base64: true });
  }
  if (extra) {
    zip.file(extra.name, extra.bytes);
  }
  return zip.generateAsync({ type: "blob" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(",");
  const mime = meta.match(/data:(.*);base64/)?.[1] ?? "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
