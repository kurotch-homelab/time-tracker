import type { DashboardTotals, ReportingService, TimeEntryFilter } from "./index.js";

export interface CustomReport {
  readonly id: string;
  readonly name: string;
  readonly filter: TimeEntryFilter;
  readonly groupBy: "user" | "project" | "activity" | "tag";
  readonly columns?: readonly string[];
}

export interface SharedReportLink {
  readonly id: string;
  readonly reportId: string;
  readonly viewerUserIds: readonly string[];
}

export interface ReportSchedule {
  readonly id: string;
  readonly reportId: string;
  readonly recipient: string;
  readonly nextRunAt: Date;
}

export interface CustomReportService {
  save(report: CustomReport): CustomReport;
  share(input: { readonly reportId: string; readonly viewerUserIds: readonly string[]; readonly id?: string }): SharedReportLink;
  openShared(linkId: string, viewer: { readonly allowedUserIds: readonly string[] }): DashboardTotals;
  schedule(schedule: ReportSchedule): void;
  dueSchedules(now: Date): readonly ReportSchedule[];
}

export function createCustomReportService(reporting: ReportingService): CustomReportService {
  const reports = new Map<string, CustomReport>();
  const links = new Map<string, SharedReportLink>();
  const schedules = new Map<string, ReportSchedule>();
  let sequence = 0;
  return {
    save(report): CustomReport {
      const copy = { ...report, filter: { ...report.filter }, ...(report.columns === undefined ? {} : { columns: [...report.columns] }) };
      reports.set(copy.id, copy);
      return copy;
    },
    share(input): SharedReportLink {
      if (!reports.has(input.reportId)) {
        throw new Error("custom report was not found");
      }
      const link = { id: input.id ?? `shared_report_${++sequence}`, reportId: input.reportId, viewerUserIds: [...input.viewerUserIds] };
      links.set(link.id, link);
      return link;
    },
    openShared(linkId, viewer): DashboardTotals {
      const link = links.get(linkId);
      if (!link) {
        throw new Error("shared report was not found");
      }
      const report = reports.get(link.reportId);
      if (!report) {
        throw new Error("custom report was not found");
      }
      const permittedUsers = viewer.allowedUserIds.filter((userId) => link.viewerUserIds.includes(userId));
      return reporting.dashboard({
        ...report.filter,
        userIds: intersect(report.filter.userIds, permittedUsers),
      });
    },
    schedule(schedule): void {
      if (!reports.has(schedule.reportId)) {
        throw new Error("custom report was not found");
      }
      schedules.set(schedule.id, { ...schedule });
    },
    dueSchedules(now): readonly ReportSchedule[] {
      return [...schedules.values()].filter((schedule) => schedule.nextRunAt <= now).map((schedule) => ({ ...schedule }));
    },
  };
}

function intersect(left: readonly string[] | undefined, right: readonly string[]): readonly string[] {
  return left === undefined ? right : left.filter((value) => right.includes(value));
}
