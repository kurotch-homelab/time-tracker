import { describe, expect, it } from "vitest";
import { TimeEntryStore, createIntegrationService, createReportingService } from "../src/index.js";

describe("createIntegrationService", () => {
  it("posts a weekly Slack summary with the same totals as the report query", async () => {
    const entries = new TimeEntryStore();
    entries.save({ id: "entry_1", userId: "member_1", projectId: "project_1", startAt: new Date("2026-07-20T09:00:00.000Z"), endAt: new Date("2026-07-20T10:00:00.000Z"), durationMinutes: 60, source: "manual" });
    const messages: unknown[] = [];
    const service = createIntegrationService({ reports: createReportingService(entries), slack: { post: async (message) => { messages.push(message); } } });

    await service.postWeeklySummary({ userId: "member_1" });

    expect(messages).toEqual([expect.objectContaining({ totalMinutes: 60, billableMinutes: 60 })]);
  });
});
