export type SyncRecordKind = "time-entry" | "active-timer";

export interface SyncRecord {
  readonly id: string;
  readonly kind: SyncRecordKind;
  readonly updatedAt: Date;
  readonly payload: unknown;
}

export interface RejectedSyncChange extends SyncRecord {
  readonly reason: string;
}

export interface SyncResult {
  readonly records: readonly SyncRecord[];
  readonly applied: readonly SyncRecord[];
  readonly rejected: readonly RejectedSyncChange[];
}

export interface OfflineSyncService {
  enqueue(record: SyncRecord): void;
  pending(): readonly SyncRecord[];
  serializePending(): string;
  restorePending(serialized: string): void;
  synchronize(remote: readonly SyncRecord[], validate?: (record: SyncRecord) => string | undefined): SyncResult;
}

export function createOfflineSyncService(): OfflineSyncService {
  let pending: SyncRecord[] = [];

  return {
    enqueue(record: SyncRecord): void {
      pending = upsertNewest(pending, record);
    },

    pending(): readonly SyncRecord[] {
      return [...pending];
    },

    serializePending(): string {
      return JSON.stringify(pending.map(serializeRecord));
    },

    restorePending(serialized: string): void {
      const parsed: unknown = JSON.parse(serialized);
      if (!Array.isArray(parsed)) {
        throw new Error("sync queue must be an array");
      }
      pending = parsed.map(parseRecord);
    },

    synchronize(remote: readonly SyncRecord[], validate = () => undefined): SyncResult {
      const result = new Map<string, SyncRecord>();
      const rejected: RejectedSyncChange[] = [];
      const apply = (record: SyncRecord, source: "local" | "remote"): void => {
        const reason = validate(record);
        if (reason) {
          if (source === "local") {
            rejected.push({ ...record, reason });
          }
          return;
        }
        const key = recordKey(record);
        const existing = result.get(key);
        if (!existing) {
          result.set(key, record);
          return;
        }
        if (record.updatedAt > existing.updatedAt) {
          if (source === "remote") {
            rejected.push({ ...existing, reason: "superseded by newer change" });
          }
          result.set(key, record);
          return;
        }
        if (source === "local") {
          rejected.push({ ...record, reason: "superseded by newer change" });
        }
      };

      for (const record of pending) {
        apply(record, "local");
      }
      for (const record of remote) {
        apply(record, "remote");
      }
      const records = [...result.values()].sort(compareRecords);
      pending = [];
      return { records, applied: records, rejected };
    },
  };
}

function recordKey(record: SyncRecord): string {
  return `${record.kind}:${record.id}`;
}

function upsertNewest(records: readonly SyncRecord[], record: SyncRecord): SyncRecord[] {
  const old = records.find((candidate) => recordKey(candidate) === recordKey(record));
  if (old && old.updatedAt > record.updatedAt) {
    return [...records];
  }
  return [...records.filter((candidate) => recordKey(candidate) !== recordKey(record)), record];
}

function compareRecords(left: SyncRecord, right: SyncRecord): number {
  return recordKey(left).localeCompare(recordKey(right));
}

function serializeRecord(record: SyncRecord): object {
  return { ...record, updatedAt: record.updatedAt.toISOString() };
}

function parseRecord(value: unknown): SyncRecord {
  if (!value || typeof value !== "object") {
    throw new Error("invalid sync record");
  }
  const record = value as { id?: unknown; kind?: unknown; updatedAt?: unknown; payload?: unknown };
  if (
    typeof record.id !== "string" ||
    (record.kind !== "time-entry" && record.kind !== "active-timer") ||
    typeof record.updatedAt !== "string"
  ) {
    throw new Error("invalid sync record");
  }
  const updatedAt = new Date(record.updatedAt);
  if (Number.isNaN(updatedAt.getTime())) {
    throw new Error("invalid sync record date");
  }
  return { id: record.id, kind: record.kind, updatedAt, payload: record.payload };
}
