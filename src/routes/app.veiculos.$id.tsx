import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, IssueStatusBadge } from "@/components/StatusBadge";
import { useApp } from "@/lib/store";
import { ArrowLeft, ClipboardList, Wrench, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { templates } from "@/lib/checklist-templates";

export const Route = createFileRoute("/app/veiculos/$id")({
  component: VehicleDetail,
});

function VehicleDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const vehicle = useApp((s) => s.vehicles.find((v) => v.id === id));
  const allIssues = useApp((s) => s.issues);
  const allExecutions = useApp((s) => s.executions);
  const issues = useMemo(() => allIssues.filter((i) => i.vehicleId === id), [allIssues, id]);
  const executions = useMemo(
    () => allExecutions.filter((e) => e.vehicleId === id),
    [allExecutions, id],
  );

  if (!vehicle) {
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="text-muted-foreground">Veículo não encontrado.</p>
        <Button onClick={() => navigate({ to: "/app" })} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  const openIssues = issues.filter((i) => i.status !== "concluida" && i.status !== "cancelada");
  const kmProx = vehicle.proximaRevisaoKm - vehicle.hodometro;

  return (
    <div className="space-y-4">
      <Link
        to="/app"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Painel
      </Link>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-primary/10 px-2.5 py-1 font-mono text-base font-bold text-primary">
                {vehicle.placa}
              </span>
              <span className="text-sm font-semibold text-muted-foreground">{vehicle.frota}</span>
            </div>
            <h1 className="mt-1 text-xl font-bold">
              {vehicle.marca} {vehicle.modelo}
            </h1>
            <p className="text-sm text-muted-foreground">
              {vehicle.ano} · {vehicle.tipo} {vehicle.implemento ? `· ${vehicle.implemento}` : ""}
            </p>
          </div>
          <StatusBadge status={vehicle.status} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Info label="Hodômetro" value={`${vehicle.hodometro.toLocaleString("pt-BR")} km`} />
          <Info
            label="Última revisão"
            value={`${vehicle.ultimaRevisaoKm.toLocaleString("pt-BR")} km`}
          />
          <Info
            label="Próxima revisão"
            value={`${vehicle.proximaRevisaoKm.toLocaleString("pt-BR")} km`}
            tone={kmProx < 0 ? "danger" : kmProx < 1000 ? "warn" : undefined}
          />
          <Info
            label="Pendências abertas"
            value={String(openIssues.length)}
            tone={openIssues.length ? "warn" : undefined}
          />
        </div>

        {vehicle.status === "nao_conforme" && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-[color:var(--danger)]/30 bg-danger-soft p-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-[color:var(--danger)]" />
            <div className="text-sm">
              <div className="font-semibold text-[color:var(--danger)]">Veículo não liberado.</div>
              <div className="text-[color:var(--danger)]/90">
                Comunique imediatamente o responsável.
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/app/checklist/novo" search={{ vehicleId: vehicle.id }}>
            <Button className="gap-1.5">
              <ClipboardList className="h-4 w-4" /> Iniciar checklist
            </Button>
          </Link>
          <Link to="/app/pendencias">
            <Button variant="outline" className="gap-1.5">
              <Wrench className="h-4 w-4" /> Ver pendências
            </Button>
          </Link>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 text-lg font-semibold">Pendências abertas</h2>
        {openIssues.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nenhuma pendência aberta.
          </p>
        ) : (
          <div className="space-y-2">
            {openIssues.map((i) => (
              <Link
                key={i.id}
                to="/app/pendencias/$id"
                params={{ id: i.id }}
                className="block rounded-lg border border-border p-3 hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{i.itemLabel}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {i.descricao}
                    </div>
                  </div>
                  <IssueStatusBadge status={i.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 text-lg font-semibold">Últimos checklists</h2>
        {executions.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nenhum checklist realizado ainda.
          </p>
        ) : (
          <div className="space-y-2">
            {executions.slice(0, 10).map((e) => {
              const tpl = templates.find((t) => t.id === e.templateId);
              return (
                <div
                  key={e.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{tpl?.nome ?? "Checklist"}</div>
                    <div className="text-xs text-muted-foreground">
                      {e.userName} ·{" "}
                      {format(new Date(e.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })} ·{" "}
                      {e.hodometro.toLocaleString("pt-BR")} km
                    </div>
                  </div>
                  {e.decision && <StatusBadge status={e.decision} />}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 text-lg font-semibold">Manutenções realizadas</h2>
        {issues.filter((i) => i.status === "concluida").length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Sem manutenções registradas.
          </p>
        ) : (
          <div className="space-y-2">
            {issues
              .filter((i) => i.status === "concluida")
              .map((i) => (
                <div key={i.id} className="rounded-lg border border-border p-3">
                  <div className="text-sm font-semibold">{i.itemLabel}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Serviço: {i.servicoExecutado} · Peças: {i.pecas || "—"}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Concluído por {i.liberadoPor} em{" "}
                    {i.concluidoEm
                      ? format(new Date(i.concluidoEm), "dd/MM/yyyy", { locale: ptBR })
                      : "—"}{" "}
                    · {i.hodometroConclusao?.toLocaleString("pt-BR")} km
                  </div>
                </div>
              ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Info({ label, value, tone }: { label: string; value: string; tone?: "warn" | "danger" }) {
  const toneClass =
    tone === "danger"
      ? "text-[color:var(--danger)]"
      : tone === "warn"
        ? "text-[color:var(--warn-foreground)]"
        : "text-foreground";
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className={`mt-0.5 text-base font-bold tabular-nums ${toneClass}`}>{value}</div>
    </div>
  );
}
