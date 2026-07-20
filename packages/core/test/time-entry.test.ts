import { describe, expect, it } from "vitest";
import {
  TimeEntryStore,
  createManualTimeEntry,
  createTimeEntryService,
} from "../src/index.js";

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

  it("creates from an explicit time band and derives duration", () => {
    const entry = createManualTimeEntry({
      id: "entry_1",
      userId: "user_1",
      projectId: "project_1",
      startAt: new Date("2026-07-20T08:45:00.000Z"),
      endAt: new Date("2026-07-20T09:30:00.000Z"),
    });

    expect(entry).toMatchObject({
      startAt: new Date("2026-07-20T08:45:00.000Z"),
      endAt: new Date("2026-07-20T09:30:00.000Z"),
      durationMinutes: 45,
    });
  });

  it("rejects an invalid explicit time band", () => {
    expect(() =>
      createManualTimeEntry({
        id: "entry_1",
        userId: "user_1",
        projectId: "project_1",
        startAt: new Date("2026-07-20T09:30:00.000Z"),
        endAt: new Date("2026-07-20T09:30:00.000Z"),
      }),
    ).toThrow("startAt must be before endAt");
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

  it("allows another user's overlapping time band", () => {
    const entry = createManualTimeEntry(
      {
        id: "entry_2",
        userId: "user_2",
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
    );

    expect(entry.userId).toBe("user_2");
  });
});

describe("createTimeEntryService", () => {
  it("manual duration input creates a retrievable time entry with a normalized time band", () => {
    const store = new TimeEntryStore();
    const service = createTimeEntryService(store);

    const created = service.createManual({
      id: "entry_1",
      userId: "user_1",
      projectId: "project_1",
      endAt: new Date("2026-07-20T09:30:00.000Z"),
      durationMinutes: 30,
    });

    expect(service.getById("entry_1")).toEqual(created);
    expect(service.getById("entry_1")?.startAt).toEqual(
      new Date("2026-07-20T09:00:00.000Z"),
    );
  });

  it("rejects a manual 稼働レコード when 記録範囲 excludes the member", () => {
    const service = createTimeEntryService(new TimeEntryStore(), {
      projects: [
        {
          id: "project_1",
          clientId: "client_1",
          name: "サイト改修",
          recordingScope: "assignment-limited",
          assignedMemberIds: ["user_2"],
          viewableMemberIds: [],
          active: true,
        },
      ],
    });

    expect(() =>
      service.createManual({
        id: "entry_1",
        userId: "user_1",
        projectId: "project_1",
        endAt: new Date("2026-07-20T09:30:00.000Z"),
        durationMinutes: 30,
      }),
    ).toThrow("member cannot record to project");
  });

  it("lists a user's 稼働レコード without exposing other users", () => {
    const service = createTimeEntryService(new TimeEntryStore());

    service.createManual({
      id: "entry_1",
      userId: "user_1",
      projectId: "project_1",
      endAt: new Date("2026-07-20T09:30:00.000Z"),
      durationMinutes: 30,
    });
    service.createManual({
      id: "entry_2",
      userId: "user_2",
      projectId: "project_1",
      endAt: new Date("2026-07-20T09:30:00.000Z"),
      durationMinutes: 30,
    });

    expect(service.listForUser("user_1").map((entry) => entry.id)).toEqual([
      "entry_1",
    ]);
  });
});
