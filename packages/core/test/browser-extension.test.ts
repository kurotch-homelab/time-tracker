import { describe, expect, it } from "vitest";
import { ActiveTimerStore, TimeEntryStore, createActiveTimerService, createBrowserExtensionService } from "../src/index.js";

describe("createBrowserExtensionService", () => {
  it("starts a timer with a reference URL without retaining private page content", () => {
    const timers = createActiveTimerService(new TimeEntryStore(), new ActiveTimerStore());
    const extension = createBrowserExtensionService(timers);

    const timer = extension.startFromPage({ id: "timer_1", userId: "member_1", projectId: "project_1", url: "https://example.test/issues/1", title: "Issue 1", startAt: new Date("2026-07-20T09:00:00.000Z"), pageContent: "must never be stored" });

    expect(timer).toMatchObject({ referenceUrl: "https://example.test/issues/1", pageTitle: "Issue 1" });
    expect(timer).not.toHaveProperty("pageContent");
  });
});
