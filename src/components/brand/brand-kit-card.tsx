"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, MoreVertical, RefreshCw, Trash2 } from "lucide-react";

import type { BrandKitRow } from "@/lib/data/brand-kits";
import {
  applyBrandKitToAllSlidesAction,
  deleteBrandKitAction,
  duplicateBrandKitAction,
} from "@/app/dashboard/marca/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export function BrandKitCard({ kit }: { kit: BrandKitRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);

  function handleDuplicate() {
    startTransition(async () => {
      try {
        await duplicateBrandKitAction(kit.id);
        toast.success("Kit duplicado.");
        router.refresh();
      } catch (err) {
        toast.error("Não foi possível duplicar.", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteBrandKitAction(kit.id);
        toast.success("Kit excluído.");
        setDeleteOpen(false);
        router.refresh();
      } catch (err) {
        toast.error("Não foi possível excluir.", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  function handleApplyToAll() {
    startTransition(async () => {
      try {
        const { updatedSlides } = await applyBrandKitToAllSlidesAction(kit.id);
        toast.success(
          updatedSlides > 0
            ? `Marca aplicada em ${updatedSlides} slide(s).`
            : "Nenhum slide usa este kit ainda."
        );
        router.refresh();
      } catch (err) {
        toast.error("Não foi possível aplicar a marca.", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  return (
    <>
      <Card className="gap-3 py-4">
        <CardHeader className="flex-row items-start justify-between gap-2 px-4">
          <div className="flex items-center gap-3">
            <div
              className="size-10 shrink-0 rounded-full border bg-muted bg-cover bg-center"
              style={{ backgroundImage: kit.avatar_url ? `url(${kit.avatar_url})` : undefined }}
            />
            <div>
              <CardTitle className="text-base">{kit.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{kit.instagram_handle}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7 shrink-0">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={handleApplyToAll} disabled={isPending}>
                <RefreshCw /> Aplicar em todos os slides
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleDuplicate} disabled={isPending}>
                <Copy /> Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                <Trash2 /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="px-4">
          <div className="flex gap-1.5">
            {[kit.color_primary, kit.color_secondary, kit.color_accent, kit.color_background].map(
              (color, i) => (
                <div
                  key={i}
                  className="size-6 rounded-full border"
                  style={{ backgroundColor: color }}
                />
              )
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {kit.font_heading} / {kit.font_body}
          </p>
        </CardContent>
        <CardFooter className="px-4">
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href={`/dashboard/marca/${kit.id}`}>Editar kit</Link>
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir kit de marca</AlertDialogTitle>
            <AlertDialogDescription>
              Projetos que usam &quot;{kit.name}&quot; deixarão de ter um kit associado, mas não
              serão excluídos.
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
