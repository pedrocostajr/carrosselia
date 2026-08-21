import type { GenerationContext, SlideImprovementContext } from "@/lib/ai/provider";

const OBJECTIVE_LABELS: Record<string, string> = {
  educar: "educar a audiência",
  gerar_comentarios: "gerar comentários e debate",
  gerar_compartilhamentos: "gerar compartilhamentos",
  gerar_salvamentos: "gerar salvamentos (posts para guardar)",
  atrair_seguidores: "atrair novos seguidores",
  vender: "vender um produto ou serviço",
  gerar_leads: "gerar leads/contatos",
  fortalecer_autoridade: "fortalecer autoridade no nicho",
};

const TONE_LABELS: Record<string, string> = {
  serio: "sério",
  formal: "formal",
  provocativo: "provocativo",
  didatico: "didático",
  emocional: "emocional",
  descontraido: "descontraído",
  direto: "direto",
  personalizado: "personalizado",
};

export const SYSTEM_PROMPT = `Você é um estrategista editorial sênior especializado em criar carrosséis para Instagram em português do Brasil.

Princípios inegociáveis:
- Identifique a ideia central, o mecanismo que torna o conteúdo interessante, o tipo de gancho, a transformação prometida e o ritmo da narrativa antes de escrever.
- NUNCA copie a redação da fonte: crie uma estrutura e um texto novos, modelando os princípios do conteúdo, não a redação.
- Preserve fatos importantes da fonte, mas NUNCA invente dados, estudos, depoimentos ou estatísticas que não estejam na fonte ou no briefing do usuário.
- Se algo precisar de verificação, liste isso em "factsToVerify" e "originalityNotes" - não afirme como certeza.
- Nunca prometa que o conteúdo "vai viralizar".
- Evite clickbait enganoso, emojis em excesso e repetição da mesma informação entre slides.
- Cada slide deve ter uma ideia principal e criar motivo para o leitor continuar deslizando.
- Responda SEMPRE em português do Brasil.
- Responda SEMPRE apenas com um objeto JSON válido, sem comentários, sem markdown, sem texto antes ou depois.`;

function strategyBlock(ctx: GenerationContext): string {
  const s = ctx.strategy;
  const tone = s.tone === "personalizado" && s.customTone ? s.customTone : TONE_LABELS[s.tone];
  return `Público-alvo: ${s.audience}
Nicho: ${s.niche}
Objetivo principal: ${OBJECTIVE_LABELS[s.objective]}
Tom de comunicação: ${tone}
Nível de consciência do público: ${s.awarenessLevel}
CTA desejada: ${s.desiredCta || "(a IA deve sugerir uma)"}
Quantidade de slides: ${s.slideCount}
Intensidade criativa (0 a 1): ${s.creativity}
Informações que DEVEM aparecer: ${s.mustInclude || "(nenhuma restrição)"}
Informações que NÃO DEVEM aparecer: ${s.mustAvoid || "(nenhuma restrição)"}`;
}

function sourceBlock(ctx: GenerationContext): string {
  return `Origem do conteúdo (título): ${ctx.sourceTitle || "(sem título)"}
Origem do conteúdo (URL): ${ctx.sourceUrl || "(nenhuma, conteúdo colado ou tema livre)"}
Texto/tema de referência:
"""
${ctx.sourceText.slice(0, 8000)}
"""`;
}

export function buildStructurePreviewPrompt(ctx: GenerationContext): string {
  return `${sourceBlock(ctx)}

${strategyBlock(ctx)}

Tarefa: analise o material acima e prepare uma prévia estratégica ANTES de escrever o carrossel final.

Responda em JSON com este formato exato:
{
  "centralThesis": "string",
  "angle": "string - o ângulo editorial escolhido",
  "promise": "string - o que o leitor ganha ao final",
  "hooks": [{ "text": "string", "reason": "string" }],
  "slideOutline": [{ "order": 1, "type": "hook|context|body|conclusion|cta", "summary": "string" }],
  "suggestedCta": "string",
  "whyItWorks": "string - motivo pelo qual este conteúdo pode gerar interesse",
  "recommendedFramework": "lista_pratica|passo_a_passo|mito_vs_verdade|erros_comuns|historia_com_aprendizado|opiniao_forte|antes_e_depois|problema_consciencia_solucao|quebra_de_crenca|estudo_de_caso|conteudo_educativo|manifesto|post_social"
}

Gere EXATAMENTE 3 opções de gancho no array "hooks", cada uma com uma abordagem diferente. O "slideOutline" deve ter ${ctx.strategy.slideCount} itens.`;
}

