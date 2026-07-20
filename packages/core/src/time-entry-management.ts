import type { TimeEntry, TimeEntryRepository } from "./index.js";

export interface TimeEntryPatch {
  readonly projectId?: string;
  readonly activityTypeId?: string;
  readonly memo?: string;
  readonly tagIds?: readonly string[];
  readonly billable?: boolean;
  readonly referenceUrls?: readonly string[];
}

export interface TimeEntryAuditEvent {
  readonly action: "updated" | "split" | "duplicated" | "deleted" | "restored";
  readonly actorUserId: string;
  readonly timeEntryId: string;
  readonly at: Date;
}

export interface TimeEntryManagementService {
  listForUser(userId: string): readonly TimeEntry[];
  update(input: { readonly actorUserId: string; readonly timeEntryId: string; readonly changes: TimeEntryPatch; readonly at: Date }): TimeEntry;
  split(input: { readonly actorUserId: string; readonly timeEntryId: string; readonly splitAt: Date; readonly firstId: string; readonly secondId: string; readonly at?: Date }): readonly [TimeEntry, TimeEntry];
  duplicate(input: { readonly actorUserId: string; readonly timeEntryId: string; readonly id: string; readonly startAt: Date; readonly endAt: Date; readonly at?: Date }): TimeEntry;
  delete(input: { readonly actorUserId: string; readonly timeEntryId: string; readonly at: Date }): TimeEntry;
  restore(input: { readonly actorUserId: string; readonly timeEntryId: string; readonly at: Date }): TimeEntry;
  auditHistory(): readonly TimeEntryAuditEvent[];
}

export function createTimeEntryManagementService(
  entries: TimeEntryRepository,
): TimeEntryManagementService {
  const audit: TimeEntryAuditEvent[] = [];

  const getOwned = (actorUserId: string, timeEntryId: string): TimeEntry => {
    const entry = entries.findById(timeEntryId);
    if (!entry || entry.deletedAt) {
      throw new Error("time entry was not found");
    }
    if (entry.userId !== actorUserId) {
      throw new Error("forbidden");
    }
    if (entry.lockedAt) {
      throw new Error("time entry is locked");
    }
    return entry;
  };

  const writeAudit = (
    action: TimeEntryAuditEvent["action"],
    actorUserId: string,
    timeEntryId: string,
    at: Date,
  ): void => {
    audit.push({ action, actorUserId, timeEntryId, at });
  };

  return {
    listForUser(userId: string): readonly TimeEntry[] {
      return entries.findAll().filter((entry) => entry.userId === userId && !entry.deletedAt);
    },

    update(input): TimeEntry {
      const previous = getOwned(input.actorUserId, input.timeEntryId);
      const updated = entries.save({
        ...previous,
        ...input.changes,
        updatedAt: input.at,
      });
      writeAudit("updated", input.actorUserId, updated.id, input.at);
      return updated;
    },

    split(input): readonly [TimeEntry, TimeEntry] {
      const previous = getOwned(input.actorUserId, input.timeEntryId);
      if (input.splitAt <= previous.startAt || input.splitAt >= previous.endAt) {
        throw new Error("split point must be inside time entry");
      }
      const at = input.at ?? input.splitAt;
      const first = withTimeBand(previous, input.firstId, previous.startAt, input.splitAt, at);
      const second = withTimeBand(previous, input.secondId, input.splitAt, previous.endAt, at);
      entries.save({ ...previous, deletedAt: at, updatedAt: at });
      entries.save(first);
      entries.save(second);
      writeAudit("split", input.actorUserId, previous.id, at);
      return [first, second];
    },

    duplicate(input): TimeEntry {
      const previous = getOwned(input.actorUserId, input.timeEntryId);
      if (input.startAt >= input.endAt) {
        throw new Error("startAt must be before endAt");
      }
      const at = input.at ?? input.startAt;
      const duplicate = withTimeBand(previous, input.id, input.startAt, input.endAt, at);
      entries.save(duplicate);
      writeAudit("duplicated", input.actorUserId, duplicate.id, at);
      return duplicate;
    },

    delete(input): TimeEntry {
      const previous = getOwned(input.actorUserId, input.timeEntryId);
      const deleted = entries.save({ ...previous, deletedAt: input.at, updatedAt: input.at });
      writeAudit("deleted", input.actorUserId, previous.id, input.at);
      return deleted;
    },

    restore(input): TimeEntry {
      const previous = entries.findById(input.timeEntryId);
      if (!previous || previous.userId !== input.actorUserId || !previous.deletedAt) {
        throw new Error("time entry was not found");
      }
      if (previous.lockedAt) {
        throw new Error("time entry is locked");
      }
      const { deletedAt: _deletedAt, ...activeEntry } = previous;
      const restored = entries.save({ ...activeEntry, updatedAt: input.at });
      writeAudit("restored", input.actorUserId, previous.id, input.at);
      return restored;
    },

    auditHistory(): readonly TimeEntryAuditEvent[] {
      return [...audit];
    },
  };
}

function withTimeBand(
  entry: TimeEntry,
  id: string,
  startAt: Date,
  endAt: Date,
  updatedAt: Date,
): TimeEntry {
  const durationMinutes = (endAt.getTime() - startAt.getTime()) / 60_000;
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    throw new Error("time band duration must be whole positive minutes");
  }
  const { deletedAt: _deletedAt, ...activeEntry } = entry;
  return {
    ...activeEntry,
    id,
    startAt,
    endAt,
    durationMinutes,
    updatedAt,
  };
}
