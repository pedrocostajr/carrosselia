"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Gauge, Loader2, RefreshCw } from "lucide-react";

import { useEditorStore } from "@/store/editor-store";
import { updateCarouselScoreAction } from "@/app/editor/[projectId]/actions";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/empty-state";

export function ScorePanel({ audience }: { audience: string }) {
  const slides = useEditorStore((s) => s.slides);
  const carouselId = useEditorStore((s) => s.carouselId);
  const editorialScore = useEditorStore((s) => s.editorialScore);
  const setEditorialScore = useEditorStore((s) => s.setEditorialScore);
  const [isLoading, setIsLoading] = useState(false);

  async function recompute() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/ai/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slides: slides.map((s) => ({ headline: s.headline, body: s.body, type: s.type })),
          audience: audience || "público geral",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error("Não foi possível calcular a pontuação.", { description: json?.error?.message });
        return;
      }
      setEditorialScore(json.score);
      if (carouselId) await updateCarouselScoreAction(carouselId, json.score);
    } catch {
      toast.error("Não foi possível calcular a pontuação.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <Gauge className="size-4" /> Pontuação editorial estimada
        </p>
        <Button variant="ghost" size="sm" onClick={recompute} disabled={isLoading}>
          {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
          Recalcular
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Estimativa heurística, não é garantia de viralização ou desempenho real.
      </p>

      {!editorialScore ? (
        <EmptyState
          icon={Gauge}
          title="Sem pontuação ainda"
          description="Clique em recalcular para avaliar o carrossel atual."
        />
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-3xl font-semibold">{editorialScore.total}</p>
            <p className="text-xs text-muted-foreground">de 100</p>
          </div>
          <div className="space-y-2">
            {editorialScore.criteria.map((c) => (
              <div key={c.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{c.label}</span>
                  <span className="text-muted-foreground">{c.score}</span>
                </div>
                <Progress value={c.score} />
              </div>
            ))}
          </div>
          {editorialScore.recommendations.length > 0 && (
            <div className="space-y-2 border-t pt-3">
              <p className="text-xs font-medium text-muted-foreground">Sugestões</p>
              {editorialScore.recommendations.map((r, i) => (
                <div key={i} className="rounded-md bg-muted/50 p-2 text-xs">
                  <p className="font-medium">{r.title}</p>
                  <p className="text-muted-foreground">{r.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
