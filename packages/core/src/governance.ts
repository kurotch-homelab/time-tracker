import type { TimeEntry } from "./index.js";

export type RequiredTimeEntryField = "project" | "activity" | "tag" | "memo";

export interface TimeAuditFlag {
  readonly timeEntryId: string;
  readonly reason: "long-duration" | "missing-required-field";
}

export interface TimeGovernanceService {
  assertCanSave(entry: TimeEntry): void;
  lock(entry: TimeEntry, at: Date): TimeEntry;
  addTimeForMember(input: { readonly actorUserId: string; readonly memberUserId: string; readonly entry: TimeEntry; readonly at: Date }): { readonly entry: TimeEntry; readonly audit: { readonly actorUserId: string; readonly memberUserId: string; readonly at: Date } };
  audit(entries: readonly TimeEntry[], longDurationMinutes?: number): readonly TimeAuditFlag[];
}

export function createTimeGovernanceService(options: { readonly requiredFields?: readonly RequiredTimeEntryField[] } = {}): TimeGovernanceService {
  const requiredFields = options.requiredFields ?? [];
  return {
    assertCanSave(entry): void {
      for (const field of requiredFields) {
        if (field === "project" && !entry.projectId) {
          throw new Error("project is required");
        }
        if (field === "activity" && !entry.activityTypeId) {
          throw new Error("activity is required");
        }
        if (field === "tag" && !entry.tagIds?.length) {
          throw new Error("tag is required");
        }
        if (field === "memo" && !entry.memo?.trim()) {
          throw new Error("memo is required");
        }
      }
    },
    lock(entry, at): TimeEntry {
      return { ...entry, lockedAt: at };
    },
    addTimeForMember(input) {
      if (input.entry.userId !== input.memberUserId) {
        throw new Error("entry owner must be target member");
      }
      this.assertCanSave(input.entry);
      return { entry: { ...input.entry, updatedAt: input.at }, audit: { actorUserId: input.actorUserId, memberUserId: input.memberUserId, at: input.at } };
    },
    audit(entries, longDurationMinutes = 16 * 60): readonly TimeAuditFlag[] {
      const flags: TimeAuditFlag[] = [];
      for (const entry of entries) {
        if (entry.durationMinutes >= longDurationMinutes) {
          flags.push({ timeEntryId: entry.id, reason: "long-duration" });
          continue;
        }
        try {
          this.assertCanSave(entry);
        } catch {
          flags.push({ timeEntryId: entry.id, reason: "missing-required-field" });
        }
      }
      return flags;
    },
  };
}
