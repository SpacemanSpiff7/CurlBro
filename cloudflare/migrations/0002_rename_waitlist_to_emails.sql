DROP INDEX IF EXISTS idx_waitlist_created_at;
DROP INDEX IF EXISTS idx_waitlist_country;
DROP INDEX IF EXISTS idx_waitlist_attempts_ip_time;

ALTER TABLE waitlist_subscribers RENAME TO email_subscribers;
ALTER TABLE waitlist_attempts RENAME TO email_attempts;

CREATE INDEX IF NOT EXISTS idx_email_created_at ON email_subscribers(created_at);
CREATE INDEX IF NOT EXISTS idx_email_country ON email_subscribers(country);
CREATE INDEX IF NOT EXISTS idx_email_attempts_ip_time
  ON email_attempts(ip_hash, created_at_ms);
