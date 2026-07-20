import { describe, expect, it } from "vitest";
import { TimeEntryStore, createTimeEntryOperationsService } from "../src/index.js";

describe("createTimeEntryOperationsService", () => {
  it("uses a saved filter to select the same entries for a list, report, and CSV export", () => {
    const entries = new TimeEntryStore();
    entries.save({ id: "entry_1", userId: "member_1", projectId: "project_1", tagIds: ["tag_1"], startAt: new Date("2026-07-20T09:00:00.000Z"), endAt: new Date("2026-07-20T09:30:00.000Z"), durationMinutes: 30, source: "manual" });
    entries.save({ id: "entry_2", userId: "member_1", projectId: "project_2", tagIds: ["tag_2"], startAt: new Date("2026-07-20T09:30:00.000Z"), endAt: new Date("2026-07-20T10:00:00.000Z"), durationMinutes: 30, source: "manual" });
    const operations = createTimeEntryOperationsService(entries);
    operations.saveFilter({ id: "filter_1", name: "Project one", filter: { projectIds: ["project_1"] } });

    expect(operations.list("filter_1").map((entry) => entry.id)).toEqual(["entry_1"]);
    expect(operations.report("filter_1").entries.map((entry) => entry.id)).toEqual(["entry_1"]);
    expect(operations.exportCsv("filter_1")).toContain("entry_1");
    expect(operations.exportCsv("filter_1")).not.toContain("entry_2");
  });
});
