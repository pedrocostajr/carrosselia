"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { slideSchema, slideFormatSchema, type Slide } from "@/lib/schemas/slide";
import { captionSchema, editorialScoreSchema, type CaptionResult, type EditorialScore } from "@/lib/schemas/ai";

const idSchema = z.string().uuid();
const qualitySchema = z.enum(["standard", "high", "maximum"]);

export async function saveCarouselAction(carouselId: string, slides: Slide[]) {
  const parsedCarouselId = idSchema.parse(carouselId);
  const validSlides = slides.map((s) => slideSchema.parse(s));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data: existing, error: existingError } = await supabase
    .from("slides")
    .select("id")
    .eq("carousel_id", parsedCarouselId);
  if (existingError) throw new Error(existingError.message);

  const nextIds = new Set(validSlides.map((s) => s.id));
  const toDelete = (existing ?? []).filter((row) => !nextIds.has(row.id)).map((row) => row.id);

  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase.from("slides").delete().in("id", toDelete);
    if (deleteError) throw new Error(deleteError.message);
  }

  if (validSlides.length > 0) {
    const { error: upsertError } = await supabase.from("slides").upsert(
      validSlides.map((slide) => ({
        id: slide.id,
        user_id: user.id,
        carousel_id: parsedCarouselId,
        order_index: slide.order,
        type: slide.type,
        template: slide.template,
        format: slide.format,
        slide_data: slide,
      })),
      { onConflict: "id" }
    );
    if (upsertError) throw new Error(upsertError.message);
  }

  await supabase
    .from("carousels")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", parsedCarouselId);

  return { savedAt: Date.now() };
}

export async function renameProjectTitleAction(projectId: string, title: string) {
  const parsedId = idSchema.parse(projectId);
  const parsedTitle = z.string().min(1).max(200).parse(title);

  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ title: parsedTitle }).eq("id", parsedId);
  if (error) throw new Error(error.message);
  revalidatePath(`/editor/${parsedId}`);
}

export async function markProjectExportedAction(projectId: string) {
  const parsedId = idSchema.parse(projectId);
  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ status: "exported" }).eq("id", parsedId);
  if (error) throw new Error(error.message);
}

export async function recordExportAction(params: {
  projectId: string;
  carouselId: string;
  format: string;
  quality: string;
  fileCount: number;
  pdfIncluded: boolean;
}) {
  const projectId = idSchema.parse(params.projectId);
  const carouselId = idSchema.parse(params.carouselId);
  const format = slideFormatSchema.parse(params.format);
  const quality = qualitySchema.parse(params.quality);
  const fileCount = z.number().int().min(0).parse(params.fileCount);
  const pdfIncluded = z.boolean().parse(params.pdfIncluded);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { error } = await supabase.from("exports").insert({
    user_id: user.id,
    project_id: projectId,
    carousel_id: carouselId,
    format,
    quality,
    file_count: fileCount,
    pdf_included: pdfIncluded,
  });
  if (error) throw new Error(error.message);

  await supabase.from("projects").update({ status: "exported" }).eq("id", projectId);
}

export async function updateCarouselCaptionAction(carouselId: string, caption: CaptionResult) {
  const parsedId = idSchema.parse(carouselId);
  const parsedCaption = captionSchema.parse(caption);
  const supabase = await createClient();
  const { error } = await supabase
    .from("carousels")
    .update({ caption: parsedCaption })
    .eq("id", parsedId);
  if (error) throw new Error(error.message);
}

export async function updateCarouselScoreAction(carouselId: string, score: EditorialScore) {
  const parsedId = idSchema.parse(carouselId);
  const parsedScore = editorialScoreSchema.parse(score);
  const supabase = await createClient();
  const { error } = await supabase
    .from("carousels")
    .update({ editorial_score: parsedScore })
    .eq("id", parsedId);
  if (error) throw new Error(error.message);
}
