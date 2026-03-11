CREATE TABLE IF NOT EXISTS email_subscribers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  normalized_email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  training_goal TEXT,
  experience_level TEXT,
  training_days TEXT,
  equipment_access_json TEXT NOT NULL DEFAULT '[]',
  biggest_challenge TEXT,
  consent_marketing INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL,
  page_path TEXT NOT NULL,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  country TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL,
  google_sheet_sync_status TEXT NOT NULL DEFAULT 'not_configured',
  google_sheet_synced_at TEXT,
  google_sheet_sync_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_email_created_at ON email_subscribers(created_at);
CREATE INDEX IF NOT EXISTS idx_email_country ON email_subscribers(country);

CREATE TABLE IF NOT EXISTS email_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_hash TEXT,
  normalized_email TEXT,
  outcome TEXT NOT NULL,
  source TEXT,
  country TEXT,
  created_at_ms INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_email_attempts_ip_time
  ON email_attempts(ip_hash, created_at_ms);
