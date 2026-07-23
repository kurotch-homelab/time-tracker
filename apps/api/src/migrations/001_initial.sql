CREATE TABLE IF NOT EXISTS active_timers (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  activity_type_id TEXT,
  memo TEXT,
  reference_url TEXT,
  page_title TEXT,
  UNIQUE (organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS time_entries (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  activity_type_id TEXT,
  memo TEXT,
  reference_urls TEXT[],
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  duration_minutes DOUBLE PRECISION NOT NULL CHECK (duration_minutes > 0),
  source TEXT NOT NULL CHECK (source IN ('manual', 'timer', 'timeline')),
  CHECK (end_at > start_at)
);

CREATE INDEX IF NOT EXISTS time_entries_organization_user_start_at_idx
  ON time_entries (organization_id, user_id, start_at DESC);

CREATE TABLE IF NOT EXISTS auth_transactions (
  transaction_hash TEXT PRIMARY KEY,
  state TEXT NOT NULL UNIQUE,
  nonce TEXT NOT NULL,
  code_verifier TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS web_sessions (
  session_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'member')),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS web_sessions_expires_at_idx ON web_sessions (expires_at);
