import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toast } from "sonner";
import type {
  ChecklistAnswer,
  ChecklistExecution,
  MaintenanceIssue,
  User,
  Vehicle,
  VehicleStatus,
} from "./types";
import { mockIssues, mockUsers, mockVehicles } from "./mock-data";
import { getTemplate, getExecutionSections } from "./checklist-templates";
import {
  isDatabaseConfigured,
  loadDatabase,
  removeVehicle,
  saveExecution,
  saveIssues,
  saveVehicle,
} from "./database";

type DataMode = "demo" | "supabase";
type ConnectionStatus = "idle" | "loading" | "synced" | "syncing" | "error";

export interface Result {
  ok: boolean;
  error?: string;
}

interface AppState {
  currentUser: User | null;
  users: User[];
  vehicles: Vehicle[];
  executions: ChecklistExecution[];
  issues: MaintenanceIssue[];
  dataMode: DataMode;
  connectionStatus: ConnectionStatus;
  syncError: string | null;
  databaseInitialized: boolean;

  login: (userId: string) => void;
  logout: () => void;
  initializeDatabase: () => Promise<void>;
  syncNow: () => Promise<void>;

  addVehicle: (v: Omit<Vehicle, "id" | "status">) => Result & { vehicle?: Vehicle };
  updateVehicle: (id: string, patch: Partial<Omit<Vehicle, "id" | "status">>) => Result;
  deleteVehicle: (id: string) => Result;

  startExecution: (templateId: string, vehicleId: string, hodometro: number) => ChecklistExecution;
  updateAnswer: (execId: string, itemId: string, patch: Partial<ChecklistAnswer>) => void;
  finalizeExecution: (execId: string, assinaturaDataUrl: string) => ChecklistExecution | null;

  updateIssue: (id: string, patch: Partial<MaintenanceIssue>) => void;
  cancelIssue: (id: string) => void;
  concludeIssue: (
    id: string,
    data: {
      diagnostico: string;
      servicoExecutado: string;
      pecas: string;
      hodometroConclusao: number;
      liberadoPor: string;
      fotoDepoisDataUrl?: string;
    },
  ) => Result;
}

type PersistedState = Pick<
  AppState,
  "currentUser" | "users" | "vehicles" | "executions" | "issues"
>;

/** Pendência que ainda impacta o veículo. */
export function isOpenIssue(i: MaintenanceIssue): boolean {
  return i.status !== "concluida" && i.status !== "cancelada";
}

/** Pendência impeditiva: crítica ou não conforme / trocar. */
export function isBlockingIssue(i: MaintenanceIssue): boolean {
  return !!i.critica || i.itemStatus === "nao_conforme" || i.itemStatus === "trocar";
}

/**
 * ÚNICA fonte de verdade do status do veículo, derivada das pendências
 * não concluídas e não canceladas.
 */
export function computeVehicleStatus(issues: MaintenanceIssue[], vehicleId: string): VehicleStatus {
  const open = issues.filter((i) => i.vehicleId === vehicleId && isOpenIssue(i));
  if (open.some(isBlockingIssue)) return "nao_conforme";
  if (open.some((i) => i.itemStatus === "atencao")) return "atencao";
  return "ok";
}

function applyVehicleStatus(
  vehicles: Vehicle[],
  issues: MaintenanceIssue[],
  vehicleId: string,
  extraPatch?: Partial<Vehicle>,
): Vehicle[] {
  const status = computeVehicleStatus(issues, vehicleId);
  return vehicles.map((v) => (v.id === vehicleId ? { ...v, ...extraPatch, status } : v));
}

function computeDecision(exec: ChecklistExecution, placa?: string) {
  const template = getTemplate(exec.templateId);
  if (!template) return { decision: "ok" as const, critical: false };
  const sections = getExecutionSections(exec.templateId, placa);
  let hasWarn = false;
  let hasNC = false;
  let hasCritical = false;
  for (const section of sections) {
    for (const item of section.items) {
      const a = exec.answers[item.id];
      if (!a || !a.status || a.status === "ok") continue;
      if (a.status === "atencao") hasWarn = true;
      else hasNC = true;
      if (item.critico) hasCritical = true;
    }
  }
  if (hasNC || hasCritical) return { decision: "nao_conforme" as const, critical: hasCritical };
  if (hasWarn) return { decision: "atencao" as const, critical: false };
  return { decision: "ok" as const, critical: false };
}

