import type { VehicleStatus, ItemStatus, IssueStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type AnyStatus = VehicleStatus | ItemStatus;

const label: Record<AnyStatus, string> = {
  ok: "OK",
  atencao: "Atenção",
  nao_conforme: "Não conforme",
  trocar: "Trocar",
};

const vehicleLabel: Record<VehicleStatus, string> = {
  ok: "Liberado",
  atencao: "Atenção",
  nao_conforme: "Bloqueado",
};

const cls: Record<AnyStatus, string> = {
  ok: "bg-ok-soft text-[color:var(--ok)] border border-[color:var(--ok)]/30",
  atencao: "bg-warn-soft text-[color:var(--warn-foreground)] border border-[color:var(--warn)]/40",
  nao_conforme: "bg-danger-soft text-[color:var(--danger)] border border-[color:var(--danger)]/40",
  trocar: "bg-danger-soft text-[color:var(--danger)] border border-[color:var(--danger)]/40",
};

const dotClass: Record<AnyStatus, string> = {
  ok: "bg-[color:var(--ok)]",
  atencao: "bg-[color:var(--warn)]",
  nao_conforme: "bg-[color:var(--danger)]",
  trocar: "bg-[color:var(--danger)]",
};

export function StatusBadge({ status, className }: { status: VehicleStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
        cls[status],
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dotClass[status])} />
      {vehicleLabel[status]}
    </span>
  );
}

export function ItemStatusBadge({ status, className }: { status: ItemStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
        cls[status],
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dotClass[status])} />
      {label[status]}
    </span>
  );
}

export { label as itemLabel };

const issueLabel: Record<IssueStatus, string> = {
  aberta: "Aberta",
  em_analise: "Em análise",
  aguardando_peca: "Aguardando peça",
  em_manutencao: "Em manutenção",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

const issueClass: Record<IssueStatus, string> = {
  aberta: "bg-danger-soft text-[color:var(--danger)]",
  em_analise: "bg-warn-soft text-[color:var(--warn-foreground)]",
  aguardando_peca: "bg-warn-soft text-[color:var(--warn-foreground)]",
  em_manutencao: "bg-accent text-accent-foreground",
  concluida: "bg-ok-soft text-[color:var(--ok)]",
  cancelada: "bg-muted text-muted-foreground",
};

export function IssueStatusBadge({ status }: { status: IssueStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        issueClass[status],
      )}
    >
      {issueLabel[status]}
    </span>
  );
}
export { issueLabel };
