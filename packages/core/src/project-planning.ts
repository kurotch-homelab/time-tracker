import type { TimeEntry } from "./index.js";

export interface ProjectTask {
  readonly id: string;
  readonly projectId: string;
  readonly name: string;
  readonly active: boolean;
}

export interface ProjectTemplate {
  readonly id: string;
  readonly name: string;
  readonly tasks: readonly Omit<ProjectTask, "id" | "projectId">[];
  readonly defaultEstimateMinutes?: number;
}

export interface FixedFeeSetting {
  readonly projectId: string;
  readonly currency: string;
  readonly fee: number;
  readonly estimateMinutes: number;
}

export interface ProjectPlanningService {
  addTask(task: ProjectTask): ProjectTask;
  saveTemplate(template: ProjectTemplate): void;
  createTasksFromTemplate(input: { readonly projectId: string; readonly templateId: string; readonly idForIndex: (index: number) => string }): readonly ProjectTask[];
  setFixedFee(setting: FixedFeeSetting): void;
  fixedFeeProgress(projectId: string, entries: readonly TimeEntry[]): { readonly projectId: string; readonly fee: number; readonly currency: string; readonly completedMinutes: number; readonly progressRatio: number };
}

export function createProjectPlanningService(): ProjectPlanningService {
  const tasks = new Map<string, ProjectTask>();
  const templates = new Map<string, ProjectTemplate>();
  const fixedFees = new Map<string, FixedFeeSetting>();
  return {
    addTask(task): ProjectTask {
      const copy = { ...task };
      tasks.set(copy.id, copy);
      return copy;
    },
    saveTemplate(template): void {
      templates.set(template.id, { ...template, tasks: template.tasks.map((task) => ({ ...task })) });
    },
    createTasksFromTemplate(input): readonly ProjectTask[] {
      const template = templates.get(input.templateId);
      if (!template) {
        throw new Error("project template was not found");
      }
      return template.tasks.map((task, index) => {
        const created = { ...task, id: input.idForIndex(index), projectId: input.projectId };
        tasks.set(created.id, created);
        return created;
      });
    },
    setFixedFee(setting): void {
      if (setting.fee < 0 || setting.estimateMinutes <= 0) {
        throw new Error("invalid fixed fee setting");
      }
      fixedFees.set(setting.projectId, { ...setting });
    },
    fixedFeeProgress(projectId, entries) {
      const setting = fixedFees.get(projectId);
      if (!setting) {
        throw new Error("fixed fee is not configured");
      }
      const completedMinutes = entries
        .filter((entry) => entry.projectId === projectId && !entry.deletedAt)
        .reduce((total, entry) => total + entry.durationMinutes, 0);
      return { projectId, fee: setting.fee, currency: setting.currency, completedMinutes, progressRatio: completedMinutes / setting.estimateMinutes };
    },
  };
}
