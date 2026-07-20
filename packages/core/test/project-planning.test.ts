import { describe, expect, it } from "vitest";
import { createProjectPlanningService } from "../src/index.js";

describe("createProjectPlanningService", () => {
  it("shows fixed-fee progress without changing raw time entries", () => {
    const planning = createProjectPlanningService();
    planning.setFixedFee({ projectId: "project_1", currency: "JPY", fee: 100_000, estimateMinutes: 600 });
    const entries = [{ id: "entry_1", userId: "member_1", projectId: "project_1", startAt: new Date("2026-07-20T09:00:00.000Z"), endAt: new Date("2026-07-20T10:00:00.000Z"), durationMinutes: 300, source: "manual" as const }];

    expect(planning.fixedFeeProgress("project_1", entries)).toEqual({ projectId: "project_1", fee: 100_000, currency: "JPY", completedMinutes: 300, progressRatio: 0.5 });
    expect(entries[0]?.durationMinutes).toBe(300);
  });
});
