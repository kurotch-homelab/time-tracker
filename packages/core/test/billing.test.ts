import { describe, expect, it } from "vitest";
import { createBillingPreview } from "../src/index.js";

describe("createBillingPreview", () => {
  it("uses the project-member rate that was active when the time entry was recorded", () => {
    const preview = createBillingPreview({
      entries: [{ id: "entry_1", userId: "member_1", projectId: "project_1", billable: true, startAt: new Date("2026-07-20T09:00:00.000Z"), endAt: new Date("2026-07-20T10:00:00.000Z"), durationMinutes: 60, source: "manual" }],
      rates: [
        { id: "rate_old", currency: "JPY", amountPerHour: 1000, effectiveFrom: new Date("2026-07-01T00:00:00.000Z"), projectId: "project_1", memberId: "member_1" },
        { id: "rate_future", currency: "JPY", amountPerHour: 2000, effectiveFrom: new Date("2026-08-01T00:00:00.000Z"), projectId: "project_1", memberId: "member_1" },
      ],
    });

    expect(preview.currencyTotals).toEqual([{ currency: "JPY", timeAmount: 1000, expenseAmount: 0, totalAmount: 1000 }]);
    expect(preview.lines[0]).toMatchObject({ rateId: "rate_old", amount: 1000 });
  });
});
