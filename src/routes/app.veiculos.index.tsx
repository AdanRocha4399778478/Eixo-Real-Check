import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { useApp } from "@/lib/store";
import { can } from "@/lib/permissions";
import type { Vehicle } from "@/lib/types";
import { Plus, Trash2, Pencil } from "lucide-react";

export const Route = createFileRoute("/app/veiculos/")({
  component: VehiclesPage,
});

type VehicleForm = Omit<Vehicle, "id" | "status">;

const empty: VehicleForm = {
  placa: "",
  frota: "",
  marca: "",
  modelo: "",
  ano: new Date().getFullYear(),
  tipo: "Cavalo mecânico",
  implemento: "",
  hodometro: 0,
  dataEntrada: new Date().toISOString().slice(0, 10),
  observacoes: "",
  ultimaRevisaoKm: 0,
  proximaRevisaoKm: 10000,
};

const MIN_ANO = 1970;
const MAX_ANO = new Date().getFullYear() + 1;

const statusOrder: Record<Vehicle["status"], number> = { nao_conforme: 0, atencao: 1, ok: 2 };

function validate(form: VehicleForm): Partial<Record<keyof VehicleForm, string>> {
  const e: Partial<Record<keyof VehicleForm, string>> = {};
  if (!form.placa.trim()) e.placa = "Informe a placa.";
  if (!form.marca.trim()) e.marca = "Informe a marca.";
  if (!form.modelo.trim()) e.modelo = "Informe o modelo.";
  if (!form.frota.trim()) e.frota = "Informe a frota.";
  if (!form.tipo.trim()) e.tipo = "Informe o tipo.";
  if (!form.dataEntrada) e.dataEntrada = "Informe a data de entrada.";
  if (!Number.isFinite(form.ano) || form.ano < MIN_ANO || form.ano > MAX_ANO)
    e.ano = `Ano deve estar entre ${MIN_ANO} e ${MAX_ANO}.`;
  if (!Number.isFinite(form.hodometro) || form.hodometro < 0)
    e.hodometro = "O hodômetro não pode ser negativo.";
  if (!Number.isFinite(form.ultimaRevisaoKm) || form.ultimaRevisaoKm < 0)
    e.ultimaRevisaoKm = "A última revisão não pode ser negativa.";
  if (!(form.proximaRevisaoKm > form.ultimaRevisaoKm))
    e.proximaRevisaoKm = "A próxima revisão deve ser maior que a última revisão.";
  return e;
}

