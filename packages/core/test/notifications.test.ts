import { describe, expect, it } from "vitest";
import { createNotificationService } from "../src/index.js";

describe("createNotificationService", () => {
  it("does not send a missing-record reminder during quiet hours or a Japanese holiday", () => {
    const sent: string[] = [];
    const notifications = createNotificationService({ send: (event) => sent.push(event.type) });

    notifications.evaluateMissingRecord({ userId: "member_1", date: new Date("2026-07-20T00:00:00.000Z"), recordedMinutes: 0, localHour: 20, quietHours: { from: 19, to: 8 }, japaneseHolidays: [] });
    notifications.evaluateMissingRecord({ userId: "member_1", date: new Date("2026-07-21T00:00:00.000Z"), recordedMinutes: 0, localHour: 12, quietHours: { from: 19, to: 8 }, japaneseHolidays: [new Date("2026-07-21T00:00:00.000Z")] });

    expect(sent).toEqual([]);
  });
});
