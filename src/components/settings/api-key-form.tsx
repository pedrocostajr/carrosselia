"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound, Loader2, ShieldCheck, Trash2 } from "lucide-react";

import { apiKeyInputSchema } from "@/lib/schemas/user-settings";
import { saveApiKeyAction, removeApiKeyAction } from "@/app/dashboard/configuracoes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ApiKeyForm({ hasKey }: { hasKey: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  function handleSave() {
    const parsed = apiKeyInputSchema.safeParse({ anthropicApiKey: value });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Chave inválida.");
      return;
    }
    setFieldError(null);

    startTransition(async () => {
      try {
        await saveApiKeyAction(parsed.data.anthropicApiKey);
        toast.success("Chave da Anthropic salva. Suas próprias gerações usarão essa chave.");
        setValue("");
        router.refresh();
      } catch (err) {
        toast.error("Não foi possível salvar a chave.", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  function handleRemove() {
    startTransition(async () => {
      try {
        await removeApiKeyAction();
        toast.success("Chave removida. Voltando a usar a chave padrão do sistema.");
        router.refresh();
      } catch (err) {
        toast.error("Não foi possível remover a chave.", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-4" />
          Sua chave da Anthropic
        </CardTitle>
        <CardDescription>
          Por padrão, a geração por IA usa a chave compartilhada do sistema. Se você tiver sua
          própria chave da API da Anthropic, pode usá-la aqui: suas gerações passam a consumir os
          créditos da sua conta, sem depender da chave do sistema.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasKey && (
          <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
            <ShieldCheck className="size-4 shrink-0" />
            Você já configurou uma chave própria. Ela está sendo usada nas suas gerações.
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="anthropic-api-key">
            {hasKey ? "Substituir chave" : "Chave da API"}
          </Label>
          <Input
            id="anthropic-api-key"
            type="password"
            placeholder="sk-ant-..."
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          {fieldError && <p className="text-sm text-destructive">{fieldError}</p>}
          <p className="text-xs text-muted-foreground">
            Você pode gerar uma chave em{" "}
            <span className="font-mono">console.anthropic.com/settings/keys</span>. Ela fica
            salva apenas para a sua conta e nunca é exibida de volta na tela.
          </p>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button onClick={handleSave} disabled={isPending || !value}>
          {isPending ? <Loader2 className="animate-spin" /> : null}
          {hasKey ? "Substituir chave" : "Salvar chave"}
        </Button>
        {hasKey && (
          <Button variant="ghost" onClick={handleRemove} disabled={isPending}>
            <Trash2 className="text-destructive" />
            Remover chave
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