/** Storage tolerante a estouro de cota — nunca falha silenciosamente. */
const safeStorage = createJSONStorage<PersistedState>(() => {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    };
  }

  return {
    getItem: (k: string) => window.localStorage.getItem(k),
    setItem: (k: string, v: string) => {
      try {
        window.localStorage.setItem(k, v);
      } catch {
        toast.error(
          "Armazenamento local cheio. Conclua ou cancele pendências antigas para liberar espaço — os dados mais recentes podem não ter sido salvos.",
        );
      }
    },
    removeItem: (k: string) => window.localStorage.removeItem(k),
  };
});

/**
 * Migra somente a estrutura necessária e preserva todos os dados operacionais.
 * A versão anterior substituía veículos, pendências e execuções pelos mocks,
 * causando perda de histórico ao abrir o app depois de uma atualização.
 */
export function migratePersistedState(persistedState: unknown): PersistedState {
  const state = (persistedState as Partial<PersistedState> | undefined) ?? {};
  const executions = Array.isArray(state.executions)
    ? state.executions.map((execution) =>
        execution.templateId === "tpl-5k" ? { ...execution, templateId: "tpl-5k-op" } : execution,
      )
    : [];

  return {
    currentUser: state.currentUser ?? null,
    users: Array.isArray(state.users) ? state.users : mockUsers,
    vehicles: Array.isArray(state.vehicles) ? state.vehicles : mockVehicles,
    issues: Array.isArray(state.issues) ? state.issues : mockIssues,
    executions,
  };
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => {
      const push = (operation: () => Promise<unknown>) => {
        if (!isDatabaseConfigured) return;
        set({ connectionStatus: "syncing", syncError: null });
        void operation()
          .then(() => set({ connectionStatus: "synced" }))
          .catch((error: unknown) =>
            set({
              connectionStatus: "error",
              syncError: error instanceof Error ? error.message : "Falha ao salvar no Supabase.",
            }),
          );
      };

      const load = async () => {
        if (!isDatabaseConfigured) {
          set({
            dataMode: "demo",
            connectionStatus: "idle",
            databaseInitialized: true,
            syncError: null,
          });
          return;
        }

        set({ dataMode: "supabase", connectionStatus: "loading", syncError: null });
        try {
          const data = await loadDatabase();
          const selectedUserId = get().currentUser?.id;
          set({
            ...data,
            currentUser: selectedUserId
              ? (data.users.find((user) => user.id === selectedUserId) ?? null)
              : null,
            connectionStatus: "synced",
            databaseInitialized: true,
          });
        } catch (error) {
          set({
            connectionStatus: "error",
            databaseInitialized: true,
            syncError:
              error instanceof Error ? error.message : "Não foi possível carregar o Supabase.",
          });
        }
      };

      return {
        currentUser: null,
        users: mockUsers,
        vehicles: mockVehicles,
        executions: [],
        issues: mockIssues,
        dataMode: isDatabaseConfigured ? "supabase" : "demo",
        connectionStatus: "idle",
        syncError: null,
        databaseInitialized: false,

        login: (userId) => {
          const user = get().users.find((u) => u.id === userId) ?? null;
          set({ currentUser: user });
        },
        logout: () => set({ currentUser: null }),
        initializeDatabase: async () => {
          if (get().databaseInitialized || get().connectionStatus === "loading") return;
          await load();
        },
        syncNow: load,

        addVehicle: (v) => {
          const placa = v.placa.trim().toUpperCase();
          if (get().vehicles.some((x) => x.placa.toUpperCase() === placa)) {
            return { ok: false, error: `Já existe um veículo com a placa ${placa}.` };
          }
          const vehicle: Vehicle = { ...v, placa, status: "ok", id: `v-${Date.now()}` };
          set((s) => ({ vehicles: [...s.vehicles, vehicle] }));
          push(() => saveVehicle(vehicle));
          return { ok: true, vehicle };
        },

        updateVehicle: (id, patch) => {
          const state = get();
          if (patch.placa !== undefined) {
            const placa = patch.placa.trim().toUpperCase();
            if (state.vehicles.some((x) => x.id !== id && x.placa.toUpperCase() === placa)) {
              return { ok: false, error: `Já existe um veículo com a placa ${placa}.` };
            }
            patch = { ...patch, placa };
          }
          // O status do veículo é sempre derivado das pendências: nunca editável.
          set((s) => ({
            vehicles: s.vehicles.map((v) =>
              v.id === id ? { ...v, ...patch, status: computeVehicleStatus(s.issues, id) } : v,
            ),
          }));
          const updated = get().vehicles.find((vehicle) => vehicle.id === id);
          if (updated) push(() => saveVehicle(updated));
          return { ok: true };
        },

        deleteVehicle: (id) => {
          const s = get();
          const hasHistory =
            s.executions.some((e) => e.vehicleId === id) ||
            s.issues.some((i) => i.vehicleId === id);
          if (hasHistory) {
            return {
              ok: false,
              error:
                "Este veículo possui checklists ou pendências registrados. O histórico impede a exclusão.",
            };
          }
          set((st) => ({ vehicles: st.vehicles.filter((v) => v.id !== id) }));
          push(() => removeVehicle(id));
          return { ok: true };
        },

        startExecution: (templateId, vehicleId, hodometro) => {
          const user = get().currentUser;
          const exec: ChecklistExecution = {
            id: `e-${Date.now()}`,
            templateId,
            vehicleId,
            userId: user?.id ?? "anon",
            userName: user?.name ?? "Anônimo",
            hodometro,
            answers: {},
            status: "em_andamento",
            createdAt: new Date().toISOString(),
          };
          set((s) => ({ executions: [exec, ...s.executions] }));
          push(() => saveExecution(exec));
          return exec;
        },

        updateAnswer: (execId, itemId, patch) => {
          set((s) => ({
            executions: s.executions.map((e) => {
              if (e.id !== execId) return e;
              // Checklist finalizado é imutável.
              if (e.status === "finalizado") return e;
              const existing = e.answers[itemId] ?? { itemId, status: null };
              return {
                ...e,
                answers: { ...e.answers, [itemId]: { ...existing, ...patch, itemId } },
              };
            }),
          }));
          const updated = get().executions.find((execution) => execution.id === execId);
          if (updated) push(() => saveExecution(updated));
        },

        finalizeExecution: (execId, assinaturaDataUrl) => {
          const state = get();
          const exec = state.executions.find((e) => e.id === execId);
          if (!exec) return null;
          if (exec.status === "finalizado") return exec;
          if (!assinaturaDataUrl) return null;
          const vehicle = state.vehicles.find((v) => v.id === exec.vehicleId);
          const placa = vehicle?.placa;
          const { decision } = computeDecision(exec, placa);
          const template = getTemplate(exec.templateId);
          const finalized: ChecklistExecution = {
            ...exec,
            status: "finalizado",
            decision,
            assinaturaDataUrl,
            finalizedAt: new Date().toISOString(),
          };

          // Gera pendências a partir das respostas não-OK (inclui itens complementares).
          const newIssues: MaintenanceIssue[] = [];
          const sections = getExecutionSections(exec.templateId, placa);
          for (const section of sections) {
            for (const item of section.items) {
              const a = exec.answers[item.id];
              if (!a?.status || a.status === "ok") continue;
              // "trocar" (preventivo) é tratado como não conforme para efeito de OS.
              const normalizedStatus = a.status === "trocar" ? "nao_conforme" : a.status;
              newIssues.push({
                id: `i-${Date.now()}-${item.id}`,
                vehicleId: exec.vehicleId,
                executionId: exec.id,
                itemLabel: item.label,
                itemStatus: normalizedStatus,
                descricao: a.observacao ?? "",
                fotoDataUrl: a.fotoDataUrl,
                createdAt: new Date().toISOString(),
                hodometro: exec.hodometro,
                abertoPor: exec.userName,
                prazo: a.prazo,
                status: "aberta",
                // Item crítico é impeditivo mesmo quando marcado como Atenção.
                critica: !!item.critico,
              });
            }
          }

          // Atualiza última/próxima revisão apenas para checklists preventivos.
          const isPreventivo = template?.tipo === "preventivo";
          const extra: Partial<Vehicle> = {
            hodometro: Math.max(vehicle?.hodometro ?? 0, exec.hodometro),
            ...(isPreventivo && template
              ? { ultimaRevisaoKm: exec.hodometro, proximaRevisaoKm: exec.hodometro + template.km }
              : {}),
          };

          set((s) => {
            const issues = [...newIssues, ...s.issues];
            return {
              executions: s.executions.map((e) => (e.id === execId ? finalized : e)),
              issues,
              vehicles: applyVehicleStatus(s.vehicles, issues, exec.vehicleId, extra),
            };
          });
          const updatedVehicle = get().vehicles.find((item) => item.id === exec.vehicleId);
          push(() =>
            Promise.all([
              saveExecution(finalized),
              saveIssues(newIssues),
              updatedVehicle ? saveVehicle(updatedVehicle) : Promise.resolve(),
            ]),
          );

          return finalized;
        },

        updateIssue: (id, patch) => {
          set((s) => {
            const issue = s.issues.find((i) => i.id === id);
            if (!issue) return s;
            const issues = s.issues.map((i) => (i.id === id ? { ...i, ...patch } : i));
            return {
              issues,
              vehicles: applyVehicleStatus(s.vehicles, issues, issue.vehicleId),
            };
          });
          const updated = get().issues.find((issue) => issue.id === id);
          const updatedVehicle = updated
            ? get().vehicles.find((vehicle) => vehicle.id === updated.vehicleId)
            : undefined;
          if (updated) {
            push(() =>
              Promise.all([
                saveIssues([updated]),
                updatedVehicle ? saveVehicle(updatedVehicle) : Promise.resolve(),
              ]),
            );
          }
        },

        cancelIssue: (id) => {
          set((s) => {
            const issue = s.issues.find((i) => i.id === id);
            if (!issue) return s;
            const issues = s.issues.map((i) =>
              i.id === id ? { ...i, status: "cancelada" as const } : i,
            );
            return {
              issues,
              vehicles: applyVehicleStatus(s.vehicles, issues, issue.vehicleId),
            };
          });
          const updated = get().issues.find((issue) => issue.id === id);
          const updatedVehicle = updated
            ? get().vehicles.find((vehicle) => vehicle.id === updated.vehicleId)
            : undefined;
          if (updated) {
            push(() =>
              Promise.all([
                saveIssues([updated]),
                updatedVehicle ? saveVehicle(updatedVehicle) : Promise.resolve(),
              ]),
            );
          }
        },

        concludeIssue: (id, data) => {
          const s = get();
          const issue = s.issues.find((i) => i.id === id);
          if (!issue) return { ok: false, error: "Pendência não encontrada." };
          if (!isOpenIssue(issue)) return { ok: false, error: "Esta pendência já foi encerrada." };
          if (!data.diagnostico.trim()) return { ok: false, error: "Informe o diagnóstico." };
          if (!data.servicoExecutado.trim())
            return { ok: false, error: "Informe o serviço executado." };
          if (!Number.isFinite(data.hodometroConclusao) || data.hodometroConclusao <= 0) {
            return { ok: false, error: "Informe um hodômetro válido." };
          }
          if (data.hodometroConclusao < issue.hodometro) {
            return {
              ok: false,
              error: `O hodômetro não pode ser menor que o da abertura (${issue.hodometro.toLocaleString("pt-BR")} km).`,
            };
          }

          const updated: MaintenanceIssue = {
            ...issue,
            ...data,
            status: "concluida",
            concluidoEm: new Date().toISOString(),
          };

          set((state) => {
            const issues = state.issues.map((i) => (i.id === id ? updated : i));
            return {
              issues,
              vehicles: applyVehicleStatus(state.vehicles, issues, issue.vehicleId, {
                hodometro: Math.max(
                  state.vehicles.find((v) => v.id === issue.vehicleId)?.hodometro ?? 0,
                  data.hodometroConclusao,
                ),
              }),
            };
          });
          const updatedVehicle = get().vehicles.find((vehicle) => vehicle.id === issue.vehicleId);
          push(() =>
            Promise.all([
              saveIssues([updated]),
              updatedVehicle ? saveVehicle(updatedVehicle) : Promise.resolve(),
            ]),
          );
          return { ok: true };
        },
      };
    },
    {
      name: "eixo-real-store",
      version: 3,
      storage: safeStorage,
      partialize: (state) => ({
        currentUser: state.currentUser,
        users: state.users,
        vehicles: state.vehicles,
        executions: state.executions,
        issues: state.issues,
      }),
      migrate: (persistedState) => migratePersistedState(persistedState),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Reconcilia o status dos veículos com as pendências persistidas.
        state.vehicles = state.vehicles.map((v) => ({
          ...v,
          status: computeVehicleStatus(state.issues, v.id),
        }));
      },
    },
  ),
);
