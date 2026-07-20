import type { TimeEntry, TimeEntryRepository } from "./index.js";

export interface TimelineCandidate {
  readonly id: string;
  readonly userId: string;
  readonly projectId: string;
  readonly startAt: Date;
  readonly endAt: Date;
  readonly title: string;
  readonly referenceUrl?: string;
  readonly expiresAt?: Date;
}

export interface TimelineCandidateService {
  collect(candidate: TimelineCandidate): void;
  listForUser(requesterUserId: string, ownerUserId: string): readonly TimelineCandidate[];
  accept(input: { readonly candidateId: string; readonly userId: string; readonly timeEntryId: string }): TimeEntry;
  reject(input: { readonly candidateId: string; readonly userId: string }): void;
  cleanup(now: Date): void;
}

export function createTimelineCandidateService(entries: TimeEntryRepository): TimelineCandidateService {
  const candidates = new Map<string, TimelineCandidate>();
  return {
    collect(candidate): void {
      if (candidate.startAt >= candidate.endAt) {
        throw new Error("timeline candidate must have a positive time band");
      }
      candidates.set(candidate.id, { ...candidate });
    },
    listForUser(requesterUserId, ownerUserId): readonly TimelineCandidate[] {
      if (requesterUserId !== ownerUserId) {
        return [];
      }
      return [...candidates.values()].filter((candidate) => candidate.userId === ownerUserId).map((candidate) => ({ ...candidate }));
    },
    accept(input): TimeEntry {
      const candidate = candidates.get(input.candidateId);
      if (!candidate || candidate.userId !== input.userId) {
        throw new Error("timeline candidate was not found");
      }
      const durationMinutes = (candidate.endAt.getTime() - candidate.startAt.getTime()) / 60_000;
      if (!Number.isInteger(durationMinutes)) {
        throw new Error("timeline candidate duration must be whole minutes");
      }
      const entry = {
        id: input.timeEntryId,
        userId: candidate.userId,
        projectId: candidate.projectId,
        ...(candidate.referenceUrl === undefined ? {} : { referenceUrls: [candidate.referenceUrl] }),
        memo: candidate.title,
        startAt: candidate.startAt,
        endAt: candidate.endAt,
        durationMinutes,
        source: "timeline" as const,
      };
      entries.save(entry);
      candidates.delete(candidate.id);
      return entry;
    },
    reject(input): void {
      const candidate = candidates.get(input.candidateId);
      if (!candidate || candidate.userId !== input.userId) {
        throw new Error("timeline candidate was not found");
      }
      candidates.delete(candidate.id);
    },
    cleanup(now): void {
      for (const candidate of candidates.values()) {
        if (candidate.expiresAt && candidate.expiresAt <= now) {
          candidates.delete(candidate.id);
        }
      }
    },
  };
}
