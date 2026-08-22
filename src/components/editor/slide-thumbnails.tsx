"use client";

import { useState } from "react";
import { AlertTriangle, Copy, Eye, EyeOff, Lock, LockOpen, Plus, Trash2 } from "lucide-react";

import { useEditorStore } from "@/store/editor-store";
import type { EditorData } from "@/lib/data/editor";
import { SLIDE_DIMENSIONS } from "@/lib/schemas/slide";
import { TEMPLATES } from "@/lib/templates/registry";
import { rebuildSlideWithTemplate } from "@/lib/templates/rebuild-slide";
import { brandKitToContext } from "@/lib/templates/brand-context";
import { SlideStage } from "@/lib/render/slide-stage";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const THUMB_SCALE = 0.11;

export function SlideThumbnails({ brandKit }: { brandKit: EditorData["brandKit"] }) {
  const slides = useEditorStore((s) => s.slides);
  const selectedSlideId = useEditorStore((s) => s.selectedSlideId);
  const selectSlide = useEditorStore((s) => s.selectSlide);
  const addSlide = useEditorStore((s) => s.addSlide);
  const duplicateSlide = useEditorStore((s) => s.duplicateSlide);
  const deleteSlide = useEditorStore((s) => s.deleteSlide);
  const reorderSlides = useEditorStore((s) => s.reorderSlides);
  const updateSlide = useEditorStore((s) => s.updateSlide);
  const overflowingElements = useEditorStore((s) => s.overflowingElements);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const brandContext = brandKitToContext(brandKit);

  function handleAddSlide() {
    const format = slides[0]?.format ?? "1080x1350";
    const newSlide = rebuildSlideWithTemplate(
      {
        id: crypto.randomUUID(),
        order: slides.length + 1,
        type: "body",
        template: "minimal",
        format,
        background: { type: "color", color: brandContext.colorBackground, gradientAngle: 180, imageAssetId: null, imageSrc: null, overlayColor: null, overlayOpacity: 0 },
        elements: [],
        layerOrder: [],
        locked: false,
        hidden: false,
        fontsUsed: [],
        headline: "Novo slide",
        body: "Edite este texto.",
        safeMarginPx: 72,
      },
      "minimal",
      brandContext,
      false,
      false
    );
    addSlide(newSlide);
  }

  function handleTemplateChange(slideId: string, templateId: string) {
    const slide = slides.find((s) => s.id === slideId);
    if (!slide) return;
    const index = slides.findIndex((s) => s.id === slideId);
    const rebuilt = rebuildSlideWithTemplate(
      slide,
      templateId,
      brandContext,
      index === 0,
      index === slides.length - 1
    );
    updateSlide(slideId, () => rebuilt);
  }

  return (
    <div className="flex w-56 shrink-0 flex-col border-r bg-background">
      <div className="flex items-center justify-between border-b p-2.5">
        <p className="text-xs font-medium text-muted-foreground">
          {slides.length} slide{slides.length !== 1 ? "s" : ""}
        </p>
        <Button variant="ghost" size="icon" className="size-7" onClick={handleAddSlide}>
          <Plus className="size-4" />
        </Button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-2.5">
        {slides.map((slide, index) => {
          const { width, height } = SLIDE_DIMENSIONS[slide.format];
          const hasOverflow = slide.elements.some((el) => overflowingElements[el.id]);
          const isSelected = slide.id === selectedSlideId;

          return (
            <div
              key={slide.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null && dragIndex !== index) reorderSlides(dragIndex, index);
                setDragIndex(null);
              }}
              className={cn(
                "group relative cursor-pointer rounded-md border-2 p-1.5 transition-colors",
                isSelected ? "border-primary" : "border-transparent hover:border-muted-foreground/30"
              )}
              onClick={() => selectSlide(slide.id)}
            >
              <div
                className="pointer-events-none overflow-hidden rounded"
                style={{ width: width * THUMB_SCALE, height: height * THUMB_SCALE }}
              >
                <SlideStage slide={slide} scale={THUMB_SCALE} interactive={false} />
              </div>

              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">#{index + 1}</span>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                  {hasOverflow && <AlertTriangle className="size-3 text-destructive" />}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-5"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateSlide(slide.id, (s) => ({ ...s, locked: !s.locked }));
                    }}
                  >
                    {slide.locked ? <Lock className="size-3" /> : <LockOpen className="size-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-5"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateSlide(slide.id, (s) => ({ ...s, hidden: !s.hidden }));
                    }}
                  >
                    {slide.hidden ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-5"
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateSlide(slide.id);
                    }}
                  >
                    <Copy className="size-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-5"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(slide.id);
                    }}
                  >
                    <Trash2 className="size-3 text-destructive" />
                  </Button>
                </div>
              </div>

              <Select value={slide.template} onValueChange={(v) => handleTemplateChange(slide.id, v)}>
                <SelectTrigger className="mt-1 h-6 w-full text-[10px]" onClick={(e) => e.stopPropagation()}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map((tpl) => (
                    <SelectItem key={tpl.id} value={tpl.id}>
                      {tpl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir slide</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) deleteSlide(deleteTarget);
                setDeleteTarget(null);
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
