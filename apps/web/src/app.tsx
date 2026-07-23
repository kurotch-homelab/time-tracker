import { type FormEvent, useEffect, useMemo, useState } from "react";
import { apiUrl, type ActiveTimer, TimeTrackerApiClient } from "./api-client.js";

const api = new TimeTrackerApiClient();

export function App() {
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [projectId, setProjectId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    void loadActiveTimer();
    const intervalId = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(intervalId);
  }, []);

  async function loadActiveTimer(): Promise<void> {
    setIsLoading(true);
    setError(null);
    try {
      setActiveTimer(await api.getActiveTimer());
    } catch (caught) {
      setError(toSafeMessage(caught));
    } finally {
      setIsLoading(false);
    }
  }

  async function startTimer(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const normalizedProjectId = projectId.trim();
    if (!normalizedProjectId) {
      setError("Enter a project ID before starting a timer.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const timer = await api.startActiveTimer({
        id: createTimerId(),
        projectId: normalizedProjectId,
        startAt: new Date(),
      });
      setActiveTimer(timer);
      setProjectId("");
    } catch (caught) {
      setError(toSafeMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  }

  const elapsed = useMemo(
    () => activeTimer ? formatElapsed(now - activeTimer.startAt.getTime()) : null,
    [activeTimer, now],
  );

  return (
    <main className="application-shell">
      <header className="application-header">
        <p className="eyebrow">Organization time tracking</p>
        <h1>Time Tracker</h1>
        <a className="sign-in-link" href={apiUrl("/auth/login")}>Sign in</a>
      </header>

      <section className="timer-card" aria-live="polite">
        <h2>Current timer</h2>
        {isLoading ? <p>Loading your current timer…</p> : null}
        {!isLoading && activeTimer ? (
          <>
            <p className="timer-value">{elapsed}</p>
            <p>Project: <strong>{activeTimer.projectId}</strong></p>
            <p className="muted">Started {activeTimer.startAt.toLocaleString()}</p>
          </>
        ) : null}
        {!isLoading && !activeTimer ? <p>No active timer.</p> : null}
      </section>

      <section className="timer-card">
        <h2>Start a timer</h2>
        <form onSubmit={startTimer}>
          <label htmlFor="project-id">Project ID</label>
          <input
            id="project-id"
            name="projectId"
            value={projectId}
            maxLength={200}
            autoComplete="off"
            onChange={(event) => setProjectId(event.target.value)}
          />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Starting…" : "Start timer"}
          </button>
        </form>
        {error ? <p className="error" role="alert">{error}</p> : null}
      </section>
    </main>
  );
}

function createTimerId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `timer_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function formatElapsed(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1_000));
  const hours = Math.floor(totalSeconds / 3_600).toString().padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3_600) / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function toSafeMessage(error: unknown): string {
  if (error instanceof Error && error.message === "unauthenticated") {
    return "Sign in to view or start a timer.";
  }
  return "The timer could not be updated. Please try again.";
}
