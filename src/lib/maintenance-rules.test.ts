import { describe, expect, it } from "vitest";
import type { ChecklistExecution, MaintenanceIssue } from "./types";
import { computeChecklistDecision, deriveVehicleStatus } from "./maintenance-rules";

function execution(
  answers: ChecklistExecution["answers"],
  templateId = "tpl-5k-op",
): ChecklistExecution {
  return {
    id: "exec-test",
    templateId,
    vehicleId: "vehicle-test",
    userId: "user-test",
    userName: "Teste",
    hodometro: 10000,
    answers,
    status: "em_andamento",
    createdAt: "2026-07-24T12:00:00.000Z",
  };
}

function issue(
  itemStatus: MaintenanceIssue["itemStatus"],
  status: MaintenanceIssue["status"] = "aberta",
): MaintenanceIssue {
  return {
    id: `${itemStatus}-${status}`,
    vehicleId: "vehicle-test",
    itemLabel: "Item",
    itemStatus,
    descricao: "Teste",
    createdAt: "2026-07-24T12:00:00.000Z",
    hodometro: 10000,
    abertoPor: "Teste",
    status,
  };
}

describe("computeChecklistDecision", () => {
  it("libera quando todas as respostas estão OK", () => {
    const result = computeChecklistDecision(
      execution({
        "pneu-pressao": { itemId: "pneu-pressao", status: "ok" },
        "seg-limpadores": { itemId: "seg-limpadores", status: "ok" },
      }),
    );
    expect(result).toEqual({ decision: "ok", critical: false });
  });

  it("mantém atenção para item não crítico", () => {
    const result = computeChecklistDecision(
      execution({
        "seg-limpadores": { itemId: "seg-limpadores", status: "atencao" },
      }),
    );
    expect(result).toEqual({ decision: "atencao", critical: false });
  });

  it("bloqueia quando a atenção é em item crítico", () => {
    const result = computeChecklistDecision(
      execution({
        "pneu-pressao": { itemId: "pneu-pressao", status: "atencao" },
      }),
    );
    expect(result).toEqual({ decision: "nao_conforme", critical: true });
  });

  it("bloqueia qualquer não conformidade", () => {
    const result = computeChecklistDecision(
      execution({
        "seg-limpadores": { itemId: "seg-limpadores", status: "nao_conforme" },
      }),
    );
    expect(result).toEqual({ decision: "nao_conforme", critical: false });
  });

  it("bloqueia item preventivo marcado para troca", () => {
    const result = computeChecklistDecision(
      execution(
        {
          "p5-eletrica-luzes": { itemId: "p5-eletrica-luzes", status: "trocar" },
        },
        "tpl-5k-prev",
      ),
    );
    expect(result).toEqual({ decision: "nao_conforme", critical: false });
  });
});

describe("deriveVehicleStatus", () => {
  it("prioriza não conformidade aberta", () => {
    expect(deriveVehicleStatus([issue("atencao"), issue("nao_conforme")])).toBe("nao_conforme");
  });

  it("trata troca preventiva como bloqueio", () => {
    expect(deriveVehicleStatus([issue("trocar")])).toBe("nao_conforme");
  });

  it("ignora pendências concluídas e canceladas", () => {
    expect(
      deriveVehicleStatus([issue("nao_conforme", "concluida"), issue("atencao", "cancelada")]),
    ).toBe("ok");
  });

  it("não rebaixa uma decisão já bloqueada", () => {
    expect(deriveVehicleStatus([issue("atencao")], "nao_conforme")).toBe("nao_conforme");
  });
});
