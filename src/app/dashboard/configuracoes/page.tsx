import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getUserAnthropicKey } from "@/lib/data/user-api-key";
import { ApiKeyForm } from "@/components/settings/api-key-form";

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const apiKey = await getUserAnthropicKey(supabase, user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie sua conta e preferências de geração por IA.
        </p>
      </div>
      <ApiKeyForm hasKey={!!apiKey} />
    </div>
  );
}
