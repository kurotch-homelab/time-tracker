import { describe, expect, it } from "vitest";
import { TimeEntryStore, createReportingService } from "../src/index.js";

describe("createReportingService", () => {
  it("calculates dashboard totals from the same filtered billable and non-billable records", () => {
    const entries = new TimeEntryStore();
    entries.save({
      id: "entry_1", userId: "member_1", projectId: "project_1", billable: true,
      startAt: new Date("2026-07-20T09:00:00.000Z"), endAt: new Date("2026-07-20T10:00:00.000Z"), durationMinutes: 60, source: "manual",
    });
    entries.save({
      id: "entry_2", userId: "member_1", projectId: "project_1", billable: false,
      startAt: new Date("2026-07-20T10:00:00.000Z"), endAt: new Date("2026-07-20T10:30:00.000Z"), durationMinutes: 30, source: "manual",
    });
    entries.save({
      id: "entry_3", userId: "member_2", projectId: "project_1", billable: true,
      startAt: new Date("2026-07-20T09:00:00.000Z"), endAt: new Date("2026-07-20T10:00:00.000Z"), durationMinutes: 60, source: "manual",
    });

    const dashboard = createReportingService(entries).dashboard({ userIds: ["member_1"] });

    expect(dashboard).toMatchObject({ totalMinutes: 90, billableMinutes: 60, nonBillableMinutes: 30, billableRatio: 2 / 3 });
  });
});
