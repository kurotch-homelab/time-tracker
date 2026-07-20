interface ManualTimeEntryBaseInput {
  readonly id: string;
  readonly userId: string;
  readonly projectId?: string;
}

export interface ManualDurationTimeEntryInput extends ManualTimeEntryBaseInput {
  readonly endAt: Date;
  readonly durationMinutes: number;
  readonly startAt?: never;
}

export interface ManualTimeBandEntryInput extends ManualTimeEntryBaseInput {
  readonly startAt: Date;
  readonly endAt: Date;
  readonly durationMinutes?: never;
}

export type ManualTimeEntryInput =
  | ManualDurationTimeEntryInput
  | ManualTimeBandEntryInput;

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

export interface TimeEntryRepository {
  findAll(): readonly TimeEntry[];
  findById(id: string): TimeEntry | undefined;
  save(entry: TimeEntry): TimeEntry;
}

export class TimeEntryStore implements TimeEntryRepository {
  readonly #entries = new Map<string, TimeEntry>();

  findAll(): readonly TimeEntry[] {
    return [...this.#entries.values()];
  }

  findById(id: string): TimeEntry | undefined {
    return this.#entries.get(id);
  }

  save(entry: TimeEntry): TimeEntry {
    this.#entries.set(entry.id, entry);
    return entry;
  }
}

export interface TimeEntryService {
  createManual(input: ManualTimeEntryInput): TimeEntry;
  getById(id: string): TimeEntry | undefined;
  listForUser(userId: string): readonly TimeEntry[];
}

export interface TimeEntryServiceOptions {
  readonly projects?: readonly Project[];
}

export function createTimeEntryService(
  repository: TimeEntryRepository = new TimeEntryStore(),
  options: TimeEntryServiceOptions = {},
): TimeEntryService {
  return {
    createManual(input: ManualTimeEntryInput): TimeEntry {
      const project = options.projects?.find(
        (candidate) => candidate.id === input.projectId,
      );
      if (project && !canMemberRecordToProject(project, input.userId)) {
        throw new Error("member cannot record to project");
      }

      const entry = createManualTimeEntry(input, {
        existingEntries: repository.findAll(),
      });

      return repository.save(entry);
    },

    getById(id: string): TimeEntry | undefined {
      return repository.findById(id);
    },

    listForUser(userId: string): readonly TimeEntry[] {
      return repository.findAll().filter((entry) => entry.userId === userId);
    },
  };
}

export function createManualTimeEntry(
  input: ManualTimeEntryInput,
  context: CreateTimeEntryContext = {},
): TimeEntry {
  if (!input.projectId) {
    throw new Error("project is required");
  }

  const timeBand = normalizeManualTimeBand(input);
  const overlaps = context.existingEntries?.some(
    (entry) =>
      entry.userId === input.userId &&
      timeBand.startAt < entry.endAt &&
      timeBand.endAt > entry.startAt,
  );

  if (overlaps) {
    throw new Error("time entries cannot overlap");
  }

  return {
    id: input.id,
    userId: input.userId,
    projectId: input.projectId,
    startAt: timeBand.startAt,
    endAt: timeBand.endAt,
    durationMinutes: timeBand.durationMinutes,
    source: "manual",
  };
}

function normalizeManualTimeBand(input: ManualTimeEntryInput): {
  readonly startAt: Date;
  readonly endAt: Date;
  readonly durationMinutes: number;
} {
  if ("durationMinutes" in input) {
    if (!Number.isInteger(input.durationMinutes) || input.durationMinutes <= 0) {
      throw new Error("durationMinutes must be a positive integer");
    }

    return {
      startAt: new Date(input.endAt.getTime() - input.durationMinutes * 60_000),
      endAt: input.endAt,
      durationMinutes: input.durationMinutes,
    };
  }

  if (input.startAt >= input.endAt) {
    throw new Error("startAt must be before endAt");
  }

  const durationMinutes = (input.endAt.getTime() - input.startAt.getTime()) / 60_000;
  if (!Number.isInteger(durationMinutes)) {
    throw new Error("time band duration must be whole minutes");
  }

  return {
    startAt: input.startAt,
    endAt: input.endAt,
    durationMinutes,
  };
}

export type RecordingScope = "public" | "assignment-limited";

export interface ActivityType {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly icon: string;
  readonly billableDefault: boolean;
  readonly active: boolean;
}

export const DEFAULT_ACTIVITY_TYPES: readonly ActivityType[] = [
  { id: "activity_design", name: "設計", color: "#7c3aed", icon: "drafting-compass", billableDefault: true, active: true },
  { id: "activity_development", name: "開発", color: "#2563eb", icon: "code", billableDefault: true, active: true },
  { id: "activity_review", name: "レビュー", color: "#0891b2", icon: "git-pull-request", billableDefault: true, active: true },
  { id: "activity_meeting", name: "会議", color: "#16a34a", icon: "users", billableDefault: true, active: true },
  { id: "activity_research", name: "調査", color: "#ca8a04", icon: "search", billableDefault: true, active: true },
  { id: "activity_documentation", name: "ドキュメント", color: "#9333ea", icon: "file-text", billableDefault: true, active: true },
  { id: "activity_testing", name: "テスト", color: "#db2777", icon: "check-check", billableDefault: true, active: true },
  { id: "activity_maintenance", name: "保守", color: "#ea580c", icon: "wrench", billableDefault: true, active: true },
  { id: "activity_admin", name: "管理・雑務", color: "#64748b", icon: "clipboard-list", billableDefault: false, active: true },
];

export interface Organization {
  readonly id: string;
  readonly name: string;
  readonly activityTypes: readonly ActivityType[];
}

export interface CreateOrganizationInput {
  readonly id: string;
  readonly name: string;
}

export interface Client {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly active: boolean;
}

export interface CreateClientInput {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly active?: boolean;
}

export interface Project {
  readonly id: string;
  readonly clientId: string;
  readonly name: string;
  readonly recordingScope: RecordingScope;
  readonly assignedMemberIds: readonly string[];
  readonly viewableMemberIds: readonly string[];
  readonly active: boolean;
}

export interface CreateProjectInput {
  readonly id: string;
  readonly clientId: string;
  readonly name: string;
  readonly recordingScope?: RecordingScope;
  readonly assignedMemberIds?: readonly string[];
  readonly viewableMemberIds?: readonly string[];
  readonly active?: boolean;
}

export function createOrganization(input: CreateOrganizationInput): Organization {
  return {
    id: input.id,
    name: input.name,
    activityTypes: DEFAULT_ACTIVITY_TYPES.map((activityType) => ({ ...activityType })),
  };
}

export function createClient(input: CreateClientInput): Client {
  return {
    id: input.id,
    organizationId: input.organizationId,
    name: input.name,
    active: input.active ?? true,
  };
}

export function createProject(input: CreateProjectInput): Project {
  return {
    id: input.id,
    clientId: input.clientId,
    name: input.name,
    recordingScope: input.recordingScope ?? "public",
    assignedMemberIds: input.assignedMemberIds ?? [],
    viewableMemberIds: input.viewableMemberIds ?? [],
    active: input.active ?? true,
  };
}

export function canMemberRecordToProject(project: Project, memberId: string): boolean {
  if (!project.active) {
    return false;
  }

  if (project.recordingScope === "public") {
    return true;
  }

  return project.assignedMemberIds.includes(memberId);
}
