"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Copy, Download, Loader2 } from "lucide-react";

import { useEditorStore } from "@/store/editor-store";
import type { EditorData } from "@/lib/data/editor";
import { SLIDE_DIMENSIONS } from "@/lib/schemas/slide";
import { EXPORT_QUALITIES, QUALITY_LABELS, type ExportQuality } from "@/lib/export/types";
import { captureSlidesAsPngDataUrls } from "@/lib/export/capture-slides";
import { buildSlidesZip, downloadBlob } from "@/lib/export/build-zip";
import { buildCarouselPdf } from "@/lib/export/build-pdf";
import { collectImageSources } from "@/lib/export/collect-image-sources";
import { preloadImages, getCachedImage } from "@/lib/render/use-konva-image";
import { recordExportAction } from "@/app/editor/[projectId]/actions";
import { duplicateProjectAction } from "@/app/dashboard/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function ExportDialog({
  open,
  onOpenChange,
  project,
  carouselId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: EditorData["project"];
  carouselId: string;
  brandKit: EditorData["brandKit"];
}) {
  const slides = useEditorStore((s) => s.slides);
  const overflowingElements = useEditorStore((s) => s.overflowingElements);
  const [quality, setQuality] = useState<ExportQuality>("high");
  const [includePdf, setIncludePdf] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lowResChecked, setLowResChecked] = useState(false);
  const [lowResIds, setLowResIds] = useState<Set<string>>(new Set());

  const dimensions = SLIDE_DIMENSIONS[project.format];

  const issues = useMemo(() => {
    return slides.map((slide) => {
      const hasOverflow = slide.elements.some((el) => overflowingElements[el.id]);
      const hasVisibleMedia = slide.elements.some(
        (el) => (el.type === "image" || el.type === "logo" || el.type === "avatar") && el.src && !el.hidden
      );
      const hasVisibleText = slide.elements.some(
        (el) => el.type === "text" && el.text.trim() && !el.hidden
      );
      const isEmpty = !hasVisibleText && !hasVisibleMedia;
      const hasLowRes = slide.elements.some((el) => lowResIds.has(el.id));
      return { hasOverflow, isEmpty, hasLowRes };
    });
  }, [slides, overflowingElements, lowResIds]);

  useEffect(() => {
    if (!open || lowResChecked) return;
    (async () => {
      await preloadImages(collectImageSources(slides));
      const ids = new Set<string>();
      for (const slide of slides) {
        for (const el of slide.elements) {
          if (el.type === "image" || el.type === "logo" || el.type === "avatar") {
            const img = getCachedImage(el.src);
            if (img && img.naturalWidth > 0 && img.naturalWidth < el.width * 1.5) {
              ids.add(el.id);
            }
          }
        }
      }
      setLowResIds(ids);
      setLowResChecked(true);
    })();
  }, [open, lowResChecked, slides]);

  const hasBlockingOverflow = issues.some((i) => i.hasOverflow);

  async function handleExportZip() {
    setIsExporting(true);
    try {
      const pngs = await captureSlidesAsPngDataUrls(slides, quality);
      const files = slides.map((slide, i) => ({
        name: `slide-${pad(i + 1)}.png`,
        dataUrl: pngs.get(slide.id) ?? "",
      }));

      let extra: { name: string; bytes: Uint8Array } | undefined;
      if (includePdf) {
        const pdfBytes = await buildCarouselPdf(
          files.map((f) => f.dataUrl),
          project.format
        );
        extra = { name: "carrossel.pdf", bytes: pdfBytes };
      }

      const zipBlob = await buildSlidesZip(files, extra);
      downloadBlob(zipBlob, `${project.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.zip`);

      await recordExportAction({
        projectId: project.id,
        carouselId,
        format: project.format,
        quality,
        fileCount: files.length + (extra ? 1 : 0),
        pdfIncluded: includePdf,
      });

      toast.success("Exportação concluída.");
    } catch (err) {
      toast.error("Não foi possível exportar os slides.", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsExporting(false);
    }
  }

  async function handleExportSingle(slideId: string, index: number) {
    setIsExporting(true);
    try {
      const pngs = await captureSlidesAsPngDataUrls(
        slides.filter((s) => s.id === slideId),
        quality
      );
      const dataUrl = pngs.get(slideId);
      if (!dataUrl) throw new Error("Não foi possível gerar a imagem.");
      const blob = await (await fetch(dataUrl)).blob();
      downloadBlob(blob, `slide-${pad(index + 1)}.png`);
    } catch (err) {
      toast.error("Não foi possível exportar este slide.", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDuplicate() {
    try {
      await duplicateProjectAction(project.id);
      toast.success("Projeto duplicado. O original permanece intacto.");
    } catch (err) {
      toast.error("Não foi possível duplicar o projeto.", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Revisar e exportar</DialogTitle>
          <DialogDescription>
            {slides.length} slide(s) · {dimensions.width}×{dimensions.height}px
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-72">
          <div className="space-y-2 pr-4">
            {slides.map((slide, i) => {
              const issue = issues[i];
              return (
                <div
                  key={slide.id}
                  className="flex items-center justify-between rounded-md border p-2.5 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">#{pad(i + 1)}</span>
                    <span className="line-clamp-1 max-w-56">{slide.headline || "(sem título)"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {issue.hasOverflow && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="size-3" /> Overflow
                      </Badge>
                    )}
                    {issue.isEmpty && <Badge variant="secondary">Vazio</Badge>}
                    {issue.hasLowRes && <Badge variant="outline">Baixa resolução</Badge>}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isExporting}
                      onClick={() => handleExportSingle(slide.id, i)}
                    >
                      <Download className="size-3.5" /> PNG
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {hasBlockingOverflow && (
          <p className="flex items-center gap-2 rounded-md bg-destructive/5 p-2 text-xs text-destructive">
            <AlertTriangle className="size-3.5 shrink-0" />
            Um ou mais slides têm texto cortando a área segura. Ajuste o texto antes de exportar
            para evitar cortes na imagem final.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4 border-t pt-4">
          <div className="space-y-1.5">
            <Label>Qualidade</Label>
            <Select value={quality} onValueChange={(v) => setQuality(v as ExportQuality)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPORT_QUALITIES.map((q) => (
                  <SelectItem key={q} value={q}>
                    {QUALITY_LABELS[q]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 pt-5">
            <Checkbox
              id="include-pdf"
              checked={includePdf}
              onCheckedChange={(v) => setIncludePdf(Boolean(v))}
            />
            <Label htmlFor="include-pdf" className="font-normal">
              Incluir PDF do carrossel
            </Label>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={handleDuplicate}>
            <Copy className="size-4" /> Duplicar projeto antes de exportar
          </Button>
          <Button onClick={handleExportZip} disabled={isExporting || slides.length === 0}>
            {isExporting ? <Loader2 className="animate-spin" /> : <Download />}
            Baixar todos (ZIP)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
