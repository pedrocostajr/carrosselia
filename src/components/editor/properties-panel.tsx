"use client";

import { useEditorStore } from "@/store/editor-store";
import type { EditorData } from "@/lib/data/editor";
import { brandKitToContext } from "@/lib/templates/brand-context";
import { ElementProperties } from "@/components/editor/panels/element-properties";
import { AiSlideActions } from "@/components/editor/panels/ai-slide-actions";
import { ScorePanel } from "@/components/editor/panels/score-panel";
import { CaptionPanel } from "@/components/editor/panels/caption-panel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/empty-state";
import { MousePointerClick } from "lucide-react";

export function PropertiesPanel({
  carousel,
  brandKit,
  userId,
}: {
  carousel: EditorData["carousel"];
  brandKit: EditorData["brandKit"];
  userId: string;
}) {
  const activePanel = useEditorStore((s) => s.activePanel);
  const slides = useEditorStore((s) => s.slides);
  const selectedSlideId = useEditorStore((s) => s.selectedSlideId);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);

  const slide = slides.find((s) => s.id === selectedSlideId);
  const element = slide?.elements.find((e) => e.id === selectedElementId);
  const slideIndex = slides.findIndex((s) => s.id === selectedSlideId);
  const brand = brandKitToContext(brandKit);

  return (
    <div className="flex w-80 shrink-0 flex-col border-l bg-background">
      <ScrollArea className="flex-1">
        <div className="space-y-6 p-4">
          {activePanel === "score" && <ScorePanel audience={carousel.audience} />}
          {activePanel === "caption" && <CaptionPanel />}
          {activePanel === "properties" && (
            <>
              {element ? (
                <ElementProperties slide={slide!} element={element} userId={userId} />
              ) : (
                <EmptyState
                  icon={MousePointerClick}
                  title="Nenhum elemento selecionado"
                  description="Clique em um elemento no canvas para editar suas propriedades."
                  className="border-none py-8"
                />
              )}
              {slide && (
                <div className="border-t pt-4">
                  <AiSlideActions
                    slide={slide}
                    carouselTitle={carousel.title}
                    tone={carousel.tone}
                    brand={brand}
                    isLast={slideIndex === slides.length - 1}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
