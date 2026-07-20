import {
  createReportingService,
  type DashboardTotals,
  type TimeEntry,
  type TimeEntryFilter,
  type TimeEntryRepository,
} from "./index.js";

export interface SavedFilter {
  readonly id: string;
  readonly name: string;
  readonly filter: TimeEntryFilter;
}

export interface BulkOperationAudit {
  readonly actorUserId: string;
  readonly entryIds: readonly string[];
  readonly operation: "delete" | "restore" | "billable" | "reassign";
  readonly at: Date;
}

export interface TimeEntryOperationsService {
  saveFilter(filter: SavedFilter): SavedFilter;
  getFilter(id: string): SavedFilter | undefined;
  list(savedFilterId: string): readonly TimeEntry[];
  report(savedFilterId: string): DashboardTotals;
  exportCsv(savedFilterId: string): string;
  bulkUpdate(input: { readonly actorUserId: string; readonly entryIds: readonly string[]; readonly changes: { readonly billable?: boolean; readonly projectId?: string; readonly deletedAt?: Date | null }; readonly at: Date; readonly allowedUserIds: readonly string[] }): readonly TimeEntry[];
  bulkAuditHistory(): readonly BulkOperationAudit[];
}

export function createTimeEntryOperationsService(entries: TimeEntryRepository): TimeEntryOperationsService {
  const filters = new Map<string, SavedFilter>();
  const audits: BulkOperationAudit[] = [];
  const reporting = createReportingService(entries);
  const requiredFilter = (id: string): SavedFilter => {
    const filter = filters.get(id);
    if (!filter) {
      throw new Error("saved filter was not found");
    }
    return filter;
  };

  return {
    saveFilter(filter: SavedFilter): SavedFilter {
      const saved = { ...filter, filter: { ...filter.filter } };
      filters.set(saved.id, saved);
      return saved;
    },
    getFilter(id: string): SavedFilter | undefined {
      return filters.get(id);
    },
    list(savedFilterId: string): readonly TimeEntry[] {
      return reporting.select(requiredFilter(savedFilterId).filter);
    },
    report(savedFilterId: string): DashboardTotals {
      return reporting.dashboard(requiredFilter(savedFilterId).filter);
    },
    exportCsv(savedFilterId: string): string {
      const selected = reporting.select(requiredFilter(savedFilterId).filter);
      const header = "id,userId,projectId,activityTypeId,memo,startAt,endAt,durationMinutes,billable,tags";
      const rows = selected.map((entry) => [
        entry.id,
        entry.userId,
        entry.projectId,
        entry.activityTypeId ?? "",
        entry.memo ?? "",
        entry.startAt.toISOString(),
        entry.endAt.toISOString(),
        String(entry.durationMinutes),
        String(entry.billable !== false),
        (entry.tagIds ?? []).join("|"),
      ].map(quoteCsv).join(","));
      return [header, ...rows].join("\n");
    },
    bulkUpdate(input): readonly TimeEntry[] {
      const targetEntries = input.entryIds.map((id) => entries.findById(id));
      if (targetEntries.some((entry) => !entry)) {
        throw new Error("time entry was not found");
      }
      const entriesToChange = targetEntries as TimeEntry[];
      if (entriesToChange.some((entry) => !input.allowedUserIds.includes(entry.userId))) {
        throw new Error("forbidden");
      }
      const changed = entriesToChange.map((entry) => {
        const base = {
          ...entry,
          ...(input.changes.billable === undefined ? {} : { billable: input.changes.billable }),
          ...(input.changes.projectId === undefined ? {} : { projectId: input.changes.projectId }),
          updatedAt: input.at,
        };
        if (input.changes.deletedAt === null) {
          const { deletedAt: _deletedAt, ...restored } = base;
          return entries.save(restored);
        }
        return entries.save({
          ...base,
          ...(input.changes.deletedAt === undefined ? {} : { deletedAt: input.changes.deletedAt }),
        });
      });
      const operation = input.changes.projectId !== undefined
        ? "reassign"
        : input.changes.billable !== undefined
          ? "billable"
          : input.changes.deletedAt === null
            ? "restore"
            : "delete";
      audits.push({ actorUserId: input.actorUserId, entryIds: [...input.entryIds], operation, at: input.at });
      return changed;
    },
    bulkAuditHistory(): readonly BulkOperationAudit[] {
      return [...audits];
    },
  };
}

function quoteCsv(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}
