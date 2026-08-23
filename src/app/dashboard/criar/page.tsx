import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { listBrandKits } from "@/lib/data/brand-kits";
import { isImageGenConfigured } from "@/lib/ai/image";
import { CreationWizard } from "@/components/wizard/creation-wizard";
import { MissingSupabaseConfig } from "@/components/missing-supabase-config";

export default async function CreateProjectPage() {
  if (!isSupabaseConfigured()) {
    return <MissingSupabaseConfig />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const brandKits = await listBrandKits();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Criar novo carrossel</h1>
        <p className="text-sm text-muted-foreground">
          Em poucos passos, a IA transforma seu conteúdo em um carrossel pronto para editar.
        </p>
      </div>
      <CreationWizard brandKits={brandKits} imageGenAvailable={isImageGenConfigured()} />
    </div>
  );
}
