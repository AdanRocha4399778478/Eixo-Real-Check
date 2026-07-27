import { describe, expect, it } from "vitest";
import { migratePersistedState } from "./store";
import type { ChecklistExecution, MaintenanceIssue, User, Vehicle } from "./types";

const user: User = { id: "u-custom", name: "Usuário real", role: "gestor" };
const vehicle: Vehicle = {
  id: "v-custom",
  placa: "ABC1D23",
  frota: "F-99",
  marca: "Marca",
  modelo: "Modelo",
  ano: 2025,
  tipo: "Caminhão",
  hodometro: 12_345,
  dataEntrada: "2026-01-01",
  status: "atencao",
  ultimaRevisaoKm: 10_000,
  proximaRevisaoKm: 15_000,
};
const execution: ChecklistExecution = {
  id: "e-custom",
  templateId: "tpl-5k",
  vehicleId: vehicle.id,
  userId: user.id,
  userName: user.name,
  hodometro: 12_345,
  answers: {},
  status: "finalizado",
  decision: "atencao",
  createdAt: "2026-01-02T00:00:00.000Z",
};
const issue: MaintenanceIssue = {
  id: "i-custom",
  vehicleId: vehicle.id,
  executionId: execution.id,
  itemLabel: "Item",
  itemStatus: "atencao",
  descricao: "Preservar",
  createdAt: "2026-01-02T00:00:00.000Z",
  hodometro: 12_345,
  abertoPor: user.name,
  status: "aberta",
};

describe("store migration", () => {
  it("preserva usuários, veículos, pendências e execuções reais", () => {
    const migrated = migratePersistedState({
      currentUser: user,
      users: [user],
      vehicles: [vehicle],
      executions: [execution],
      issues: [issue],
    });

    expect(migrated.currentUser).toEqual(user);
    expect(migrated.users).toEqual([user]);
    expect(migrated.vehicles).toEqual([vehicle]);
    expect(migrated.issues).toEqual([issue]);
    expect(migrated.executions).toHaveLength(1);
  });

  it("migra o antigo checklist operacional sem apagar a execução", () => {
    const migrated = migratePersistedState({
      currentUser: null,
      users: [user],
      vehicles: [vehicle],
      executions: [execution],
      issues: [issue],
    });

    expect(migrated.executions[0]).toMatchObject({
      id: execution.id,
      templateId: "tpl-5k-op",
    });
  });
});
