import type {
  AIProvider,
  GenerationContext,
  SlideImprovementContext,
  ScoreableSlide,
} from "@/lib/ai/provider";
import type {
  StructurePreview,
  GenerationResult,
  SlideImprovementResult,
  EditorialScore,
  Framework,
} from "@/lib/schemas/ai";

const EDITORIAL_CRITERIA_LABELS = [
  "Clareza do gancho",
  "Especificidade",
  "Potencial de curiosidade",
  "Identificação com o público",
  "Ritmo entre slides",
  "Potencial de salvamento",
  "Potencial de compartilhamento",
  "Clareza da CTA",
  "Originalidade",
  "Legibilidade",
];

/** Small deterministic string hash (djb2) used to vary demo output per input without randomness. */
function hashString(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return Math.abs(hash);
}

function pickDeterministic<T>(items: readonly T[], seed: number): T {
  return items[seed % items.length];
}

function splitIntoSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);
}

function titleCase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const FRAMEWORKS_ROTATION: Framework[] = [
  "lista_pratica",
  "passo_a_passo",
  "erros_comuns",
  "problema_consciencia_solucao",
  "conteudo_educativo",
];

export class DemoProvider implements AIProvider {
  readonly id = "demo";
  readonly isDemo = true;

  async generateStructurePreview(ctx: GenerationContext): Promise<StructurePreview> {
    const seed = hashString(ctx.sourceText + ctx.strategy.niche);
    const topic = ctx.sourceTitle || this.extractTopic(ctx.sourceText);
    const framework = pickDeterministic(FRAMEWORKS_ROTATION, seed);

    const hooks = [
      {
        text: `${titleCase(topic)}: o que quase ninguém te conta`,
        reason: "Gancho de curiosidade com promessa de informação exclusiva.",
      },
      {
        text: `Pare de errar isso sobre ${topic.toLowerCase()}`,
        reason: "Gancho de quebra de padrão, direto ao ponto de dor do público.",
      },
      {
        text: `${ctx.strategy.slideCount} pontos sobre ${topic.toLowerCase()} para ${ctx.strategy.audience}`,
        reason: "Gancho de lista prática, fácil de prometer e cumprir.",
      },
    ];

    return {
      centralThesis: `${titleCase(topic)} é um tema relevante para ${ctx.strategy.audience} e pode ser explicado de forma prática.`,
      angle: "Abordagem prática e direta, com foco em aplicação imediata.",
      promise: `Ao final, o leitor entende como aplicar ${topic.toLowerCase()} na prática.`,
      hooks,
      slideOutline: Array.from({ length: ctx.strategy.slideCount }, (_, i) => ({
        order: i + 1,
        type:
          i === 0
            ? "hook"
            : i === 1
            ? "context"
            : i === ctx.strategy.slideCount - 1
            ? "cta"
            : i === ctx.strategy.slideCount - 2
            ? "conclusion"
            : "body",
        summary: `Ponto ${i + 1} do desenvolvimento sobre ${topic.toLowerCase()}.`,
      })),
      suggestedCta: ctx.strategy.desiredCta || "Salve este post para consultar depois.",
      whyItWorks:
        "Estrutura clara, uma ideia por slide e promessa específica aumentam a chance de leitura completa e salvamento.",
      recommendedFramework: framework,
    };
  }

