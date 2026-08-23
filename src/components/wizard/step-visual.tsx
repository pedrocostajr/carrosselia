"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

import type { WizardState } from "@/components/wizard/wizard-types";
import type { BrandKitRow } from "@/lib/data/brand-kits";
import { TEMPLATES } from "@/lib/templates/registry";
import { SLIDE_DIMENSIONS } from "@/lib/schemas/slide";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface Props {
  state: WizardState;
  brandKits: BrandKitRow[];
  imageGenAvailable: boolean;
  onChange: (
    patch: Partial<
      Pick<WizardState, "brandKitId" | "templateId" | "format" | "generateBackgroundImages">
    >
  ) => void;
  onBack: () => void;
}

function TemplateThumbnail({ templateId }: { templateId: string }) {
  if (templateId === "social-post") {
    return (
      <div className="flex aspect-[4/5] w-full flex-col gap-2 rounded-md border bg-white p-3 dark:bg-neutral-900">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-full bg-neutral-300 dark:bg-neutral-700" />
          <div className="space-y-1">
            <div className="h-1.5 w-14 rounded bg-neutral-400 dark:bg-neutral-600" />
            <div className="h-1 w-10 rounded bg-neutral-300 dark:bg-neutral-700" />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="h-1.5 w-full rounded bg-neutral-300 dark:bg-neutral-700" />
          <div className="h-1.5 w-full rounded bg-neutral-300 dark:bg-neutral-700" />
          <div className="h-1.5 w-2/3 rounded bg-neutral-300 dark:bg-neutral-700" />
        </div>
      </div>
    );
  }

  if (templateId === "photo-overlay") {
    return (
      <div className="relative flex aspect-[4/5] w-full flex-col justify-end gap-1.5 overflow-hidden rounded-md border bg-gradient-to-br from-neutral-500 to-neutral-800 p-3">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative h-2.5 w-3/4 rounded bg-white/90" />
        <div className="relative h-1.5 w-full rounded bg-white/70" />
        <div className="relative h-1.5 w-1/2 rounded bg-white/70" />
      </div>
    );
  }

  if (templateId === "editorial") {
    return (
      <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 rounded-md border bg-white p-3 dark:bg-neutral-900">
        <div className="h-0.5 w-6 bg-amber-600" />
        <div className="h-2 w-3/4 rounded bg-neutral-500" />
        <div className="h-1.5 w-1/2 rounded bg-neutral-300 dark:bg-neutral-700" />
      </div>
    );
  }

  return (
    <div className="flex aspect-[4/5] w-full flex-col justify-center gap-2 rounded-md border bg-white p-3 dark:bg-neutral-900">
      <div className="h-2.5 w-3/4 rounded bg-neutral-600 dark:bg-neutral-400" />
      <div className="h-1.5 w-full rounded bg-neutral-300 dark:bg-neutral-700" />
      <div className="h-1.5 w-2/3 rounded bg-neutral-300 dark:bg-neutral-700" />
    </div>
  );
}

export function StepVisual({ state, brandKits, imageGenAvailable, onChange, onBack }: Props) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressLabel, setProgressLabel] = useState("");

  async function handleGenerate() {
    setIsGenerating(true);
    setProgressLabel("Gerando o roteiro do carrossel...");
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceText: state.origin.editedText,
          sourceTitle: state.origin.extracted?.title ?? null,
          sourceUrl: state.origin.extracted?.url ?? null,
          strategy: state.strategy,
          chosenHook: state.chosenHook,
          structure: state.structure,
          brandKitId: state.brandKitId,
          templateId: state.templateId,
          format: state.format,
          contentSourceType: state.origin.type,
          generateBackgroundImages:
            state.templateId === "photo-overlay" && imageGenAvailable
              ? state.generateBackgroundImages
              : false,
        }),
      });
      setProgressLabel(
        state.templateId === "photo-overlay" && state.generateBackgroundImages
          ? "Gerando imagens de fundo com IA (isso pode levar um pouco mais)..."
          : "Aplicando a identidade visual..."
      );
      const json = await res.json();
      if (!res.ok) {
        toast.error("Não foi possível gerar o carrossel.", { description: json?.error?.message });
        return;
      }
      setProgressLabel("Abrindo o editor...");
      if (json.isDemo) {
        toast.info("Carrossel gerado em modo demonstração.");
      }
      router.push(`/editor/${json.projectId}`);
    } catch {
      toast.error("Não foi possível gerar o carrossel. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label>Kit de marca</Label>
        <Select
          value={state.brandKitId ?? "none"}
          onValueChange={(v) => onChange({ brandKitId: v === "none" ? null : v })}
        >
          <SelectTrigger className="w-full sm:w-80">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum (usar padrão)</SelectItem>
            {brandKits.map((kit) => (
              <SelectItem key={kit.id} value={kit.id}>
                {kit.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Modelo visual</Label>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onChange({ templateId: tpl.id })}
              className={cn(
                "space-y-2 rounded-lg border p-3 text-left transition-colors hover:border-primary",
                state.templateId === tpl.id && "border-primary ring-1 ring-primary"
              )}
            >
              <TemplateThumbnail templateId={tpl.id} />
              <p className="text-sm font-medium">{tpl.name}</p>
              <p className="text-xs text-muted-foreground">{tpl.description}</p>
            </button>
          ))}
        </div>

        {state.templateId === "photo-overlay" && (
          <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-3">
            <Checkbox
              id="generate-images"
              checked={state.generateBackgroundImages}
              disabled={!imageGenAvailable}
              onCheckedChange={(v) => onChange({ generateBackgroundImages: Boolean(v) })}
            />
            <div className="space-y-0.5">
              <Label htmlFor="generate-images" className="flex items-center gap-1.5 font-normal">
                <Sparkles className="size-3.5" /> Gerar imagens de fundo com IA (Google)
              </Label>
              <p className="text-xs text-muted-foreground">
                {imageGenAvailable
                  ? "Cria uma imagem de fundo original para cada slide, com base no conteúdo gerado."
                  : "Indisponível: configure GEMINI_API_KEY para ativar esta opção. Sem ela, o template usa um fundo escuro sólido."}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Formato</Label>
        <div className="flex gap-3">
          {(["1080x1350", "1080x1080"] as const).map((format) => (
            <button
              key={format}
              type="button"
              onClick={() => onChange({ format })}
              className={cn(
                "rounded-md border px-4 py-2 text-sm transition-colors hover:border-primary",
                state.format === format && "border-primary bg-primary/5"
              )}
            >
              {format}
              {format === "1080x1350" && (
                <span className="ml-1.5 text-xs text-muted-foreground">(padrão)</span>
              )}
              <span className="ml-1 text-xs text-muted-foreground">
                {SLIDE_DIMENSIONS[format].width}×{SLIDE_DIMENSIONS[format].height}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between border-t pt-4">
        <Button variant="outline" onClick={onBack} disabled={isGenerating}>
          Voltar
        </Button>
        <Button onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="animate-spin" /> {progressLabel}
            </>
          ) : (
            "Gerar carrossel"
          )}
        </Button>
      </div>
    </div>
  );
}
