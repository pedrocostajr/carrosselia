"use client";

import { customAlphabet } from "nanoid";

import { createClient } from "@/lib/supabase/client";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10);

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export class UploadValidationError extends Error {}

export interface UploadedAsset {
  storagePath: string;
  publicUrl: string;
  mimeType: string;
  sizeBytes: number;
}

/**
 * Uploads a brand asset (logo, alternate logo, avatar) directly to the
 * public "brand-assets" Supabase Storage bucket from the browser. The path
 * is always generated server-side-equivalent (random id, whitelisted
 * extension) rather than derived from the user's original filename, and is
 * namespaced under the user's own id so storage RLS policies guarantee only
 * the owner can write or delete it.
 */
export async function uploadBrandAsset(
  file: File,
  kind: "logo" | "logo_alt" | "avatar",
  userId: string,
  brandKitId: string
): Promise<UploadedAsset> {
  const ext = ALLOWED_MIME_TO_EXT[file.type];
  if (!ext) {
    throw new UploadValidationError(
      "Formato de arquivo não suportado. Envie PNG, JPG, WEBP ou SVG."
    );
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new UploadValidationError("O arquivo deve ter no máximo 10MB.");
  }

  const supabase = createClient();
  const path = `${userId}/brand/${brandKitId}/${kind}-${nanoid()}.${ext}`;

  const { error } = await supabase.storage.from("brand-assets").upload(path, file, {
    contentType: file.type,
    upsert: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from("brand-assets").getPublicUrl(path);

  await supabase.from("assets").insert({
    user_id: userId,
    brand_kit_id: brandKitId,
    kind,
    storage_path: path,
    mime_type: file.type,
    size_bytes: file.size,
  });

  return {
    storagePath: path,
    publicUrl: data.publicUrl,
    mimeType: file.type,
    sizeBytes: file.size,
  };
}
