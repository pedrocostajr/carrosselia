import { create } from "zustand";

import type { Slide, SlideElement } from "@/lib/schemas/slide";
import type { CaptionResult, EditorialScore } from "@/lib/schemas/ai";

const MAX_HISTORY = 30;

interface EditorState {
  projectId: string;
  carouselId: string;
  slides: Slide[];
  caption: CaptionResult | null;
  editorialScore: EditorialScore | null;
  selectedSlideId: string | null;
  selectedElementId: string | null;
  editingElementId: string | null;
  overflowingElements: Record<string, boolean>;
  history: Slide[][];
  future: Slide[][];
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: number | null;
  clipboardElement: SlideElement | null;
  zoom: number;
  viewMode: "desktop" | "mobile";
  activePanel: "properties" | "score" | "caption";

  init: (
    projectId: string,
    carouselId: string,
    slides: Slide[],
    caption?: CaptionResult | null,
    editorialScore?: EditorialScore | null
  ) => void;
  setCaption: (caption: CaptionResult) => void;
  setEditorialScore: (score: EditorialScore) => void;
  selectSlide: (id: string | null) => void;
  selectElement: (id: string | null) => void;
  startEditText: (id: string | null) => void;
  setOverflow: (elementId: string, overflow: boolean) => void;

  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  updateSlide: (slideId: string, updater: (slide: Slide) => Slide, commit?: boolean) => void;
  updateElement: (
    slideId: string,
    elementId: string,
    patch: Partial<SlideElement>,
    commit?: boolean
  ) => void;
  addSlide: (slide: Slide, atIndex?: number) => void;
  duplicateSlide: (slideId: string) => void;
  deleteSlide: (slideId: string) => void;
  reorderSlides: (fromIndex: number, toIndex: number) => void;
  replaceSlide: (slideId: string, next: Slide) => void;

  copyElement: (elementId: string) => void;
  pasteElement: (slideId: string) => void;

  markSaved: () => void;
  setSaving: (saving: boolean) => void;
  setZoom: (zoom: number) => void;
  setViewMode: (mode: "desktop" | "mobile") => void;
  setActivePanel: (panel: "properties" | "score" | "caption") => void;
}

function cloneSlides(slides: Slide[]): Slide[] {
  return slides.map((s) => ({ ...s, elements: s.elements.map((e) => ({ ...e })) }));
}

