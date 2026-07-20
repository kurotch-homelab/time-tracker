import { describe, expect, it } from "vitest";
import { ActiveTimerStore, TimeEntryStore, createActiveTimerService, createConnectorService } from "../src/index.js";

describe("createConnectorService", () => {
  it("maps Jira context to a permitted project timer without exposing other workspace data", () => {
    const timers = createActiveTimerService(new TimeEntryStore(), new ActiveTimerStore());
    const connectors = createConnectorService(timers);
    connectors.configure({ id: "jira_1", userId: "member_1", allowedProjectIds: ["project_1"] });

    const timer = connectors.startFromContext({ connectorId: "jira_1", id: "timer_1", projectId: "project_1", title: "JIRA-123", url: "https://jira.example.test/browse/123", startAt: new Date("2026-07-20T09:00:00.000Z") });

    expect(timer).toMatchObject({ projectId: "project_1", memo: "JIRA-123" });
    expect(() => connectors.startFromContext({ connectorId: "jira_1", id: "timer_2", projectId: "project_2", title: "private", url: "https://jira.example.test/browse/456", startAt: new Date("2026-07-20T09:00:00.000Z") })).toThrow("project is outside connector scope");
  });
});
