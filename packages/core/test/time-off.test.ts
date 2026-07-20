import { describe, expect, it } from "vitest";
import { calculateUtilization, createTimeOffService } from "../src/index.js";

describe("Time Off", () => {
  it("removes approved time off from utilization capacity", () => {
    const timeOff = createTimeOffService();
    timeOff.request({ id: "off_1", userId: "member_1", startDate: new Date("2026-07-20T00:00:00.000Z"), endDate: new Date("2026-07-20T00:00:00.000Z") });
    timeOff.review({ id: "off_1", reviewerId: "manager_1", decision: "approved", at: new Date("2026-07-19T00:00:00.000Z") });

    expect(calculateUtilization({ workedMinutes: 480, workdays: 2, dailyCapacityMinutes: 480, timeOff: timeOff.approvedForUser("member_1") })).toEqual({ workedMinutes: 480, capacityMinutes: 480, ratio: 1 });
  });
});
