import { describe, expect, it } from "vitest";
import { calculateMonthlyForecast } from "../src/index.js";

describe("calculateMonthlyForecast", () => {
  it("excludes holidays from pace and marks sparse early-month data as a reference", () => {
    const forecast = calculateMonthlyForecast({
      monthStart: new Date("2026-07-01T00:00:00.000Z"),
      monthEnd: new Date("2026-07-31T23:59:59.999Z"),
      asOf: new Date("2026-07-03T12:00:00.000Z"),
      recordedMinutes: 480,
      holidays: [new Date("2026-07-02T00:00:00.000Z")],
    });

    expect(forecast).toMatchObject({ elapsedWorkingDays: 2, reference: true });
    expect(forecast.projectedMinutes).toBeGreaterThan(480);
  });
});
