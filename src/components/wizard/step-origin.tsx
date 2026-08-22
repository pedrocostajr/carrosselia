"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Link2, Loader2, Type, Lightbulb } from "lucide-react";

import type { WizardState } from "@/components/wizard/wizard-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  state: WizardState;
  onChange: (patch: Partial<WizardState["origin"]>) => void;
  onNext: () => void;
}

export function StepOrigin({ state, onChange, onNext }: Props) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const { origin } = state;

  async function handleExtract() {
    if (!origin.url.trim()) return;
    setIsExtracting(true);
    setExtractError(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: origin.url.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setExtractError(json?.error?.message || "Não foi possível acessar esta página.");
        return;
      }
      onChange({ extracted: json.content, editedText: json.content.textContent });
      toast.success("Conteúdo extraído com sucesso.");
    } catch {
      setExtractError("Não foi possível acessar esta página. Tente novamente ou cole o texto manualmente.");
    } finally {
      setIsExtracting(false);
    }
  }

  const canContinue = origin.editedText.trim().length > 0;

  return (
    <div className="space-y-6">
      <Tabs
        value={origin.type}
        onValueChange={(v) =>
          onChange({ type: v as WizardState["origin"]["type"], editedText: "", extracted: null })
        }
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="url">
            <Link2 className="size-4" /> URL
          </TabsTrigger>
          <TabsTrigger value="text">
            <Type className="size-4" /> Texto
          </TabsTrigger>
          <TabsTrigger value="topic">
            <Lightbulb className="size-4" /> Tema
          </TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="space-y-4 pt-4">
          <div className="flex gap-2">
            <Input
              placeholder="https://exemplo.com/artigo"
              value={origin.url}
              onChange={(e) => onChange({ url: e.target.value })}
            />
            <Button type="button" onClick={handleExtract} disabled={isExtracting || !origin.url.trim()}>
              {isExtracting && <Loader2 className="animate-spin" />}
              Extrair conteúdo
            </Button>
          </div>

          {extractError && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <p>{extractError}</p>
            </div>
          )}

          {origin.extracted && (
            <Card>
              <CardContent className="space-y-3 pt-4">
                <div>
                  <p className="text-sm font-medium">{origin.extracted.title || "Sem título"}</p>
                  {origin.extracted.author && (
                    <p className="text-xs text-muted-foreground">Por {origin.extracted.author}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Conteúdo extraído (você pode editar)</Label>
                  <Textarea
                    value={origin.editedText}
                    onChange={(e) => onChange({ editedText: e.target.value })}
                    rows={10}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {!origin.extracted && !extractError && (
            <p className="text-sm text-muted-foreground">
              Não conseguimos acessar páginas dinâmicas, redes sociais, conteúdos protegidos ou que
              exigem login. Nesses casos, cole o texto manualmente na aba &quot;Texto&quot;.
            </p>
          )}
        </TabsContent>

        <TabsContent value="text" className="space-y-1.5 pt-4">
          <Label>Cole o texto de referência</Label>
          <Textarea
            placeholder="Cole aqui o texto que servirá de base para o carrossel..."
            value={origin.rawText}
            onChange={(e) => onChange({ rawText: e.target.value, editedText: e.target.value })}
            rows={12}
          />
        </TabsContent>

        <TabsContent value="topic" className="space-y-1.5 pt-4">
          <Label>Qual é o tema ou ideia?</Label>
          <Textarea
            placeholder="Ex: Como manter consistência ao postar no Instagram"
            value={origin.topic}
            onChange={(e) => onChange({ topic: e.target.value, editedText: e.target.value })}
            rows={4}
          />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!canContinue}>
          Continuar
        </Button>
      </div>
    </div>
  );
}
