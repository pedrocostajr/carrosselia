import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/**
 * Uploads AI-generated image bytes to the public brand-assets bucket under
 * the requesting user's own folder, using the same RLS-backed path
 * convention as user uploads, and records it in the assets table.
 */
export async function uploadGeneratedImage(
  supabase: SupabaseClient<Database>,
  params: {
    userId: string;
    projectId: string;
    slideId: string;
    bytes: Buffer;
    mimeType: string;
  }
): Promise<string> {
  const ext = EXT_BY_MIME[params.mimeType] || "png";
  const path = `${params.userId}/projects/${params.projectId}/generated/${params.slideId}.${ext}`;

  const { error } = await supabase.storage.from("brand-assets").upload(path, params.bytes, {
    contentType: params.mimeType,
    upsert: true,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("brand-assets").getPublicUrl(path);

  await supabase.from("assets").insert({
    user_id: params.userId,
    project_id: params.projectId,
    kind: "upload",
    storage_path: path,
    mime_type: params.mimeType,
    size_bytes: params.bytes.byteLength,
  });

  return data.publicUrl;
}
