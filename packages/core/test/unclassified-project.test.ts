import { describe, expect, it } from "vitest";
import { createOrganization, createProjectReassignmentService } from "../src/index.js";

describe("createProjectReassignmentService", () => {
  it("initializes each organization with one non-billable unclassified project", () => {
    const organization = createOrganization({ id: "org_1", name: "Neko Room" });

    expect(organization.unclassifiedProject).toMatchObject({ id: "org_1:unclassified", billable: false });
  });

  it("moves orphaned time entries to the unclassified project and makes them non-billable", () => {
    const service = createProjectReassignmentService({
      organizationId: "org_1",
      unclassifiedProjectId: "project_unclassified",
    });

    const entry = service.reassignIfOrphaned(
      {
        id: "entry_1",
        userId: "member_1",
        projectId: "project_deleted",
        startAt: new Date("2026-07-20T09:00:00.000Z"),
        endAt: new Date("2026-07-20T10:00:00.000Z"),
        durationMinutes: 60,
        source: "manual",
        billable: true,
      },
      [],
    );

    expect(entry).toMatchObject({
      projectId: "project_unclassified",
      billable: false,
    });
  });
});
