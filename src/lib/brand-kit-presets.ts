import type { BrandKitInput } from "@/lib/schemas/brand-kit";

export interface BrandKitPreset {
  id: string;
  label: string;
  description: string;
  values: Pick<
    BrandKitInput,
    | "colorPrimary"
    | "colorSecondary"
    | "colorAccent"
    | "colorBackground"
    | "colorText"
    | "fontHeading"
    | "fontBody"
    | "buttonStyle"
    | "cornerRadius"
    | "visualStyle"
  >;
}

export const BRAND_KIT_PRESETS: BrandKitPreset[] = [
  {
    id: "minimal-light",
    label: "Minimalista claro",
    description: "Fundo branco, tipografia limpa e um único acento de cor.",
    values: {
      colorPrimary: "#111111",
      colorSecondary: "#6B7280",
      colorAccent: "#2563EB",
      colorBackground: "#FFFFFF",
      colorText: "#111111",
      fontHeading: "Inter",
      fontBody: "Inter",
      buttonStyle: "outline",
      cornerRadius: 20,
      visualStyle: "minimalista",
    },
  },
  {
    id: "minimal-dark",
    label: "Minimalista escuro",
    description: "Fundo escuro elegante com texto claro e acento vibrante.",
    values: {
      colorPrimary: "#F5F5F5",
      colorSecondary: "#A3A3A3",
      colorAccent: "#22D3EE",
      colorBackground: "#0A0A0A",
      colorText: "#F5F5F5",
      fontHeading: "Space Grotesk",
      fontBody: "Inter",
      buttonStyle: "solid",
      cornerRadius: 20,
      visualStyle: "minimalista",
    },
  },
  {
    id: "editorial",
    label: "Editorial sofisticado",
    description: "Serifa clássica, paleta neutra e tratamento de revista.",
    values: {
      colorPrimary: "#1C1917",
      colorSecondary: "#78716C",
      colorAccent: "#B45309",
      colorBackground: "#FAF9F6",
      colorText: "#1C1917",
      fontHeading: "Playfair Display",
      fontBody: "Lora",
      buttonStyle: "ghost",
      cornerRadius: 4,
      visualStyle: "editorial",
    },
  },
  {
    id: "high-contrast",
    label: "Alto contraste",
    description: "Preto e amarelo/branco puros para máximo impacto visual.",
    values: {
      colorPrimary: "#000000",
      colorSecondary: "#000000",
      colorAccent: "#FACC15",
      colorBackground: "#FFFFFF",
      colorText: "#000000",
      fontHeading: "Bebas Neue",
      fontBody: "Montserrat",
      buttonStyle: "solid",
      cornerRadius: 0,
      visualStyle: "forte",
    },
  },
  {
    id: "corporate",
    label: "Profissional corporativo",
    description: "Azul institucional, cinzas neutros e visual confiável.",
    values: {
      colorPrimary: "#1E3A8A",
      colorSecondary: "#475569",
      colorAccent: "#0EA5E9",
      colorBackground: "#FFFFFF",
      colorText: "#0F172A",
      fontHeading: "Montserrat",
      fontBody: "Inter",
      buttonStyle: "solid",
      cornerRadius: 8,
      visualStyle: "elegante",
    },
  },
  {
    id: "social-post",
    label: "Post social (estilo X)",
    description: "Visual limpo inspirado em posts de rede social, com fundo neutro.",
    values: {
      colorPrimary: "#0F1419",
      colorSecondary: "#536471",
      colorAccent: "#1D9BF0",
      colorBackground: "#FFFFFF",
      colorText: "#0F1419",
      fontHeading: "Inter",
      fontBody: "Inter",
      buttonStyle: "soft",
      cornerRadius: 999,
      visualStyle: "descontraido",
    },
  },
  {
    id: "photo-overlay",
    label: "Fotográfico com sobreposição",
    description: "Pensado para fotos de fundo com camada escura e texto branco.",
    values: {
      colorPrimary: "#FFFFFF",
      colorSecondary: "#E5E5E5",
      colorAccent: "#F97316",
      colorBackground: "#111111",
      colorText: "#FFFFFF",
      fontHeading: "DM Serif Display",
      fontBody: "Inter",
      buttonStyle: "solid",
      cornerRadius: 12,
      visualStyle: "forte",
    },
  },
];
