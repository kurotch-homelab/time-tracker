import { createHmac } from "node:crypto";
import type { ManualTimeEntryInput, TimeEntry, TimeEntryService } from "./index.js";

export type PublicApiScope = "time-entry:read" | "time-entry:write";

export interface IntegrationToken {
  readonly id: string;
  readonly organizationId: string;
  readonly scopes: readonly PublicApiScope[];
  readonly value: string;
}

export interface WebhookSubscription {
  readonly id: string;
  readonly organizationId: string;
  readonly secret: string;
}

export interface WebhookDelivery {
  readonly subscriptionId: string;
  readonly event: "time-entry.created";
  readonly payload: TimeEntry;
  readonly signature: string;
  readonly attempts: number;
  readonly status: "pending" | "delivered" | "failed";
}

export interface PublicApiService {
  createToken(input: { readonly id: string; readonly organizationId: string; readonly scopes: readonly PublicApiScope[] }): IntegrationToken;
  createTimeEntry(tokenValue: string, input: ManualTimeEntryInput): TimeEntry;
  browserSession(tokenValue: string): never;
  addWebhook(subscription: WebhookSubscription): void;
  deliverPending(deliver: (delivery: WebhookDelivery) => boolean): void;
  webhookDeliveries(): readonly WebhookDelivery[];
}

export function createPublicApiService(options: { readonly timeEntries: TimeEntryService }): PublicApiService {
  const tokens = new Map<string, IntegrationToken>();
  const webhooks: WebhookSubscription[] = [];
  const deliveries: WebhookDelivery[] = [];
  return {
    createToken(input): IntegrationToken {
      const token = { ...input, value: `integration_${input.id}` };
      tokens.set(token.value, token);
      return token;
    },
    createTimeEntry(tokenValue, input): TimeEntry {
      const token = tokens.get(tokenValue);
      if (!token) {
        throw new Error("unauthenticated");
      }
      if (!token.scopes.includes("time-entry:write")) {
        throw new Error("forbidden");
      }
      const entry = options.timeEntries.createManual(input);
      for (const webhook of webhooks.filter((candidate) => candidate.organizationId === token.organizationId)) {
        deliveries.push({
          subscriptionId: webhook.id,
          event: "time-entry.created",
          payload: entry,
          signature: sign(webhook.secret, entry),
          attempts: 0,
          status: "pending",
        });
      }
      return entry;
    },
    browserSession(tokenValue): never {
      if (tokens.has(tokenValue)) {
        throw new Error("integration token cannot access browser sessions");
      }
      throw new Error("unauthenticated");
    },
    addWebhook(subscription): void {
      webhooks.push({ ...subscription });
    },
    deliverPending(deliver): void {
      for (let index = 0; index < deliveries.length; index += 1) {
        const delivery = deliveries[index] as WebhookDelivery;
        if (delivery.status === "delivered" || delivery.attempts >= 3) {
          continue;
        }
        const attempts = delivery.attempts + 1;
        const delivered = deliver({ ...delivery, attempts });
        deliveries[index] = { ...delivery, attempts, status: delivered ? "delivered" : attempts >= 3 ? "failed" : "pending" };
      }
    },
    webhookDeliveries(): readonly WebhookDelivery[] {
      return deliveries.map((delivery) => ({ ...delivery }));
    },
  };
}

function sign(secret: string, payload: TimeEntry): string {
  return createHmac("sha256", secret).update(JSON.stringify({ ...payload, startAt: payload.startAt.toISOString(), endAt: payload.endAt.toISOString() })).digest("hex");
}
