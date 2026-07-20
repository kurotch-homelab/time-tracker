import type { TimeEntry } from "./index.js";

export interface BillableRate {
  readonly id: string;
  readonly currency: string;
  readonly amountPerHour: number;
  readonly effectiveFrom: Date;
  readonly projectId?: string;
  readonly memberId?: string;
}

export interface BillableExpense {
  readonly id: string;
  readonly projectId: string;
  readonly currency: string;
  readonly amount: number;
  readonly receiptUrl?: string;
}

export interface BillingLine {
  readonly entryId: string;
  readonly projectId: string;
  readonly memberId: string;
  readonly minutes: number;
  readonly currency: string;
  readonly rateId?: string;
  readonly amount: number;
}

export interface CurrencyBillingTotal {
  readonly currency: string;
  readonly timeAmount: number;
  readonly expenseAmount: number;
  readonly totalAmount: number;
}

export interface BillingPreview {
  readonly lines: readonly BillingLine[];
  readonly expenses: readonly BillableExpense[];
  readonly currencyTotals: readonly CurrencyBillingTotal[];
}

export interface BillingPreviewInput {
  readonly entries: readonly TimeEntry[];
  readonly rates: readonly BillableRate[];
  readonly expenses?: readonly BillableExpense[];
  readonly minimumChargeByCurrency?: Readonly<Record<string, number>>;
}

export interface BillingSnapshot {
  readonly id: string;
  readonly createdAt: Date;
  readonly preview: BillingPreview;
}

export function createBillingPreview(input: BillingPreviewInput): BillingPreview {
  const lines = input.entries
    .filter((entry) => !entry.deletedAt && entry.billable !== false)
    .map((entry) => toBillingLine(entry, input.rates));
  const expenses = [...(input.expenses ?? [])];
  const currencies = new Set([...lines.map((line) => line.currency), ...expenses.map((expense) => expense.currency)]);
  const currencyTotals = [...currencies].sort().map((currency) => {
    const rawTimeAmount = sum(lines.filter((line) => line.currency === currency).map((line) => line.amount));
    const minimum = input.minimumChargeByCurrency?.[currency] ?? 0;
    const timeAmount = Math.max(rawTimeAmount, minimum);
    const expenseAmount = sum(expenses.filter((expense) => expense.currency === currency).map((expense) => expense.amount));
    return { currency, timeAmount, expenseAmount, totalAmount: timeAmount + expenseAmount };
  });
  return { lines, expenses, currencyTotals };
}

export function createBillingSnapshot(id: string, createdAt: Date, preview: BillingPreview): BillingSnapshot {
  return {
    id,
    createdAt,
    preview: {
      lines: preview.lines.map((line) => ({ ...line })),
      expenses: preview.expenses.map((expense) => ({ ...expense })),
      currencyTotals: preview.currencyTotals.map((total) => ({ ...total })),
    },
  };
}

function toBillingLine(entry: TimeEntry, rates: readonly BillableRate[]): BillingLine {
  const rate = resolveRate(entry, rates);
  const currency = rate?.currency ?? "UNRATED";
  const amount = rate ? (entry.durationMinutes / 60) * rate.amountPerHour : 0;
  return {
    entryId: entry.id,
    projectId: entry.projectId,
    memberId: entry.userId,
    minutes: entry.durationMinutes,
    currency,
    ...(rate === undefined ? {} : { rateId: rate.id }),
    amount,
  };
}

export function resolveRate(entry: TimeEntry, rates: readonly BillableRate[]): BillableRate | undefined {
  return rates
    .filter((rate) => rate.effectiveFrom <= entry.startAt)
    .filter((rate) => rate.projectId === undefined || rate.projectId === entry.projectId)
    .filter((rate) => rate.memberId === undefined || rate.memberId === entry.userId)
    .sort((left, right) => rateSpecificity(right) - rateSpecificity(left) || right.effectiveFrom.getTime() - left.effectiveFrom.getTime())[0];
}

function rateSpecificity(rate: BillableRate): number {
  return (rate.projectId === undefined ? 0 : 2) + (rate.memberId === undefined ? 0 : 1);
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
