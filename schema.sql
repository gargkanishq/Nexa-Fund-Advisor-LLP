-- Cloudflare D1 Schema for Nexa Fund Advisor LLP
-- Apply locally: npx wrangler d1 execute nexa-fund-db --local --file=./schema.sql
-- Apply remotely: npx wrangler d1 execute nexa-fund-db --remote --file=./schema.sql

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  cover_image TEXT NOT NULL,
  featured INTEGER NOT NULL DEFAULT 0,
  published_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_credentials TEXT NOT NULL,
  content TEXT NOT NULL,
  reading_time_minutes INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts (slug);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts (published_at DESC);

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at ON rate_limits (reset_at);

CREATE TABLE IF NOT EXISTS enquiry_dedupe (
  key TEXT PRIMARY KEY,
  enquiry_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_enquiry_dedupe_expires_at ON enquiry_dedupe (expires_at);
