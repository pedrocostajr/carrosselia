"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { brandKitInputSchema } from "@/lib/schemas/brand-kit";
import { slideSchema, type Slide } from "@/lib/schemas/slide";

const idSchema = z.string().uuid();

function toRow(input: z.infer<typeof brandKitInputSchema>) {
  return {
    name: input.name,
    display_name: input.displayName,
    instagram_handle: input.instagramHandle,
    avatar_url: input.avatarUrl,
    logo_url: input.logoUrl,
    logo_alt_url: input.logoAltUrl,
    color_primary: input.colorPrimary,
    color_secondary: input.colorSecondary,
    color_accent: input.colorAccent,
    color_background: input.colorBackground,
    color_text: input.colorText,
    font_heading: input.fontHeading,
    font_body: input.fontBody,
    button_style: input.buttonStyle,
    corner_radius: input.cornerRadius,
    visual_style: input.visualStyle,
    footer_text: input.footerText,
    default_cta: input.defaultCta,
    site_or_handle: input.siteOrHandle,
  };
}

export async function createBrandKitAction(
  id: string,
  values: z.infer<typeof brandKitInputSchema>
) {
  const parsedId = idSchema.parse(id);
  const parsed = brandKitInputSchema.parse(values);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { error } = await supabase.from("brand_kits").insert({
    id: parsedId,
    user_id: user.id,
    ...toRow(parsed),
  });
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/marca");
  return parsedId;
}

export async function updateBrandKitAction(
  id: string,
  values: z.infer<typeof brandKitInputSchema>
) {
  const parsedId = idSchema.parse(id);
  const parsed = brandKitInputSchema.parse(values);

  const supabase = await createClient();
  const { error } = await supabase.from("brand_kits").update(toRow(parsed)).eq("id", parsedId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/marca");
  revalidatePath(`/dashboard/marca/${parsedId}`);
}

export async function deleteBrandKitAction(id: string) {
  const parsedId = idSchema.parse(id);
  const supabase = await createClient();
  const { error } = await supabase.from("brand_kits").delete().eq("id", parsedId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/marca");
}

export async function duplicateBrandKitAction(id: string) {
  const parsedId = idSchema.parse(id);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data: original, error: fetchError } = await supabase
    .from("brand_kits")
    .select("*")
    .eq("id", parsedId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const { id: _id, user_id, created_at, updated_at, is_preset, ...rest } = original;
  void _id;
  void user_id;
  void created_at;
  void updated_at;
  void is_preset;

  const { data: inserted, error: insertError } = await supabase
    .from("brand_kits")
    .insert({ ...rest, user_id: user.id, name: `${original.name} (cópia)` })
    .select()
    .single();
  if (insertError) throw new Error(insertError.message);

  revalidatePath("/dashboard/marca");
  return inserted.id as string;
}

/**
 * Re-applies this brand kit's colors, fonts, logo and avatar across every
 * slide of every carousel already using it - the "Aplicar em todos os
 * slides" action. Only touches roles a brand kit actually controls (text
 * color/font by role, logo/avatar image references, solid-color
 * backgrounds); manual per-slide overrides to unrelated properties are left
 * untouched.
 */
export async function applyBrandKitToAllSlidesAction(brandKitId: string) {
  const parsedId = idSchema.parse(brandKitId);
  const supabase = await createClient();

  const { data: kit, error: kitError } = await supabase
    .from("brand_kits")
    .select("*")
    .eq("id", parsedId)
    .single();
  if (kitError) throw new Error(kitError.message);

  const { data: carousels, error: carouselsError } = await supabase
    .from("carousels")
    .select("id")
    .eq("brand_kit_id", parsedId);
  if (carouselsError) throw new Error(carouselsError.message);

  let updatedSlides = 0;

  for (const carousel of carousels ?? []) {
    const { data: slides, error: slidesError } = await supabase
      .from("slides")
      .select("id, slide_data")
      .eq("carousel_id", carousel.id);
    if (slidesError) throw new Error(slidesError.message);

    for (const row of slides ?? []) {
      const parsedSlide = slideSchema.safeParse(row.slide_data);
      if (!parsedSlide.success) continue;

      const next = applyBrandToSlide(parsedSlide.data, kit);
      const { error: updateError } = await supabase
        .from("slides")
        .update({ slide_data: next })
        .eq("id", row.id);
      if (updateError) throw new Error(updateError.message);
      updatedSlides += 1;
    }
  }

  revalidatePath("/dashboard/marca");
  return { updatedSlides };
}

interface BrandKitRowLike {
  color_primary: string;
  color_secondary: string;
  color_accent: string;
  color_background: string;
  color_text: string;
  font_heading: string;
  font_body: string;
  logo_url: string | null;
  avatar_url: string | null;
  display_name: string;
  instagram_handle: string;
}

function applyBrandToSlide(slide: Slide, kit: BrandKitRowLike): Slide {
  return {
    ...slide,
    background:
      slide.background.type === "color"
        ? { ...slide.background, color: kit.color_background }
        : slide.background,
    elements: slide.elements.map((el) => {
      if (el.type === "text") {
        const isHeading = el.role === "headline";
        return {
          ...el,
          fontFamily: isHeading ? kit.font_heading : kit.font_body,
          color: el.role === "footer" ? kit.color_secondary : kit.color_text,
          emphasisColor: kit.color_accent,
          text:
            el.role === "handle"
              ? kit.instagram_handle
              : el.role === "displayName"
              ? kit.display_name
              : el.text,
        };
      }
      if (el.type === "logo" && kit.logo_url) {
        return { ...el, src: kit.logo_url };
      }
      if (el.type === "avatar" && kit.avatar_url) {
        return { ...el, src: kit.avatar_url };
      }
      return el;
    }),
  };
}
