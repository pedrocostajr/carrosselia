"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const idSchema = z.string().uuid();
const titleSchema = z.string().min(1).max(200);

export async function renameProjectAction(projectId: string, title: string) {
  const parsedId = idSchema.parse(projectId);
  const parsedTitle = titleSchema.parse(title);

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ title: parsedTitle })
    .eq("id", parsedId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function deleteProjectAction(projectId: string) {
  const parsedId = idSchema.parse(projectId);
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", parsedId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function duplicateProjectAction(projectId: string) {
  const parsedId = idSchema.parse(projectId);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data: original, error: fetchError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", parsedId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const { data: newProject, error: insertError } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      brand_kit_id: original.brand_kit_id,
      title: `${original.title} (cópia)`,
      format: original.format,
      status: "draft",
      locale: original.locale,
    })
    .select()
    .single();
  if (insertError) throw new Error(insertError.message);

  const { data: carousels, error: carouselsError } = await supabase
    .from("carousels")
    .select("*")
    .eq("project_id", parsedId);
  if (carouselsError) throw new Error(carouselsError.message);

  for (const carousel of carousels ?? []) {
    const { data: newCarousel, error: newCarouselError } = await supabase
      .from("carousels")
      .insert({
        user_id: user.id,
        project_id: newProject.id,
        brand_kit_id: carousel.brand_kit_id,
        title: carousel.title,
        framework: carousel.framework,
        format: carousel.format,
        strategy: carousel.strategy,
        caption: carousel.caption,
        editorial_score: carousel.editorial_score,
      })
      .select()
      .single();
    if (newCarouselError) throw new Error(newCarouselError.message);

    const { data: slides, error: slidesError } = await supabase
      .from("slides")
      .select("*")
      .eq("carousel_id", carousel.id)
      .order("order_index", { ascending: true });
    if (slidesError) throw new Error(slidesError.message);

    if (slides && slides.length > 0) {
      const { error: insertSlidesError } = await supabase.from("slides").insert(
        slides.map((slide) => ({
          user_id: user.id,
          carousel_id: newCarousel.id,
          order_index: slide.order_index,
          type: slide.type,
          template: slide.template,
          format: slide.format,
          slide_data: slide.slide_data,
        }))
      );
      if (insertSlidesError) throw new Error(insertSlidesError.message);
    }
  }

  revalidatePath("/dashboard");
  return newProject.id as string;
}
