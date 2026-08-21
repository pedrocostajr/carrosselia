import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutGrid, Palette, Plus, Sparkles } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/dashboard/user-menu";
import { DemoModeBanner } from "@/components/demo-mode-banner";
import { isDemoMode } from "@/lib/ai";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Meus projetos", icon: LayoutGrid },
  { href: "/dashboard/marca", label: "Minha marca", icon: Palette },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r bg-muted/20 md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 px-6 font-semibold">
          <Sparkles className="size-5" />
          Carousel AI
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto p-3">
          <Button asChild className="w-full">
            <Link href="/dashboard/criar">
              <Plus />
              Criar novo carrossel
            </Link>
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b px-4 md:px-8">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold md:hidden">
            <Sparkles className="size-5" />
            Carousel AI
          </Link>
          <div className="hidden md:block" />
          <UserMenu email={user.email ?? ""} />
        </header>
        {isDemoMode() && <DemoModeBanner />}
        <main className="flex-1 px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
