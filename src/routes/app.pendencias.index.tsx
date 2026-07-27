import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  IssueStatusBadge,
  StatusBadge,
  ItemStatusBadge,
  issueLabel,
} from "@/components/StatusBadge";
import { useApp } from "@/lib/store";
import type { IssueStatus } from "@/lib/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Wrench } from "lucide-react";

export const Route = createFileRoute("/app/pendencias/")({
  component: PendenciasPage,
});

const statuses: IssueStatus[] = [
  "aberta",
  "em_analise",
  "aguardando_peca",
  "em_manutencao",
  "concluida",
  "cancelada",
];

function PendenciasPage() {
  const issues = useApp((s) => s.issues);
  const vehicles = useApp((s) => s.vehicles);
  const [filter, setFilter] = useState<IssueStatus | "todos">("todos");

  const filtered = issues
    .filter((i) => filter === "todos" || i.status === filter)
    // Críticas primeiro, depois as mais antigas.
    .sort((a, b) => {
      const ac = a.critica ? 0 : 1;
      const bc = b.critica ? 0 : 1;
      if (ac !== bc) return ac - bc;
      return a.createdAt < b.createdAt ? -1 : 1;
    });

  const vehicleById = (id: string) => vehicles.find((v) => v.id === id);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Pendências de manutenção</h1>
        <p className="text-sm text-muted-foreground">
          Trate anormalidades e libere veículos tecnicamente.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <FilterButton
          label="Todos"
          active={filter === "todos"}
          onClick={() => setFilter("todos")}
        />
        {statuses.map((s) => (
          <FilterButton
            key={s}
            label={issueLabel[s]}
            active={filter === s}
            onClick={() => setFilter(s)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Nenhuma pendência.</Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((i) => {
            const v = vehicleById(i.vehicleId);
            return (
              <Link
                key={i.id}
                to="/app/pendencias/$id"
                params={{ id: i.id }}
                className="block rounded-lg border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {v && (
                        <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-sm font-bold text-primary">
                          {v.placa}
                        </span>
                      )}
                      {i.critica && (
                        <span className="rounded-full bg-danger-soft px-1.5 py-0.5 text-[10px] font-bold uppercase text-[color:var(--danger)]">
                          Crítica
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm font-semibold">{i.itemLabel}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {i.descricao}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      Aberto por {i.abertoPor} ·{" "}
                      {format(new Date(i.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <IssueStatusBadge status={i.status} />
                    <ItemStatusBadge status={i.itemStatus} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Card className="flex items-center gap-3 border-primary/30 bg-primary/5 p-4">
        <Wrench className="h-5 w-5 text-primary" />
        <p className="text-xs text-muted-foreground">
          Ao concluir uma pendência com serviço executado, o veículo é reavaliado automaticamente.
        </p>
      </Card>
    </div>
  );
}

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-md px-3 py-2 text-xs font-semibold transition ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-accent"
      }`}
    >
      {label}
    </button>
  );
}
