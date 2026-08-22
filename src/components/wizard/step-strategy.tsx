"use client";

import type { WizardState } from "@/components/wizard/wizard-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const OBJECTIVE_OPTIONS: { value: WizardState["strategy"]["objective"]; label: string }[] = [
  { value: "educar", label: "Educar" },
  { value: "gerar_comentarios", label: "Gerar comentários" },
  { value: "gerar_compartilhamentos", label: "Gerar compartilhamentos" },
  { value: "gerar_salvamentos", label: "Gerar salvamentos" },
  { value: "atrair_seguidores", label: "Atrair seguidores" },
  { value: "vender", label: "Vender" },
  { value: "gerar_leads", label: "Gerar leads" },
  { value: "fortalecer_autoridade", label: "Fortalecer autoridade" },
];

const TONE_OPTIONS: { value: WizardState["strategy"]["tone"]; label: string }[] = [
  { value: "serio", label: "Sério" },
  { value: "formal", label: "Formal" },
  { value: "provocativo", label: "Provocativo" },
  { value: "didatico", label: "Didático" },
  { value: "emocional", label: "Emocional" },
  { value: "descontraido", label: "Descontraído" },
  { value: "direto", label: "Direto" },
  { value: "personalizado", label: "Personalizado" },
];

const AWARENESS_OPTIONS: { value: WizardState["strategy"]["awarenessLevel"]; label: string }[] = [
  { value: "inconsciente", label: "Inconsciente do problema" },
  { value: "consciente_do_problema", label: "Consciente do problema" },
  { value: "consciente_da_solucao", label: "Consciente da solução" },
  { value: "consciente_do_produto", label: "Consciente do produto" },
  { value: "muito_consciente", label: "Muito consciente" },
];

interface Props {
  state: WizardState;
  onChange: (patch: Partial<WizardState["strategy"]>) => void;
  onBack: () => void;
  onNext: () => void;
}

export function StepStrategy({ state, onChange, onBack, onNext }: Props) {
  const { strategy } = state;
  const canContinue = strategy.audience.trim().length > 2 && strategy.niche.trim().length > 1;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Público-alvo</Label>
          <Input
            placeholder="Ex: empreendedoras de moda iniciantes"
            value={strategy.audience}
            onChange={(e) => onChange({ audience: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Nicho</Label>
          <Input
            placeholder="Ex: moda sustentável"
            value={strategy.niche}
            onChange={(e) => onChange({ niche: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Objetivo</Label>
          <Select value={strategy.objective} onValueChange={(v) => onChange({ objective: v as WizardState["strategy"]["objective"] })}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OBJECTIVE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Tom de comunicação</Label>
          <Select value={strategy.tone} onValueChange={(v) => onChange({ tone: v as WizardState["strategy"]["tone"] })}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TONE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {strategy.tone === "personalizado" && (
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Descreva o tom desejado</Label>
            <Input
              placeholder="Ex: como um mentor experiente e caloroso"
              value={strategy.customTone}
              onChange={(e) => onChange({ customTone: e.target.value })}
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label>Nível de consciência do público</Label>
          <Select
            value={strategy.awarenessLevel}
            onValueChange={(v) => onChange({ awarenessLevel: v as WizardState["strategy"]["awarenessLevel"] })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AWARENESS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>CTA desejada (opcional)</Label>
          <Input
            placeholder="Ex: comente 'EU QUERO'"
            value={strategy.desiredCta}
            onChange={(e) => onChange({ desiredCta: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Quantidade de slides ({strategy.slideCount})</Label>
        <Slider
          min={3}
          max={15}
          step={1}
          value={[strategy.slideCount]}
          onValueChange={([v]) => onChange({ slideCount: v })}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Intensidade criativa ({Math.round(strategy.creativity * 100)}%)</Label>
        <Slider
          min={0}
          max={1}
          step={0.1}
          value={[strategy.creativity]}
          onValueChange={([v]) => onChange({ creativity: v })}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Informações que devem aparecer</Label>
          <Textarea
            value={strategy.mustInclude}
            onChange={(e) => onChange({ mustInclude: e.target.value })}
            rows={3}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Informações que não devem aparecer</Label>
          <Textarea
            value={strategy.mustAvoid}
            onChange={(e) => onChange({ mustAvoid: e.target.value })}
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Voltar
        </Button>
        <Button onClick={onNext} disabled={!canContinue}>
          Continuar
        </Button>
      </div>
    </div>
  );
}
