import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ChecklistExecution, MaintenanceIssue, User, Vehicle } from "./types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY
)?.trim();

export const isDatabaseConfigured = Boolean(supabaseUrl && supabaseKey);

const supabase: SupabaseClient | null = isDatabaseConfigured
  ? createClient(supabaseUrl!, supabaseKey!, {
      auth: { persistSession: false },
    })
  : null;

function requireClient() {
  if (!supabase) throw new Error("Supabase não configurado.");
  return supabase;
}

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

type UserRow = {
  id: string;
  name: string;
  role: User["role"];
};

type VehicleRow = {
  id: string;
  placa: string;
  frota: string;
  marca: string;
  modelo: string;
  ano: number;
  tipo: string;
  implemento: string | null;
  hodometro: number;
  data_entrada: string;
  status: Vehicle["status"];
  motorista_principal_id: string | null;
  observacoes: string | null;
  foto_url: string | null;
  ultima_revisao_km: number;
  proxima_revisao_km: number;
};

type ExecutionRow = {
  id: string;
  template_id: string;
  vehicle_id: string;
  user_id: string;
  user_name: string;
  hodometro: number;
  answers: ChecklistExecution["answers"];
  status: ChecklistExecution["status"];
  decision: ChecklistExecution["decision"] | null;
  assinatura_data_url: string | null;
  created_at: string;
  finalized_at: string | null;
};

type IssueRow = {
  id: string;
  vehicle_id: string;
  execution_id: string | null;
  item_label: string;
  item_status: MaintenanceIssue["itemStatus"];
  descricao: string;
  foto_data_url: string | null;
  created_at: string;
  hodometro: number;
  aberto_por: string;
  prazo: string | null;
  mecanico_id: string | null;
  status: MaintenanceIssue["status"];
  diagnostico: string | null;
  pecas: string | null;
  servico_executado: string | null;
  concluido_em: string | null;
  hodometro_conclusao: number | null;
  foto_depois_data_url: string | null;
  liberado_por: string | null;
  critica: boolean;
};

const toVehicleRow = (vehicle: Vehicle): VehicleRow => ({
  id: vehicle.id,
  placa: vehicle.placa,
  frota: vehicle.frota,
  marca: vehicle.marca,
  modelo: vehicle.modelo,
  ano: vehicle.ano,
  tipo: vehicle.tipo,
  implemento: vehicle.implemento ?? null,
  hodometro: vehicle.hodometro,
  data_entrada: vehicle.dataEntrada,
  status: vehicle.status,
  motorista_principal_id: vehicle.motoristaPrincipalId ?? null,
  observacoes: vehicle.observacoes ?? null,
  foto_url: vehicle.fotoUrl ?? null,
  ultima_revisao_km: vehicle.ultimaRevisaoKm,
  proxima_revisao_km: vehicle.proximaRevisaoKm,
});

const fromVehicleRow = (row: VehicleRow): Vehicle => ({
  id: row.id,
  placa: row.placa,
  frota: row.frota,
  marca: row.marca,
  modelo: row.modelo,
  ano: row.ano,
  tipo: row.tipo,
  implemento: row.implemento ?? undefined,
  hodometro: row.hodometro,
  dataEntrada: row.data_entrada,
  status: row.status,
  motoristaPrincipalId: row.motorista_principal_id ?? undefined,
  observacoes: row.observacoes ?? undefined,
  fotoUrl: row.foto_url ?? undefined,
  ultimaRevisaoKm: row.ultima_revisao_km,
  proximaRevisaoKm: row.proxima_revisao_km,
});

const toExecutionRow = (execution: ChecklistExecution): ExecutionRow => ({
  id: execution.id,
  template_id: execution.templateId,
  vehicle_id: execution.vehicleId,
  user_id: execution.userId,
  user_name: execution.userName,
  hodometro: execution.hodometro,
  answers: execution.answers,
  status: execution.status,
  decision: execution.decision ?? null,
  assinatura_data_url: execution.assinaturaDataUrl ?? null,
  created_at: execution.createdAt,
  finalized_at: execution.finalizedAt ?? null,
});