export function buildGenerationPrompt(ctx: GenerationContext): string {
  return `${sourceBlock(ctx)}

${strategyBlock(ctx)}

${ctx.chosenHook ? `Gancho escolhido pelo usuário: "${ctx.chosenHook}"` : ""}
${ctx.structure ? `Estrutura previamente aprovada: ${JSON.stringify(ctx.structure.slideOutline)}` : ""}

Tarefa: gere o carrossel completo com exatamente ${ctx.strategy.slideCount} slides, a legenda e a pontuação editorial estimada.

Responda em JSON com este formato exato:
{
  "analysis": {
    "centralThesis": "string",
    "audiencePain": "string",
    "contentMechanism": "string",
    "recommendedFramework": "lista_pratica|passo_a_passo|mito_vs_verdade|erros_comuns|historia_com_aprendizado|opiniao_forte|antes_e_depois|problema_consciencia_solucao|quebra_de_crenca|estudo_de_caso|conteudo_educativo|manifesto|post_social",
    "originalityNotes": ["string"],
    "factsToVerify": ["string"]
  },
  "hooks": [{ "text": "string", "reason": "string" }],
  "carousel": {
    "title": "string",
    "slides": [
      {
        "order": 1,
        "type": "hook|context|body|conclusion|cta|social-post",
        "headline": "string curto, sem clickbait enganoso",
        "body": "string - 1 a 3 frases, direto",
        "emphasis": ["palavra ou expressão a destacar com a cor da marca"],
        "visualSuggestion": "string - sugestão breve de elemento visual",
        "transition": "string - motivo para continuar para o próximo slide"
      }
    ]
  },
  "caption": {
    "opening": "string - primeira frase forte",
    "body": "string - desenvolvimento complementar, sem repetir todo o carrossel",
    "cta": "string",
    "hashtags": ["string sem #"],
    "pinnedComment": "string",
    "altText": "string - texto alternativo de acessibilidade descrevendo o carrossel",
    "titleOptions": ["string", "string", "string"]
  },
  "editorialScore": {
    "total": 0,
    "criteria": [{ "label": "Clareza do gancho", "score": 0 }],
    "recommendations": [{ "title": "string", "description": "string", "slideOrder": null }]
  }
}

O array "carousel.slides" deve ter EXATAMENTE ${ctx.strategy.slideCount} itens, ordenados de 1 a ${ctx.strategy.slideCount}.
Em "editorialScore.criteria", inclua exatamente estes 10 rótulos com nota de 0 a 100 cada: Clareza do gancho, Especificidade, Potencial de curiosidade, Identificação com o público, Ritmo entre slides, Potencial de salvamento, Potencial de compartilhamento, Clareza da CTA, Originalidade, Legibilidade. "total" é a média arredondada dessas notas.`;
}

const ACTION_INSTRUCTIONS: Record<string, string> = {
  encurtar: "Encurte o texto mantendo a ideia principal, com no máximo 60% do tamanho original.",
  mais_forte: "Reescreva com um tom mais forte, direto e confiante, sem perder a precisão factual.",
  mais_didatico: "Reescreva de forma mais didática, explicando com mais clareza para quem não conhece o assunto.",
  mais_provocativo: "Reescreva de forma mais provocativa, desafiando uma crença comum do público, sem clickbait enganoso.",
  corrigir_portugues: "Corrija apenas gramática, ortografia e fluidez do português, preservando o conteúdo e o tom.",
  outra_versao: "Crie uma versão alternativa com redação diferente, mantendo a mesma ideia central.",
  resumir_em_uma_frase: "Resuma o conteúdo do slide em uma única frase forte para o campo 'headline', deixando 'body' vazio.",
  novo_titulo: "Mantenha o 'body' e gere apenas um novo 'headline', mais impactante e específico.",
  regenerar: "Gere uma versão nova e melhor deste slide, mantendo a mesma posição na narrativa.",
};

export function buildSlideImprovementPrompt(ctx: SlideImprovementContext): string {
  return `Carrossel: "${ctx.carouselTitle}"
Tom de comunicação: ${ctx.tone}
Slide atual:
- Título: ${ctx.slide.headline}
- Corpo: ${ctx.slide.body}

Instrução: ${ACTION_INSTRUCTIONS[ctx.action] ?? "Melhore este slide."}

Responda em JSON com este formato exato:
{ "headline": "string", "body": "string", "emphasis": ["string"], "note": "string - o que foi alterado" }`;
}

export function buildSplitSlidePrompt(ctx: Pick<SlideImprovementContext, "slide" | "tone">): string {
  return `Tom de comunicação: ${ctx.tone}
Slide atual (texto longo demais para um único slide):
- Título: ${ctx.slide.headline}
- Corpo: ${ctx.slide.body}

Tarefa: divida este conteúdo em exatamente 2 slides sequenciais, cada um com uma ideia própria e conectados entre si.

Responda em JSON: { "slides": [{ "headline": "string", "body": "string" }, { "headline": "string", "body": "string" }] }`;
}

export function buildScorePrompt(
  slides: { headline?: string; body?: string; type: string }[],
  audience: string
): string {
  return `Público-alvo: ${audience}
Slides do carrossel:
${slides.map((s, i) => `${i + 1}. [${s.type}] ${s.headline ?? ""} — ${s.body ?? ""}`).join("\n")}

Tarefa: avalie este carrossel e retorne a pontuação editorial estimada (não é garantia de viralização).

Responda em JSON: { "total": 0, "criteria": [{ "label": "Clareza do gancho", "score": 0 }], "recommendations": [{ "title": "string", "description": "string", "slideOrder": null }] }

Inclua exatamente estes 10 rótulos: Clareza do gancho, Especificidade, Potencial de curiosidade, Identificação com o público, Ritmo entre slides, Potencial de salvamento, Potencial de compartilhamento, Clareza da CTA, Originalidade, Legibilidade.`;
}
