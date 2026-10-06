CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY,
  slug VARCHAR(120) NOT NULL UNIQUE,
  title VARCHAR(180) NOT NULL,
  tag VARCHAR(80) NOT NULL,
  excerpt VARCHAR(300) NOT NULL DEFAULT '',
  image_url TEXT NOT NULL,
  program_slug VARCHAR(120) NOT NULL DEFAULT 'education-scholarship-fund',
  body TEXT NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS blog_posts_publication_idx ON blog_posts (status, published_at DESC);

CREATE TABLE IF NOT EXISTS donations (
  id TEXT PRIMARY KEY,
  reference VARCHAR(20) NOT NULL UNIQUE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 1 AND amount <= 10000),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'declined', 'failed', 'held', 'refunded', 'voided')),
  transaction_id VARCHAR(32) UNIQUE,
  gateway_response_code VARCHAR(8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS donations_created_idx ON donations (created_at DESC);

CREATE TABLE IF NOT EXISTS authorize_net_events (
  event_id VARCHAR(120) PRIMARY KEY,
  event_type VARCHAR(120) NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_login_attempts (
  identity_hash CHAR(64) PRIMARY KEY,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
