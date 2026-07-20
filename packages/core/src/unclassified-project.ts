import type { TimeEntry } from "./index.js";

export interface ProjectReassignmentService {
  readonly organizationId: string;
  readonly unclassifiedProjectId: string;
  reassignIfOrphaned(entry: TimeEntry, activeProjectIds: readonly string[]): TimeEntry;
  assertCanDelete(projectId: string): void;
}

export function createProjectReassignmentService(input: {
  readonly organizationId: string;
  readonly unclassifiedProjectId: string;
}): ProjectReassignmentService {
  return {
    ...input,
    reassignIfOrphaned(entry: TimeEntry, activeProjectIds: readonly string[]): TimeEntry {
      if (entry.projectId === input.unclassifiedProjectId || activeProjectIds.includes(entry.projectId)) {
        return entry;
      }
      return { ...entry, projectId: input.unclassifiedProjectId, billable: false };
    },
    assertCanDelete(projectId: string): void {
      if (projectId === input.unclassifiedProjectId) {
        throw new Error("unclassified project cannot be deleted");
      }
    },
  };
}
