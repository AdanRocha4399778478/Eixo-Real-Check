export type Role = "motorista" | "mecanico" | "gestor";

export interface User {
  id: string;
  name: string;
  role: Role;
}

export type VehicleStatus = "ok" | "atencao" | "nao_conforme";

export interface Vehicle {
  id: string;
  placa: string;
  frota: string;
  marca: string;
  modelo: string;
  ano: number;
  tipo: string;
  implemento?: string;
  hodometro: number;
  dataEntrada: string;
  status: VehicleStatus;
  motoristaPrincipalId?: string;
  observacoes?: string;
  fotoUrl?: string;
  ultimaRevisaoKm: number;
  proximaRevisaoKm: number;
}

export type ItemStatus = "ok" | "atencao" | "nao_conforme" | "trocar";

export interface ChecklistItemDef {
  id: string;
  label: string;
  criterio?: string;
  critico?: boolean;
}
export interface ChecklistSectionDef {
  id: string;
  title: string;
  items: ChecklistItemDef[];
}
export type ChecklistTipo = "operacional" | "preventivo" | "complementar";

/** Modo de resposta: 3 estados (operacional) ou 2 estados OK/Trocar (preventivo). */
export type ChecklistMode = "operacional" | "preventivo";

export interface ChecklistTemplate {
  id: string;
  nome: string;
  km: number;
  tipo: ChecklistTipo;
  mode: ChecklistMode;
  /** Subtítulo curto usado nos cabeçalhos. */
  subtitulo?: string;
  /** IDs de templates cujos itens são herdados (na ordem, do menor para o maior). */
  inheritsFrom?: string[];
  /** Categorias técnicas cobertas por este nível (documentação). */
  categorias?: string[];
  /** Seções e itens específicos deste nível. */
  sections: ChecklistSectionDef[];
}

export interface ChecklistAnswer {
  itemId: string;
  status: ItemStatus | null;
  observacao?: string;
  fotoDataUrl?: string;
  prazo?: string;
}

export type ChecklistDecision = "ok" | "atencao" | "nao_conforme";
export type ExecutionStatus = "em_andamento" | "finalizado";

export interface ChecklistExecution {
  id: string;
  templateId: string;
  vehicleId: string;
  userId: string;
  userName: string;
  hodometro: number;
  answers: Record<string, ChecklistAnswer>;
  status: ExecutionStatus;
  decision?: ChecklistDecision;
  assinaturaDataUrl?: string;
  createdAt: string;
  finalizedAt?: string;
}

export type IssueStatus =
  "aberta" | "em_analise" | "aguardando_peca" | "em_manutencao" | "concluida" | "cancelada";

export interface MaintenanceIssue {
  id: string;
  vehicleId: string;
  executionId?: string;
  itemLabel: string;
  itemStatus: ItemStatus;
  descricao: string;
  fotoDataUrl?: string;
  createdAt: string;
  hodometro: number;
  abertoPor: string;
  prazo?: string;
  mecanicoId?: string;
  status: IssueStatus;
  diagnostico?: string;
  pecas?: string;
  servicoExecutado?: string;
  concluidoEm?: string;
  hodometroConclusao?: number;
  fotoDepoisDataUrl?: string;
  liberadoPor?: string;
  critica?: boolean;
}
