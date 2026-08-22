import { AlertTriangle } from "lucide-react";

export function MissingSupabaseConfig() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <AlertTriangle className="size-10 text-destructive" />
      <h1 className="text-xl font-semibold">Configuração pendente</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        O Supabase ainda não foi configurado neste ambiente. Defina{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
        no arquivo <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.local</code> (veja o
        README) e recarregue a página.
      </p>
    </div>
  );
}
