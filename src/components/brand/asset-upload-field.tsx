"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImageIcon, Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { uploadBrandAsset, UploadValidationError } from "@/lib/storage/upload-brand-asset";

export function AssetUploadField({
  label,
  kind,
  userId,
  brandKitId,
  value,
  onChange,
  circular = false,
}: {
  label: string;
  kind: "logo" | "logo_alt" | "avatar";
  userId: string;
  brandKitId: string;
  value: string | null;
  onChange: (url: string) => void;
  circular?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setIsUploading(true);
    try {
      const asset = await uploadBrandAsset(file, kind, userId, brandKitId);
      onChange(asset.publicUrl);
      toast.success("Imagem enviada.");
    } catch (err) {
      const message =
        err instanceof UploadValidationError
          ? err.message
          : "Não foi possível enviar a imagem.";
      toast.error(message);
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div
          className={`flex size-16 shrink-0 items-center justify-center overflow-hidden border bg-muted ${
            circular ? "rounded-full" : "rounded-md"
          }`}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={label} className="size-full object-cover" />
          ) : (
            <ImageIcon className="size-5 text-muted-foreground" />
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? <Loader2 className="animate-spin" /> : <Upload />}
          {value ? "Substituir" : "Enviar imagem"}
        </Button>
      </div>
    </div>
  );
}
