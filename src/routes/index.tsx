import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useApp } from "@/lib/store";
import { useStoreHydrated } from "@/hooks/use-store-hydrated";
import type { Role } from "@/lib/types";
import { Truck, Wrench, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Entrar — Eixo Real | Controle de Manutenção" },
      {
        name: "description",
        content:
          "Acesse o aplicativo de checklists e manutenção da Eixo Real Transportes como motorista, mecânico ou gestor.",
      },
      { property: "og:title", content: "Entrar — Eixo Real | Controle de Manutenção" },
      {
        property: "og:description",
        content: "Acesso ao painel de manutenção da frota Eixo Real Transportes.",
      },
    ],
  }),
  component: LoginPage,
});

const roleMeta: Record<Role, { label: string; description: string; icon: React.ReactNode }> = {
  motorista: {
    label: "Motorista",
    description: "Executa o checklist operacional e assina a liberação.",
    icon: <Truck className="h-5 w-5" />,
  },
  mecanico: {
    label: "Mecânico",
    description: "Trata pendências, registra serviço e libera tecnicamente.",
    icon: <Wrench className="h-5 w-5" />,
  },
  gestor: {
    label: "Gestor",
    description: "Cadastra frota, acompanha indicadores e liberações.",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
};

function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<Role>("motorista");
  const login = useApp((s) => s.login);
  const currentUser = useApp((s) => s.currentUser);
  const users = useApp((s) => s.users);
  const dataMode = useApp((s) => s.dataMode);
  const connectionStatus = useApp((s) => s.connectionStatus);
  const syncError = useApp((s) => s.syncError);
  const databaseInitialized = useApp((s) => s.databaseInitialized);
  const initializeDatabase = useApp((s) => s.initializeDatabase);
  const hydrated = useStoreHydrated();
  const navigate = useNavigate();

  useEffect(() => {
    if (hydrated) void initializeDatabase();
  }, [hydrated, initializeDatabase]);

  useEffect(() => {
    if (hydrated && databaseInitialized && currentUser) navigate({ to: "/app" });
  }, [hydrated, databaseInitialized, currentUser, navigate]);

  const usersOfRole = users.filter((u) => u.role === selectedRole);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <Logo className="h-24 w-auto" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary">Controle de Manutenção</h1>
            <p className="text-sm text-muted-foreground">Eixo Real Transportes</p>
          </div>
        </div>

        <Card className="p-5">
          <div className="mb-4">
            <div className="text-sm font-semibold text-foreground">Entrar como</div>
            <p className="text-xs text-muted-foreground">
              Selecione seu perfil e usuário para acessar o painel.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(roleMeta) as Role[]).map((r) => {
              const active = selectedRole === r;
              return (
                <button
                  key={r}
                  onClick={() => setSelectedRole(r)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-xs font-semibold transition ${
                    active
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {roleMeta[r].icon}
                  {roleMeta[r].label}
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-xs text-muted-foreground">{roleMeta[selectedRole].description}</p>

          <div className="mt-5 space-y-2">
            {connectionStatus === "loading" && (
              <p className="py-3 text-center text-sm text-muted-foreground">
                Carregando usuários e dados...
              </p>
            )}
            {usersOfRole.map((u) => (
              <Button
                key={u.id}
                variant="outline"
                className="h-12 w-full justify-start text-base"
                onClick={() => {
                  login(u.id);
                  navigate({ to: "/app" });
                }}
              >
                <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {u.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                {u.name}
              </Button>
            ))}
            {databaseInitialized && usersOfRole.length === 0 && (
              <p className="py-3 text-center text-sm text-muted-foreground">
                Nenhum usuário deste perfil cadastrado.
              </p>
            )}
          </div>
        </Card>

        <p className="text-center text-[11px] text-muted-foreground">
          {dataMode === "supabase"
            ? connectionStatus === "error"
              ? `Supabase indisponível: ${syncError ?? "verifique a configuração"}`
              : "Dados conectados ao Supabase"
            : "Ambiente de demonstração • Dados salvos somente neste navegador"}
        </p>
      </div>
    </div>
  );
}
