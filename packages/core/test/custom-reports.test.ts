import { describe, expect, it } from "vitest";
import { TimeEntryStore, createCustomReportService, createReportingService } from "../src/index.js";

describe("createCustomReportService", () => {
  it("recalculates a shared report using the viewer permission scope", () => {
    const entries = new TimeEntryStore();
    entries.save({ id: "entry_1", userId: "member_1", projectId: "project_1", startAt: new Date("2026-07-20T09:00:00.000Z"), endAt: new Date("2026-07-20T10:00:00.000Z"), durationMinutes: 60, source: "manual" });
    entries.save({ id: "entry_2", userId: "member_2", projectId: "project_1", startAt: new Date("2026-07-20T09:00:00.000Z"), endAt: new Date("2026-07-20T10:00:00.000Z"), durationMinutes: 60, source: "manual" });
    const reports = createCustomReportService(createReportingService(entries));
    reports.save({ id: "report_1", name: "All time", filter: {}, groupBy: "user" });
    const link = reports.share({ reportId: "report_1", viewerUserIds: ["member_1"] });

    expect(reports.openShared(link.id, { allowedUserIds: ["member_1"] }).entries.map((entry) => entry.id)).toEqual(["entry_1"]);
  });
});
