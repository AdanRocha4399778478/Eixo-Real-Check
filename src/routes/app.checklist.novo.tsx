import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/lib/store";
import {
  templates,
  preventivoTemplates,
  template5kOperacional,
  recommendTemplateForRole,
  includedLevels,
  templateShortLabel,
  getComplementarySection,
} from "@/lib/checklist-templates";
import { ClipboardList, Sparkles, Wrench } from "lucide-react";
import { toast } from "sonner";
import { can } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  vehicleId: z.string().optional(),
});

export const Route = createFileRoute("/app/checklist/novo")({
  validateSearch: (s) => searchSchema.parse(s),
  component: NewChecklist,
});

function NewChecklist() {
  const { vehicleId: initialId } = Route.useSearch();
  const vehicles = useApp((s) => s.vehicles);
  const currentUser = useApp((s) => s.currentUser);
  const startExecution = useApp((s) => s.startExecution);
  const navigate = useNavigate();

  const [vehicleId, setVehicleId] = useState(initialId ?? "");
  const [hodometro, setHodometro] = useState("");
  const [templateId, setTemplateId] = useState<string | null>(null);

  const selected = vehicles.find((v) => v.id === vehicleId);
  const selectedHodometro = selected?.hodometro;

  useEffect(() => {
    if (selectedHodometro !== undefined) setHodometro(String(selectedHodometro));
    else setHodometro("");
    setTemplateId(null);
  }, [vehicleId, selectedHodometro]);

  const hodometroNum = Number(hodometro);
  const hodometroError =
    hodometro === ""
      ? "Informe o hodômetro atual."
      : !Number.isFinite(hodometroNum)
        ? "Informe um número válido."
        : hodometroNum <= 0
          ? "O hodômetro deve ser maior que zero."
          : selected && hodometroNum < selected.hodometro
            ? `O hodômetro não pode ser menor que o registrado (${selected.hodometro.toLocaleString("pt-BR")} km).`
            : null;
  const invalidHodometro = !!hodometroError;

  const role = currentUser?.role ?? "motorista";

  const recommended = useMemo(() => {
    if (!selected) return null;
    return recommendTemplateForRole(role, selected.proximaRevisaoKm);
  }, [selected, role]);

  const effectiveTemplateId = templateId ?? recommended?.id ?? null;
  const included = effectiveTemplateId ? includedLevels(effectiveTemplateId) : [];
  const complementary = useMemo(() => {
    if (!selected || !effectiveTemplateId) return null;
    const tpl = templates.find((t) => t.id === effectiveTemplateId);
    if (!tpl || tpl.mode !== "preventivo") return null;
    return getComplementarySection(selected.placa, tpl.km);
  }, [selected, effectiveTemplateId]);

  const canPickManual = role === "gestor" || role === "mecanico";

  // Options offered to the user based on role.
  const options = useMemo(() => {
    if (role === "motorista") return [template5kOperacional];
    if (role === "mecanico") return preventivoTemplates;
    return templates; // gestor
  }, [role]);

  const start = () => {
    if (!can(role, "checklist.start")) {
      toast.error("Seu perfil não pode iniciar checklists.");
      return;
    }
    if (!vehicleId) {
      toast.error("Selecione um veículo.");
      return;
    }
    if (hodometroError) {
      toast.error(hodometroError);
      return;
    }
    if (!effectiveTemplateId) {
      toast.error("Selecione o tipo de checklist.");
      return;
    }
    const exec = startExecution(effectiveTemplateId, vehicleId, hodometroNum);
    navigate({ to: "/app/checklist/$id", params: { id: exec.id } });
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Novo checklist</h1>
        <p className="text-sm text-muted-foreground">
          O sistema recomenda a revisão com base no perfil e na próxima revisão prevista do veículo.
        </p>
      </div>

      <Card className="p-5 space-y-4">
        <div>
          <Label>Veículo</Label>
          <select
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-3 text-base"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
          >
            <option value="">Selecione…</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.placa} · {v.frota} · {v.marca} {v.modelo}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Hodômetro atual (km)</Label>
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            value={hodometro}
            onChange={(e) => setHodometro(e.target.value)}
            className="mt-1 h-12 text-lg tabular-nums"
            placeholder="Ex.: 184320"
            aria-invalid={!!hodometroError}
          />
          {hodometroError && (
            <p className="mt-1 text-xs text-[color:var(--danger)]">{hodometroError}</p>
          )}
        </div>

        {selected && recommended && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                  Revisão recomendada
                </div>
                <div className="text-sm font-bold text-primary">{recommended.nome}</div>
                {recommended.subtitulo && (
                  <div className="text-[11px] text-primary/80">{recommended.subtitulo}</div>
                )}
                <div className="mt-1 text-xs text-muted-foreground">
                  {role === "motorista"
                    ? "Motoristas realizam o checklist operacional antes de rodar."
                    : `Próxima revisão prevista: ${selected.proximaRevisaoKm.toLocaleString("pt-BR")} km · Última: ${selected.ultimaRevisaoKm.toLocaleString("pt-BR")} km`}
                </div>
                {recommended.mode === "preventivo" && included.length > 1 && (
                  <div className="mt-2 text-xs text-primary/90">
                    Inclui também os itens de{" "}
                    {included
                      .slice(0, -1)
                      .map((t) => templateShortLabel(t.id))
                      .join(", ")}
                    .
                  </div>
                )}
                {complementary && (
                  <div className="mt-2 rounded border border-[color:var(--warn)]/40 bg-warn-soft px-2 py-1.5 text-[11px] text-[color:var(--warn-foreground)]">
                    <strong>Complementar por placa:</strong> {complementary.items.length} item(s)
                    específico(s) deste veículo serão incluídos.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {selected && canPickManual && (
          <div>
            <Label>Tipo de checklist</Label>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {options.map((t) => {
                const isRecommended = recommended?.id === t.id;
                const isSelected = effectiveTemplateId === t.id;
                const Icon = t.mode === "operacional" ? ClipboardList : Wrench;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplateId(t.id)}
                    className={cn(
                      "flex items-start gap-2 rounded-lg border-2 p-3 text-left transition",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <Icon className="mt-0.5 h-4 w-4 text-primary" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold">{templateShortLabel(t.id)}</span>
                        {isRecommended && (
                          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">
                            Recomendado
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] capitalize text-muted-foreground">{t.tipo}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {selected && !canPickManual && recommended && (
          <p className="text-xs text-muted-foreground">
            Motoristas iniciam o checklist operacional recomendado. Preventivos por km são
            realizados pela equipe mecânica.
          </p>
        )}

        <Button
          onClick={start}
          disabled={!vehicleId || invalidHodometro || !effectiveTemplateId}
          className="h-12 w-full text-base"
        >
          Iniciar checklist
        </Button>
      </Card>
    </div>
  );
}
