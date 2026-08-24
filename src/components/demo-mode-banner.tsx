import Link from "next/link";
import { FlaskConical } from "lucide-react";

export function DemoModeBanner() {
  return (
    <div className="flex items-center justify-center gap-2 border-b bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
      <FlaskConical className="size-4 shrink-0" />
      Modo demonstração ativo: a geração por IA é simulada de forma determinística porque nenhuma
      chave da Anthropic está configurada. Todas as outras funcionalidades são reais. Você pode
      usar sua própria chave em{" "}
      <Link href="/dashboard/configuracoes" className="underline underline-offset-2">
        Configurações
      </Link>
      .
    </div>
  );
}
