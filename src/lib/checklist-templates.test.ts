import { describe, expect, it } from "vitest";
import {
  getComplementarySection,
  getTemplate,
  includedLevels,
  recommendPreventivo,
} from "./checklist-templates";

describe("checklist templates", () => {
  it("compõe cumulativamente os itens dos níveis preventivos", () => {
    const base = getTemplate("tpl-5k-prev");
    const preventive = getTemplate("tpl-100k");
    expect(preventive!.sections.length).toBeGreaterThan(base!.sections.length);
    expect(preventive!.sections.slice(0, base!.sections.length)).toEqual(base!.sections);
  });

  it("mantém a ordem de herança dos níveis", () => {
    expect(includedLevels("tpl-50k").map((template) => template.id)).toEqual([
      "tpl-5k-prev",
      "tpl-10k",
      "tpl-20k",
      "tpl-50k",
    ]);
  });

  it.each([
    [190000, "tpl-10k"],
    [200000, "tpl-100k"],
    [250000, "tpl-50k"],
    [123456, "tpl-5k-prev"],
  ])("recomenda o template correto para %i km", (km, expectedId) => {
    expect(recommendPreventivo(km).id).toBe(expectedId);
  });

  it("inclui itens complementares apenas na periodicidade da placa", () => {
    expect(getComplementarySection("BYA2H92", 10_000)?.items).toHaveLength(3);
    expect(getComplementarySection("BYA2H92", 5_000)).toBeNull();
  });
});
