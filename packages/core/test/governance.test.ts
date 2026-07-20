import { describe, expect, it } from "vitest";
import { createTimeGovernanceService } from "../src/index.js";

describe("createTimeGovernanceService", () => {
  it("requires configured fields only when the governance rule is enabled", () => {
    const governance = createTimeGovernanceService({ requiredFields: ["memo", "tag"] });
    const entry = { id: "entry_1", userId: "member_1", projectId: "project_1", startAt: new Date("2026-07-20T09:00:00.000Z"), endAt: new Date("2026-07-20T09:30:00.000Z"), durationMinutes: 30, source: "manual" as const };

    expect(() => governance.assertCanSave(entry)).toThrow("memo is required");
    expect(createTimeGovernanceService().assertCanSave(entry)).toBeUndefined();
  });
});
