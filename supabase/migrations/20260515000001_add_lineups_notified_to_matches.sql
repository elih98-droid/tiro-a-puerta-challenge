-- Track whether lineups have been checked for this match.
-- Once TRUE, the check-lineups cron skips this match (idempotency).
ALTER TABLE matches
  ADD COLUMN lineups_notified BOOLEAN NOT NULL DEFAULT FALSE;
