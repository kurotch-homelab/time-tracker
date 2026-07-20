export type OrganizationRole = "admin" | "manager" | "member";

export type Permission =
  | "organization:manage"
  | "members:manage"
  | "time-entry:read:any"
  | "time-entry:write:self";

export interface User {
  readonly id: string;
  readonly email: string;
}

export interface Membership {
  readonly organizationId: string;
  readonly userId: string;
  readonly role: OrganizationRole;
}

export interface WebSession {
  readonly id: string;
  readonly userId: string;
  readonly kind: "web";
}

export interface CreateMembershipInput extends Membership {}

export interface AuthorizeInput {
  readonly sessionId: string;
  readonly organizationId: string;
  readonly permission: Permission;
}

export interface AccessService {
  registerUser(user: User): User;
  addMembership(input: CreateMembershipInput): Membership;
  signIn(input: { readonly userId: string; readonly sessionId?: string }): WebSession;
  authorize(input: AuthorizeInput): Membership;
  getSession(sessionId: string): WebSession | undefined;
}

const permissionsByRole: Readonly<Record<OrganizationRole, readonly Permission[]>> = {
  admin: [
    "organization:manage",
    "members:manage",
    "time-entry:read:any",
    "time-entry:write:self",
  ],
  manager: ["time-entry:read:any", "time-entry:write:self"],
  member: ["time-entry:write:self"],
};

export function createAccessService(): AccessService {
  const users = new Map<string, User>();
  const memberships = new Map<string, Membership>();
  const sessions = new Map<string, WebSession>();
  let sequence = 0;

  return {
    registerUser(user: User): User {
      users.set(user.id, { ...user });
      return user;
    },

    addMembership(input: CreateMembershipInput): Membership {
      if (!users.has(input.userId)) {
        throw new Error("user was not found");
      }

      const membership = { ...input };
      memberships.set(membershipKey(input.organizationId, input.userId), membership);
      return membership;
    },

    signIn(input: { readonly userId: string; readonly sessionId?: string }): WebSession {
      if (!users.has(input.userId)) {
        throw new Error("user was not found");
      }

      const session = {
        id: input.sessionId ?? `web_session_${++sequence}`,
        userId: input.userId,
        kind: "web" as const,
      };
      sessions.set(session.id, session);
      return session;
    },

    authorize(input: AuthorizeInput): Membership {
      const session = sessions.get(input.sessionId);
      if (!session) {
        throw new Error("unauthenticated");
      }

      const membership = memberships.get(membershipKey(input.organizationId, session.userId));
      if (!membership || !permissionsByRole[membership.role].includes(input.permission)) {
        throw new Error("forbidden");
      }
      return membership;
    },

    getSession(sessionId: string): WebSession | undefined {
      return sessions.get(sessionId);
    },
  };
}

function membershipKey(organizationId: string, userId: string): string {
  return `${organizationId}:${userId}`;
}
