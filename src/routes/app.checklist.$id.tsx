import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { StatusBadge, ItemStatusBadge } from "@/components/StatusBadge";
import { useApp } from "@/lib/store";
import { getTemplate, getExecutionSections } from "@/lib/checklist-templates";
import { processImageFile } from "@/lib/image";
import type { ItemStatus } from "@/lib/types";
import {
  Camera,
  Check,
  X,
  AlertTriangle,
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/checklist/$id")({
  component: ExecutionPage,
});

function ExecutionPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const exec = useApp((s) => s.executions.find((e) => e.id === id));
  const vehicle = useApp((s) =>
    exec ? s.vehicles.find((v) => v.id === exec.vehicleId) : undefined,
  );
  const updateAnswer = useApp((s) => s.updateAnswer);

  const template = exec ? getTemplate(exec.templateId) : null;
  const sections = useMemo(
    () => (exec && vehicle ? getExecutionSections(exec.templateId, vehicle.placa) : []),
    [exec, vehicle],
  );
  const isPreventivo = template?.mode === "preventivo";

  const totalItems = useMemo(
    () => sections.reduce((sum, s) => sum + s.items.length, 0),
    [sections],
  );
  const answeredItems = useMemo(
    () => (exec ? Object.values(exec.answers).filter((a) => a.status !== null).length : 0),
    [exec],
  );
  const percent = totalItems ? Math.round((answeredItems / totalItems) * 100) : 0;

  const [showFinalize, setShowFinalize] = useState(false);

  if (!exec || !template || !vehicle) {
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="text-muted-foreground">Checklist não encontrado.</p>
        <Button onClick={() => navigate({ to: "/app" })} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  if (exec.status === "finalizado") {
    return <FinalizedView execId={exec.id} />;
  }

  // Primeiro item inválido + motivo (usado para levar o usuário até o erro).
  const firstInvalid = (() => {
    for (const section of sections) {
      for (const item of section.items) {
        const a = exec.answers[item.id];
        if (!a?.status) return { id: item.id, msg: `Responda o item "${item.label}".` };
        if (a.status === "atencao" && !a.observacao?.trim())
          return { id: item.id, msg: `Descreva a observação do item "${item.label}".` };
        if (a.status === "trocar" && !a.observacao?.trim())
          return { id: item.id, msg: `Descreva o serviço do item "${item.label}".` };
        if (a.status === "nao_conforme") {
          if (!a.observacao?.trim())
            return { id: item.id, msg: `Descreva a não conformidade do item "${item.label}".` };
          if (!a.fotoDataUrl)
            return { id: item.id, msg: `Anexe a foto obrigatória do item "${item.label}".` };
        }
      }
    }
    return null;
  })();

  const canFinalize = !firstInvalid;

  const tryFinalize = () => {
    if (firstInvalid) {
      toast.error(firstInvalid.msg);
      const el = document.getElementById(`item-${firstInvalid.id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.classList.add("ring-2", "ring-[color:var(--danger)]");
      window.setTimeout(() => el?.classList.remove("ring-2", "ring-[color:var(--danger)]"), 2000);
      return;
    }
    setShowFinalize(true);
  };

  return (
    <div className="space-y-4 pb-32">
      <Link
        to="/app"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Painel
      </Link>

      <Card className="sticky top-16 z-30 p-4 shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {template.nome}
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-sm font-bold text-primary">
                {vehicle.placa}
              </span>
              <span className="text-sm font-semibold">
                {vehicle.marca} {vehicle.modelo}
              </span>
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              Hodômetro {exec.hodometro.toLocaleString("pt-BR")} km · {exec.userName}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold tabular-nums text-primary">{percent}%</div>
            <div className="text-[10px] font-semibold uppercase text-muted-foreground">
              {answeredItems}/{totalItems}
            </div>
          </div>
        </div>
        <Progress value={percent} className="mt-3 h-2" />
      </Card>

      {isPreventivo && (
        <Card className="border-[color:var(--danger)]/30 bg-danger-soft/40 p-3 text-xs text-[color:var(--danger)]">
          <strong>Regra:</strong> ao marcar <em>Trocar</em>, abrir OS e substituir o item antes da
          liberação do veículo.
        </Card>
      )}

      {sections.map((section) => (
        <Card key={section.id} className="p-4">
          <h3 className="mb-3 text-base font-bold text-primary">{section.title}</h3>
          <div className="space-y-3">
            {section.items.map((item) => {
              const a = exec.answers[item.id] ?? { itemId: item.id, status: null };
              return (
                <div
                  key={item.id}
                  id={`item-${item.id}`}
                  className="rounded-lg border border-border p-3 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">
                        {item.label}
                        {item.critico && (
                          <span className="ml-2 rounded-full bg-danger-soft px-1.5 py-0.5 text-[10px] font-bold uppercase text-[color:var(--danger)]">
                            Crítico
                          </span>
                        )}
                      </div>
                      {item.criterio && (
                        <div className="mt-0.5 text-xs text-muted-foreground">{item.criterio}</div>
                      )}
                    </div>
                  </div>

                  {isPreventivo ? (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <StatusButton
                        status="ok"
                        active={a.status === "ok"}
                        onClick={() =>
                          updateAnswer(exec.id, item.id, {
                            status: "ok",
                            observacao: "",
                            fotoDataUrl: undefined,
                          })
                        }
                      />
                      <StatusButton
                        status="trocar"
                        active={a.status === "trocar"}
                        onClick={() => updateAnswer(exec.id, item.id, { status: "trocar" })}
                      />
                    </div>
                  ) : (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <StatusButton
                        status="ok"
                        active={a.status === "ok"}
                        onClick={() =>
                          updateAnswer(exec.id, item.id, {
                            status: "ok",
                            observacao: "",
                            fotoDataUrl: undefined,
                          })
                        }
                      />
                      <StatusButton
                        status="atencao"
                        active={a.status === "atencao"}
                        onClick={() => updateAnswer(exec.id, item.id, { status: "atencao" })}
                      />
                      <StatusButton
                        status="nao_conforme"
                        active={a.status === "nao_conforme"}
                        onClick={() => updateAnswer(exec.id, item.id, { status: "nao_conforme" })}
                      />
                    </div>
                  )}

                  {(a.status === "atencao" ||
                    a.status === "nao_conforme" ||
                    a.status === "trocar") && (
                    <div className="mt-3 space-y-2">
                      <Textarea
                        placeholder={
                          a.status === "nao_conforme"
                            ? "Descreva a não conformidade (obrigatório)"
                            : a.status === "trocar"
                              ? "Descreva o serviço / peça a substituir (obrigatório)"
                              : "Descreva o que deve ser observado (obrigatório)"
                        }
                        value={a.observacao ?? ""}
                        onChange={(e) =>
                          updateAnswer(exec.id, item.id, { observacao: e.target.value })
                        }
                      />
                      {a.status === "atencao" && (
                        <Input
                          type="date"
                          value={a.prazo?.slice(0, 10) ?? ""}
                          onChange={(e) =>
                            updateAnswer(exec.id, item.id, {
                              prazo: e.target.value
                                ? new Date(e.target.value).toISOString()
                                : undefined,
                            })
                          }
                          placeholder="Prazo para correção"
                        />
                      )}
                      <PhotoInput
                        required={a.status === "nao_conforme"}
                        value={a.fotoDataUrl}
                        onChange={(dataUrl) =>
                          updateAnswer(exec.id, item.id, { fotoDataUrl: dataUrl })
                        }
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      ))}

      <div className="fixed bottom-16 left-0 right-0 z-30 border-t border-border bg-card p-3 shadow-lg md:bottom-0">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {canFinalize ? "Pronto para finalizar" : "Complete todos os itens obrigatórios"}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate({ to: "/app" })}>
              Continuar depois
            </Button>
            <Button onClick={tryFinalize}>Finalizar</Button>
          </div>
        </div>
      </div>

      {showFinalize && <FinalizeDialog execId={exec.id} onClose={() => setShowFinalize(false)} />}
    </div>
  );
}

function StatusButton({
  status,
  active,
  onClick,
}: {
  status: ItemStatus;
  active: boolean;
  onClick: () => void;
}) {
  const conf: Record<
    ItemStatus,
    { label: string; icon: React.ReactNode; base: string; active: string }
  > = {
    ok: {
      label: "OK",
      icon: <Check className="h-4 w-4" />,
      base: "border-[color:var(--ok)]/40 text-[color:var(--ok)]",
      active: "bg-[color:var(--ok)] text-white border-[color:var(--ok)]",
    },
    atencao: {
      label: "Atenção",
      icon: <AlertTriangle className="h-4 w-4" />,
      base: "border-[color:var(--warn)]/40 text-[color:var(--warn-foreground)]",
      active:
        "bg-[color:var(--warn)] text-[color:var(--warn-foreground)] border-[color:var(--warn)]",
    },
    nao_conforme: {
      label: "Não conforme",
      icon: <X className="h-4 w-4" />,
      base: "border-[color:var(--danger)]/40 text-[color:var(--danger)]",
      active: "bg-[color:var(--danger)] text-white border-[color:var(--danger)]",
    },
    trocar: {
      label: "Trocar",
      icon: <RefreshCw className="h-4 w-4" />,
      base: "border-[color:var(--danger)]/40 text-[color:var(--danger)]",
      active: "bg-[color:var(--danger)] text-white border-[color:var(--danger)]",
    },
  };
  const c = conf[status];

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-12 items-center justify-center gap-1.5 rounded-lg border-2 bg-card text-sm font-bold transition",
        active ? c.active : c.base + " hover:bg-muted",
      )}
    >
      {c.icon}
      {c.label}
    </button>
  );
}

function PhotoInput({
  value,
  onChange,
  required,
}: {
  value?: string;
  onChange: (v: string | undefined) => void;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      onChange(await processImageFile(file));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível processar a imagem.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="Foto" className="h-28 rounded-md border border-border" />
          <button
            onClick={() => onChange(undefined)}
            className="absolute -right-2 -top-2 rounded-full bg-[color:var(--danger)] p-1 text-white"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          className="w-full gap-1.5"
        >
          <Camera className="h-4 w-4" />
          {required ? "Adicionar foto (obrigatório)" : "Adicionar foto"}
        </Button>
      )}
    </div>
  );
}

function FinalizeDialog({ execId, onClose }: { execId: string; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const finalizeExecution = useApp((s) => s.finalizeExecution);
  const navigate = useNavigate();
  const [empty, setEmpty] = useState(true);

  const start = (x: number, y: number) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const move = (x: number, y: number) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#0b1e3a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
    setEmpty(false);
  };
  const end = () => (drawingRef.current = false);

  const pos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const clear = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setEmpty(true);
  };

  const confirm = () => {
    if (empty) {
      toast.error("A assinatura do responsável é obrigatória.");
      return;
    }
    const dataUrl = canvasRef.current?.toDataURL("image/png") ?? "";
    const result = finalizeExecution(execId, dataUrl);
    if (!result) {
      toast.error("Não foi possível finalizar este checklist.");
      onClose();
      return;
    }
    toast.success("Checklist finalizado.");
    onClose();
    navigate({ to: "/app/checklist/$id", params: { id: execId } });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-md p-5">
        <h3 className="text-lg font-bold">Assinatura do motorista</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Assine no espaço abaixo para confirmar a finalização.
        </p>
        <div className="mt-3 rounded-lg border-2 border-dashed border-border bg-muted/30">
          <canvas
            ref={canvasRef}
            width={400}
            height={180}
            className="h-[180px] w-full touch-none"
            onPointerDown={(e) => {
              const { x, y } = pos(e);
              start(x, y);
            }}
            onPointerMove={(e) => {
              const { x, y } = pos(e);
              move(x, y);
            }}
            onPointerUp={end}
            onPointerLeave={end}
          />
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" onClick={clear}>
            Limpar
          </Button>
          <Button variant="outline" onClick={onClose} className="ml-auto">
            Cancelar
          </Button>
          <Button onClick={confirm} disabled={empty}>
            Confirmar
          </Button>
        </div>
      </Card>
    </div>
  );
}

function FinalizedView({ execId }: { execId: string }) {
  const exec = useApp((s) => s.executions.find((e) => e.id === execId));
  const vehicle = useApp((s) =>
    exec ? s.vehicles.find((v) => v.id === exec.vehicleId) : undefined,
  );
  const template = exec ? getTemplate(exec.templateId) : null;
  const navigate = useNavigate();

  if (!exec || !vehicle || !template) return null;

  const decision = exec.decision ?? "ok";

  const sections = getExecutionSections(exec.templateId, vehicle.placa);
  const anomalies = sections
    .flatMap((s) => s.items.map((i) => ({ section: s.title, item: i, answer: exec.answers[i.id] })))
    .filter((x) => x.answer && x.answer.status && x.answer.status !== "ok");

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card
        className={cn(
          "p-6 text-center",
          decision === "ok" && "border-[color:var(--ok)]/40 bg-ok-soft",
          decision === "atencao" && "border-[color:var(--warn)]/40 bg-warn-soft",
          decision === "nao_conforme" && "border-[color:var(--danger)]/40 bg-danger-soft",
        )}
      >
        <div className="flex justify-center">
          {decision === "ok" && <ShieldCheck className="h-12 w-12 text-[color:var(--ok)]" />}
          {decision === "atencao" && (
            <AlertTriangle className="h-12 w-12 text-[color:var(--warn)]" />
          )}
          {decision === "nao_conforme" && (
            <ShieldAlert className="h-12 w-12 text-[color:var(--danger)]" />
          )}
        </div>
        <h2 className="mt-3 text-2xl font-bold">
          {decision === "ok" && "Liberado para rodar"}
          {decision === "atencao" && "Liberado com correção programada"}
          {decision === "nao_conforme" && "Veículo não liberado"}
        </h2>
        <p className="mt-1 text-sm">
          {decision === "ok" && "Nenhuma anormalidade registrada. Boa viagem!"}
          {decision === "atencao" &&
            "Existem itens que devem ser acompanhados. Uma pendência foi criada."}
          {decision === "nao_conforme" &&
            "Comunique imediatamente o responsável. O veículo está bloqueado."}
        </p>
        <div className="mt-3">
          <StatusBadge status={decision} />
        </div>
      </Card>

      <Card className="border-[color:var(--warn)]/30 bg-warn-soft p-4 text-sm text-[color:var(--warn-foreground)]">
        <strong>Atenção:</strong> Pare o veículo e comunique imediatamente se houver pneu com bolha
        ou lona aparente, falha de freio ou direção, vazamento importante, alerta vermelho no painel
        ou item obrigatório de segurança ausente.
      </Card>

      {anomalies.length > 0 && (
        <Card className="p-4">
          <h3 className="mb-3 text-base font-bold">Anormalidades encontradas</h3>
          <div className="space-y-2">
            {anomalies.map(({ section, item, answer }, idx) => (
              <div key={item.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">
                      #{idx + 1} · {section}
                    </div>
                    <div className="text-sm font-semibold">{item.label}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{answer?.observacao}</div>
                  </div>
                  {answer?.status && <ItemStatusBadge status={answer.status} />}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-4">
        <h3 className="mb-2 text-base font-bold">Liberação</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Responsável</div>
            <div className="font-semibold">{exec.userName}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Data e hora</div>
            <div className="font-semibold">
              {exec.finalizedAt ? new Date(exec.finalizedAt).toLocaleString("pt-BR") : "—"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Hodômetro</div>
            <div className="font-semibold tabular-nums">
              {exec.hodometro.toLocaleString("pt-BR")} km
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Veículo</div>
            <div className="font-semibold">{vehicle.placa}</div>
          </div>
        </div>
        {exec.assinaturaDataUrl && (
          <div className="mt-3">
            <div className="text-xs text-muted-foreground">Assinatura</div>
            <img
              src={exec.assinaturaDataUrl}
              alt="Assinatura"
              className="mt-1 h-24 rounded border border-border bg-white"
            />
          </div>
        )}
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => navigate({ to: "/app" })} className="flex-1">
          Voltar ao painel
        </Button>
        <Button
          onClick={() => navigate({ to: "/app/veiculos/$id", params: { id: vehicle.id } })}
          className="flex-1"
        >
          Abrir veículo
        </Button>
      </div>
    </div>
  );
}
