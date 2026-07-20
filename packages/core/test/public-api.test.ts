import { describe, expect, it } from "vitest";
import { TimeEntryStore, createPublicApiService, createTimeEntryService } from "../src/index.js";

describe("createPublicApiService", () => {
  it("allows an integration token to create a time entry but not access browser sessions", () => {
    const api = createPublicApiService({ timeEntries: createTimeEntryService(new TimeEntryStore()) });
    const token = api.createToken({ id: "token_1", organizationId: "org_1", scopes: ["time-entry:write"] });

    const entry = api.createTimeEntry(token.value, {
      id: "entry_1", userId: "member_1", projectId: "project_1", endAt: new Date("2026-07-20T09:30:00.000Z"), durationMinutes: 30,
    });

    expect(entry.id).toBe("entry_1");
    expect(() => api.browserSession(token.value)).toThrow("integration token cannot access browser sessions");
  });
});
