"use client";

import { toast } from "sonner";
import { Copy, MessageSquareQuote } from "lucide-react";

import { useEditorStore } from "@/store/editor-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";

function CopyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={() => {
            navigator.clipboard.writeText(value);
            toast.success("Copiado.");
          }}
        >
          <Copy className="size-3" />
        </Button>
      </div>
      <Textarea readOnly value={value} rows={Math.min(6, Math.max(2, Math.ceil(value.length / 60)))} />
    </div>
  );
}

export function CaptionPanel() {
  const caption = useEditorStore((s) => s.caption);

  if (!caption) {
    return (
      <EmptyState
        icon={MessageSquareQuote}
        title="Legenda ainda não gerada"
        description="A legenda é criada automaticamente ao gerar o carrossel."
      />
    );
  }

  const fullCaption = `${caption.opening}\n\n${caption.body}\n\n${caption.cta}\n\n${caption.hashtags
    .map((h) => `#${h}`)
    .join(" ")}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <MessageSquareQuote className="size-4" /> Legenda para Instagram
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            navigator.clipboard.writeText(fullCaption);
            toast.success("Legenda completa copiada.");
          }}
        >
          <Copy className="size-3.5" /> Copiar tudo
        </Button>
      </div>

      <CopyField label="Frase de abertura" value={caption.opening} />
      <CopyField label="Desenvolvimento" value={caption.body} />
      <CopyField label="CTA" value={caption.cta} />

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Hashtags</Label>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() => {
              navigator.clipboard.writeText(caption.hashtags.map((h) => `#${h}`).join(" "));
              toast.success("Hashtags copiadas.");
            }}
          >
            <Copy className="size-3" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1">
          {caption.hashtags.map((h) => (
            <Badge key={h} variant="secondary">
              #{h}
            </Badge>
          ))}
        </div>
      </div>

      <CopyField label="Comentário fixado sugerido" value={caption.pinnedComment} />
      <CopyField label="Texto alternativo (acessibilidade)" value={caption.altText} />

      <div className="space-y-1">
        <Label className="text-xs">Opções de título</Label>
        {caption.titleOptions.map((title, i) => (
          <CopyField key={i} label={`Opção ${i + 1}`} value={title} />
        ))}
      </div>
    </div>
  );
}
