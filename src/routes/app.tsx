import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/lib/store";
import { useStoreHydrated } from "@/hooks/use-store-hydrated";
import { can, permissionMessage, type Action } from "@/lib/permissions";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

/** Rotas existentes protegidas por ação. */
const guarded: { prefix: string; action: Action }[] = [
  { prefix: "/app/checklist", action: "checklist.start" },
  { prefix: "/app/veiculos", action: "vehicle.view" },
  { prefix: "/app/pendencias", action: "issue.view" },
];

function AppLayout() {
  const user = useApp((s) => s.currentUser);
  const databaseInitialized = useApp((s) => s.databaseInitialized);
  const initializeDatabase = useApp((s) => s.initializeDatabase);
  const hydrated = useStoreHydrated();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (hydrated) void initializeDatabase();
  }, [hydrated, initializeDatabase]);

  useEffect(() => {
    if (hydrated && databaseInitialized && !user) navigate({ to: "/" });
  }, [hydrated, databaseInitialized, user, navigate]);

  const blocked =
    hydrated && databaseInitialized && user
      ? guarded.find((g) => pathname.startsWith(g.prefix) && !can(user.role, g.action))
      : undefined;

  useEffect(() => {
    if (blocked) {
      toast.error(permissionMessage[blocked.action]);
      navigate({ to: "/app", replace: true });
    }
  }, [blocked, navigate]);

  if (!hydrated || !databaseInitialized || !user) return null;

  return <AppShell>{blocked ? null : <Outlet />}</AppShell>;
}
