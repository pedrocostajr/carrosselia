"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Scissors,
  Sparkles,
  Wand2,
} from "lucide-react";

import { useEditorStore } from "@/store/editor-store";
import type { Slide } from "@/lib/schemas/slide";
import type { SlideImprovementAction } from "@/lib/schemas/ai";
import { applyContentToSlide } from "@/lib/templates/apply-content";
import { rebuildSlideWithTemplate } from "@/lib/templates/rebuild-slide";
import type { BrandContext } from "@/lib/templates/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ACTIONS: { action: SlideImprovementAction; label: string }[] = [
  { action: "encurtar", label: "Encurtar texto" },
  { action: "mais_forte", label: "Deixar mais forte" },
  { action: "mais_didatico", label: "Deixar mais didático" },
  { action: "mais_provocativo", label: "Deixar mais provocativo" },
  { action: "corrigir_portugues", label: "Corrigir português" },
  { action: "outra_versao", label: "Criar outra versão" },
  { action: "resumir_em_uma_frase", label: "Resumir em uma frase" },
  { action: "novo_titulo", label: "Gerar novo título" },
  { action: "regenerar", label: "Regenerar apenas este slide" },
];

interface Preview {
  headline: string;
  body: string;
  note: string;
}

export function AiSlideActions({
  slide,
  carouselTitle,
  tone,
  brand,
  isLast,
}: {
  slide: Slide;
  carouselTitle: string;
  tone: string;
  brand: BrandContext;
  isLast: boolean;
}) {
  const updateSlide = useEditorStore((s) => s.updateSlide);
  const addSlide = useEditorStore((s) => s.addSlide);
  const slides = useEditorStore((s) => s.slides);

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [splitPreview, setSplitPreview] = useState<{ headline: string; body: string }[] | null>(null);

  async function runAction(action: SlideImprovementAction) {
    setLoadingAction(action);
    try {
      const res = await fetch("/api/ai/slide-improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          slide: { headline: slide.headline, body: slide.body },
          carouselTitle,
          tone,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error("Não foi possível gerar a sugestão.", { description: json?.error?.message });
        return;
      }
      setPreview(json.result);
    } catch {
      toast.error("Não foi possível gerar a sugestão.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function runSplit() {
    setLoadingAction("dividir_em_dois_slides");
    try {
      const res = await fetch("/api/ai/split-slide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slide: { headline: slide.headline, body: slide.body }, tone }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error("Não foi possível dividir o slide.", { description: json?.error?.message });
        return;
      }
      setSplitPreview(json.result.slides);
    } catch {
      toast.error("Não foi possível dividir o slide.");
    } finally {
      setLoadingAction(null);
    }
  }

  function applyPreview() {
    if (!preview) return;
    updateSlide(slide.id, (s) => applyContentToSlide(s, { headline: preview.headline, body: preview.body }));
    setPreview(null);
    toast.success("Slide atualizado.");
  }

  function applySplit() {
    if (!splitPreview) return;
    const index = slides.findIndex((s) => s.id === slide.id);
    const first = applyContentToSlide(slide, splitPreview[0]);
    updateSlide(slide.id, () => first);

    const second = rebuildSlideWithTemplate(
      { ...slide, id: crypto.randomUUID() },
      slide.template,
      brand,
      false,
      isLast
    );
    addSlide(applyContentToSlide(second, splitPreview[1]), index + 1);
    setSplitPreview(null);
    toast.success("Slide dividido em dois.");
  }

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Sparkles className="size-3.5" /> Ações de IA para este slide
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {ACTIONS.map(({ action, label }) => (
          <Button
            key={action}
            variant="outline"
            size="sm"
            className="justify-start text-xs"
            disabled={loadingAction !== null}
            onClick={() => runAction(action)}
          >
            {loadingAction === action ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Wand2 className="size-3" />
            )}
            {label}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="col-span-2 justify-start text-xs"
          disabled={loadingAction !== null}
          onClick={runSplit}
        >
          {loadingAction === "dividir_em_dois_slides" ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Scissors className="size-3" />
          )}
          Dividir em dois slides
        </Button>
      </div>

      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pré-visualização da sugestão</DialogTitle>
            <DialogDescription>{preview?.note}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Título</p>
              <p>{preview?.headline}</p>
            </div>
            {preview?.body && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Texto</p>
                <p>{preview.body}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreview(null)}>
              Cancelar
            </Button>
            <Button onClick={applyPreview}>Substituir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!splitPreview} onOpenChange={(open) => !open && setSplitPreview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dividir em dois slides</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            {splitPreview?.map((s, i) => (
              <div key={i} className="rounded-md border p-3">
                <p className="text-xs font-medium text-muted-foreground">Slide {i === 0 ? "atual" : "novo"}</p>
                <p className="font-medium">{s.headline}</p>
                <p className="text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSplitPreview(null)}>
              Cancelar
            </Button>
            <Button onClick={applySplit}>Dividir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
