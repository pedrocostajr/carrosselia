"use client";

import { useEffect, useRef } from "react";
import type Konva from "konva";

import { SlideStage } from "@/lib/render/slide-stage";
import type { Slide } from "@/lib/schemas/slide";

/**
 * Renders every slide off-screen at full resolution (scale=1) using the
 * exact same SlideStage component the editor canvas uses, so the exported
 * PNG always matches what was seen while editing. Calls onReady once all
 * stages have committed their first paint.
 */
export function ExportCapture({
  slides,
  onReady,
}: {
  slides: Slide[];
  onReady: (stages: Record<string, Konva.Stage>) => void;
}) {
  const refs = useRef<Record<string, Konva.Stage | null>>({});
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const stages: Record<string, Konva.Stage> = {};
        for (const slide of slides) {
          const stage = refs.current[slide.id];
          if (stage) stages[slide.id] = stage;
        }
        onReady(stages);
      });
    });
  }, [slides, onReady]);

  return (
    <div style={{ position: "fixed", top: -100000, left: -100000, pointerEvents: "none" }} aria-hidden>
      {slides.map((slide) => (
        <SlideStage
          key={slide.id}
          slide={slide}
          scale={1}
          interactive={false}
          stageRef={(node) => {
            refs.current[slide.id] = node;
          }}
        />
      ))}
    </div>
  );
}