  async generateCarousel(ctx: GenerationContext): Promise<GenerationResult> {
    const seed = hashString(ctx.sourceText + ctx.strategy.audience);
    const topic = ctx.sourceTitle || this.extractTopic(ctx.sourceText);
    const sentences = splitIntoSentences(ctx.sourceText);
    const count = ctx.strategy.slideCount;
    const hookText = ctx.chosenHook || `${titleCase(topic)}: o que quase ninguém te conta`;

    const slides = Array.from({ length: count }, (_, i) => {
      const order = i + 1;
      const isFirst = i === 0;
      const isLast = i === count - 1;
      const isPenultimate = i === count - 2;

      if (isFirst) {
        return {
          order,
          type: "hook" as const,
          headline: hookText,
          body: `Um guia direto para ${ctx.strategy.audience}.`,
          emphasis: [topic],
          visualSuggestion: "Título grande, centralizado, com fundo de contraste.",
          transition: "Desliza para entender o contexto.",
        };
      }
      if (isLast) {
        return {
          order,
          type: "cta" as const,
          headline: "Gostou? Aplique agora",
          body: ctx.strategy.desiredCta || "Salve este carrossel e compartilhe com alguém que precisa ler isso.",
          emphasis: [],
          visualSuggestion: "CTA em destaque com botão visual.",
          transition: "",
        };
      }
      if (isPenultimate) {
        return {
          order,
          type: "conclusion" as const,
          headline: "Resumindo",
          body: `${titleCase(topic)} fica mais simples quando você aplica um passo de cada vez.`,
          emphasis: [],
          visualSuggestion: "Bloco de síntese com ícone de conclusão.",
          transition: "Última etapa: o que fazer agora.",
        };
      }

      const sentence = sentences[(i - 1) % Math.max(sentences.length, 1)] || `Ponto importante sobre ${topic}.`;
      return {
        order,
        type: (i === 1 ? "context" : "body") as "context" | "body",
        headline: `Ponto ${i}`,
        body: sentence.slice(0, 220),
        emphasis: [],
        visualSuggestion: "Texto com um destaque visual e ícone de apoio.",
        transition: "Continue para o próximo ponto.",
      };
    });

    const criteria = EDITORIAL_CRITERIA_LABELS.map((label, idx) => ({
      label,
      score: 62 + ((seed >> idx) % 26),
    }));
    const total = Math.round(criteria.reduce((sum, c) => sum + c.score, 0) / criteria.length);

    return {
      analysis: {
        centralThesis: `${titleCase(topic)} é relevante para ${ctx.strategy.audience}.`,
        audiencePain: `Falta de clareza prática sobre ${topic.toLowerCase()}.`,
        contentMechanism: "Lista estruturada com progressão lógica entre os pontos.",
        recommendedFramework: pickDeterministic(FRAMEWORKS_ROTATION, seed),
        originalityNotes: [
          "Conteúdo gerado em modo demonstração - sem chamada real de IA.",
        ],
        factsToVerify: [],
      },
      hooks: [
        { text: hookText, reason: "Gancho escolhido para este carrossel de demonstração." },
      ],
      carousel: { title: titleCase(topic), slides },
      caption: {
        opening: `${titleCase(topic)}: o resumo prático que ${ctx.strategy.audience} estava esperando.`,
        body: `Neste carrossel, você vê os pontos principais sobre ${topic.toLowerCase()} de forma direta e aplicável.`,
        cta: ctx.strategy.desiredCta || "Salve e compartilhe com quem precisa ver isso.",
        hashtags: this.buildHashtags(topic, ctx.strategy.niche),
        pinnedComment: `Qual desses pontos sobre ${topic.toLowerCase()} fez mais sentido pra você? 👇`,
        altText: `Carrossel educativo sobre ${topic.toLowerCase()} com ${count} slides, texto em fundo contrastante.`,
        titleOptions: [
          titleCase(topic),
          `Guia rápido: ${topic.toLowerCase()}`,
          `${titleCase(topic)} sem enrolação`,
        ],
      },
      editorialScore: {
        total,
        criteria,
        recommendations: [
          {
            title: "Reforce o gancho",
            description: "Considere tornar o primeiro slide ainda mais específico para o público.",
            slideOrder: 1,
          },
          {
            title: "CTA mais direta",
            description: "Deixe claro o próximo passo que o leitor deve tomar.",
            slideOrder: count,
          },
        ],
      },
    };
  }

  async improveSlide(ctx: SlideImprovementContext): Promise<SlideImprovementResult> {
    const prefix: Record<string, string> = {
      encurtar: "(resumido) ",
      mais_forte: "(versão mais forte) ",
      mais_didatico: "(versão mais didática) ",
      mais_provocativo: "(versão mais provocativa) ",
      corrigir_portugues: "",
      outra_versao: "(versão alternativa) ",
      resumir_em_uma_frase: "",
      novo_titulo: "",
      regenerar: "(regenerado) ",
    };

    const isHeadlineOnly = ctx.action === "novo_titulo";
    const isBodyOnly = ctx.action === "resumir_em_uma_frase";
    const headline = ctx.slide.headline ?? "";
    const body = ctx.slide.body ?? "";

    return {
      headline: isBodyOnly ? `${body.split(/[.!?]/)[0]}.` : `${prefix[ctx.action] ?? ""}${headline}`,
      body: isHeadlineOnly ? body : isBodyOnly ? "" : `${prefix[ctx.action] ?? ""}${body}`,
      emphasis: [],
      note: `Ajuste aplicado em modo demonstração (ação: ${ctx.action}).`,
    };
  }

  async splitSlide(
    ctx: Pick<SlideImprovementContext, "slide" | "tone">
  ): Promise<{ slides: { headline: string; body: string }[] }> {
    const headline = ctx.slide.headline ?? "";
    const body = ctx.slide.body ?? "";
    const sentences = splitIntoSentences(body);
    const mid = Math.max(1, Math.ceil(sentences.length / 2));
    return {
      slides: [
        { headline, body: sentences.slice(0, mid).join(" ") || body },
        { headline: "Continuação", body: sentences.slice(mid).join(" ") || body },
      ],
    };
  }

  async scoreCarousel(
    slides: ScoreableSlide[],
    audience: string
  ): Promise<EditorialScore> {
    const seed = hashString(slides.map((s) => s.headline).join("|") + audience);
    const criteria = EDITORIAL_CRITERIA_LABELS.map((label, idx) => ({
      label,
      score: 60 + ((seed >> idx) % 30),
    }));
    const total = Math.round(criteria.reduce((sum, c) => sum + c.score, 0) / criteria.length);
    return {
      total,
      criteria,
      recommendations: [
        {
          title: "Revise o ritmo",
          description: "Verifique se cada slide dá motivo para continuar deslizando.",
          slideOrder: null,
        },
      ],
    };
  }

  private extractTopic(text: string): string {
    const sentences = splitIntoSentences(text);
    const first = sentences[0] || text;
    return first.slice(0, 60).replace(/[.,;:!?]+$/, "") || "este tema";
  }

  private buildHashtags(topic: string, niche: string): string[] {
    const normalize = (v: string) =>
      Array.from(v.normalize("NFD"))
        .filter((ch) => {
          const code = ch.codePointAt(0) ?? 0;
          return !(code >= 0x0300 && code <= 0x036f);
        })
        .join("")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase();
    const base = [normalize(topic), normalize(niche), "conteudo", "instagram", "carrossel"];
    return Array.from(new Set(base.filter(Boolean)));
  }
}
