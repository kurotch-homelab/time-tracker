import { resolveRate, type BillableRate, type TimeEntry } from "./index.js";

export interface RoundingRule {
  readonly incrementMinutes: number;
  readonly mode: "nearest" | "up" | "down";
}

export interface ProfitabilityReport {
  readonly rawBillableMinutes: number;
  readonly roundedBillableMinutes: number;
  readonly revenueByCurrency: Readonly<Record<string, number>>;
  readonly laborCost: number;
  readonly marginByCurrency: Readonly<Record<string, number>>;
}

export function createProfitabilityReport(input: {
  readonly entries: readonly TimeEntry[];
  readonly billingRates: readonly BillableRate[];
  readonly laborCostPerHourByUser: Readonly<Record<string, number>>;
  readonly rounding?: RoundingRule;
}): ProfitabilityReport {
  const billableEntries = input.entries.filter((entry) => !entry.deletedAt && entry.billable !== false);
  const rawBillableMinutes = billableEntries.reduce((total, entry) => total + entry.durationMinutes, 0);
  const roundedBillableMinutes = billableEntries.reduce((total, entry) => total + roundMinutes(entry.durationMinutes, input.rounding), 0);
  const revenueByCurrency: Record<string, number> = {};
  const laborCostByCurrency: Record<string, number> = {};
  for (const entry of billableEntries) {
    const rate = resolveRate(entry, input.billingRates);
    if (!rate) {
      continue;
    }
    const minutes = roundMinutes(entry.durationMinutes, input.rounding);
    revenueByCurrency[rate.currency] = (revenueByCurrency[rate.currency] ?? 0) + (minutes / 60) * rate.amountPerHour;
    laborCostByCurrency[rate.currency] = (laborCostByCurrency[rate.currency] ?? 0) + (minutes / 60) * (input.laborCostPerHourByUser[entry.userId] ?? 0);
  }
  const marginByCurrency = Object.fromEntries(Object.keys(revenueByCurrency).map((currency) => [currency, revenueByCurrency[currency]! - (laborCostByCurrency[currency] ?? 0)]));
  return { rawBillableMinutes, roundedBillableMinutes, revenueByCurrency, laborCost: Object.values(laborCostByCurrency).reduce((total, amount) => total + amount, 0), marginByCurrency };
}

export function createWorkloadReport(input: { readonly allocatedMinutesByUser: Readonly<Record<string, number>>; readonly capacityMinutesByUser: Readonly<Record<string, number>> }): readonly { readonly userId: string; readonly allocatedMinutes: number; readonly capacityMinutes: number; readonly utilization: number }[] {
  return Object.keys(input.capacityMinutesByUser).sort().map((userId) => {
    const allocatedMinutes = input.allocatedMinutesByUser[userId] ?? 0;
    const capacityMinutes = input.capacityMinutesByUser[userId] ?? 0;
    return { userId, allocatedMinutes, capacityMinutes, utilization: capacityMinutes === 0 ? 0 : allocatedMinutes / capacityMinutes };
  });
}

function roundMinutes(minutes: number, rule: RoundingRule | undefined): number {
  if (!rule) {
    return minutes;
  }
  if (!Number.isInteger(rule.incrementMinutes) || rule.incrementMinutes <= 0) {
    throw new Error("rounding increment must be a positive whole minute");
  }
  const factor = minutes / rule.incrementMinutes;
  const rounded = rule.mode === "up" ? Math.ceil(factor) : rule.mode === "down" ? Math.floor(factor) : Math.round(factor);
  return rounded * rule.incrementMinutes;
}
