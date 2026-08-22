"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, Shapes, Type, UserCircle2, Image as LogoIcon } from "lucide-react";

import { useEditorStore } from "@/store/editor-store";
import type { EditorData } from "@/lib/data/editor";
import { SLIDE_DIMENSIONS } from "@/lib/schemas/slide";
import { uploadCanvasImage, UploadValidationError } from "@/lib/storage/upload-brand-asset";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function CanvasToolbar({
  userId,
  brandKit,
}: {
  userId: string;
  brandKit: EditorData["brandKit"];
}) {
  const slides = useEditorStore((s) => s.slides);
  const selectedSlideId = useEditorStore((s) => s.selectedSlideId);
  const projectId = useEditorStore((s) => s.projectId);
  const updateSlide = useEditorStore((s) => s.updateSlide);
  const selectElement = useEditorStore((s) => s.selectElement);

  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const slide = slides.find((s) => s.id === selectedSlideId);

  function addElementToSlide(build: (dims: { width: number; height: number }) => import("@/lib/schemas/slide").SlideElement) {
    if (!slide) return;
    const dims = SLIDE_DIMENSIONS[slide.format];
    const element = build(dims);
    updateSlide(slide.id, (s) => ({
      ...s,
      elements: [...s.elements, element],
      layerOrder: [...s.layerOrder, element.id],
    }));
    selectElement(element.id);
  }

  function handleAddText() {
    addElementToSlide((dims) => ({
      id: crypto.randomUUID(),
      type: "text",
      role: "body",
      zIndex: 0,
      x: dims.width / 2 - 200,
      y: dims.height / 2 - 40,
      width: 400,
      height: 80,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      text: "Novo texto",
      fontFamily: "Inter",
      fontSize: 40,
      fontWeight: 600,
      fontStyle: "normal",
      color: "#111111",
      align: "left",
      lineHeight: 1.2,
      letterSpacing: 0,
      emphasisRanges: [],
      autoFit: true,
      minFontSize: 18,
    }));
  }

  function handleAddShape(shape: "rect" | "ellipse") {
    addElementToSlide((dims) => ({
      id: crypto.randomUUID(),
      type: "shape",
      zIndex: 0,
      x: dims.width / 2 - 100,
      y: dims.height / 2 - 100,
      width: 200,
      height: 200,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      shape,
      fill: "#2563EB",
      stroke: null,
      strokeWidth: 0,
      borderRadius: shape === "rect" ? 16 : 0,
    }));
  }

  function handleAddAvatar() {
    if (!brandKit?.avatar_url) {
      toast.info("Cadastre uma foto de perfil no kit de marca para usá-la aqui.");
      return;
    }
    addElementToSlide((dims) => ({
      id: crypto.randomUUID(),
      type: "avatar",
      zIndex: 0,
      x: dims.width / 2 - 40,
      y: 64,
      width: 80,
      height: 80,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      assetId: null,
      src: brandKit.avatar_url,
      borderColor: null,
      borderWidth: 0,
    }));
  }

  function handleAddLogo() {
    if (!brandKit?.logo_url) {
      toast.info("Cadastre um logotipo no kit de marca para usá-lo aqui.");
      return;
    }
    addElementToSlide((dims) => ({
      id: crypto.randomUUID(),
      type: "logo",
      zIndex: 0,
      x: dims.width - 120,
      y: dims.height - 120,
      width: 56,
      height: 56,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      assetId: null,
      src: brandKit.logo_url,
      variant: "primary",
    }));
  }

  async function handleImageFile(file: File | undefined) {
    if (!file || !slide) return;
    setIsUploading(true);
    try {
      const asset = await uploadCanvasImage(file, userId, projectId);
      const dims = SLIDE_DIMENSIONS[slide.format];
      addElementToSlide(() => ({
        id: crypto.randomUUID(),
        type: "image",
        zIndex: 0,
        x: dims.width / 2 - 150,
        y: dims.height / 2 - 150,
        width: 300,
        height: 300,
        rotation: 0,
        opacity: 1,
        locked: false,
        hidden: false,
        assetId: null,
        src: asset.publicUrl,
        cropX: 0,
        cropY: 0,
        cropWidth: 1,
        cropHeight: 1,
        borderRadius: 0,
        shadow: null,
      }));
      toast.success("Imagem adicionada.");
    } catch (err) {
      toast.error(err instanceof UploadValidationError ? err.message : "Não foi possível enviar a imagem.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-1.5 border-b bg-background p-2">
      <Button variant="ghost" size="sm" disabled={!slide} onClick={handleAddText}>
        <Type className="size-4" /> Texto
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={!slide}>
            <Shapes className="size-4" /> Forma
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => handleAddShape("rect")}>Retângulo</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleAddShape("ellipse")}>Elipse</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => handleImageFile(e.target.files?.[0])}
      />
      <Button
        variant="ghost"
        size="sm"
        disabled={!slide || isUploading}
        onClick={() => inputRef.current?.click()}
      >
        {isUploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
        Imagem
      </Button>

      <Button variant="ghost" size="sm" disabled={!slide} onClick={handleAddAvatar}>
        <UserCircle2 className="size-4" /> Foto de perfil
      </Button>

      <Button variant="ghost" size="sm" disabled={!slide} onClick={handleAddLogo}>
        <LogoIcon className="size-4" /> Logotipo
      </Button>
    </div>
  );
}
