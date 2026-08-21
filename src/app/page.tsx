import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function Home() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/dashboard");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-24 text-center">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Sparkles className="size-4" />
        Carousel AI
      </div>
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Crie carrosséis inteligentes para Instagram com a sua identidade visual
      </h1>
      <p className="max-w-xl text-lg text-muted-foreground text-balance">
        Cole um link, um texto ou apenas uma ideia. A IA cria o roteiro, você edita visualmente e
        exporta pronto para publicar.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/cadastrar">
            Começar agora
            <ArrowRight />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/entrar">Entrar</Link>
        </Button>
      </div>
    </main>
  );
}
