import { describe, expect, it } from "vitest";
import { createFreeeDraftService } from "../src/index.js";

describe("createFreeeDraftService", () => {
  it("stores the freee response and immutable billing snapshot, and blocks duplicate sends", async () => {
    const service = createFreeeDraftService({
      createDraft: async () => ({ draftId: "freee_1", responseSummary: { status: "created" } }),
    });
    service.connect({ organizationId: "org_1", refreshTokenRef: "secret_ref" });
    service.mapClient({ organizationId: "org_1", clientId: "client_1", freeePartnerId: "partner_1" });
    const preview = { lines: [{ entryId: "entry_1", projectId: "project_1", memberId: "member_1", minutes: 60, currency: "JPY", amount: 1000 }], expenses: [], currencyTotals: [{ currency: "JPY", timeAmount: 1000, expenseAmount: 0, totalAmount: 1000 }] };

    const draft = await service.createDraft({ id: "draft_1", organizationId: "org_1", clientId: "client_1", idempotencyKey: "range_july", createdAt: new Date("2026-07-20T00:00:00.000Z"), preview });

    expect(draft).toMatchObject({ freeeDraftId: "freee_1", snapshot: { preview: { lines: [expect.objectContaining({ entryId: "entry_1" })] } } });
    await expect(service.createDraft({ id: "draft_2", organizationId: "org_1", clientId: "client_1", idempotencyKey: "range_july", createdAt: new Date("2026-07-20T00:00:00.000Z"), preview })).rejects.toThrow("duplicate draft transmission");
  });
});
