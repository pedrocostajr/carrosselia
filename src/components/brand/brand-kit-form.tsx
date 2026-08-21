"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

import { brandKitInputSchema, GOOGLE_FONT_OPTIONS, VISUAL_STYLES, type BrandKitInput } from "@/lib/schemas/brand-kit";
import type { BrandKitRow } from "@/lib/data/brand-kits";
import { BRAND_KIT_PRESETS } from "@/lib/brand-kit-presets";
import { createBrandKitAction, updateBrandKitAction } from "@/app/dashboard/marca/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ColorField } from "@/components/brand/color-field";
import { AssetUploadField } from "@/components/brand/asset-upload-field";
import { GoogleFontsLoader } from "@/components/brand/google-fonts-loader";

const BUTTON_STYLE_LABELS: Record<string, string> = {
  solid: "Sólido",
  outline: "Contorno",
  soft: "Suave",
  ghost: "Fantasma",
};

const VISUAL_STYLE_LABELS: Record<string, string> = {
  minimalista: "Minimalista",
  elegante: "Elegante",
  forte: "Forte",
  editorial: "Editorial",
  descontraido: "Descontraído",
};

function rowToDefaults(row: BrandKitRow): BrandKitInput {
  return {
    name: row.name,
    displayName: row.display_name,
    instagramHandle: row.instagram_handle,
    avatarUrl: row.avatar_url,
    logoUrl: row.logo_url,
    logoAltUrl: row.logo_alt_url,
    colorPrimary: row.color_primary,
    colorSecondary: row.color_secondary,
    colorAccent: row.color_accent,
    colorBackground: row.color_background,
    colorText: row.color_text,
    fontHeading: row.font_heading,
    fontBody: row.font_body,
    buttonStyle: row.button_style as BrandKitInput["buttonStyle"],
    cornerRadius: row.corner_radius,
    visualStyle: row.visual_style as BrandKitInput["visualStyle"],
    footerText: row.footer_text,
    defaultCta: row.default_cta,
    siteOrHandle: row.site_or_handle,
  };
}

const DEFAULT_VALUES: BrandKitInput = {
  name: "",
  displayName: "",
  instagramHandle: "@",
  avatarUrl: null,
  logoUrl: null,
  logoAltUrl: null,
  colorPrimary: "#111111",
  colorSecondary: "#4B5563",
  colorAccent: "#2563EB",
  colorBackground: "#FFFFFF",
  colorText: "#111111",
  fontHeading: "Playfair Display",
  fontBody: "Inter",
  buttonStyle: "solid",
  cornerRadius: 16,
  visualStyle: "minimalista",
  footerText: null,
  defaultCta: null,
  siteOrHandle: null,
};

