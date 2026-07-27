import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { useApp } from "@/lib/store";
import type { VehicleStatus } from "@/lib/types";
import {
  Truck,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Wrench,
  ClipboardList,
  CalendarClock,
  CalendarX,
  Search,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

const statusOrder: Record<VehicleStatus, number> = { nao_conforme: 0, atencao: 1, ok: 2 };

function Dashboard() {
  const vehicles = useApp((s) => s.vehicles);
  const issues = useApp((s) => s.issues);
  const executions = useApp((s) => s.executions);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"todos" | VehicleStatus>("todos");

  const stats = useMemo(() => {
    const openIssues = issues.filter((i) => i.status !== "concluida" && i.status !== "cancelada");
    const now = new Date();
    const monthChecks = executions.filter(
      (e) =>
        e.finalizedAt &&
        new Date(e.finalizedAt).getMonth() === now.getMonth() &&
        new Date(e.finalizedAt).getFullYear() === now.getFullYear(),
    );
    const proxRevisao = vehicles.filter(
      (v) => v.proximaRevisaoKm - v.hodometro <= 1000 && v.proximaRevisaoKm - v.hodometro > 0,
    );
    const revAtrasada = vehicles.filter((v) => v.hodometro > v.proximaRevisaoKm);
    return {
      frota: vehicles.length,
      liberados: vehicles.filter((v) => v.status === "ok").length,
      atencao: vehicles.filter((v) => v.status === "atencao").length,
      bloqueados: vehicles.filter((v) => v.status === "nao_conforme").length,
      proxRevisao: proxRevisao.length,
      revAtrasada: revAtrasada.length,
      pendencias: openIssues.length,
      checklistsMes: monthChecks.length,
    };
  }, [vehicles, issues, executions]);

  const filtered = vehicles
    .filter((v) => filter === "todos" || v.status === filter)
    .filter(
      (v) =>
        !query ||
        v.placa.toLowerCase().includes(query.toLowerCase()) ||
        v.frota.toLowerCase().includes(query.toLowerCase()) ||
        v.modelo.toLowerCase().includes(query.toLowerCase()),
    )
    // Bloqueados primeiro, depois atenção, depois liberados.
    .sort(
      (a, b) => statusOrder[a.status] - statusOrder[b.status] || a.placa.localeCompare(b.placa),
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Painel operacional</h1>
        <p className="text-sm text-muted-foreground">Visão geral da frota Eixo Real Transportes.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric
          icon={<Truck className="h-4 w-4" />}
          label="Frota"
          value={stats.frota}
          tone="navy"
        />
        <Metric
          icon={<ShieldCheck className="h-4 w-4" />}
          label="Liberados"
          value={stats.liberados}
          tone="ok"
        />
        <Metric
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Atenção"
          value={stats.atencao}
          tone="warn"
        />
        <Metric
          icon={<ShieldAlert className="h-4 w-4" />}
          label="Bloqueados"
          value={stats.bloqueados}
          tone="danger"
        />
        <Metric
          icon={<CalendarClock className="h-4 w-4" />}
          label="Revisões próximas"
          value={stats.proxRevisao}
          tone="warn"
        />
        <Metric
          icon={<CalendarX className="h-4 w-4" />}
          label="Revisões atrasadas"
          value={stats.revAtrasada}
          tone="danger"
        />
        <Metric
          icon={<Wrench className="h-4 w-4" />}
          label="Pendências abertas"
          value={stats.pendencias}
          tone="navy"
        />
        <Metric
          icon={<ClipboardList className="h-4 w-4" />}
          label="Checklists no mês"
          value={stats.checklistsMes}
          tone="navy"
        />
      </div>

      <Card className="p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Veículos da frota</h2>
            <p className="text-xs text-muted-foreground">
              Toque em um veículo para abrir o histórico.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por placa, frota ou modelo"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8 sm:w-64"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto">
              {(["todos", "ok", "atencao", "nao_conforme"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`whitespace-nowrap rounded-md px-3 py-2 text-xs font-semibold transition ${
                    filter === f
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {f === "todos"
                    ? "Todos"
                    : f === "ok"
                      ? "Liberados"
                      : f === "atencao"
                        ? "Atenção"
                        : "Bloqueados"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {filtered.map((v) => {
            const pend = issues.filter(
              (i) => i.vehicleId === v.id && i.status !== "concluida" && i.status !== "cancelada",
            ).length;
            const kmProx = v.proximaRevisaoKm - v.hodometro;
            return (
              <div
                key={v.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-card p-3 transition hover:border-primary/40 hover:shadow-sm sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto]"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-sm font-bold text-primary">
                      {v.placa}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">{v.frota}</span>
                  </div>
                  <div className="mt-1 truncate text-sm text-foreground">
                    {v.marca} {v.modelo} · {v.ano}
                  </div>
                </div>
                <div className="hidden text-right sm:block">
                  <div className="text-xs uppercase text-muted-foreground">Hodômetro</div>
                  <div className="text-sm font-semibold tabular-nums">
                    {v.hodometro.toLocaleString("pt-BR")} km
                  </div>
                </div>
                <div className="hidden text-right sm:block">
                  <div className="text-xs uppercase text-muted-foreground">Próx. revisão</div>
                  <div
                    className={`text-sm font-semibold tabular-nums ${
                      kmProx < 0
                        ? "text-[color:var(--danger)]"
                        : kmProx < 1000
                          ? "text-[color:var(--warn-foreground)]"
                          : ""
                    }`}
                  >
                    {v.proximaRevisaoKm.toLocaleString("pt-BR")} km
                  </div>
                </div>
                <div className="col-span-2 flex items-center justify-between gap-2 sm:col-span-1">
                  <StatusBadge status={v.status} />
                  {pend > 0 && (
                    <span className="rounded-full bg-warn-soft px-2 py-0.5 text-xs font-semibold text-[color:var(--warn-foreground)]">
                      {pend} pend.
                    </span>
                  )}
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Button asChild size="sm" className="w-full sm:w-auto">
                    <Link to="/app/veiculos/$id" params={{ id: v.id }}>
                      Abrir veículo <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nenhum veículo encontrado.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "navy" | "ok" | "warn" | "danger";
}) {
  const toneClass = {
    navy: "bg-primary/5 text-primary",
    ok: "bg-ok-soft text-[color:var(--ok)]",
    warn: "bg-warn-soft text-[color:var(--warn-foreground)]",
    danger: "bg-danger-soft text-[color:var(--danger)]",
  }[tone];
  return (
    <Card className="p-3">
      <div
        className={`mb-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${toneClass}`}
      >
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold tabular-nums text-foreground">{value}</div>
    </Card>
  );
}
