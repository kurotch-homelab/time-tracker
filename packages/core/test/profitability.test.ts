import { describe, expect, it } from "vitest";
import { createProfitabilityReport } from "../src/index.js";

describe("createProfitabilityReport", () => {
  it("rounds displayed billable time without mutating raw records", () => {
    const entries = [{ id: "entry_1", userId: "member_1", projectId: "project_1", billable: true, startAt: new Date("2026-07-20T09:00:00.000Z"), endAt: new Date("2026-07-20T09:17:00.000Z"), durationMinutes: 17, source: "manual" as const }];

    const report = createProfitabilityReport({ entries, billingRates: [{ id: "rate_1", currency: "JPY", amountPerHour: 6000, effectiveFrom: new Date("2026-01-01T00:00:00.000Z") }], rounding: { incrementMinutes: 15, mode: "nearest" }, laborCostPerHourByUser: { member_1: 3000 } });

    expect(report.roundedBillableMinutes).toBe(15);
    expect(entries[0]?.durationMinutes).toBe(17);
  });
});
