"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import type { EditorData } from "@/lib/data/editor";
import { useEditorStore } from "@/store/editor-store";
import { saveCarouselAction } from "@/app/editor/[projectId]/actions";
import { EditorTopbar } from "@/components/editor/editor-topbar";
import { SlideThumbnails } from "@/components/editor/slide-thumbnails";
import { SlideCanvas } from "@/components/editor/slide-canvas";
import { CanvasToolbar } from "@/components/editor/canvas-toolbar";
import { PropertiesPanel } from "@/components/editor/properties-panel";
import { GoogleFontsLoader } from "@/components/brand/google-fonts-loader";

const AUTOSAVE_DELAY_MS = 1500;

export function EditorShell({ data, userId }: { data: EditorData; userId: string }) {
  const init = useEditorStore((s) => s.init);
  const slides = useEditorStore((s) => s.slides);
  const isDirty = useEditorStore((s) => s.isDirty);
  const setSaving = useEditorStore((s) => s.setSaving);
  const markSaved = useEditorStore((s) => s.markSaved);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const copyElement = useEditorStore((s) => s.copyElement);
  const pasteElement = useEditorStore((s) => s.pasteElement);
  const selectedSlideId = useEditorStore((s) => s.selectedSlideId);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const deleteElementFromSlide = useEditorStore((s) => s.updateSlide);

  const initialized = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    init(data.project.id, data.carousel.id, data.slides, data.carousel.caption, data.carousel.editorialScore);
  }, [data, init]);

  useEffect(() => {
    if (!isDirty || !data.carousel.id) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        await saveCarouselAction(data.carousel.id, slides);
        markSaved();
      } catch (err) {
        toast.error("Não foi possível salvar automaticamente.", {
          description: err instanceof Error ? err.message : undefined,
        });
        setSaving(false);
      }
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides, isDirty]);

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA" || target.tagName === "INPUT" || target.isContentEditable) {
        return;
      }
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (isMod && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      } else if (isMod && e.key.toLowerCase() === "c" && selectedElementId) {
        copyElement(selectedElementId);
      } else if (isMod && e.key.toLowerCase() === "v" && selectedSlideId) {
        pasteElement(selectedSlideId);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedSlideId && selectedElementId) {
          e.preventDefault();
          deleteElementFromSlide(selectedSlideId, (slide) => ({
            ...slide,
            elements: slide.elements.filter((el) => el.id !== selectedElementId),
            layerOrder: slide.layerOrder.filter((id) => id !== selectedElementId),
          }));
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, copyElement, pasteElement, selectedElementId, selectedSlideId, deleteElementFromSlide]);

  const fontFamilies = Array.from(
    new Set(slides.flatMap((s) => s.elements.filter((e) => e.type === "text").map((e) => e.fontFamily)))
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-muted/20">
      <GoogleFontsLoader families={fontFamilies} />
      <EditorTopbar project={data.project} brandKit={data.brandKit} carouselId={data.carousel.id} />
      <div className="flex min-h-0 flex-1">
        <SlideThumbnails brandKit={data.brandKit} />
        <div className="flex min-w-0 flex-1 flex-col">
          <CanvasToolbar userId={userId} brandKit={data.brandKit} />
          <SlideCanvas />
        </div>
        <PropertiesPanel carousel={data.carousel} brandKit={data.brandKit} userId={userId} />
      </div>
    </div>
  );
}
