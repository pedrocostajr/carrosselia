import { beforeEach, describe, expect, it } from "vitest";

import { useEditorStore } from "@/store/editor-store";
import type { Slide } from "@/lib/schemas/slide";

function makeSlide(id: string, order: number): Slide {
  return {
    id,
    order,
    type: "body",
    template: "minimal",
    format: "1080x1350",
    background: {
      type: "color",
      color: "#FFFFFF",
      gradientAngle: 180,
      imageAssetId: null,
      imageSrc: null,
      overlayColor: null,
      overlayOpacity: 0,
    },
    elements: [],
    layerOrder: [],
    locked: false,
    hidden: false,
    fontsUsed: [],
    headline: `Slide ${order}`,
    body: "",
    safeMarginPx: 64,
  };
}

describe("useEditorStore", () => {
  beforeEach(() => {
    useEditorStore.getState().init("project-1", "carousel-1", [
      makeSlide("s1", 1),
      makeSlide("s2", 2),
      makeSlide("s3", 3),
    ]);
  });

  it("reorders slides and renumbers order", () => {
    useEditorStore.getState().reorderSlides(0, 2);
    const { slides } = useEditorStore.getState();
    expect(slides.map((s) => s.id)).toEqual(["s2", "s3", "s1"]);
    expect(slides.map((s) => s.order)).toEqual([1, 2, 3]);
  });

  it("duplicates a slide with a new id right after the original", () => {
    useEditorStore.getState().duplicateSlide("s1");
    const { slides } = useEditorStore.getState();
    expect(slides).toHaveLength(4);
    expect(slides[0].id).toBe("s1");
    expect(slides[1].id).not.toBe("s1");
    expect(slides[1].headline).toBe("Slide 1");
  });

  it("deletes a slide and renumbers the remaining ones", () => {
    useEditorStore.getState().deleteSlide("s2");
    const { slides } = useEditorStore.getState();
    expect(slides.map((s) => s.id)).toEqual(["s1", "s3"]);
    expect(slides.map((s) => s.order)).toEqual([1, 2]);
  });

  it("supports undo/redo across a mutation", () => {
    useEditorStore.getState().deleteSlide("s2");
    expect(useEditorStore.getState().slides).toHaveLength(2);

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().slides).toHaveLength(3);

    useEditorStore.getState().redo();
    expect(useEditorStore.getState().slides).toHaveLength(2);
  });

  it("marks the store dirty after a mutation and clean after markSaved", () => {
    expect(useEditorStore.getState().isDirty).toBe(false);
    useEditorStore.getState().deleteSlide("s3");
    expect(useEditorStore.getState().isDirty).toBe(true);
    useEditorStore.getState().markSaved();
    expect(useEditorStore.getState().isDirty).toBe(false);
  });
});
