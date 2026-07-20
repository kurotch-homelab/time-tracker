import { describe, expect, it } from "vitest";
import { createAccessService } from "../src/index.js";

describe("createAccessService", () => {
  it("rejects a member from organization settings while allowing an admin session", () => {
    const access = createAccessService();
    access.registerUser({ id: "admin", email: "admin@example.test" });
    access.registerUser({ id: "member", email: "member@example.test" });
    access.addMembership({ organizationId: "org_1", userId: "admin", role: "admin" });
    access.addMembership({ organizationId: "org_1", userId: "member", role: "member" });

    const memberSession = access.signIn({ userId: "member" });
    const adminSession = access.signIn({ userId: "admin" });

    expect(() =>
      access.authorize({
        sessionId: memberSession.id,
        organizationId: "org_1",
        permission: "organization:manage",
      }),
    ).toThrow("forbidden");
    expect(
      access.authorize({
        sessionId: adminSession.id,
        organizationId: "org_1",
        permission: "organization:manage",
      }).role,
    ).toBe("admin");
  });
});
