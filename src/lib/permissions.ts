import type { Role } from "./types";

/**
 * Ações do aplicativo (nenhuma funcionalidade nova — apenas nomeia o que já existe).
 */
export type Action =
  | "vehicle.view"
  | "vehicle.create"
  | "vehicle.edit"
  | "vehicle.delete"
  | "checklist.start"
  | "issue.view"
  | "issue.manage";

const matrix: Record<Role, Action[]> = {
  motorista: ["vehicle.view", "checklist.start", "issue.view"],
  mecanico: ["vehicle.view", "checklist.start", "issue.view", "issue.manage"],
  gestor: [
    "vehicle.view",
    "vehicle.create",
    "vehicle.edit",
    "vehicle.delete",
    "checklist.start",
    "issue.view",
    "issue.manage",
  ],
};

export function can(role: Role | undefined | null, action: Action): boolean {
  if (!role) return false;
  return matrix[role].includes(action);
}

export const permissionMessage: Record<Action, string> = {
  "vehicle.view": "Você não tem permissão para visualizar veículos.",
  "vehicle.create": "Apenas gestores podem cadastrar veículos.",
  "vehicle.edit": "Apenas gestores podem editar veículos.",
  "vehicle.delete": "Apenas gestores podem excluir veículos.",
  "checklist.start": "Seu perfil não pode iniciar checklists.",
  "issue.view": "Você não tem permissão para visualizar pendências.",
  "issue.manage": "Apenas mecânicos e gestores podem tratar pendências.",
};
