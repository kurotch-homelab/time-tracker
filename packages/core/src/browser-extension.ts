import type { ActiveTimer, ActiveTimerService } from "./index.js";

export interface BrowserExtensionService {
  startFromPage(input: { readonly id: string; readonly userId: string; readonly projectId: string; readonly url: string; readonly title: string; readonly startAt: Date; readonly pageContent?: string }): ActiveTimer;
}

export function createBrowserExtensionService(timers: ActiveTimerService): BrowserExtensionService {
  return {
    startFromPage(input): ActiveTimer {
      return timers.start({
        id: input.id,
        userId: input.userId,
        projectId: input.projectId,
        startAt: input.startAt,
        referenceUrl: input.url,
        pageTitle: input.title,
      });
    },
  };
}
