import Link from "next/link";
import { Palette, Plus } from "lucide-react";

import { listBrandKits } from "@/lib/data/brand-kits";
import { BrandKitCard } from "@/components/brand/brand-kit-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default async function BrandKitsPage() {
  const kits = await listBrandKits();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Minha marca</h1>
          <p className="text-sm text-muted-foreground">
            Crie e gerencie diferentes kits de identidade visual.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/marca/novo">
            <Plus />
            Novo kit de marca
          </Link>
        </Button>
      </div>

      {kits.length === 0 ? (
        <EmptyState
          icon={Palette}
          title="Nenhum kit de marca ainda"
          description="Crie seu primeiro kit para aplicar cores, fontes, logotipo e foto automaticamente aos seus carrosséis."
          action={
            <Button asChild>
              <Link href="/dashboard/marca/novo">
                <Plus />
                Criar meu primeiro kit
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kits.map((kit) => (
            <BrandKitCard key={kit.id} kit={kit} />
          ))}
        </div>
      )}
    </div>
  );
}
