import { describe, expect, it } from "vitest";
import { TimeEntryStore, createCsvImportService } from "../src/index.js";

describe("createCsvImportService", () => {
  it("imports valid time entries and reports invalid rows without persisting them", () => {
    const entries = new TimeEntryStore();
    const importer = createCsvImportService(entries);

    const result = importer.import(`id,userId,projectId,startAt,endAt\nentry_1,member_1,project_1,2026-07-20T09:00:00.000Z,2026-07-20T09:30:00.000Z\nentry_2,member_1,,2026-07-20T10:00:00.000Z,2026-07-20T10:30:00.000Z`);

    expect(result.imported.map((entry) => entry.id)).toEqual(["entry_1"]);
    expect(result.invalid).toEqual([
      expect.objectContaining({ row: 3, reason: "project is required" }),
    ]);
    expect(entries.findAll().map((entry) => entry.id)).toEqual(["entry_1"]);
  });
});