export const useEditorStore = create<EditorState>((set, get) => ({
  projectId: "",
  carouselId: "",
  slides: [],
  caption: null,
  editorialScore: null,
  selectedSlideId: null,
  selectedElementId: null,
  editingElementId: null,
  overflowingElements: {},
  history: [],
  future: [],
  isDirty: false,
  isSaving: false,
  lastSavedAt: null,
  clipboardElement: null,
  zoom: 1,
  viewMode: "desktop",
  activePanel: "properties",

  init: (projectId, carouselId, slides, caption = null, editorialScore = null) =>
    set({
      projectId,
      carouselId,
      slides,
      caption,
      editorialScore,
      selectedSlideId: slides[0]?.id ?? null,
      selectedElementId: null,
      history: [],
      future: [],
      isDirty: false,
    }),
  setCaption: (caption) => set({ caption }),
  setEditorialScore: (editorialScore) => set({ editorialScore }),

  selectSlide: (id) => set({ selectedSlideId: id, selectedElementId: null, editingElementId: null }),
  selectElement: (id) => set({ selectedElementId: id }),
  startEditText: (id) => set({ editingElementId: id }),
  setOverflow: (elementId, overflow) =>
    set((state) => ({ overflowingElements: { ...state.overflowingElements, [elementId]: overflow } })),

  pushHistory: () =>
    set((state) => ({
      history: [...state.history.slice(-MAX_HISTORY + 1), cloneSlides(state.slides)],
      future: [],
    })),

  undo: () => {
    const { history, slides, future } = get();
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    set({
      slides: previous,
      history: history.slice(0, -1),
      future: [cloneSlides(slides), ...future].slice(0, MAX_HISTORY),
      isDirty: true,
    });
  },

  redo: () => {
    const { future, slides, history } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({
      slides: next,
      future: future.slice(1),
      history: [...history, cloneSlides(slides)].slice(-MAX_HISTORY),
      isDirty: true,
    });
  },

  updateSlide: (slideId, updater, commit = true) => {
    if (commit) get().pushHistory();
    set((state) => ({
      slides: state.slides.map((s) => (s.id === slideId ? updater(s) : s)),
      isDirty: true,
    }));
  },

  updateElement: (slideId, elementId, patch, commit = true) => {
    if (commit) get().pushHistory();
    set((state) => ({
      slides: state.slides.map((s) =>
        s.id !== slideId
          ? s
          : {
              ...s,
              elements: s.elements.map((e) => (e.id === elementId ? ({ ...e, ...patch } as SlideElement) : e)),
            }
      ),
      isDirty: true,
    }));
  },

  addSlide: (slide, atIndex) => {
    get().pushHistory();
    set((state) => {
      const slides = [...state.slides];
      const index = atIndex ?? slides.length;
      slides.splice(index, 0, slide);
      return {
        slides: slides.map((s, i) => ({ ...s, order: i + 1 })),
        selectedSlideId: slide.id,
        isDirty: true,
      };
    });
  },

  duplicateSlide: (slideId) => {
    get().pushHistory();
    set((state) => {
      const index = state.slides.findIndex((s) => s.id === slideId);
      if (index === -1) return state;
      const original = state.slides[index];
      const idMap = new Map<string, string>();
      const newElements = original.elements.map((e) => {
        const newId = crypto.randomUUID();
        idMap.set(e.id, newId);
        return { ...e, id: newId };
      });
      const duplicate: Slide = {
        ...original,
        id: crypto.randomUUID(),
        elements: newElements,
        layerOrder: original.layerOrder.map((id) => idMap.get(id) ?? id),
      };
      const slides = [...state.slides];
      slides.splice(index + 1, 0, duplicate);
      return {
        slides: slides.map((s, i) => ({ ...s, order: i + 1 })),
        selectedSlideId: duplicate.id,
        isDirty: true,
      };
    });
  },

  deleteSlide: (slideId) => {
    get().pushHistory();
    set((state) => {
      const slides = state.slides.filter((s) => s.id !== slideId).map((s, i) => ({ ...s, order: i + 1 }));
      const wasSelected = state.selectedSlideId === slideId;
      return {
        slides,
        selectedSlideId: wasSelected ? slides[0]?.id ?? null : state.selectedSlideId,
        selectedElementId: wasSelected ? null : state.selectedElementId,
        isDirty: true,
      };
    });
  },

  reorderSlides: (fromIndex, toIndex) => {
    get().pushHistory();
    set((state) => {
      const slides = [...state.slides];
      const [moved] = slides.splice(fromIndex, 1);
      slides.splice(toIndex, 0, moved);
      return { slides: slides.map((s, i) => ({ ...s, order: i + 1 })), isDirty: true };
    });
  },

  replaceSlide: (slideId, next) => {
    get().pushHistory();
    set((state) => ({
      slides: state.slides.map((s) => (s.id === slideId ? next : s)),
      isDirty: true,
    }));
  },

  copyElement: (elementId) => {
    const slide = get().slides.find((s) => s.id === get().selectedSlideId);
    const el = slide?.elements.find((e) => e.id === elementId);
    if (el) set({ clipboardElement: el });
  },

  pasteElement: (slideId) => {
    const { clipboardElement } = get();
    if (!clipboardElement) return;
    get().pushHistory();
    const newEl = { ...clipboardElement, id: crypto.randomUUID(), x: clipboardElement.x + 24, y: clipboardElement.y + 24 };
    set((state) => ({
      slides: state.slides.map((s) =>
        s.id === slideId
          ? { ...s, elements: [...s.elements, newEl], layerOrder: [...s.layerOrder, newEl.id] }
          : s
      ),
      selectedElementId: newEl.id,
      isDirty: true,
    }));
  },

  markSaved: () => set({ isDirty: false, isSaving: false, lastSavedAt: Date.now() }),
  setSaving: (saving) => set({ isSaving: saving }),
  setZoom: (zoom) => set({ zoom }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setActivePanel: (panel) => set({ activePanel: panel }),
}));
