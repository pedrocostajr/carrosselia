import { Clock, ShieldX } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ApprovalGate({ status }: { status: "pending" | "rejected" }) {
  const isPending = status === "pending";

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      {isPending ? (
        <Clock className="size-10 text-muted-foreground" />
      ) : (
        <ShieldX className="size-10 text-destructive" />
      )}
      <h1 className="text-xl font-semibold">
        {isPending ? "Sua conta aguarda aprovação" : "Acesso não autorizado"}
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {isPending
          ? "Um administrador precisa aprovar seu cadastro antes que você possa criar e editar carrosséis. Você será avisado assim que isso acontecer."
          : "O acesso desta conta foi negado por um administrador do sistema."}
      </p>
      <form action="/auth/sign-out" method="post">
        <Button variant="outline" type="submit">
          Sair
        </Button>
      </form>
    </div>
  );
}
