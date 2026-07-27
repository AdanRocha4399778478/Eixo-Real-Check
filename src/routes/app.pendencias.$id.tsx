import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IssueStatusBadge, ItemStatusBadge, issueLabel } from "@/components/StatusBadge";
import { useApp } from "@/lib/store";
import { can } from "@/lib/permissions";
import { processImageFile } from "@/lib/image";
import type { IssueStatus } from "@/lib/types";
import { ArrowLeft, Camera, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/app/pendencias/$id")({
  component: IssueDetail,
});

const statuses: IssueStatus[] = ["aberta", "em_analise", "aguardando_peca", "em_manutencao"];

function IssueDetail() {
  const { id } = Route.useParams();
  const issue = useApp((s) => s.issues.find((i) => i.id === id));
  const vehicle = useApp((s) =>
    issue ? s.vehicles.find((v) => v.id === issue.vehicleId) : undefined,
  );
  const updateIssue = useApp((s) => s.updateIssue);
  const concludeIssue = useApp((s) => s.concludeIssue);
  const cancelIssue = useApp((s) => s.cancelIssue);
  const currentUser = useApp((s) => s.currentUser);
  const navigate = useNavigate();
  const canManage = can(currentUser?.role, "issue.manage");

  const [hodometro, setHodometro] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const persistedHodometro = issue?.hodometroConclusao ?? vehicle?.hodometro ?? issue?.hodometro;

  // Mantém o campo local sincronizado com o valor persistido (não perde ao sair e voltar).
  useEffect(() => {
    if (persistedHodometro === undefined) return;
    setHodometro(String(persistedHodometro));
  }, [persistedHodometro]);

  if (!issue) {
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="text-muted-foreground">Pendência não encontrada.</p>
        <Button onClick={() => navigate({ to: "/app/pendencias" })} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  const hodometroNum = Number(hodometro);
  const hodometroError =
    hodometro === ""
      ? "Informe o hodômetro da conclusão."
      : !Number.isFinite(hodometroNum) || hodometroNum <= 0
        ? "O hodômetro deve ser um número maior que zero."
        : hodometroNum < issue.hodometro
          ? `O hodômetro não pode ser menor que o da abertura (${issue.hodometro.toLocaleString("pt-BR")} km).`
          : null;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const dataUrl = await processImageFile(file);
      updateIssue(issue.id, { fotoDepoisDataUrl: dataUrl });
      toast.success("Foto anexada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível anexar a foto.");
    }
  };

  const conclude = () => {
    if (!currentUser) return;
    if (!issue.diagnostico?.trim()) {
      toast.error("Informe o diagnóstico antes de concluir.");
      return;
    }
    if (!issue.servicoExecutado?.trim()) {
      toast.error("Informe o serviço executado antes de concluir.");
      return;
    }
    if (hodometroError) {
      toast.error(hodometroError);
      return;
    }
    const res = concludeIssue(issue.id, {
      diagnostico: issue.diagnostico ?? "",
      servicoExecutado: issue.servicoExecutado ?? "",
      pecas: issue.pecas ?? "",
      hodometroConclusao: hodometroNum,
      liberadoPor: currentUser.name,
      fotoDepoisDataUrl: issue.fotoDepoisDataUrl,
    });
    if (!res.ok) {
      toast.error(res.error ?? "Não foi possível concluir a pendência.");
      return;
    }
    toast.success("Pendência concluída. Status do veículo atualizado.");
    navigate({ to: "/app/pendencias" });
  };

  const cancel = () => {
    cancelIssue(issue.id);
    toast.success("Pendência cancelada. Status do veículo atualizado.");
  };

  const isDone = issue.status === "concluida" || issue.status === "cancelada";

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        to="/app/pendencias"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Pendências
      </Link>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {vehicle && (
              <Link
                to="/app/veiculos/$id"
                params={{ id: vehicle.id }}
                className="inline-flex items-center gap-2"
              >
                <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-sm font-bold text-primary">
                  {vehicle.placa}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {vehicle.marca} {vehicle.modelo}
                </span>
              </Link>
            )}
            <h1 className="mt-2 text-xl font-bold">{issue.itemLabel}</h1>
          </div>
          <div className="flex flex-col items-end gap-2">
            <IssueStatusBadge status={issue.status} />
            <ItemStatusBadge status={issue.itemStatus} />
            {issue.critica && (
              <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[10px] font-bold uppercase text-[color:var(--danger)]">
                Impeditiva
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <Info label="Aberto por" value={issue.abertoPor} />
          <Info
            label="Data"
            value={format(new Date(issue.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
          />
          <Info label="Hodômetro" value={`${issue.hodometro.toLocaleString("pt-BR")} km`} />
          <Info
            label="Prazo"
            value={
              issue.prazo ? format(new Date(issue.prazo), "dd/MM/yyyy", { locale: ptBR }) : "—"
            }
          />
        </div>

        <div className="mt-4">
          <div className="text-xs font-semibold uppercase text-muted-foreground">Descrição</div>
          <p className="mt-1 text-sm">{issue.descricao || "—"}</p>
        </div>

        {issue.fotoDataUrl && (
          <div className="mt-3">
            <div className="text-xs font-semibold uppercase text-muted-foreground">
              Foto (motorista)
            </div>
            <img
              src={issue.fotoDataUrl}
              alt="Foto pendência"
              className="mt-1 h-40 rounded-md border border-border"
            />
          </div>
        )}
      </Card>

      {!canManage && !isDone && (
        <Card className="border-primary/30 bg-primary/5 p-4 text-xs text-muted-foreground">
          Seu perfil pode acompanhar esta pendência, mas o tratamento é feito pela equipe mecânica.
        </Card>
      )}

      {canManage && !isDone && (
        <Card className="p-5">
          <h2 className="text-lg font-bold">Ação do mecânico</h2>
          <p className="text-xs text-muted-foreground">
            Os dados são salvos automaticamente enquanto você edita.
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <Label>Status da pendência</Label>
              <select
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={issue.status}
                onChange={(e) => {
                  updateIssue(issue.id, { status: e.target.value as IssueStatus });
                  toast.success("Status da pendência atualizado.");
                }}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {issueLabel[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Diagnóstico</Label>
              <Textarea
                value={issue.diagnostico ?? ""}
                onChange={(e) => updateIssue(issue.id, { diagnostico: e.target.value })}
                placeholder="Descreva o diagnóstico técnico"
              />
              {!issue.diagnostico?.trim() && (
                <p className="mt-1 text-xs text-muted-foreground">Obrigatório para concluir.</p>
              )}
            </div>
            <div>
              <Label>Peças utilizadas</Label>
              <Textarea
                value={issue.pecas ?? ""}
                onChange={(e) => updateIssue(issue.id, { pecas: e.target.value })}
                placeholder="Ex.: 1x jogo de pastilha dianteira, 1x disco"
              />
            </div>
            <div>
              <Label>Serviço executado</Label>
              <Textarea
                value={issue.servicoExecutado ?? ""}
                onChange={(e) => updateIssue(issue.id, { servicoExecutado: e.target.value })}
                placeholder="Detalhes do serviço realizado"
              />
              {!issue.servicoExecutado?.trim() && (
                <p className="mt-1 text-xs text-muted-foreground">Obrigatório para concluir.</p>
              )}
            </div>
            <div>
              <Label>Hodômetro na conclusão (km)</Label>
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                value={hodometro}
                onChange={(e) => {
                  setHodometro(e.target.value);
                  const n = Number(e.target.value);
                  if (Number.isFinite(n) && n > 0) updateIssue(issue.id, { hodometroConclusao: n });
                }}
              />
              {hodometroError && (
                <p className="mt-1 text-xs text-[color:var(--danger)]">{hodometroError}</p>
              )}
            </div>
            <div>
              <Label>Foto depois do serviço</Label>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  void handleFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              {issue.fotoDepoisDataUrl ? (
                <div className="relative mt-1 inline-block">
                  <img
                    src={issue.fotoDepoisDataUrl}
                    alt="Depois"
                    className="h-28 rounded-md border border-border"
                  />
                  <button
                    type="button"
                    onClick={() => updateIssue(issue.id, { fotoDepoisDataUrl: undefined })}
                    className="absolute -right-2 -top-2 rounded-full bg-[color:var(--danger)] p-1 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="mt-1 w-full gap-1.5"
                  onClick={() => inputRef.current?.click()}
                >
                  <Camera className="h-4 w-4" /> Anexar foto
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                onClick={conclude}
                disabled={
                  !issue.diagnostico?.trim() || !issue.servicoExecutado?.trim() || !!hodometroError
                }
                className="flex-1 sm:flex-none"
              >
                Concluir e liberar
              </Button>
              <Button variant="outline" onClick={cancel}>
                Cancelar pendência
              </Button>
            </div>
          </div>
        </Card>
      )}

      {isDone && (
        <Card className="p-5">
          <h2 className="text-lg font-bold">Serviço registrado</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <Info label="Diagnóstico" value={issue.diagnostico ?? "—"} />
            <Info label="Serviço" value={issue.servicoExecutado ?? "—"} />
            <Info label="Peças" value={issue.pecas ?? "—"} />
            <Info
              label="Concluído em"
              value={
                issue.concluidoEm
                  ? format(new Date(issue.concluidoEm), "dd/MM/yyyy HH:mm", { locale: ptBR })
                  : "—"
              }
            />
            <Info label="Liberado por" value={issue.liberadoPor ?? "—"} />
            <Info
              label="Hodômetro"
              value={
                issue.hodometroConclusao
                  ? `${issue.hodometroConclusao.toLocaleString("pt-BR")} km`
                  : "—"
              }
            />
          </div>
          {issue.fotoDepoisDataUrl && (
            <img
              src={issue.fotoDepoisDataUrl}
              alt="Após serviço"
              className="mt-3 h-40 rounded-md border border-border"
            />
          )}
        </Card>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold">{value}</div>
    </div>
  );
}
