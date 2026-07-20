export type TimeOffStatus = "requested" | "approved" | "rejected";

export interface TimeOffRequest {
  readonly id: string;
  readonly userId: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly status: TimeOffStatus;
  readonly reviewerId?: string;
  readonly reviewedAt?: Date;
}

export interface TimeOffService {
  request(input: { readonly id: string; readonly userId: string; readonly startDate: Date; readonly endDate: Date }): TimeOffRequest;
  review(input: { readonly id: string; readonly reviewerId: string; readonly decision: "approved" | "rejected"; readonly at: Date }): TimeOffRequest;
  approvedForUser(userId: string): readonly TimeOffRequest[];
}

export function createTimeOffService(): TimeOffService {
  const requests = new Map<string, TimeOffRequest>();
  return {
    request(input): TimeOffRequest {
      if (input.startDate > input.endDate) {
        throw new Error("time off start must be before end");
      }
      const request = { ...input, status: "requested" as const };
      requests.set(request.id, request);
      return request;
    },
    review(input): TimeOffRequest {
      const request = requests.get(input.id);
      if (!request || request.status !== "requested") {
        throw new Error("time off request is not awaiting review");
      }
      const reviewed = { ...request, status: input.decision, reviewerId: input.reviewerId, reviewedAt: input.at };
      requests.set(reviewed.id, reviewed);
      return reviewed;
    },
    approvedForUser(userId): readonly TimeOffRequest[] {
      return [...requests.values()].filter((request) => request.userId === userId && request.status === "approved");
    },
  };
}

export function calculateUtilization(input: { readonly workedMinutes: number; readonly workdays: number; readonly dailyCapacityMinutes: number; readonly timeOff: readonly TimeOffRequest[] }): { readonly workedMinutes: number; readonly capacityMinutes: number; readonly ratio: number } {
  const timeOffDays = new Set(input.timeOff.flatMap(daysInRequest));
  const capacityMinutes = Math.max(0, input.workdays - timeOffDays.size) * input.dailyCapacityMinutes;
  return { workedMinutes: input.workedMinutes, capacityMinutes, ratio: capacityMinutes === 0 ? 0 : input.workedMinutes / capacityMinutes };
}

function daysInRequest(request: TimeOffRequest): string[] {
  const cursor = new Date(Date.UTC(request.startDate.getUTCFullYear(), request.startDate.getUTCMonth(), request.startDate.getUTCDate()));
  const end = Date.UTC(request.endDate.getUTCFullYear(), request.endDate.getUTCMonth(), request.endDate.getUTCDate());
  const days: string[] = [];
  while (cursor.getTime() <= end) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}
