import type { TimeEntryRepository } from "./index.js";

export type TimesheetStatus = "submitted" | "approved" | "rejected";

export interface Timesheet {
  readonly id: string;
  readonly userId: string;
  readonly entryIds: readonly string[];
  readonly approverIds: readonly string[];
  readonly approvedByIds: readonly string[];
  readonly status: TimesheetStatus;
  readonly submittedAt: Date;
  readonly reviewedAt?: Date;
  readonly comment?: string;
}

export interface TimesheetApprovalService {
  submit(input: { readonly id: string; readonly userId: string; readonly entryIds: readonly string[]; readonly approverIds: readonly string[]; readonly submittedAt: Date }): Timesheet;
  review(input: { readonly timesheetId: string; readonly approverId: string; readonly decision: "approved" | "rejected"; readonly at: Date; readonly comment?: string }): Timesheet;
  get(id: string): Timesheet | undefined;
}

export function createTimesheetApprovalService(entries: TimeEntryRepository): TimesheetApprovalService {
  const timesheets = new Map<string, Timesheet>();
  return {
    submit(input): Timesheet {
      if (input.approverIds.length === 0) {
        throw new Error("timesheet requires an approver");
      }
      const targetEntries = input.entryIds.map((id) => entries.findById(id));
      if (targetEntries.some((entry) => !entry || entry.userId !== input.userId)) {
        throw new Error("timesheet entries must belong to submitting member");
      }
      const sheet = { ...input, entryIds: [...input.entryIds], approverIds: [...input.approverIds], approvedByIds: [], status: "submitted" as const };
      timesheets.set(sheet.id, sheet);
      return sheet;
    },
    review(input): Timesheet {
      const previous = timesheets.get(input.timesheetId);
      if (!previous || previous.status !== "submitted") {
        throw new Error("timesheet is not awaiting review");
      }
      const expectedApprover = previous.approverIds[previous.approvedByIds.length];
      if (input.approverId !== expectedApprover) {
        throw new Error("approver is not assigned for this review layer");
      }
      const approvedByIds = input.decision === "approved" ? [...previous.approvedByIds, input.approverId] : previous.approvedByIds;
      const status = input.decision === "rejected"
        ? "rejected" as const
        : approvedByIds.length === previous.approverIds.length
          ? "approved" as const
          : "submitted" as const;
      const next = {
        ...previous,
        approvedByIds,
        status,
        reviewedAt: input.at,
        ...(input.comment === undefined ? {} : { comment: input.comment }),
      };
      if (status === "approved") {
        for (const entryId of previous.entryIds) {
          const entry = entries.findById(entryId);
          if (entry) {
            entries.save({ ...entry, lockedAt: input.at, updatedAt: input.at });
          }
        }
      }
      timesheets.set(next.id, next);
      return next;
    },
    get(id): Timesheet | undefined {
      return timesheets.get(id);
    },
  };
}