function VehiclesPage() {
  const vehicles = useApp((s) => s.vehicles);
  const addVehicle = useApp((s) => s.addVehicle);
  const updateVehicle = useApp((s) => s.updateVehicle);
  const deleteVehicle = useApp((s) => s.deleteVehicle);
  const currentUser = useApp((s) => s.currentUser);
  const navigate = useNavigate();
  const canCreate = can(currentUser?.role, "vehicle.create");
  const canEdit = can(currentUser?.role, "vehicle.edit");
  const canDelete = can(currentUser?.role, "vehicle.delete");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<VehicleForm>(empty);
  const [touched, setTouched] = useState(false);

  const errors = validate(form);
  const hasErrors = Object.keys(errors).length > 0;

  const sorted = useMemo(
    () =>
      [...vehicles].sort(
        (a, b) => statusOrder[a.status] - statusOrder[b.status] || a.placa.localeCompare(b.placa),
      ),
    [vehicles],
  );

  const startNew = () => {
    if (!canCreate) return;
    setEditing(null);
    setForm(empty);
    setTouched(false);
    setOpen(true);
  };
  const startEdit = (v: Vehicle) => {
    if (!canEdit) return;
    const { id, status, ...rest } = v;
    setEditing(v);
    setForm(rest);
    setTouched(false);
    setOpen(true);
  };

  const save = () => {
    setTouched(true);
    if (hasErrors) {
      toast.error("Corrija os campos destacados antes de salvar.");
      return;
    }
    if (editing) {
      if (!canEdit) return toast.error("Apenas gestores podem editar veículos.");
      const res = updateVehicle(editing.id, form);
      if (!res.ok) return toast.error(res.error!);
      toast.success("Veículo atualizado.");
    } else {
      if (!canCreate) return toast.error("Apenas gestores podem cadastrar veículos.");
      const res = addVehicle(form);
      if (!res.ok) return toast.error(res.error!);
      toast.success("Veículo cadastrado.");
    }
    setOpen(false);
  };

  const remove = (v: Vehicle) => {
    if (!canDelete) return toast.error("Apenas gestores podem excluir veículos.");
    if (!confirm(`Excluir o veículo ${v.placa}?`)) return;
    const res = deleteVehicle(v.id);
    if (!res.ok) return toast.error(res.error!);
    toast.success(`Veículo ${v.placa} excluído.`);
  };

  const err = (k: keyof VehicleForm) => (touched ? errors[k] : undefined);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Veículos</h1>
          <p className="text-sm text-muted-foreground">Cadastro e gestão da frota.</p>
        </div>
        {canCreate && (
          <Button onClick={startNew} className="gap-1.5">
            <Plus className="h-4 w-4" /> Novo veículo
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar veículo" : "Cadastrar veículo"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field
              label="Placa"
              value={form.placa}
              error={err("placa")}
              onChange={(v) => setForm({ ...form, placa: v.toUpperCase() })}
            />
            <Field
              label="Frota"
              value={form.frota}
              error={err("frota")}
              onChange={(v) => setForm({ ...form, frota: v })}
            />
            <Field
              label="Marca"
              value={form.marca}
              error={err("marca")}
              onChange={(v) => setForm({ ...form, marca: v })}
            />
            <Field
              label="Modelo"
              value={form.modelo}
              error={err("modelo")}
              onChange={(v) => setForm({ ...form, modelo: v })}
            />
            <Field
              label="Ano"
              type="number"
              value={String(form.ano)}
              error={err("ano")}
              onChange={(v) => setForm({ ...form, ano: Number(v) })}
            />
            <Field
              label="Tipo"
              value={form.tipo}
              error={err("tipo")}
              onChange={(v) => setForm({ ...form, tipo: v })}
            />
            <Field
              label="Implemento"
              value={form.implemento ?? ""}
              onChange={(v) => setForm({ ...form, implemento: v })}
            />
            <Field
              label="Hodômetro atual"
              type="number"
              value={String(form.hodometro)}
              error={err("hodometro")}
              onChange={(v) => setForm({ ...form, hodometro: Number(v) })}
            />
            <Field
              label="Data de entrada"
              type="date"
              value={form.dataEntrada}
              error={err("dataEntrada")}
              onChange={(v) => setForm({ ...form, dataEntrada: v })}
            />
            <Field
              label="Última revisão (km)"
              type="number"
              value={String(form.ultimaRevisaoKm)}
              error={err("ultimaRevisaoKm")}
              onChange={(v) => setForm({ ...form, ultimaRevisaoKm: Number(v) })}
            />
            <Field
              label="Próxima revisão (km)"
              type="number"
              value={String(form.proximaRevisaoKm)}
              error={err("proximaRevisaoKm")}
              onChange={(v) => setForm({ ...form, proximaRevisaoKm: Number(v) })}
            />
            <div className="sm:col-span-2">
              <Label>Observações</Label>
              <Textarea
                value={form.observacoes ?? ""}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              />
            </div>
            <p className="text-xs text-muted-foreground sm:col-span-2">
              O status do veículo (Liberado, Atenção ou Bloqueado) é calculado automaticamente pelas
              pendências abertas.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sorted.map((v) => (
          <Card
            key={v.id}
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: "/app/veiculos/$id", params: { id: v.id } })}
            onKeyDown={(e) => {
              if (e.key === "Enter") navigate({ to: "/app/veiculos/$id", params: { id: v.id } });
            }}
            className="cursor-pointer p-4 transition hover:border-primary/40 hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-sm font-bold text-primary">
                  {v.placa}
                </span>
                <div className="mt-1 truncate text-sm font-semibold">
                  {v.marca} {v.modelo}
                </div>
                <div className="text-xs text-muted-foreground">
                  {v.frota} · {v.ano} · {v.tipo}
                </div>
              </div>
              <StatusBadge status={v.status} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-muted-foreground">Hodômetro</div>
                <div className="font-semibold tabular-nums">
                  {v.hodometro.toLocaleString("pt-BR")} km
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Próx. revisão</div>
                <div className="font-semibold tabular-nums">
                  {v.proximaRevisaoKm.toLocaleString("pt-BR")} km
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link to="/app/veiculos/$id" params={{ id: v.id }}>
                  Abrir
                </Link>
              </Button>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Editar"
                  onClick={() => startEdit(v)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {canDelete && (
                <Button variant="ghost" size="icon" aria-label="Excluir" onClick={() => remove(v)}>
                  <Trash2 className="h-4 w-4 text-[color:var(--danger)]" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  error?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1"
        aria-invalid={!!error}
      />
      {error && <p className="mt-1 text-xs text-[color:var(--danger)]">{error}</p>}
    </div>
  );
}
