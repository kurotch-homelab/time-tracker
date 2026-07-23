import {
  ActiveTimerStore,
  TimeEntryStore,
  createActiveTimerService,
  type ActiveTimer,
  type ActiveTimerService,
} from "@time-tracker/core";
import type { Pool } from "pg";

export interface TimeTrackingScope {
  readonly userId: string;
  readonly organizationId: string;
}

export interface StartStoredActiveTimerInput extends TimeTrackingScope {
  readonly id: string;
  readonly projectId: string;
  readonly startAt: Date;
  readonly activityTypeId?: string;
  readonly memo?: string;
  readonly referenceUrl?: string;
  readonly pageTitle?: string;
}

export interface TimeTrackingStore {
  getActiveTimer(scope: TimeTrackingScope): Promise<ActiveTimer | undefined>;
  startActiveTimer(input: StartStoredActiveTimerInput): Promise<ActiveTimer>;
}

/** Intended only for tests and local development without DATABASE_URL. */
export class InMemoryTimeTrackingStore implements TimeTrackingStore {
  readonly #services = new Map<string, ActiveTimerService>();

  async getActiveTimer(scope: TimeTrackingScope): Promise<ActiveTimer | undefined> {
    return this.#serviceFor(scope).getForUser(scope.userId);
  }

  async startActiveTimer(input: StartStoredActiveTimerInput): Promise<ActiveTimer> {
    const { organizationId: _organizationId, ...timerInput } = input;
    return this.#serviceFor(input).start(timerInput);
  }

  #serviceFor(scope: TimeTrackingScope): ActiveTimerService {
    const key = `${scope.organizationId}\u0000${scope.userId}`;
    let service = this.#services.get(key);
    if (!service) {
      service = createActiveTimerService(new TimeEntryStore(), new ActiveTimerStore());
      this.#services.set(key, service);
    }
    return service;
  }
}

interface ActiveTimerRow {
  readonly id: string;
  readonly user_id: string;
  readonly project_id: string;
  readonly start_at: Date;
  readonly activity_type_id: string | null;
  readonly memo: string | null;
  readonly reference_url: string | null;
  readonly page_title: string | null;
}

/**
 * Persists the currently active timer by organization and user. Starting a new
 * timer finalizes the previous one in the same PostgreSQL transaction.
 */
export class PostgresTimeTrackingStore implements TimeTrackingStore {
  public constructor(private readonly pool: Pool) {}

  async getActiveTimer(scope: TimeTrackingScope): Promise<ActiveTimer | undefined> {
    const result = await this.pool.query<ActiveTimerRow>(
      `SELECT id, user_id, project_id, start_at, activity_type_id, memo, reference_url, page_title
       FROM active_timers
       WHERE organization_id = $1 AND user_id = $2`,
      [scope.organizationId, scope.userId],
    );
    const row = result.rows[0];
    return row ? toActiveTimer(row) : undefined;
  }

  async startActiveTimer(input: StartStoredActiveTimerInput): Promise<ActiveTimer> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const current = await client.query<ActiveTimerRow>(
        `SELECT id, user_id, project_id, start_at, activity_type_id, memo, reference_url, page_title
         FROM active_timers
         WHERE organization_id = $1 AND user_id = $2
         FOR UPDATE`,
        [input.organizationId, input.userId],
      );
      const previous = current.rows[0];
      if (previous) {
        const previousTimer = toActiveTimer(previous);
        const durationMinutes = (input.startAt.getTime() - previousTimer.startAt.getTime()) / 60_000;
        if (durationMinutes <= 0) {
          throw new Error("active timer must run for a positive duration");
        }
        await client.query(
          `INSERT INTO time_entries (
             id, organization_id, user_id, project_id, activity_type_id, memo,
             reference_urls, start_at, end_at, duration_minutes, source
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'timer')`,
          [
            previousTimer.id,
            input.organizationId,
            previousTimer.userId,
            previousTimer.projectId,
            previousTimer.activityTypeId ?? null,
            previousTimer.memo ?? null,
            previousTimer.referenceUrl ? [previousTimer.referenceUrl] : null,
            previousTimer.startAt,
            input.startAt,
            durationMinutes,
          ],
        );
        await client.query(
          "DELETE FROM active_timers WHERE organization_id = $1 AND user_id = $2",
          [input.organizationId, input.userId],
        );
      }

      await client.query(
        `INSERT INTO active_timers (
           id, organization_id, user_id, project_id, start_at,
           activity_type_id, memo, reference_url, page_title
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          input.id,
          input.organizationId,
          input.userId,
          input.projectId,
          input.startAt,
          input.activityTypeId ?? null,
          input.memo ?? null,
          input.referenceUrl ?? null,
          input.pageTitle ?? null,
        ],
      );
      await client.query("COMMIT");
      const { organizationId: _organizationId, ...timer } = input;
      return timer;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

function toActiveTimer(row: ActiveTimerRow): ActiveTimer {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    startAt: new Date(row.start_at),
    ...(row.activity_type_id === null ? {} : { activityTypeId: row.activity_type_id }),
    ...(row.memo === null ? {} : { memo: row.memo }),
    ...(row.reference_url === null ? {} : { referenceUrl: row.reference_url }),
    ...(row.page_title === null ? {} : { pageTitle: row.page_title }),
  };
}
