export interface ManualTimeEntryInput {
  readonly id: string;
  readonly userId: string;
  readonly projectId?: string;
  readonly endAt: Date;
  readonly durationMinutes: number;
}

export interface CreateTimeEntryContext {
  readonly existingEntries?: readonly TimeEntry[];
}

export interface TimeEntry {
  readonly id: string;
  readonly userId: string;
  readonly projectId: string;
  readonly startAt: Date;
  readonly endAt: Date;
  readonly durationMinutes: number;
  readonly source: "manual";
}

export function createManualTimeEntry(
  input: ManualTimeEntryInput,
  context: CreateTimeEntryContext = {},
): TimeEntry {
  if (!input.projectId) {
    throw new Error("project is required");
  }

  const startAt = new Date(input.endAt.getTime() - input.durationMinutes * 60_000);
  const overlaps = context.existingEntries?.some(
    (entry) =>
      entry.userId === input.userId &&
      startAt < entry.endAt &&
      input.endAt > entry.startAt,
  );

  if (overlaps) {
    throw new Error("time entries cannot overlap");
  }

  return {
    id: input.id,
    userId: input.userId,
    projectId: input.projectId,
    startAt,
    endAt: input.endAt,
    durationMinutes: input.durationMinutes,
    source: "manual",
  };
}
