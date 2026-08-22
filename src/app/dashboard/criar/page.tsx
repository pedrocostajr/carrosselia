import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { listBrandKits } from "@/lib/data/brand-kits";
import { CreationWizard } from "@/components/wizard/creation-wizard";

export default async function CreateProjectPage() {
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
      <CreationWizard brandKits={brandKits} />
    </div>
  );
}
