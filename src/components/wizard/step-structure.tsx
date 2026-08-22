"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";

import type { WizardState } from "@/components/wizard/wizard-types";
import type { StructurePreview } from "@/lib/schemas/ai";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  state: WizardState;
  onChange: (patch: Partial<Pick<WizardState, "structure" | "chosenHook">>) => void;
  onBack: () => void;
  onNext: () => void;
}

export function StepStructure({ state, onChange, onBack, onNext }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchStructure() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/structure-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceText: state.origin.editedText,
          sourceTitle: state.origin.extracted?.title ?? null,
          sourceUrl: state.origin.extracted?.url ?? null,
          strategy: state.strategy,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message || "Não foi possível gerar a prévia estratégica.");
        return;
      }
      const structure = json.structure as StructurePreview;
      onChange({ structure, chosenHook: structure.hooks[0]?.text ?? "" });
    } catch {
      setError("Não foi possível gerar a prévia estratégica. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!state.structure) {
      // Intentional fetch-on-mount: generates the strategic preview as soon
      // as the user reaches this step, without requiring an extra click.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchStructure();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const structure = state.structure;

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
          <p className="text-sm">Analisando o conteúdo e preparando a estratégia...</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="space-y-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={fetchStructure}>
            <RefreshCw className="size-4" /> Tentar novamente
          </Button>
        </div>
      )}

      {!isLoading && structure && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs font-medium text-muted-foreground">Tese principal</p>
                <p className="mt-1 text-sm">{structure.centralThesis}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs font-medium text-muted-foreground">Ângulo</p>
                <p className="mt-1 text-sm">{structure.angle}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs font-medium text-muted-foreground">Promessa</p>
                <p className="mt-1 text-sm">{structure.promise}</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Escolha um gancho para o slide inicial</p>
              <Button variant="ghost" size="sm" onClick={fetchStructure}>
                <RefreshCw className="size-3.5" /> Gerar novos ganchos
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {structure.hooks.map((hook, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onChange({ chosenHook: hook.text })}
                  className={cn(
                    "rounded-lg border p-4 text-left text-sm transition-colors hover:border-primary",
                    state.chosenHook === hook.text && "border-primary bg-primary/5"
                  )}
                >
                  <p className="flex items-center gap-1.5 font-medium">
                    <Sparkles className="size-3.5 shrink-0" />
                    {hook.text}
                  </p>
                  <p className="mt-1.5 text-xs text-muted-foreground">{hook.reason}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Estrutura resumida dos slides</p>
            <ol className="space-y-1.5 text-sm">
              {structure.slideOutline.map((s) => (
                <li key={s.order} className="flex gap-2">
                  <span className="text-muted-foreground">{s.order}.</span>
                  <span>{s.summary}</span>
                </li>
              ))}
            </ol>
          </div>

          <Card>
            <CardContent className="space-y-1 pt-4">
              <p className="text-xs font-medium text-muted-foreground">CTA sugerida</p>
              <p className="text-sm">{structure.suggestedCta}</p>
              <p className="pt-2 text-xs font-medium text-muted-foreground">
                Por que pode gerar interesse
              </p>
              <p className="text-sm">{structure.whyItWorks}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Voltar
        </Button>
        <Button onClick={onNext} disabled={!structure || !state.chosenHook}>
          Continuar
        </Button>
      </div>
    </div>
  );
}
