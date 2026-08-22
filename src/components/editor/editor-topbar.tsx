"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Download,
  Gauge,
  Loader2,
  MessageSquareQuote,
  Monitor,
  Redo2,
  Smartphone,
  Trash2,
  Undo2,
} from "lucide-react";

import { useEditorStore } from "@/store/editor-store";
import type { EditorData } from "@/lib/data/editor";
import { deleteProjectAction } from "@/app/dashboard/actions";
import { renameProjectTitleAction } from "@/app/editor/[projectId]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { ExportDialog } from "@/components/editor/export-dialog";

export function EditorTopbar({
  project,
  brandKit,
  carouselId,
}: {
  project: EditorData["project"];
  brandKit: EditorData["brandKit"];
  carouselId: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(project.title);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const isDirty = useEditorStore((s) => s.isDirty);
  const isSaving = useEditorStore((s) => s.isSaving);
  const history = useEditorStore((s) => s.history);
  const future = useEditorStore((s) => s.future);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const zoom = useEditorStore((s) => s.zoom);
  const setZoom = useEditorStore((s) => s.setZoom);
  const viewMode = useEditorStore((s) => s.viewMode);
  const setViewMode = useEditorStore((s) => s.setViewMode);
  const activePanel = useEditorStore((s) => s.activePanel);
  const setActivePanel = useEditorStore((s) => s.setActivePanel);

  async function handleRename() {
    if (!title.trim() || title === project.title) return;
    try {
      await renameProjectTitleAction(project.id, title);
    } catch (err) {
      toast.error("Não foi possível renomear.", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  async function handleDelete() {
    try {
      await deleteProjectAction(project.id);
      toast.success("Projeto excluído.");
      router.push("/dashboard");
    } catch (err) {
      toast.error("Não foi possível excluir.", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  return (
    <>
      <div className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>

        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleRename}
          className="h-8 w-56 border-transparent bg-transparent font-medium shadow-none hover:border-input focus-visible:border-input"
        />

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {isSaving ? (
            <>
              <Loader2 className="size-3.5 animate-spin" /> Salvando...
            </>
          ) : isDirty ? (
            <>alterações não salvas</>
          ) : (
            <>
              <Check className="size-3.5" /> Salvo
            </>
          )}
        </div>

        <div className="mx-2 h-6 w-px bg-border" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={undo} disabled={history.length === 0}>
              <Undo2 className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Desfazer (Ctrl+Z)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={redo} disabled={future.length === 0}>
              <Redo2 className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Refazer (Ctrl+Shift+Z)</TooltipContent>
        </Tooltip>

        <div className="mx-2 h-6 w-px bg-border" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setZoom(Math.max(0.25, zoom - 0.1))}
        >
          −
        </Button>
        <span className="w-10 text-center text-xs text-muted-foreground">
          {Math.round(zoom * 100)}%
        </span>
        <Button variant="ghost" size="sm" onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}>
          +
        </Button>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={viewMode === "desktop" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("desktop")}
            >
              <Monitor className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Visualização padrão</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={viewMode === "mobile" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("mobile")}
            >
              <Smartphone className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Visualização em celular</TooltipContent>
        </Tooltip>

        <div className="flex-1" />

        <Button
          variant={activePanel === "score" ? "secondary" : "outline"}
          size="sm"
          onClick={() => setActivePanel(activePanel === "score" ? "properties" : "score")}
        >
          <Gauge className="size-4" /> Pontuação
        </Button>
        <Button
          variant={activePanel === "caption" ? "secondary" : "outline"}
          size="sm"
          onClick={() => setActivePanel(activePanel === "caption" ? "properties" : "caption")}
        >
          <MessageSquareQuote className="size-4" /> Legenda
        </Button>
        <Button size="sm" onClick={() => setExportOpen(true)}>
          <Download className="size-4" /> Exportar
        </Button>

        <Button variant="ghost" size="icon" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir projeto inteiro</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os slides, exportações e histórico deste
              projeto serão excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Excluir projeto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        project={project}
        carouselId={carouselId}
        brandKit={brandKit}
      />
    </>
  );
}
