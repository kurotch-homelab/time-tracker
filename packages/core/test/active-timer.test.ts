import { describe, expect, it } from "vitest";
import {
  ActiveTimerStore,
  TimeEntryStore,
  createActiveTimerService,
} from "../src/index.js";

describe("createActiveTimerService", () => {
  it("finalizes a user's running active timer before starting the next one", () => {
    const timeEntries = new TimeEntryStore();
    const activeTimers = new ActiveTimerStore();
    const service = createActiveTimerService(timeEntries, activeTimers);

    service.start({
      id: "timer_1",
      userId: "user_1",
      projectId: "project_1",
      startAt: new Date("2026-07-20T09:00:00.000Z"),
    });
    const currentTimer = service.start({
      id: "timer_2",
      userId: "user_1",
      projectId: "project_2",
      startAt: new Date("2026-07-20T09:30:00.000Z"),
    });

    expect(service.getForUser("user_1")).toEqual(currentTimer);
    expect(timeEntries.findAll()).toEqual([
      {
        id: "timer_1",
        userId: "user_1",
        projectId: "project_1",
        startAt: new Date("2026-07-20T09:00:00.000Z"),
        endAt: new Date("2026-07-20T09:30:00.000Z"),
        durationMinutes: 30,
        source: "timer",
      },
    ]);
  });

  it("updates the active timer's recording details without creating a completed time entry", () => {
    const timeEntries = new TimeEntryStore();
    const service = createActiveTimerService(timeEntries, new ActiveTimerStore());

    service.start({
      id: "timer_1",
      userId: "user_1",
      projectId: "project_1",
      startAt: new Date("2026-07-20T09:00:00.000Z"),
    });

    const updatedTimer = service.update({
      userId: "user_1",
      projectId: "project_2",
      activityTypeId: "activity_review",
      memo: "Review pull request",
    });

    expect(updatedTimer).toMatchObject({
      projectId: "project_2",
      activityTypeId: "activity_review",
      memo: "Review pull request",
    });
    expect(timeEntries.findAll()).toEqual([]);
  });

  it("stops an active timer as a completed time entry", () => {
    const timeEntries = new TimeEntryStore();
    const service = createActiveTimerService(timeEntries, new ActiveTimerStore());

    service.start({
      id: "timer_1",
      userId: "user_1",
      projectId: "project_1",
      activityTypeId: "activity_review",
      memo: "Review pull request",
      startAt: new Date("2026-07-20T09:00:00.000Z"),
    });

    const completedEntry = service.stop({
      userId: "user_1",
      endAt: new Date("2026-07-20T09:30:00.000Z"),
    });

    expect(completedEntry).toMatchObject({
      id: "timer_1",
      projectId: "project_1",
      activityTypeId: "activity_review",
      memo: "Review pull request",
      durationMinutes: 30,
      source: "timer",
    });
    expect(service.getForUser("user_1")).toBeUndefined();
    expect(timeEntries.findAll()).toEqual([completedEntry]);
  });

  it("quickly resumes a stopped time entry with its recording details", () => {
    const timeEntries = new TimeEntryStore();
    const service = createActiveTimerService(timeEntries, new ActiveTimerStore());

    service.start({
      id: "timer_1",
      userId: "user_1",
      projectId: "project_1",
      activityTypeId: "activity_review",
      memo: "Review pull request",
      startAt: new Date("2026-07-20T09:00:00.000Z"),
    });
    service.stop({
      userId: "user_1",
      endAt: new Date("2026-07-20T09:30:00.000Z"),
    });

    const resumedTimer = service.resume({
      id: "timer_2",
      timeEntryId: "timer_1",
      startAt: new Date("2026-07-20T10:00:00.000Z"),
    });

    expect(resumedTimer).toMatchObject({
      id: "timer_2",
      userId: "user_1",
      projectId: "project_1",
      activityTypeId: "activity_review",
      memo: "Review pull request",
    });
    expect(timeEntries.findAll()).toHaveLength(1);
  });

  it("discards detected idle time from the completed time entry", () => {
    const timeEntries = new TimeEntryStore();
    const service = createActiveTimerService(timeEntries, new ActiveTimerStore());

    service.start({
      id: "timer_1",
      userId: "user_1",
      projectId: "project_1",
      startAt: new Date("2026-07-20T09:00:00.000Z"),
    });

    const completedEntry = service.resolveIdle({
      userId: "user_1",
      idleStartedAt: new Date("2026-07-20T09:10:00.000Z"),
      resolvedAt: new Date("2026-07-20T09:30:00.000Z"),
      decision: "discard",
    });

    expect(completedEntry).toMatchObject({
      startAt: new Date("2026-07-20T09:00:00.000Z"),
      endAt: new Date("2026-07-20T09:10:00.000Z"),
      durationMinutes: 10,
    });
    expect(service.getForUser("user_1")).toBeUndefined();
  });

  it("counts detected idle time when the user chooses to count it", () => {
    const timeEntries = new TimeEntryStore();
    const service = createActiveTimerService(timeEntries, new ActiveTimerStore());

    service.start({
      id: "timer_1",
      userId: "user_1",
      projectId: "project_1",
      startAt: new Date("2026-07-20T09:00:00.000Z"),
    });

    const completedEntry = service.resolveIdle({
      userId: "user_1",
      idleStartedAt: new Date("2026-07-20T09:10:00.000Z"),
      resolvedAt: new Date("2026-07-20T09:30:00.000Z"),
      decision: "count",
    });

    expect(completedEntry).toMatchObject({
      startAt: new Date("2026-07-20T09:00:00.000Z"),
      endAt: new Date("2026-07-20T09:30:00.000Z"),
      durationMinutes: 30,
    });
    expect(service.getForUser("user_1")).toBeUndefined();
  });
});
