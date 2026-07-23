export interface ActiveTimer {
  readonly id: string;
  readonly userId: string;
  readonly projectId: string;
  readonly startAt: Date;
}

export interface StartActiveTimerInput {
  readonly id: string;
  readonly projectId: string;
  readonly startAt: Date;
}

type FetchImplementation = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const configuredApiOrigin = normalizeApiOrigin(import.meta.env.VITE_API_ORIGIN);

/**
 * The web app and Tauri shell deliberately use the same same-origin API client.
 * Authentication is carried only in an HttpOnly session cookie, never in browser
 * storage or desktop configuration.
 */
export class TimeTrackerApiClient {
  public constructor(private readonly fetchImplementation: FetchImplementation = fetch) {}

  public async startActiveTimer(input: StartActiveTimerInput): Promise<ActiveTimer> {
    const response = await this.fetchImplementation(apiUrl("/api/v1/active-timer"), {
      method: "POST",
      credentials: configuredApiOrigin ? "include" : "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: input.id,
        projectId: input.projectId,
        startAt: input.startAt.toISOString(),
      }),
    });
    return parseActiveTimerResponse(response);
  }

  public async getActiveTimer(): Promise<ActiveTimer | null> {
    const response = await this.fetchImplementation(apiUrl("/api/v1/active-timer"), {
      credentials: configuredApiOrigin ? "include" : "same-origin",
    });
    if (!response.ok) {
      throw await createApiError(response);
    }
    const payload: unknown = await response.json();
    if (isNullTimerResponse(payload)) {
      return null;
    }
    return parseActiveTimerPayload(payload);
  }
}

export function apiUrl(path: `/${string}`): string {
  return `${configuredApiOrigin ?? ""}${path}`;
}

async function parseActiveTimerResponse(response: Response): Promise<ActiveTimer> {
  if (!response.ok) {
    throw await createApiError(response);
  }
  return parseActiveTimerPayload(await response.json());
}

function parseActiveTimerPayload(payload: unknown): ActiveTimer {
  if (!isActiveTimerPayload(payload)) {
    throw new Error("The server returned an invalid active timer.");
  }
  const startAt = new Date(payload.startAt);
  if (Number.isNaN(startAt.valueOf())) {
    throw new Error("The server returned an invalid active timer.");
  }
  return { ...payload, startAt };
}

function isActiveTimerPayload(payload: unknown): payload is {
  id: string;
  userId: string;
  projectId: string;
  startAt: string;
} {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return false;
  }
  const candidate = payload as Record<string, unknown>;
  return ["id", "userId", "projectId", "startAt"].every((key) => typeof candidate[key] === "string");
}

function isNullTimerResponse(payload: unknown): payload is { timer: null } {
  return Boolean(payload)
    && typeof payload === "object"
    && !Array.isArray(payload)
    && (payload as Record<string, unknown>).timer === null;
}

async function createApiError(response: Response): Promise<Error> {
  const defaultMessage = `Request failed (${response.status}).`;
  try {
    const payload: unknown = await response.json();
    if (payload && typeof payload === "object" && typeof (payload as Record<string, unknown>).error === "string") {
      return new Error((payload as Record<string, string>).error);
    }
  } catch {
    // The generic status message below intentionally avoids rendering server output.
  }
  return new Error(defaultMessage);
}

function normalizeApiOrigin(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const origin = new URL(value).origin;
  return origin === "null" ? undefined : origin;
}
