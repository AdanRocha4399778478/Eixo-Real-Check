import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { useApp } from "@/lib/store";
import { Button } from "./ui/button";
import {
  LogOut,
  LayoutDashboard,
  Truck,
  ClipboardList,
  Wrench,
  Database,
  HardDrive,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";
import type { ReactNode } from "react";

const roleLabel: Record<Role, string> = {
  motorista: "Motorista",
  mecanico: "Mecânico",
  gestor: "Gestor",
};

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  roles: Role[];
}

const navItems: NavItem[] = [
  {
    to: "/app",
    label: "Painel",
    icon: <LayoutDashboard className="h-5 w-5" />,
    roles: ["motorista", "mecanico", "gestor"],
  },
  {
    to: "/app/veiculos",
    label: "Veículos",
    icon: <Truck className="h-5 w-5" />,
    roles: ["motorista", "mecanico", "gestor"],
  },
  {
    to: "/app/checklist/novo",
    label: "Checklist",
    icon: <ClipboardList className="h-5 w-5" />,
    roles: ["motorista", "mecanico", "gestor"],
  },
  {
    to: "/app/pendencias",
    label: "Pendências",
    icon: <Wrench className="h-5 w-5" />,
    roles: ["mecanico", "gestor", "motorista"],
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const user = useApp((s) => s.currentUser);
  const logout = useApp((s) => s.logout);
  const dataMode = useApp((s) => s.dataMode);
  const connectionStatus = useApp((s) => s.connectionStatus);
  const syncError = useApp((s) => s.syncError);
  const syncNow = useApp((s) => s.syncNow);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const visible = navItems.filter((n) => (user ? n.roles.includes(user.role) : false));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-primary text-primary-foreground shadow-sm">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3">
          <Link to="/app" className="flex items-center gap-3">
            <div className="rounded-md bg-white/95 p-1.5">
              <Logo className="h-8 w-auto" />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold leading-tight">Eixo Real</div>
              <div className="text-[10px] uppercase tracking-widest opacity-80">
                Controle de Manutenção
              </div>
            </div>
          </Link>

          <nav className="hidden gap-1 md:flex">
            {visible.map((n) => {
              const active = n.to === "/app" ? pathname === "/app" : pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition",
                    active ? "bg-white/15" : "hover:bg-white/10",
                  )}
                >
                  {n.icon}
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void syncNow()}
              disabled={dataMode === "demo" || connectionStatus === "loading"}
              title={
                syncError ??
                (dataMode === "supabase"
                  ? "Dados conectados ao Supabase. Clique para atualizar."
                  : "Modo demonstração: dados salvos neste navegador.")
              }
              className="hidden items-center gap-1.5 rounded-md bg-white/10 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide sm:flex"
            >
              {dataMode === "supabase" ? (
                <Database className="h-3.5 w-3.5" />
              ) : (
                <HardDrive className="h-3.5 w-3.5" />
              )}
              <span>
                {dataMode === "supabase"
                  ? connectionStatus === "error"
                    ? "Erro no banco"
                    : connectionStatus === "loading" || connectionStatus === "syncing"
                      ? "Sincronizando"
                      : "Supabase"
                  : "Demonstração"}
              </span>
              {dataMode === "supabase" && (
                <RefreshCw
                  className={cn(
                    "h-3 w-3",
                    (connectionStatus === "loading" || connectionStatus === "syncing") &&
                      "animate-spin",
                  )}
                />
              )}
            </button>
            {user && (
              <div className="hidden text-right sm:block">
                <div className="text-sm font-semibold leading-tight">{user.name}</div>
                <div className="text-[10px] uppercase tracking-widest opacity-80">
                  {roleLabel[user.role]}
                </div>
              </div>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                logout();
                navigate({ to: "/" });
              }}
              className="gap-1.5"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 pb-24 md:pb-6">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card md:hidden">
        <div
          className="mx-auto flex max-w-7xl"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.max(visible.length, 1)}, minmax(0, 1fr))`,
          }}
        >
          {visible.map((n) => {
            const active = n.to === "/app" ? pathname === "/app" : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-3 text-[11px] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                {n.icon}
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
