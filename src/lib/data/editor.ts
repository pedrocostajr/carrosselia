import "server-only";

import { createClient } from "@/lib/supabase/server";
import { slideSchema, type Slide } from "@/lib/schemas/slide";
import type { CaptionResult, EditorialScore } from "@/lib/schemas/ai";

export interface EditorData {
  project: {
    id: string;
    title: string;
    format: "1080x1350" | "1080x1080";
    status: string;
    brandKitId: string | null;
  };
  carousel: {
    id: string;
    title: string;
    framework: string | null;
    tone: string;
    audience: string;
    caption: CaptionResult | null;
    editorialScore: EditorialScore | null;
  };
  slides: Slide[];
  brandKit: Awaited<ReturnType<typeof fetchBrandKit>>;
}

async function fetchBrandKit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  brandKitId: string | null
) {
  if (!brandKitId) return null;
  const { data } = await supabase.from("brand_kits").select("*").eq("id", brandKitId).maybeSingle();
  return data;
}

export async function getEditorData(projectId: string): Promise<EditorData | null> {
  const supabase = await createClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();
  if (projectError || !project) return null;

  const { data: carousel, error: carouselError } = await supabase
    .from("carousels")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (carouselError) throw carouselError;

  let slides: Slide[] = [];
  let carouselOut: EditorData["carousel"] = {
    id: "",
    title: project.title,
    framework: null,
    tone: "direto",
    audience: "",
    caption: null,
    editorialScore: null,
  };

  if (carousel) {
    const { data: slideRows, error: slidesError } = await supabase
      .from("slides")
      .select("*")
      .eq("carousel_id", carousel.id)
      .order("order_index", { ascending: true });
    if (slidesError) throw slidesError;

    slides = (slideRows ?? [])
      .map((row) => slideSchema.safeParse(row.slide_data))
      .filter((r): r is { success: true; data: Slide } => r.success)
      .map((r) => r.data);

    const strategy = (carousel.strategy as { tone?: string; audience?: string } | null) ?? null;
    carouselOut = {
      id: carousel.id,
      title: carousel.title,
      framework: carousel.framework,
      tone: strategy?.tone ?? "direto",
      audience: strategy?.audience ?? "",
      caption: (carousel.caption as CaptionResult | null) ?? null,
      editorialScore: (carousel.editorial_score as EditorialScore | null) ?? null,
    };
  }

  const brandKit = await fetchBrandKit(supabase, project.brand_kit_id);

  return {
    project: {
      id: project.id,
      title: project.title,
      format: project.format,
      status: project.status,
      brandKitId: project.brand_kit_id,
    },
    carousel: carouselOut,
    slides,
    brandKit,
  };
}
