"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Copy, MoreVertical, Pencil, Trash2 } from "lucide-react";

import type { ProjectWithBrandKit } from "@/lib/data/projects";
import {
  deleteProjectAction,
  duplicateProjectAction,
  renameProjectAction,
} from "@/app/dashboard/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  ready: "Pronto",
  exported: "Exportado",
};

const STATUS_VARIANT: Record<string, "secondary" | "default" | "outline"> = {
  draft: "secondary",
  ready: "default",
  exported: "outline",
};

export function ProjectCard({ project }: { project: ProjectWithBrandKit }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [title, setTitle] = useState(project.title);

  function handleRename() {
    startTransition(async () => {
      try {
        await renameProjectAction(project.id, title);
        toast.success("Projeto renomeado.");
        setRenameOpen(false);
      } catch (err) {
        toast.error("Não foi possível renomear o projeto.", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteProjectAction(project.id);
        toast.success("Projeto excluído.");
        setDeleteOpen(false);
      } catch (err) {
        toast.error("Não foi possível excluir o projeto.", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  function handleDuplicate() {
    startTransition(async () => {
      try {
        await duplicateProjectAction(project.id);
        toast.success("Projeto duplicado.");
        router.refresh();
      } catch (err) {
        toast.error("Não foi possível duplicar o projeto.", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  const updatedAt = new Date(project.updated_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <>
      <Card className="group relative gap-3 py-4">
        <CardHeader className="flex-row items-start justify-between gap-2 px-4">
          <CardTitle className="line-clamp-2 text-base">
            <Link href={`/editor/${project.id}`} className="hover:underline">
              {project.title}
            </Link>
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7 shrink-0">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setRenameOpen(true)}>
                <Pencil /> Renomear
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleDuplicate} disabled={isPending}>
                <Copy /> Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setDeleteOpen(true)}
              >
                <Trash2 /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="px-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant={STATUS_VARIANT[project.status]}>{STATUS_LABEL[project.status]}</Badge>
            <span>{project.format}</span>
            {project.brand_kits?.name && <span>· {project.brand_kits.name}</span>}
          </div>
        </CardContent>
        <CardFooter className="px-4 text-xs text-muted-foreground">
          Atualizado em {updatedAt}
        </CardFooter>
      </Card>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear projeto</DialogTitle>
          </DialogHeader>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRename} disabled={isPending || !title.trim()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir projeto</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O projeto &quot;{project.title}&quot; e todos os
              seus carrosséis, slides e exportações serão excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
