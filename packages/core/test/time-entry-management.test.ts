import { describe, expect, it } from "vitest";
import {
  TimeEntryStore,
  createTimeEntryManagementService,
} from "../src/index.js";

describe("createTimeEntryManagementService", () => {
  it("lets a member split their own time entry into two non-overlapping bands", () => {
    const entries = new TimeEntryStore();
    entries.save({
      id: "entry_1",
      userId: "member_1",
      projectId: "project_1",
      startAt: new Date("2026-07-20T09:00:00.000Z"),
      endAt: new Date("2026-07-20T10:00:00.000Z"),
      durationMinutes: 60,
      source: "manual",
    });
    const service = createTimeEntryManagementService(entries);

    const split = service.split({
      actorUserId: "member_1",
      timeEntryId: "entry_1",
      splitAt: new Date("2026-07-20T09:30:00.000Z"),
      firstId: "entry_2",
      secondId: "entry_3",
    });

    expect(split.map((entry) => entry.durationMinutes)).toEqual([30, 30]);
    expect(service.listForUser("member_1").map((entry) => entry.id)).toEqual([
      "entry_2",
      "entry_3",
    ]);
  });
});
