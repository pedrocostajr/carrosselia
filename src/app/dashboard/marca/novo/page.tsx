import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { BrandKitForm } from "@/components/brand/brand-kit-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewBrandKitPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Novo kit de marca</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identidade visual</CardTitle>
        </CardHeader>
        <CardContent>
          <BrandKitForm userId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
