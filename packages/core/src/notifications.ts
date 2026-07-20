export type NotificationType = "missing-record" | "forecast-overrun" | "weekly-summary" | "abandoned-timer";

export interface NotificationEvent {
  readonly id: string;
  readonly type: NotificationType;
  readonly userId: string;
  readonly payload: Readonly<Record<string, unknown>>;
}

export interface QuietHours {
  readonly from: number;
  readonly to: number;
}

export interface NotificationService {
  evaluateMissingRecord(input: { readonly userId: string; readonly date: Date; readonly recordedMinutes: number; readonly localHour: number; readonly quietHours?: QuietHours; readonly japaneseHolidays: readonly Date[]; readonly timeOffDates?: readonly Date[] }): NotificationEvent | undefined;
  notifyForecastOverrun(input: { readonly userId: string; readonly targetId: string; readonly projectedMinutes: number; readonly limitMinutes: number }): NotificationEvent | undefined;
  sendWeeklySummary(input: { readonly userId: string; readonly totalMinutes: number; readonly billableRatio: number; readonly forecastNote?: string }): NotificationEvent;
  history(): readonly NotificationEvent[];
}

export function createNotificationService(adapter: { readonly send: (event: NotificationEvent) => void }): NotificationService {
  const history: NotificationEvent[] = [];
  const sentKeys = new Set<string>();
  let sequence = 0;
  const send = (type: NotificationType, userId: string, payload: Readonly<Record<string, unknown>>, dedupeKey?: string): NotificationEvent | undefined => {
    if (dedupeKey && sentKeys.has(dedupeKey)) {
      return undefined;
    }
    const event = { id: `notification_${++sequence}`, type, userId, payload };
    if (dedupeKey) {
      sentKeys.add(dedupeKey);
    }
    history.push(event);
    adapter.send(event);
    return event;
  };

  return {
    evaluateMissingRecord(input): NotificationEvent | undefined {
      if (input.recordedMinutes > 0 || isQuiet(input.localHour, input.quietHours)) {
        return undefined;
      }
      const skipped = new Set([...input.japaneseHolidays, ...(input.timeOffDates ?? [])].map(dayKey));
      if (skipped.has(dayKey(input.date))) {
        return undefined;
      }
      const weekday = input.date.getUTCDay();
      if (weekday === 0 || weekday === 6) {
        return undefined;
      }
      return send("missing-record", input.userId, { date: dayKey(input.date) }, `missing:${input.userId}:${dayKey(input.date)}`);
    },
    notifyForecastOverrun(input): NotificationEvent | undefined {
      if (input.projectedMinutes <= input.limitMinutes) {
        return undefined;
      }
      return send("forecast-overrun", input.userId, input, `forecast:${input.userId}:${input.targetId}`);
    },
    sendWeeklySummary(input): NotificationEvent {
      return send("weekly-summary", input.userId, input) as NotificationEvent;
    },
    history(): readonly NotificationEvent[] {
      return [...history];
    },
  };
}

function isQuiet(hour: number, quietHours: QuietHours | undefined): boolean {
  if (!quietHours) {
    return false;
  }
  if (quietHours.from === quietHours.to) {
    return true;
  }
  return quietHours.from < quietHours.to
    ? hour >= quietHours.from && hour < quietHours.to
    : hour >= quietHours.from || hour < quietHours.to;
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
