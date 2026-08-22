"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isConfigError = error.message.includes("não está configurada");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <AlertTriangle className="size-10 text-destructive" />
      <h1 className="text-xl font-semibold">
        {isConfigError ? "Configuração pendente" : "Algo deu errado"}
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {isConfigError
          ? "O Supabase ainda não foi configurado neste ambiente. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local (veja o README) e recarregue a página."
          : "Ocorreu um erro inesperado. Você pode tentar novamente."}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => reset()}>
          Tentar novamente
        </Button>
        <Button asChild>
          <Link href="/">Voltar ao início</Link>
        </Button>
      </div>
    </div>
  );
}
