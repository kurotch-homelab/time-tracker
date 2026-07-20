import type { DashboardTotals, ReportingService, TimeEntryFilter } from "./index.js";

export interface Insight {
  readonly summary: string;
  readonly filter: TimeEntryFilter;
  readonly aggregates: Pick<DashboardTotals, "totalMinutes" | "billableMinutes" | "nonBillableMinutes" | "billableRatio">;
}

export interface InsightService {
  generate(input: { readonly filter: TimeEntryFilter; readonly allowedUserIds?: readonly string[] }): Insight;
}

export function createInsightService(reporting: ReportingService): InsightService {
  return {
    generate(input): Insight {
      const filter = {
        ...input.filter,
        ...(input.allowedUserIds === undefined ? {} : { userIds: restrictUsers(input.filter.userIds, input.allowedUserIds) }),
      };
      const dashboard = reporting.dashboard(filter);
      if (dashboard.totalMinutes === 0) {
        throw new Error("insufficient authorized report data");
      }
      const aggregates = {
        totalMinutes: dashboard.totalMinutes,
        billableMinutes: dashboard.billableMinutes,
        nonBillableMinutes: dashboard.nonBillableMinutes,
        billableRatio: dashboard.billableRatio,
      };
      return {
        summary: `${aggregates.totalMinutes} minutes recorded; ${Math.round(aggregates.billableRatio * 100)}% is billable.`,
        filter,
        aggregates,
      };
    },
  };
}

function restrictUsers(existing: readonly string[] | undefined, allowed: readonly string[]): readonly string[] {
  return existing === undefined ? allowed : existing.filter((userId) => allowed.includes(userId));
}
