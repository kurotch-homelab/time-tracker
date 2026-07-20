import { createBillingSnapshot, type BillingPreview, type BillingSnapshot } from "./index.js";

export interface FreeeConnection {
  readonly organizationId: string;
  readonly refreshTokenRef: string;
}

export interface FreeeDraft {
  readonly id: string;
  readonly organizationId: string;
  readonly clientId: string;
  readonly freeeDraftId: string;
  readonly responseSummary: Readonly<Record<string, unknown>>;
  readonly snapshot: BillingSnapshot;
}

export interface FreeeDraftService {
  connect(connection: FreeeConnection): void;
  mapClient(input: { readonly organizationId: string; readonly clientId: string; readonly freeePartnerId: string }): void;
  createDraft(input: { readonly id: string; readonly organizationId: string; readonly clientId: string; readonly idempotencyKey: string; readonly createdAt: Date; readonly preview: BillingPreview }): Promise<FreeeDraft>;
  listDrafts(): readonly FreeeDraft[];
}

export function createFreeeDraftService(adapter: {
  readonly createDraft: (input: { readonly partnerId: string; readonly preview: BillingPreview }) => Promise<{ readonly draftId: string; readonly responseSummary: Readonly<Record<string, unknown>> }>;
}): FreeeDraftService {
  const connections = new Map<string, FreeeConnection>();
  const clientMappings = new Map<string, string>();
  const sentKeys = new Set<string>();
  const drafts: FreeeDraft[] = [];
  return {
    connect(connection: FreeeConnection): void {
      connections.set(connection.organizationId, { ...connection });
    },
    mapClient(input): void {
      clientMappings.set(clientKey(input.organizationId, input.clientId), input.freeePartnerId);
    },
    async createDraft(input): Promise<FreeeDraft> {
      if (!connections.has(input.organizationId)) {
        throw new Error("freee is not connected");
      }
      const partnerId = clientMappings.get(clientKey(input.organizationId, input.clientId));
      if (!partnerId) {
        throw new Error("freee partner mapping is required");
      }
      const transmissionKey = `${input.organizationId}:${input.idempotencyKey}`;
      if (sentKeys.has(transmissionKey)) {
        throw new Error("duplicate draft transmission");
      }
      const response = await adapter.createDraft({ partnerId, preview: input.preview });
      const draft = {
        id: input.id,
        organizationId: input.organizationId,
        clientId: input.clientId,
        freeeDraftId: response.draftId,
        responseSummary: response.responseSummary,
        snapshot: createBillingSnapshot(`${input.id}:snapshot`, input.createdAt, input.preview),
      };
      sentKeys.add(transmissionKey);
      drafts.push(draft);
      return draft;
    },
    listDrafts(): readonly FreeeDraft[] {
      return [...drafts];
    },
  };
}

function clientKey(organizationId: string, clientId: string): string {
  return `${organizationId}:${clientId}`;
}
