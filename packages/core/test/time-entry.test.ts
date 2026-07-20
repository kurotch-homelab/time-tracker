import { describe, expect, it } from "vitest";
import { createManualTimeEntry } from "../src/index.js";

describe("createManualTimeEntry", () => {
  it("normalizes duration input into a time band", () => {
    const entry = createManualTimeEntry({
      id: "entry_1",
      userId: "user_1",
      projectId: "project_1",
      endAt: new Date("2026-07-20T09:30:00.000Z"),
      durationMinutes: 30,
    });

    expect(entry).toEqual({
      id: "entry_1",
      userId: "user_1",
      projectId: "project_1",
      startAt: new Date("2026-07-20T09:00:00.000Z"),
      endAt: new Date("2026-07-20T09:30:00.000Z"),
      durationMinutes: 30,
      source: "manual",
    });
  });

  it("requires a project", () => {
    expect(() =>
      createManualTimeEntry({
        id: "entry_1",
        userId: "user_1",
        endAt: new Date("2026-07-20T09:30:00.000Z"),
        durationMinutes: 30,
      }),
    ).toThrow("project is required");
  });

  it("rejects overlapping entries for the same user", () => {
    expect(() =>
      createManualTimeEntry(
        {
          id: "entry_2",
          userId: "user_1",
          projectId: "project_1",
          endAt: new Date("2026-07-20T09:45:00.000Z"),
          durationMinutes: 30,
        },
        {
          existingEntries: [
            {
              id: "entry_1",
              userId: "user_1",
              projectId: "project_1",
              startAt: new Date("2026-07-20T09:00:00.000Z"),
              endAt: new Date("2026-07-20T09:30:00.000Z"),
              durationMinutes: 30,
              source: "manual",
            },
          ],
        },
      ),
    ).toThrow("time entries cannot overlap");
  });
});
