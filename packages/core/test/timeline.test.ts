import { describe, expect, it } from "vitest";
import { TimeEntryStore, createTimelineCandidateService } from "../src/index.js";

describe("createTimelineCandidateService", () => {
  it("creates a time entry only after the owner accepts a private timeline candidate", () => {
    const entries = new TimeEntryStore();
    const timeline = createTimelineCandidateService(entries);
    timeline.collect({ id: "candidate_1", userId: "member_1", projectId: "project_1", startAt: new Date("2026-07-20T09:00:00.000Z"), endAt: new Date("2026-07-20T09:30:00.000Z"), title: "Research" });

    expect(timeline.listForUser("admin", "member_1")).toEqual([]);
    const entry = timeline.accept({ candidateId: "candidate_1", userId: "member_1", timeEntryId: "entry_1" });

    expect(entry).toMatchObject({ id: "entry_1", source: "timeline" });
    expect(entries.findById("entry_1")).toEqual(entry);
  });
});
