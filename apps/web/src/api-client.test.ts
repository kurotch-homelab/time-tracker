import { describe, expect, it, vi } from "vitest";
import { TimeTrackerApiClient } from "./api-client.js";

describe("TimeTrackerApiClient", () => {
  it("starts a timer and retrieves the current shared timer through the API", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: "timer_1",
        userId: "member_1",
        projectId: "project_1",
        startAt: "2026-07-24T09:00:00.000Z",
      }), { status: 201, headers: { "content-type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: "timer_1",
        userId: "member_1",
        projectId: "project_1",
        startAt: "2026-07-24T09:00:00.000Z",
      }), { status: 200, headers: { "content-type": "application/json" } }));
    const api = new TimeTrackerApiClient(fetchImpl);

    const started = await api.startActiveTimer({
      id: "timer_1",
      projectId: "project_1",
      startAt: new Date("2026-07-24T09:00:00.000Z"),
    });
    const current = await api.getActiveTimer();

    expect(started).toMatchObject({ id: "timer_1", projectId: "project_1" });
    expect(current).toMatchObject({ id: "timer_1", userId: "member_1" });
    expect(fetchImpl).toHaveBeenNthCalledWith(1, "/api/v1/active-timer", expect.objectContaining({ method: "POST", credentials: "same-origin" }));
  });
});
