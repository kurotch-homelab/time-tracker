export interface MonthlyForecastInput {
  readonly monthStart: Date;
  readonly monthEnd: Date;
  readonly asOf: Date;
  readonly recordedMinutes: number;
  readonly recentWeekMinutes?: number;
  readonly holidays?: readonly Date[];
  readonly thresholdMinutes?: number;
}

export interface MonthlyForecast {
  readonly elapsedWorkingDays: number;
  readonly totalWorkingDays: number;
  readonly projectedMinutes: number;
  readonly minimumMinutes: number;
  readonly maximumMinutes: number;
  readonly reference: boolean;
  readonly exceedsThreshold: boolean;
}

export function calculateMonthlyForecast(input: MonthlyForecastInput): MonthlyForecast {
  if (input.monthStart > input.monthEnd || input.asOf < input.monthStart) {
    throw new Error("invalid forecast range");
  }
  const holidays = new Set((input.holidays ?? []).map(dayKey));
  const allWorkingDays = workdaysBetween(input.monthStart, input.monthEnd, holidays);
  const elapsedEnd = input.asOf > input.monthEnd ? input.monthEnd : input.asOf;
  const elapsedWorkingDays = workdaysBetween(input.monthStart, elapsedEnd, holidays);
  const pace = elapsedWorkingDays === 0 ? 0 : input.recordedMinutes / elapsedWorkingDays;
  const projectedMinutes = Math.round(pace * allWorkingDays);
  const recentWeekProjected = input.recentWeekMinutes === undefined
    ? projectedMinutes
    : Math.round((input.recentWeekMinutes / 5) * allWorkingDays);
  return {
    elapsedWorkingDays,
    totalWorkingDays: allWorkingDays,
    projectedMinutes,
    minimumMinutes: Math.min(projectedMinutes, recentWeekProjected),
    maximumMinutes: Math.max(projectedMinutes, recentWeekProjected),
    reference: elapsedWorkingDays < 5,
    exceedsThreshold: input.thresholdMinutes !== undefined && projectedMinutes > input.thresholdMinutes,
  };
}

function workdaysBetween(start: Date, end: Date, holidays: ReadonlySet<string>): number {
  const cursor = utcDay(start);
  const finalDay = utcDay(end);
  let count = 0;
  while (cursor <= finalDay) {
    const weekday = cursor.getUTCDay();
    if (weekday !== 0 && weekday !== 6 && !holidays.has(dayKey(cursor))) {
      count += 1;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
}

function utcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function dayKey(date: Date): string {
  return utcDay(date).toISOString().slice(0, 10);
}
