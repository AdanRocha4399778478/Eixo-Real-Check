import { getTemplate } from "./checklist-templates";
import type {
  ChecklistDecision,
  ChecklistExecution,
  MaintenanceIssue,
  VehicleStatus,
} from "./types";

export function computeChecklistDecision(execution: ChecklistExecution): {
  decision: ChecklistDecision;
  critical: boolean;
} {
  const template = getTemplate(execution.templateId);
  if (!template) return { decision: "ok", critical: false };

  let hasWarning = false;
  let hasNonConformity = false;
  let hasCritical = false;

  for (const section of template.sections) {
    for (const item of section.items) {
      const answer = execution.answers[item.id];
      if (!answer?.status) continue;

      if (answer.status === "atencao") {
        hasWarning = true;
        if (item.critico) hasCritical = true;
      }
      if (answer.status === "nao_conforme" || answer.status === "trocar") {
        hasNonConformity = true;
        if (item.critico) hasCritical = true;
      }
    }
  }

  if (hasNonConformity) return { decision: "nao_conforme", critical: hasCritical };
  if (hasWarning) {
    return {
      decision: hasCritical ? "nao_conforme" : "atencao",
      critical: hasCritical,
    };
  }
  return { decision: "ok", critical: false };
}

export function deriveVehicleStatus(
  issues: MaintenanceIssue[],
  fallback: VehicleStatus = "ok",
): VehicleStatus {
  const openIssues = issues.filter(
    (issue) => issue.status !== "concluida" && issue.status !== "cancelada",
  );

  if (
    openIssues.some((issue) => issue.itemStatus === "nao_conforme" || issue.itemStatus === "trocar")
  ) {
    return "nao_conforme";
  }
  if (openIssues.some((issue) => issue.itemStatus === "atencao") && fallback !== "nao_conforme") {
    return "atencao";
  }
  return fallback;
}
