"use client";

import { useMemo, useRef } from "react";

import { useEditorStore } from "@/store/editor-store";
import { SLIDE_DIMENSIONS } from "@/lib/schemas/slide";
import { SlideStage } from "@/lib/render/slide-stage";
import { TextEditOverlay } from "@/components/editor/text-edit-overlay";
import { EmptyState } from "@/components/empty-state";
import { ImageIcon } from "lucide-react";

const MOBILE_FRAME_SCALE = 0.85;

export function SlideCanvas() {
  const slides = useEditorStore((s) => s.slides);
  const selectedSlideId = useEditorStore((s) => s.selectedSlideId);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const editingElementId = useEditorStore((s) => s.editingElementId);
  const selectElement = useEditorStore((s) => s.selectElement);
  const updateElement = useEditorStore((s) => s.updateElement);
  const setOverflow = useEditorStore((s) => s.setOverflow);
  const startEditText = useEditorStore((s) => s.startEditText);
  const zoom = useEditorStore((s) => s.zoom);
  const viewMode = useEditorStore((s) => s.viewMode);

  const containerRef = useRef<HTMLDivElement>(null);

  const slide = slides.find((s) => s.id === selectedSlideId);
  const dimensions = slide ? SLIDE_DIMENSIONS[slide.format] : null;

  const scale = useMemo(() => {
    const base = viewMode === "mobile" ? MOBILE_FRAME_SCALE * 0.55 : 0.55;
    return base * zoom;
  }, [zoom, viewMode]);

  if (!slide || !dimensions) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState icon={ImageIcon} title="Nenhum slide selecionado" />
      </div>
    );
  }

  const editingElement =
    editingElementId && slide.elements.find((e) => e.id === editingElementId && e.type === "text");

  return (
    <div className="flex flex-1 items-center justify-center overflow-auto bg-neutral-100 p-8 dark:bg-neutral-900">
      <div
        ref={containerRef}
        className="relative shadow-2xl"
        style={{ width: dimensions.width * scale, height: dimensions.height * scale }}
      >
        <SlideStage
          slide={slide}
          scale={scale}
          interactive
          selectedElementId={selectedElementId}
          onSelectElement={selectElement}
          onCommitElement={(elementId, patch) => updateElement(slide.id, elementId, patch, true)}
          onOverflowChange={setOverflow}
          editingElementId={editingElementId}
          onStartEditText={(id) => startEditText(id)}
        />

        {editingElement && editingElement.type === "text" && (
          <TextEditOverlay
            element={editingElement}
            containerScale={scale}
            onCommit={(text) => {
              updateElement(slide.id, editingElement.id, { text }, true);
              startEditText(null);
            }}
            onCancel={() => startEditText(null)}
          />
        )}
      </div>
    </div>
  );
}
