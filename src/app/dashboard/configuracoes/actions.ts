"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { apiKeyInputSchema } from "@/lib/schemas/user-settings";
import { setUserAnthropicKey } from "@/lib/data/user-api-key";

export async function saveApiKeyAction(anthropicApiKey: string) {
  const parsed = apiKeyInputSchema.parse({ anthropicApiKey });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  await setUserAnthropicKey(supabase, user.id, parsed.anthropicApiKey);
  revalidatePath("/dashboard/configuracoes");
}

export async function removeApiKeyAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  await setUserAnthropicKey(supabase, user.id, null);
  revalidatePath("/dashboard/configuracoes");
}
