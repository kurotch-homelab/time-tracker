import { describe, expect, it } from "vitest";
import { TimeEntryStore, createTimesheetApprovalService } from "../src/index.js";

describe("createTimesheetApprovalService", () => {
  it("locks submitted time entries after final approval", () => {
    const entries = new TimeEntryStore();
    entries.save({ id: "entry_1", userId: "member_1", projectId: "project_1", startAt: new Date("2026-07-20T09:00:00.000Z"), endAt: new Date("2026-07-20T10:00:00.000Z"), durationMinutes: 60, source: "manual" });
    const timesheets = createTimesheetApprovalService(entries);
    timesheets.submit({ id: "sheet_1", userId: "member_1", entryIds: ["entry_1"], approverIds: ["manager_1"], submittedAt: new Date("2026-07-21T00:00:00.000Z") });

    timesheets.review({ timesheetId: "sheet_1", approverId: "manager_1", decision: "approved", at: new Date("2026-07-21T01:00:00.000Z") });

    expect(entries.findById("entry_1")?.lockedAt).toEqual(new Date("2026-07-21T01:00:00.000Z"));
    expect(timesheets.get("sheet_1")?.status).toBe("approved");
  });
});
