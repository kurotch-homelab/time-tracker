import type { ActiveTimer, ActiveTimerService } from "./index.js";

export interface ConnectorConfiguration {
  readonly id: string;
  readonly userId: string;
  readonly allowedProjectIds: readonly string[];
}

export interface ConnectorService {
  configure(configuration: ConnectorConfiguration): void;
  startFromContext(input: { readonly connectorId: string; readonly id: string; readonly projectId: string; readonly title: string; readonly url: string; readonly startAt: Date }): ActiveTimer;
}

export function createConnectorService(timers: ActiveTimerService): ConnectorService {
  const configurations = new Map<string, ConnectorConfiguration>();
  return {
    configure(configuration): void {
      configurations.set(configuration.id, { ...configuration, allowedProjectIds: [...configuration.allowedProjectIds] });
    },
    startFromContext(input): ActiveTimer {
      const configuration = configurations.get(input.connectorId);
      if (!configuration) {
        throw new Error("connector is not configured");
      }
      if (!configuration.allowedProjectIds.includes(input.projectId)) {
        throw new Error("project is outside connector scope");
      }
      return timers.start({
        id: input.id,
        userId: configuration.userId,
        projectId: input.projectId,
        memo: input.title,
        referenceUrl: input.url,
        startAt: input.startAt,
      });
    },
  };
}
