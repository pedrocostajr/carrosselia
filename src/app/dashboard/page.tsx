import { Suspense } from "react";
import Link from "next/link";
import { LayoutGrid, Plus } from "lucide-react";

import { listProjects, type ProjectRow } from "@/lib/data/projects";
import { listBrandKits } from "@/lib/data/brand-kits";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { ProjectsToolbar } from "@/components/dashboard/projects-toolbar";
import { ProjectCard } from "@/components/dashboard/project-card";
import { DashboardPagination } from "@/components/dashboard/pagination";
import { EmptyState } from "@/components/empty-state";
import { MissingSupabaseConfig } from "@/components/missing-supabase-config";
import { Button } from "@/components/ui/button";

interface DashboardPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  if (!isSupabaseConfigured()) {
    return <MissingSupabaseConfig />;
  }

  const params = await searchParams;
  const page = Number(params.page) || 1;

  const [{ projects, total, pageSize }, brandKits] = await Promise.all([
    listProjects({
      search: params.search,
      status: (params.status as ProjectRow["status"] | "all") || "all",
      format: (params.format as ProjectRow["format"] | "all") || "all",
      brandKitId: params.brandKitId || "all",
      page,
    }),
    listBrandKits(),
  ]);

  const hasFilters = Boolean(params.search || params.status || params.format || params.brandKitId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Meus projetos</h1>
          <p className="text-sm text-muted-foreground">
            Seus carrosséis recentes, rascunhos e exportações.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/criar">
            <Plus />
            Criar novo carrossel
          </Link>
        </Button>
      </div>

      <Suspense>
        <ProjectsToolbar brandKits={brandKits.map((k) => ({ id: k.id, name: k.name }))} />
      </Suspense>

      {projects.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title={hasFilters ? "Nenhum projeto encontrado" : "Você ainda não criou nenhum carrossel"}
          description={
            hasFilters
              ? "Tente ajustar os filtros de busca."
              : "Comece colando um texto, uma URL ou apenas escrevendo um tema."
          }
          action={
            !hasFilters && (
              <Button asChild>
                <Link href="/dashboard/criar">
                  <Plus />
                  Criar meu primeiro carrossel
                </Link>
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <DashboardPagination page={page} pageSize={pageSize} total={total} />
    </div>
  );
}
