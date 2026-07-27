import { describe, expect, it } from "vitest";
import { can } from "./permissions";

describe("permissions", () => {
  it("permite ao mecânico executar checklists preventivos", () => {
    expect(can("mecanico", "checklist.start")).toBe(true);
  });

  it("mantém cadastro e exclusão de veículos restritos ao gestor", () => {
    expect(can("motorista", "vehicle.create")).toBe(false);
    expect(can("mecanico", "vehicle.delete")).toBe(false);
    expect(can("gestor", "vehicle.create")).toBe(true);
  });
});
