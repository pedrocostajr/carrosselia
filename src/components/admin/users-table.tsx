"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, ShieldCheck, Trash2, X } from "lucide-react";

import type { UserWithActivity } from "@/lib/data/admin";
import { approveUserAction, rejectUserAction, deleteUserAction } from "@/app/dashboard/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
};

const STATUS_VARIANT: Record<string, "secondary" | "default" | "destructive"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
};

export function UsersTable({
  users,
  currentUserId,
}: {
  users: UserWithActivity[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<UserWithActivity | null>(null);

  function handleApprove(userId: string) {
    startTransition(async () => {
      try {
        await approveUserAction(userId);
        toast.success("Usuário aprovado.");
        router.refresh();
      } catch (err) {
        toast.error("Não foi possível aprovar.", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  function handleReject(userId: string) {
    startTransition(async () => {
      try {
        await rejectUserAction(userId);
        toast.success("Usuário rejeitado.");
        router.refresh();
      } catch (err) {
        toast.error("Não foi possível rejeitar.", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        await deleteUserAction(deleteTarget.id);
        toast.success("Usuário excluído.");
        setDeleteTarget(null);
        router.refresh();
      } catch (err) {
        toast.error("Não foi possível excluir.", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Projetos</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{u.full_name || "(sem nome)"}</span>
                    <span className="text-xs text-muted-foreground">{u.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[u.approval_status]}>
                    {STATUS_LABEL[u.approval_status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {u.role === "admin" ? (
                    <Badge variant="outline" className="gap-1">
                      <ShieldCheck className="size-3" /> Admin
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">Usuário</span>
                  )}
                </TableCell>
                <TableCell>{u.projectCount}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell className="text-right">
                  {u.id === currentUserId ? (
                    <span className="text-xs text-muted-foreground">Você</span>
                  ) : (
                    <div className="flex justify-end gap-1">
                      {u.approval_status !== "approved" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          disabled={isPending}
                          onClick={() => handleApprove(u.id)}
                        >
                          <Check className="size-4 text-emerald-600" />
                        </Button>
                      )}
                      {u.approval_status !== "rejected" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          disabled={isPending}
                          onClick={() => handleReject(u.id)}
                        >
                          <X className="size-4 text-amber-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        disabled={isPending}
                        onClick={() => setDeleteTarget(u)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Isso vai excluir permanentemente a conta de {deleteTarget?.email}, incluindo todos os
              projetos, kits de marca e exportações. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isPending ? <Loader2 className="animate-spin" /> : null}
              Excluir permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
