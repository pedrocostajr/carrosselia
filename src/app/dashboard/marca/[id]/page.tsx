import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getBrandKit } from "@/lib/data/brand-kits";
import { BrandKitForm } from "@/components/brand/brand-kit-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EditBrandKitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const kit = await getBrandKit(id);
  if (!kit) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Editar kit de marca</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{kit.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <BrandKitForm userId={user.id} existing={kit} existingId={kit.id} />
        </CardContent>
      </Card>
    </div>
  );
}
