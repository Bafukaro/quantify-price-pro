import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Database,
  Bell,
  Search,
  Building2,
} from "lucide-react";

const nav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/projecto/p-001", label: "Projecto · BoQ", icon: FolderKanban },
  { to: "/app/precos", label: "Base de Preços", icon: Database },
];

const titles: Record<string, string> = {
  "/app": "Dashboard — Visão geral dos projectos",
  "/app/precos": "Base de Dados de Preços",
};

export default function AppLayout() {
  const { pathname } = useLocation();
  const title =
    titles[pathname] ||
    (pathname.startsWith("/app/projecto") ? "Projecto — BoQ por Fases" : "SQI");

  return (
    <div className="min-h-screen bg-surface-sunken text-foreground flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-border bg-primary text-primary-foreground hidden md:flex flex-col">
        <div className="px-6 py-6 border-b border-white/10">
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="size-9 rounded-md bg-gradient-accent grid place-items-center shadow-soft">
              <Building2 className="size-5" />
            </div>
            <div>
              <div className="font-display text-lg leading-none">SQI</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/60 mt-1">
                Sistema Quantitativo Integrado
              </div>
            </div>
          </NavLink>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`
              }
            >
              <n.icon className="size-4" />
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="rounded-md bg-white/5 p-3 text-xs text-white/70">
            <div className="font-medium text-white mb-1">Fase 1 — MVP</div>
            Demo visual. Dados são exemplos para Maputo & Beira.
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-surface-elevated flex items-center justify-between px-6 sticky top-0 z-30 backdrop-blur">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              SQI · Gestão de Obras
            </div>
            <h1 className="font-display text-lg text-foreground leading-tight">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted text-sm text-muted-foreground w-72">
              <Search className="size-4" />
              <input
                placeholder="Procurar projecto, material, item…"
                className="bg-transparent outline-none flex-1"
              />
            </div>
            <button className="relative size-9 grid place-items-center rounded-md hover:bg-muted">
              <Bell className="size-4" />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive" />
            </button>
            <div className="flex items-center gap-2.5 pl-3 border-l border-border">
              <div className="size-8 rounded-full bg-gradient-accent grid place-items-center text-primary-foreground text-xs font-semibold">
                CM
              </div>
              <div className="hidden sm:block leading-tight">
                <div className="text-sm font-medium">Cláudia Macuácua</div>
                <div className="text-[11px] text-muted-foreground">Gestor de Obra</div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}