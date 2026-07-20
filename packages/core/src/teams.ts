export interface Team {
  readonly id: string;
  readonly organizationId: string;
  readonly memberIds: readonly string[];
  readonly managerIds: readonly string[];
  readonly projectIds: readonly string[];
}

export interface AdminAuditRecord {
  readonly actorId: string;
  readonly targetId: string;
  readonly action: string;
  readonly at: Date;
}

export interface TeamAdministrationService {
  createTeam(team: Team): Team;
  updateTeam(input: { readonly actorId: string; readonly team: Team; readonly at: Date }): Team;
  canManagerViewEntry(input: { readonly managerId: string; readonly userId: string; readonly projectId: string }): boolean;
  auditHistory(): readonly AdminAuditRecord[];
}

export function createTeamAdministrationService(): TeamAdministrationService {
  const teams = new Map<string, Team>();
  const audit: AdminAuditRecord[] = [];
  return {
    createTeam(team): Team {
      const copy = copyTeam(team);
      teams.set(copy.id, copy);
      return copy;
    },
    updateTeam(input): Team {
      const copy = copyTeam(input.team);
      teams.set(copy.id, copy);
      audit.push({ actorId: input.actorId, targetId: copy.id, action: "team.updated", at: input.at });
      return copy;
    },
    canManagerViewEntry(input): boolean {
      return [...teams.values()].some((team) =>
        team.managerIds.includes(input.managerId) &&
        team.memberIds.includes(input.userId) &&
        team.projectIds.includes(input.projectId),
      );
    },
    auditHistory(): readonly AdminAuditRecord[] {
      return [...audit];
    },
  };
}

function copyTeam(team: Team): Team {
  return { ...team, memberIds: [...team.memberIds], managerIds: [...team.managerIds], projectIds: [...team.projectIds] };
}
