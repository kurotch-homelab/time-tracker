import { describe, expect, it } from "vitest";
import {
  DEFAULT_ACTIVITY_TYPES,
  canMemberRecordToProject,
  createClient,
  createOrganization,
  createProject,
} from "../src/index.js";

describe("project master data", () => {
  it("creates a クライアント and 案件 that can be selected for recording", () => {
    const client = createClient({
      id: "client_1",
      organizationId: "org_1",
      name: "A社",
    });
    const project = createProject({
      id: "project_1",
      clientId: client.id,
      name: "サイト改修",
      recordingScope: "public",
    });

    expect(project).toMatchObject({
      clientId: "client_1",
      active: true,
      recordingScope: "public",
    });
    expect(canMemberRecordToProject(project, "member_1")).toBe(true);
  });

  it("allows public 案件 recording without granting 閲覧権限", () => {
    const project = createProject({
      id: "project_1",
      clientId: "client_1",
      name: "サイト改修",
      recordingScope: "public",
    });

    expect(canMemberRecordToProject(project, "member_1")).toBe(true);
    expect(project.viewableMemberIds).toEqual([]);
  });

  it("rejects recording to an assignment-limited 案件 without assignment", () => {
    const project = createProject({
      id: "project_1",
      clientId: "client_1",
      name: "サイト改修",
      recordingScope: "assignment-limited",
      assignedMemberIds: ["member_1"],
    });

    expect(canMemberRecordToProject(project, "member_1")).toBe(true);
    expect(canMemberRecordToProject(project, "member_2")).toBe(false);
  });

  it("initializes an organization with the 9 global 作業種別 defaults", () => {
    const organization = createOrganization({
      id: "org_1",
      name: "Neko Room",
    });

    expect(organization.activityTypes.map((activityType) => activityType.name)).toEqual(
      DEFAULT_ACTIVITY_TYPES.map((activityType) => activityType.name),
    );
    expect(organization.activityTypes).toHaveLength(9);
  });
});