const fromExecutionRow = (row: ExecutionRow): ChecklistExecution => ({
  id: row.id,
  templateId: row.template_id,
  vehicleId: row.vehicle_id,
  userId: row.user_id,
  userName: row.user_name,
  hodometro: row.hodometro,
  answers: row.answers ?? {},
  status: row.status,
  decision: row.decision ?? undefined,
  assinaturaDataUrl: row.assinatura_data_url ?? undefined,
  createdAt: row.created_at,
  finalizedAt: row.finalized_at ?? undefined,
});

const toIssueRow = (issue: MaintenanceIssue): IssueRow => ({
  id: issue.id,
  vehicle_id: issue.vehicleId,
  execution_id: issue.executionId ?? null,
  item_label: issue.itemLabel,
  item_status: issue.itemStatus,
  descricao: issue.descricao,
  foto_data_url: issue.fotoDataUrl ?? null,
  created_at: issue.createdAt,
  hodometro: issue.hodometro,
  aberto_por: issue.abertoPor,
  prazo: issue.prazo ?? null,
  mecanico_id: issue.mecanicoId ?? null,
  status: issue.status,
  diagnostico: issue.diagnostico ?? null,
  pecas: issue.pecas ?? null,
  servico_executado: issue.servicoExecutado ?? null,
  concluido_em: issue.concluidoEm ?? null,
  hodometro_conclusao: issue.hodometroConclusao ?? null,
  foto_depois_data_url: issue.fotoDepoisDataUrl ?? null,
  liberado_por: issue.liberadoPor ?? null,
  critica: issue.critica ?? false,
});

const fromIssueRow = (row: IssueRow): MaintenanceIssue => ({
  id: row.id,
  vehicleId: row.vehicle_id,
  executionId: row.execution_id ?? undefined,
  itemLabel: row.item_label,
  itemStatus: row.item_status,
  descricao: row.descricao,
  fotoDataUrl: row.foto_data_url ?? undefined,
  createdAt: row.created_at,
  hodometro: row.hodometro,
  abertoPor: row.aberto_por,
  prazo: row.prazo ?? undefined,
  mecanicoId: row.mecanico_id ?? undefined,
  status: row.status,
  diagnostico: row.diagnostico ?? undefined,
  pecas: row.pecas ?? undefined,
  servicoExecutado: row.servico_executado ?? undefined,
  concluidoEm: row.concluido_em ?? undefined,
  hodometroConclusao: row.hodometro_conclusao ?? undefined,
  fotoDepoisDataUrl: row.foto_depois_data_url ?? undefined,
  liberadoPor: row.liberado_por ?? undefined,
  critica: row.critica,
});

export const databaseMappers = {
  vehicle: { toRow: toVehicleRow, fromRow: fromVehicleRow },
  execution: { toRow: toExecutionRow, fromRow: fromExecutionRow },
  issue: { toRow: toIssueRow, fromRow: fromIssueRow },
};

export async function loadDatabase() {
  const client = requireClient();
  const [usersResult, vehiclesResult, executionsResult, issuesResult] = await Promise.all([
    client.from("app_users").select("*").order("name"),
    client.from("vehicles").select("*").order("frota"),
    client.from("checklist_executions").select("*").order("created_at", { ascending: false }),
    client.from("maintenance_issues").select("*").order("created_at", { ascending: false }),
  ]);

  throwIfError(usersResult.error);
  throwIfError(vehiclesResult.error);
  throwIfError(executionsResult.error);
  throwIfError(issuesResult.error);

  return {
    users: (usersResult.data as UserRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      role: row.role,
    })),
    vehicles: (vehiclesResult.data as VehicleRow[]).map(fromVehicleRow),
    executions: (executionsResult.data as ExecutionRow[]).map(fromExecutionRow),
    issues: (issuesResult.data as IssueRow[]).map(fromIssueRow),
  };
}

export async function saveVehicle(vehicle: Vehicle) {
  const { error } = await requireClient().from("vehicles").upsert(toVehicleRow(vehicle));
  throwIfError(error);
}

export async function removeVehicle(id: string) {
  const { error } = await requireClient().from("vehicles").delete().eq("id", id);
  throwIfError(error);
}

export async function saveExecution(execution: ChecklistExecution) {
  const { error } = await requireClient()
    .from("checklist_executions")
    .upsert(toExecutionRow(execution));
  throwIfError(error);
}

export async function saveIssues(issues: MaintenanceIssue[]) {
  if (issues.length === 0) return;
  const { error } = await requireClient().from("maintenance_issues").upsert(issues.map(toIssueRow));
  throwIfError(error);
}
