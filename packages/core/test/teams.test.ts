import { describe, expect, it } from "vitest";
import { createTeamAdministrationService } from "../src/index.js";

describe("createTeamAdministrationService", () => {
  it("limits a team manager to time-entry details for assigned teams and projects", () => {
    const teams = createTeamAdministrationService();
    teams.createTeam({ id: "team_1", organizationId: "org_1", memberIds: ["member_1"], managerIds: ["manager_1"], projectIds: ["project_1"] });

    expect(teams.canManagerViewEntry({ managerId: "manager_1", userId: "member_1", projectId: "project_1" })).toBe(true);
    expect(teams.canManagerViewEntry({ managerId: "manager_1", userId: "member_2", projectId: "project_2" })).toBe(false);
  });
});
