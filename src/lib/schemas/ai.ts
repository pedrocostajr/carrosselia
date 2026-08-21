import { z } from "zod";

export const OBJECTIVES = [
  "educar",
  "gerar_comentarios",
  "gerar_compartilhamentos",
  "gerar_salvamentos",
  "atrair_seguidores",
  "vender",
  "gerar_leads",
  "fortalecer_autoridade",
] as const;
export const objectiveSchema = z.enum(OBJECTIVES);
export type Objective = z.infer<typeof objectiveSchema>;

export const TONES = [
  "serio",
  "formal",
  "provocativo",
  "didatico",
  "emocional",
  "descontraido",
  "direto",
  "personalizado",
] as const;
export const toneSchema = z.enum(TONES);
export type Tone = z.infer<typeof toneSchema>;

export const AWARENESS_LEVELS = [
  "inconsciente",
  "consciente_do_problema",
  "consciente_da_solucao",
  "consciente_do_produto",
  "muito_consciente",
] as const;
export const awarenessLevelSchema = z.enum(AWARENESS_LEVELS);

export const FRAMEWORKS = [
  "lista_pratica",
  "passo_a_passo",
  "mito_vs_verdade",
  "erros_comuns",
  "historia_com_aprendizado",
  "opiniao_forte",
  "antes_e_depois",
  "problema_consciencia_solucao",
  "quebra_de_crenca",
  "estudo_de_caso",
  "conteudo_educativo",
  "manifesto",
  "post_social",
] as const;
export const frameworkSchema = z.enum(FRAMEWORKS);
export type Framework = z.infer<typeof frameworkSchema>;

export const strategyInputSchema = z.object({
  audience: z.string().min(3).max(500),
  niche: z.string().min(2).max(200),
  objective: objectiveSchema,
  tone: toneSchema,
  customTone: z.string().max(200).optional(),
  awarenessLevel: awarenessLevelSchema,
  desiredCta: z.string().max(300).optional(),
  slideCount: z.number().int().min(3).max(15),
  creativity: z.number().min(0).max(1).default(0.5),
  mustInclude: z.string().max(1000).optional(),
  mustAvoid: z.string().max(1000).optional(),
});
export type StrategyInput = z.infer<typeof strategyInputSchema>;

export const hookOptionSchema = z.object({
  text: z.string(),
  reason: z.string(),
});

export const structurePreviewSchema = z.object({
  centralThesis: z.string(),
  angle: z.string(),
  promise: z.string(),
  hooks: z.array(hookOptionSchema).min(1),
  slideOutline: z.array(
    z.object({
      order: z.number().int(),
      type: z.string(),
      summary: z.string(),
    })
  ),
  suggestedCta: z.string(),
  whyItWorks: z.string(),
  recommendedFramework: frameworkSchema,
});
export type StructurePreview = z.infer<typeof structurePreviewSchema>;

export const aiSlideSchema = z.object({
  order: z.number().int().min(1),
  type: z.enum(["hook", "context", "body", "conclusion", "cta", "social-post"]),
  headline: z.string(),
  body: z.string(),
  emphasis: z.array(z.string()).default([]),
  visualSuggestion: z.string().default(""),
  transition: z.string().default(""),
});
export type AiSlide = z.infer<typeof aiSlideSchema>;

export const analysisSchema = z.object({
  centralThesis: z.string(),
  audiencePain: z.string(),
  contentMechanism: z.string(),
  recommendedFramework: frameworkSchema,
  originalityNotes: z.array(z.string()).default([]),
  factsToVerify: z.array(z.string()).default([]),
});

export const editorialCriterionSchema = z.object({
  label: z.string(),
  score: z.number().min(0).max(100),
});

export const editorialScoreSchema = z.object({
  total: z.number().min(0).max(100),
  criteria: z.array(editorialCriterionSchema),
  recommendations: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      slideOrder: z.number().int().nullable().default(null),
    })
  ),
});
export type EditorialScore = z.infer<typeof editorialScoreSchema>;

export const captionSchema = z.object({
  opening: z.string(),
  body: z.string(),
  cta: z.string(),
  hashtags: z.array(z.string()).default([]),
  pinnedComment: z.string(),
  altText: z.string(),
  titleOptions: z.array(z.string()).default([]),
});
export type CaptionResult = z.infer<typeof captionSchema>;

export const generationResultSchema = z.object({
  analysis: analysisSchema,
  hooks: z.array(hookOptionSchema).min(1),
  carousel: z.object({
    title: z.string(),
    slides: z.array(aiSlideSchema).min(1),
  }),
  caption: captionSchema,
  editorialScore: editorialScoreSchema,
});
export type GenerationResult = z.infer<typeof generationResultSchema>;

export const slideImprovementActionSchema = z.enum([
  "encurtar",
  "mais_forte",
  "mais_didatico",
  "mais_provocativo",
  "corrigir_portugues",
  "outra_versao",
  "dividir_em_dois",
  "resumir_em_uma_frase",
  "novo_titulo",
  "regenerar",
]);
export type SlideImprovementAction = z.infer<typeof slideImprovementActionSchema>;

export const slideImprovementResultSchema = z.object({
  headline: z.string(),
  body: z.string(),
  emphasis: z.array(z.string()).default([]),
  note: z.string().default(""),
});
export type SlideImprovementResult = z.infer<typeof slideImprovementResultSchema>;

export const splitSlideResultSchema = z.object({
  slides: z
    .array(
      z.object({
        headline: z.string(),
        body: z.string(),
      })
    )
    .length(2),
});
