import { describe, expect, it } from "vitest";
import { databaseMappers } from "./database";
import type { ChecklistExecution, MaintenanceIssue, Vehicle } from "./types";

describe("database mappers", () => {
  it("preserva todos os dados do veículo", () => {
    const vehicle: Vehicle = {
      id: "v-test",
      placa: "ABC-1D23",
      frota: "F-100",
      marca: "Volvo",
      modelo: "FH",
      ano: 2025,
      tipo: "Cavalo mecânico",
      implemento: "Bitrem",
      hodometro: 12345,
      dataEntrada: "2026-01-10",
      status: "atencao",
      motoristaPrincipalId: "u-mot-1",
      observacoes: "Teste",
      fotoUrl: "https://example.com/vehicle.jpg",
      ultimaRevisaoKm: 10000,
      proximaRevisaoKm: 15000,
    };

    expect(databaseMappers.vehicle.fromRow(databaseMappers.vehicle.toRow(vehicle))).toEqual(
      vehicle,
    );
  });

  it("preserva respostas e assinatura da execução", () => {
    const execution: ChecklistExecution = {
      id: "e-test",
      templateId: "tpl-5k",
      vehicleId: "v-test",
      userId: "u-mot-1",
      userName: "Motorista",
      hodometro: 15000,
      answers: {
        item: {
          itemId: "item",
          status: "atencao",
          observacao: "Teste",
          prazo: "2026-08-01T00:00:00.000Z",
        },
      },
      status: "finalizado",
      decision: "atencao",
      assinaturaDataUrl: "data:image/png;base64,abc",
      createdAt: "2026-07-24T12:00:00.000Z",
      finalizedAt: "2026-07-24T12:10:00.000Z",
    };

    expect(databaseMappers.execution.fromRow(databaseMappers.execution.toRow(execution))).toEqual(
      execution,
    );
  });

  it("preserva o ciclo completo da pendência", () => {
    const issue: MaintenanceIssue = {
      id: "i-test",
      vehicleId: "v-test",
      executionId: "e-test",
      itemLabel: "Freio",
      itemStatus: "nao_conforme",
      descricao: "Ruído",
      fotoDataUrl: "data:image/png;base64,antes",
      createdAt: "2026-07-24T12:00:00.000Z",
      hodometro: 15000,
      abertoPor: "Motorista",
      prazo: "2026-07-25T12:00:00.000Z",
      mecanicoId: "u-mec-1",
      status: "concluida",
      diagnostico: "Pastilha",
      pecas: "Jogo de pastilhas",
      servicoExecutado: "Substituição",
      concluidoEm: "2026-07-24T15:00:00.000Z",
      hodometroConclusao: 15010,
      fotoDepoisDataUrl: "data:image/png;base64,depois",
      liberadoPor: "Mecânico",
      critica: true,
    };

    expect(databaseMappers.issue.fromRow(databaseMappers.issue.toRow(issue))).toEqual(issue);
  });
});
