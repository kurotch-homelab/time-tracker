import type { TimeEntry, TimeEntryRepository } from "./index.js";

export interface TimeEntryFilter {
  readonly from?: Date;
  readonly to?: Date;
  readonly userIds?: readonly string[];
  readonly projectIds?: readonly string[];
  readonly tagIds?: readonly string[];
  readonly search?: string;
}

export interface DashboardTotals {
  readonly totalMinutes: number;
  readonly billableMinutes: number;
  readonly nonBillableMinutes: number;
  readonly billableRatio: number;
  readonly entries: readonly TimeEntry[];
}

export interface GroupedMinutes {
  readonly key: string;
  readonly totalMinutes: number;
  readonly billableMinutes: number;
}

export interface ReportingService {
  select(filter?: TimeEntryFilter): readonly TimeEntry[];
  dashboard(filter?: TimeEntryFilter): DashboardTotals;
  groupBy(filter: TimeEntryFilter | undefined, dimension: "user" | "project" | "activity" | "tag"): readonly GroupedMinutes[];
}

export function createReportingService(entries: TimeEntryRepository): ReportingService {
  const select = (filter: TimeEntryFilter = {}): readonly TimeEntry[] =>
    entries.findAll().filter((entry) => matchesFilter(entry, filter));

  return {
    select,
    dashboard(filter?: TimeEntryFilter): DashboardTotals {
      const selected = select(filter);
      const totalMinutes = selected.reduce((total, entry) => total + entry.durationMinutes, 0);
      const billableMinutes = selected
        .filter((entry) => entry.billable !== false)
        .reduce((total, entry) => total + entry.durationMinutes, 0);
      return {
        totalMinutes,
        billableMinutes,
        nonBillableMinutes: totalMinutes - billableMinutes,
        billableRatio: totalMinutes === 0 ? 0 : billableMinutes / totalMinutes,
        entries: selected,
      };
    },
    groupBy(filter: TimeEntryFilter | undefined, dimension: "user" | "project" | "activity" | "tag"): readonly GroupedMinutes[] {
      const groups = new Map<string, { totalMinutes: number; billableMinutes: number }>();
      for (const entry of select(filter)) {
        const keys = groupKeys(entry, dimension);
        for (const key of keys) {
          const existing = groups.get(key) ?? { totalMinutes: 0, billableMinutes: 0 };
          existing.totalMinutes += entry.durationMinutes;
          if (entry.billable !== false) {
            existing.billableMinutes += entry.durationMinutes;
          }
          groups.set(key, existing);
        }
      }
      return [...groups.entries()]
        .map(([key, value]) => ({ key, ...value }))
        .sort((left, right) => left.key.localeCompare(right.key));
    },
  };
}

export function matchesFilter(entry: TimeEntry, filter: TimeEntryFilter): boolean {
  if (entry.deletedAt) {
    return false;
  }
  if (filter.from && entry.endAt <= filter.from) {
    return false;
  }
  if (filter.to && entry.startAt >= filter.to) {
    return false;
  }
  if (filter.userIds && !filter.userIds.includes(entry.userId)) {
    return false;
  }
  if (filter.projectIds && !filter.projectIds.includes(entry.projectId)) {
    return false;
  }
  if (filter.tagIds && !entry.tagIds?.some((tagId) => filter.tagIds?.includes(tagId))) {
    return false;
  }
  if (filter.search) {
    const haystack = [entry.memo, entry.projectId, entry.activityTypeId, ...(entry.tagIds ?? [])]
      .filter((value): value is string => value !== undefined)
      .join(" ")
      .toLocaleLowerCase();
    if (!haystack.includes(filter.search.toLocaleLowerCase())) {
      return false;
    }
  }
  return true;
}

function groupKeys(entry: TimeEntry, dimension: "user" | "project" | "activity" | "tag"): readonly string[] {
  if (dimension === "user") {
    return [entry.userId];
  }
  if (dimension === "project") {
    return [entry.projectId];
  }
  if (dimension === "activity") {
    return [entry.activityTypeId ?? "unclassified"];
  }
  return entry.tagIds?.length ? entry.tagIds : ["untagged"];
}
