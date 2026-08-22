import type { Objective, Tone, StructurePreview } from "@/lib/schemas/ai";
import type { SlideFormat } from "@/lib/schemas/slide";
import type { ExtractedContent } from "@/lib/schemas/content-source";

export type ContentOriginType = "url" | "text" | "topic";

export interface WizardState {
  step: 1 | 2 | 3 | 4;
  origin: {
    type: ContentOriginType;
    url: string;
    rawText: string;
    topic: string;
    editedText: string;
    extracted: ExtractedContent | null;
  };
  strategy: {
    audience: string;
    niche: string;
    objective: Objective;
    tone: Tone;
    customTone: string;
    awarenessLevel:
      | "inconsciente"
      | "consciente_do_problema"
      | "consciente_da_solucao"
      | "consciente_do_produto"
      | "muito_consciente";
    desiredCta: string;
    slideCount: number;
    creativity: number;
    mustInclude: string;
    mustAvoid: string;
  };
  structure: StructurePreview | null;
  chosenHook: string;
  brandKitId: string | null;
  templateId: string;
  format: SlideFormat;
}

export const INITIAL_WIZARD_STATE: WizardState = {
  step: 1,
  origin: {
    type: "topic",
    url: "",
    rawText: "",
    topic: "",
    editedText: "",
    extracted: null,
  },
  strategy: {
    audience: "",
    niche: "",
    objective: "educar",
    tone: "direto",
    customTone: "",
    awarenessLevel: "consciente_do_problema",
    desiredCta: "",
    slideCount: 7,
    creativity: 0.5,
    mustInclude: "",
    mustAvoid: "",
  },
  structure: null,
  chosenHook: "",
  brandKitId: null,
  templateId: "minimal",
  format: "1080x1350",
};
