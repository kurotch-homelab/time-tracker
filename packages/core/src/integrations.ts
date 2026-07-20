import type { ReportingService, TimeEntryFilter } from "./index.js";

export interface CalendarSuggestion {
  readonly id: string;
  readonly title: string;
  readonly startAt: Date;
  readonly endAt: Date;
  readonly referenceUrl?: string;
}

export interface IntegrationAudit {
  readonly kind: "slack" | "backup";
  readonly status: "succeeded" | "failed";
  readonly at: Date;
  readonly detail: string;
}

export interface IntegrationService {
  postWeeklySummary(input: { readonly userId: string; readonly filter?: TimeEntryFilter }): Promise<void>;
  calendarSuggestions(events: readonly CalendarSuggestion[]): readonly CalendarSuggestion[];
  backup(name: string, contents: string): Promise<void>;
  auditHistory(): readonly IntegrationAudit[];
}

export function createIntegrationService(options: {
  readonly reports: ReportingService;
  readonly slack?: { readonly post: (message: Readonly<Record<string, unknown>>) => Promise<void> };
  readonly storage?: { readonly write: (name: string, contents: string) => Promise<void> };
  readonly now?: () => Date;
}): IntegrationService {
  const audit: IntegrationAudit[] = [];
  const now = options.now ?? (() => new Date());
  return {
    async postWeeklySummary(input): Promise<void> {
      if (!options.slack) {
        throw new Error("slack is not connected");
      }
      const summary = options.reports.dashboard({ ...input.filter, userIds: [input.userId] });
      try {
        await options.slack.post({ userId: input.userId, totalMinutes: summary.totalMinutes, billableMinutes: summary.billableMinutes, billableRatio: summary.billableRatio });
        audit.push({ kind: "slack", status: "succeeded", at: now(), detail: input.userId });
      } catch (error) {
        audit.push({ kind: "slack", status: "failed", at: now(), detail: error instanceof Error ? error.message : "delivery failed" });
        throw error;
      }
    },
    calendarSuggestions(events): readonly CalendarSuggestion[] {
      return events.map((event) => ({ ...event }));
    },
    async backup(name, contents): Promise<void> {
      if (!options.storage) {
        throw new Error("external storage is not connected");
      }
      try {
        await options.storage.write(name, contents);
        audit.push({ kind: "backup", status: "succeeded", at: now(), detail: name });
      } catch (error) {
        audit.push({ kind: "backup", status: "failed", at: now(), detail: error instanceof Error ? error.message : "backup failed" });
        throw error;
      }
    },
    auditHistory(): readonly IntegrationAudit[] {
      return [...audit];
    },
  };
}