export function BrandKitForm({
  userId,
  existing,
  existingId,
}: {
  userId: string;
  existing?: BrandKitRow;
  existingId?: string;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kitId] = useState(() => existingId ?? existing?.id ?? crypto.randomUUID());

  const form = useForm<BrandKitInput>({
    resolver: zodResolver(brandKitInputSchema),
    defaultValues: existing ? rowToDefaults(existing) : DEFAULT_VALUES,
  });

  const values = form.watch();

  async function onSubmit(data: BrandKitInput) {
    setIsSubmitting(true);
    try {
      if (existing) {
        await updateBrandKitAction(kitId, data);
        toast.success("Kit de marca atualizado.");
      } else {
        await createBrandKitAction(kitId, data);
        toast.success("Kit de marca criado.");
      }
      router.push("/dashboard/marca");
      router.refresh();
    } catch (err) {
      toast.error("Não foi possível salvar o kit de marca.", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function applyPreset(presetId: string) {
    const preset = BRAND_KIT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    for (const [key, value] of Object.entries(preset.values)) {
      form.setValue(key as keyof BrandKitInput, value, { shouldDirty: true });
    }
    toast.success(`Preset "${preset.label}" aplicado.`);
  }

  return (
    <Form {...form}>
      <GoogleFontsLoader families={[values.fontHeading, values.fontBody]} />
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {!existing && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Começar a partir de um preset (opcional)</p>
            <div className="flex flex-wrap gap-2">
              {BRAND_KIT_PRESETS.map((preset) => (
                <Button
                  key={preset.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(preset.id)}
                >
                  <Sparkles className="size-3.5" />
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        <Tabs defaultValue="identidade">
          <TabsList>
            <TabsTrigger value="identidade">Identidade</TabsTrigger>
            <TabsTrigger value="cores">Cores</TabsTrigger>
            <TabsTrigger value="estilo">Tipografia e estilo</TabsTrigger>
          </TabsList>

          <TabsContent value="identidade" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do kit</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Marca principal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de exibição</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Ana Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="instagramHandle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuário do Instagram</FormLabel>
                    <FormControl>
                      <Input placeholder="@usuario" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="siteOrHandle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site ou arroba exibida nos slides</FormLabel>
                    <FormControl>
                      <Input placeholder="seusite.com.br" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <AssetUploadField
                label="Foto de perfil"
                kind="avatar"
                userId={userId}
                brandKitId={kitId}
                value={values.avatarUrl}
                onChange={(url) => form.setValue("avatarUrl", url, { shouldDirty: true })}
                circular
              />
              <AssetUploadField
                label="Logotipo principal"
                kind="logo"
                userId={userId}
                brandKitId={kitId}
                value={values.logoUrl}
                onChange={(url) => form.setValue("logoUrl", url, { shouldDirty: true })}
              />
              <AssetUploadField
                label="Logotipo alternativo"
                kind="logo_alt"
                userId={userId}
                brandKitId={kitId}
                value={values.logoAltUrl}
                onChange={(url) => form.setValue("logoAltUrl", url, { shouldDirty: true })}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="defaultCta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CTA padrão</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Salve este post"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="footerText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rodapé padrão</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: © Sua marca"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="cores" className="grid grid-cols-2 gap-4 pt-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="colorPrimary"
              render={({ field }) => (
                <ColorField label="Cor primária" value={field.value} onChange={field.onChange} />
              )}
            />
            <FormField
              control={form.control}
              name="colorSecondary"
              render={({ field }) => (
                <ColorField label="Cor secundária" value={field.value} onChange={field.onChange} />
              )}
            />
            <FormField
              control={form.control}
              name="colorAccent"
              render={({ field }) => (
                <ColorField label="Cor de destaque" value={field.value} onChange={field.onChange} />
              )}
            />
            <FormField
              control={form.control}
              name="colorBackground"
              render={({ field }) => (
                <ColorField label="Cor de fundo" value={field.value} onChange={field.onChange} />
              )}
            />
            <FormField
              control={form.control}
              name="colorText"
              render={({ field }) => (
                <ColorField label="Cor dos textos" value={field.value} onChange={field.onChange} />
              )}
            />
          </TabsContent>

          <TabsContent value="estilo" className="space-y-6 pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="fontHeading"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fonte para títulos</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GOOGLE_FONT_OPTIONS.map((f) => (
                          <SelectItem key={f.family} value={f.family}>
                            {f.family}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fontBody"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fonte para textos</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GOOGLE_FONT_OPTIONS.map((f) => (
                          <SelectItem key={f.family} value={f.family}>
                            {f.family}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="buttonStyle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estilo dos botões e etiquetas</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(BUTTON_STYLE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="visualStyle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferência visual</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {VISUAL_STYLES.map((style) => (
                          <SelectItem key={style} value={style}>
                            {VISUAL_STYLE_LABELS[style]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="cornerRadius"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Arredondamento dos elementos ({field.value}px)</FormLabel>
                  <FormControl>
                    <Slider
                      min={0}
                      max={48}
                      step={2}
                      value={[field.value]}
                      onValueChange={([v]) => field.onChange(v)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/marca")}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {existing ? "Salvar alterações" : "Criar kit de marca"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
