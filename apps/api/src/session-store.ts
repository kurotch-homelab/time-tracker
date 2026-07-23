import { createHash } from "node:crypto";
import type { Pool } from "pg";
import type { AuthenticatedPrincipal } from "./application.js";

export interface LoginTransaction {
  readonly state: string;
  readonly nonce: string;
  readonly codeVerifier: string;
  readonly expiresAt: Date;
}

export interface WebSession extends AuthenticatedPrincipal {
  readonly expiresAt: Date;
}

export interface SessionStore {
  createLoginTransaction(transactionId: string, transaction: LoginTransaction): Promise<void>;
  consumeLoginTransaction(transactionId: string): Promise<LoginTransaction | undefined>;
  createWebSession(sessionId: string, session: WebSession): Promise<void>;
  getWebSession(sessionId: string): Promise<WebSession | undefined>;
  deleteWebSession(sessionId: string): Promise<void>;
}

export class InMemorySessionStore implements SessionStore {
  readonly #transactions = new Map<string, LoginTransaction>();
  readonly #sessions = new Map<string, WebSession>();

  async createLoginTransaction(transactionId: string, transaction: LoginTransaction): Promise<void> {
    this.#transactions.set(hashOpaqueValue(transactionId), transaction);
  }

  async consumeLoginTransaction(transactionId: string): Promise<LoginTransaction | undefined> {
    const key = hashOpaqueValue(transactionId);
    const transaction = this.#transactions.get(key);
    this.#transactions.delete(key);
    return transaction && transaction.expiresAt > new Date() ? transaction : undefined;
  }

  async createWebSession(sessionId: string, session: WebSession): Promise<void> {
    this.#sessions.set(hashOpaqueValue(sessionId), session);
  }

  async getWebSession(sessionId: string): Promise<WebSession | undefined> {
    const session = this.#sessions.get(hashOpaqueValue(sessionId));
    return session && session.expiresAt > new Date() ? session : undefined;
  }

  async deleteWebSession(sessionId: string): Promise<void> {
    this.#sessions.delete(hashOpaqueValue(sessionId));
  }
}

export class PostgresSessionStore implements SessionStore {
  public constructor(private readonly pool: Pool) {}

  async createLoginTransaction(transactionId: string, transaction: LoginTransaction): Promise<void> {
    await this.pool.query(
      `INSERT INTO auth_transactions (transaction_hash, state, nonce, code_verifier, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [hashOpaqueValue(transactionId), transaction.state, transaction.nonce, transaction.codeVerifier, transaction.expiresAt],
    );
  }

  async consumeLoginTransaction(transactionId: string): Promise<LoginTransaction | undefined> {
    await this.pool.query("DELETE FROM auth_transactions WHERE expires_at <= NOW()");
    const result = await this.pool.query<{
      state: string;
      nonce: string;
      code_verifier: string;
      expires_at: Date;
    }>(
      `DELETE FROM auth_transactions
       WHERE transaction_hash = $1 AND expires_at > NOW()
       RETURNING state, nonce, code_verifier, expires_at`,
      [hashOpaqueValue(transactionId)],
    );
    const row = result.rows[0];
    return row ? {
      state: row.state,
      nonce: row.nonce,
      codeVerifier: row.code_verifier,
      expiresAt: new Date(row.expires_at),
    } : undefined;
  }

  async createWebSession(sessionId: string, session: WebSession): Promise<void> {
    await this.pool.query(
      `INSERT INTO web_sessions (session_hash, user_id, organization_id, role, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [hashOpaqueValue(sessionId), session.userId, session.organizationId, session.role, session.expiresAt],
    );
  }

  async getWebSession(sessionId: string): Promise<WebSession | undefined> {
    const result = await this.pool.query<{
      user_id: string;
      organization_id: string;
      role: "admin" | "manager" | "member";
      expires_at: Date;
    }>(
      `SELECT user_id, organization_id, role, expires_at
       FROM web_sessions
       WHERE session_hash = $1 AND expires_at > NOW()`,
      [hashOpaqueValue(sessionId)],
    );
    const row = result.rows[0];
    return row ? {
      userId: row.user_id,
      organizationId: row.organization_id,
      role: row.role,
      expiresAt: new Date(row.expires_at),
    } : undefined;
  }

  async deleteWebSession(sessionId: string): Promise<void> {
    await this.pool.query("DELETE FROM web_sessions WHERE session_hash = $1", [hashOpaqueValue(sessionId)]);
  }
}

function hashOpaqueValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
