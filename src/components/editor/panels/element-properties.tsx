"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Lock, LockOpen, Replace, Trash2 } from "lucide-react";

import { useEditorStore } from "@/store/editor-store";
import type { Slide, SlideElement } from "@/lib/schemas/slide";
import { GOOGLE_FONT_OPTIONS } from "@/lib/schemas/brand-kit";
import { uploadCanvasImage, UploadValidationError } from "@/lib/storage/upload-brand-asset";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColorField } from "@/components/brand/color-field";

export function ElementProperties({
  slide,
  element,
  userId,
}: {
  slide: Slide;
  element: SlideElement;
  userId: string;
}) {
  const updateElement = useEditorStore((s) => s.updateElement);
  const projectId = useEditorStore((s) => s.projectId);
  const [isReplacing, setIsReplacing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function patch(p: Partial<SlideElement>, commit = true) {
    updateElement(slide.id, element.id, p, commit);
  }

  function moveLayer(direction: "up" | "down") {
    const order = [...slide.layerOrder];
    const idx = order.indexOf(element.id);
    const swapWith = direction === "up" ? idx + 1 : idx - 1;
    if (swapWith < 0 || swapWith >= order.length) return;
    [order[idx], order[swapWith]] = [order[swapWith], order[idx]];
    useEditorStore.getState().updateSlide(slide.id, (s) => ({ ...s, layerOrder: order }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase text-muted-foreground">{element.type}</p>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-6" onClick={() => moveLayer("up")}>
            <ArrowUp className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-6" onClick={() => moveLayer("down")}>
            <ArrowDown className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-6" onClick={() => patch({ locked: !element.locked })}>
            {element.locked ? <Lock className="size-3.5" /> : <LockOpen className="size-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="size-6" onClick={() => patch({ hidden: !element.hidden })}>
            {element.hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() =>
              useEditorStore.getState().updateSlide(slide.id, (s) => ({
                ...s,
                elements: s.elements.filter((e) => e.id !== element.id),
                layerOrder: s.layerOrder.filter((id) => id !== element.id),
              }))
            }
          >
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Largura</Label>
          <Input
            type="number"
            value={Math.round(element.width)}
            onChange={(e) => patch({ width: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Altura</Label>
          <Input
            type="number"
            value={Math.round(element.height)}
            onChange={(e) => patch({ height: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Opacidade ({Math.round(element.opacity * 100)}%)</Label>
        <Slider
          min={0}
          max={1}
          step={0.05}
          value={[element.opacity]}
          onValueChange={([v]) => patch({ opacity: v }, false)}
          onValueCommit={([v]) => patch({ opacity: v })}
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Rotação ({Math.round(element.rotation)}°)</Label>
        <Slider
          min={-180}
          max={180}
          step={1}
          value={[element.rotation]}
          onValueChange={([v]) => patch({ rotation: v }, false)}
          onValueCommit={([v]) => patch({ rotation: v })}
        />
      </div>

      {element.type === "text" && (
        <div className="space-y-3 border-t pt-3">
          <div className="space-y-1">
            <Label className="text-xs">Fonte</Label>
            <Select value={element.fontFamily} onValueChange={(v) => patch({ fontFamily: v })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOOGLE_FONT_OPTIONS.map((f) => (
                  <SelectItem key={f.family} value={f.family}>
                    {f.family}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Tamanho</Label>
              <Input
                type="number"
                value={element.fontSize}
                onChange={(e) => patch({ fontSize: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Peso</Label>
              <Select
                value={String(element.fontWeight)}
                onValueChange={(v) => patch({ fontWeight: Number(v) })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[400, 500, 600, 700, 800].map((w) => (
                    <SelectItem key={w} value={String(w)}>
                      {w}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant={element.align === "left" ? "secondary" : "outline"}
              size="icon"
              onClick={() => patch({ align: "left" })}
            >
              <AlignLeft className="size-4" />
            </Button>
            <Button
              variant={element.align === "center" ? "secondary" : "outline"}
              size="icon"
              onClick={() => patch({ align: "center" })}
            >
              <AlignCenter className="size-4" />
            </Button>
            <Button
              variant={element.align === "right" ? "secondary" : "outline"}
              size="icon"
              onClick={() => patch({ align: "right" })}
            >
              <AlignRight className="size-4" />
            </Button>
          </div>

          <ColorField label="Cor do texto" value={element.color} onChange={(v) => patch({ color: v })} />

          <div className="space-y-1">
            <Label className="text-xs">Espaçamento entre linhas ({element.lineHeight.toFixed(2)})</Label>
            <Slider
              min={0.9}
              max={2}
              step={0.05}
              value={[element.lineHeight]}
              onValueChange={([v]) => patch({ lineHeight: v }, false)}
              onValueCommit={([v]) => patch({ lineHeight: v })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Espaçamento entre letras ({element.letterSpacing})</Label>
            <Slider
              min={-2}
              max={10}
              step={0.5}
              value={[element.letterSpacing]}
              onValueChange={([v]) => patch({ letterSpacing: v }, false)}
              onValueCommit={([v]) => patch({ letterSpacing: v })}
            />
          </div>
        </div>
      )}

      {(element.type === "shape") && (
        <div className="space-y-3 border-t pt-3">
          <ColorField label="Preenchimento" value={element.fill} onChange={(v) => patch({ fill: v })} />
          <div className="space-y-1">
            <Label className="text-xs">Arredondamento</Label>
            <Slider
              min={0}
              max={100}
              step={2}
              value={[element.borderRadius]}
              onValueChange={([v]) => patch({ borderRadius: v }, false)}
              onValueCommit={([v]) => patch({ borderRadius: v })}
            />
          </div>
        </div>
      )}

      {element.type === "image" && (
        <div className="space-y-3 border-t pt-3">
          <div className="space-y-1">
            <Label className="text-xs">Arredondamento</Label>
            <Slider
              min={0}
              max={100}
              step={2}
              value={[element.borderRadius]}
              onValueChange={([v]) => patch({ borderRadius: v }, false)}
              onValueCommit={([v]) => patch({ borderRadius: v })}
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setIsReplacing(true);
              try {
                const asset = await uploadCanvasImage(file, userId, projectId);
                patch({ src: asset.publicUrl, cropX: 0, cropY: 0, cropWidth: 1, cropHeight: 1 });
                toast.success("Imagem substituída.");
              } catch (err) {
                toast.error(
                  err instanceof UploadValidationError ? err.message : "Não foi possível enviar a imagem."
                );
              } finally {
                setIsReplacing(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled={isReplacing}
            onClick={() => fileInputRef.current?.click()}
          >
            {isReplacing ? <Loader2 className="size-3.5 animate-spin" /> : <Replace className="size-3.5" />}
            Substituir imagem
          </Button>
          <p className="text-xs text-muted-foreground">
            Arraste no canvas para reposicionar. Use os campos de largura/altura para recortar a
            área visível.
          </p>
        </div>
      )}
    </div>
  );
}
