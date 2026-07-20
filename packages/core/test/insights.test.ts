import { describe, expect, it } from "vitest";
import { TimeEntryStore, createInsightService, createReportingService } from "../src/index.js";

describe("createInsightService", () => {
  it("returns an insight with its supporting report filter without changing time entries", () => {
    const entries = new TimeEntryStore();
    const entry = { id: "entry_1", userId: "member_1", projectId: "project_1", billable: true, startAt: new Date("2026-07-20T09:00:00.000Z"), endAt: new Date("2026-07-20T10:00:00.000Z"), durationMinutes: 60, source: "manual" as const };
    entries.save(entry);
    const insights = createInsightService(createReportingService(entries));

    const insight = insights.generate({ filter: { projectIds: ["project_1"] } });

    expect(insight).toMatchObject({ filter: { projectIds: ["project_1"] }, aggregates: { totalMinutes: 60 } });
    expect(entries.findById("entry_1")).toEqual(entry);
  });
});
