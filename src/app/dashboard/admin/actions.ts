"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/data/admin";
import { createAdminClient } from "@/lib/supabase/admin";

const idSchema = z.string().uuid();

export async function approveUserAction(userId: string) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Apenas o administrador pode fazer isso.");
  const parsedId = idSchema.parse(userId);

  const { error } = await admin.supabase
    .from("profiles")
    .update({ approval_status: "approved" })
    .eq("id", parsedId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/admin");
}

export async function rejectUserAction(userId: string) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Apenas o administrador pode fazer isso.");
  const parsedId = idSchema.parse(userId);

  if (parsedId === admin.user.id) {
    throw new Error("Você não pode rejeitar a própria conta de administrador.");
  }

  const { error } = await admin.supabase
    .from("profiles")
    .update({ approval_status: "rejected" })
    .eq("id", parsedId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/admin");
}

/**
 * Permanently deletes a user's auth account. Every owned row (profile,
 * brand kits, projects, carousels, slides, assets, exports, ai_generations)
 * cascades away via the existing "on delete cascade" foreign keys to
 * auth.users - there is nothing left to clean up manually. Irreversible.
 */
export async function deleteUserAction(userId: string) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Apenas o administrador pode fazer isso.");
  const parsedId = idSchema.parse(userId);

  if (parsedId === admin.user.id) {
    throw new Error("Você não pode excluir a própria conta de administrador.");
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(parsedId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/admin");
}
