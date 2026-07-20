import { describe, expect, it } from "vitest";
import { createOfflineSyncService } from "../src/index.js";

describe("createOfflineSyncService", () => {
  it("adopts the latest conflicting active timer and explains rejected changes", () => {
    const sync = createOfflineSyncService();
    sync.enqueue({
      id: "member_1",
      kind: "active-timer",
      updatedAt: new Date("2026-07-20T09:05:00.000Z"),
      payload: { projectId: "project_local" },
    });

    const result = sync.synchronize([
      {
        id: "member_1",
        kind: "active-timer",
        updatedAt: new Date("2026-07-20T09:10:00.000Z"),
        payload: { projectId: "project_remote" },
      },
    ]);

    expect(result.records).toEqual([
      {
        id: "member_1",
        kind: "active-timer",
        updatedAt: new Date("2026-07-20T09:10:00.000Z"),
        payload: { projectId: "project_remote" },
      },
    ]);
    expect(result.rejected).toEqual([
      expect.objectContaining({ id: "member_1", reason: "superseded by newer change" }),
    ]);
  });
});
