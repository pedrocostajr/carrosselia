"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BrandKitOption {
  id: string;
  name: string;
}

export function ProjectsToolbar({ brandKits }: { brandKits: BrandKitOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [, startTransition] = useTransition();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar projetos..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") updateParam("search", search);
          }}
          onBlur={() => updateParam("search", search)}
        />
      </div>

      <Select
        defaultValue={searchParams.get("status") ?? "all"}
        onValueChange={(v) => updateParam("status", v)}
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os status</SelectItem>
          <SelectItem value="draft">Rascunho</SelectItem>
          <SelectItem value="ready">Pronto</SelectItem>
          <SelectItem value="exported">Exportado</SelectItem>
        </SelectContent>
      </Select>

      <Select
        defaultValue={searchParams.get("format") ?? "all"}
        onValueChange={(v) => updateParam("format", v)}
      >
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Formato" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os formatos</SelectItem>
          <SelectItem value="1080x1350">1080×1350</SelectItem>
          <SelectItem value="1080x1080">1080×1080</SelectItem>
        </SelectContent>
      </Select>

      {brandKits.length > 0 && (
        <Select
          defaultValue={searchParams.get("brandKitId") ?? "all"}
          onValueChange={(v) => updateParam("brandKitId", v)}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Kit de marca" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os kits</SelectItem>
            {brandKits.map((kit) => (
              <SelectItem key={kit.id} value={kit.id}>
                {kit.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
