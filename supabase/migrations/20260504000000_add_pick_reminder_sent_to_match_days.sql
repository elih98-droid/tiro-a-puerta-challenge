-- Migration: 20260504000000
-- Add pick_reminder_sent column to match_days.
--
-- Purpose: lets the send-pick-reminders cron mark a day as "reminders sent"
-- so it doesn't send duplicate emails on subsequent runs.
-- The cron is idempotent: it only sends once per match_day.

ALTER TABLE match_days
  ADD COLUMN IF NOT EXISTS pick_reminder_sent BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN match_days.pick_reminder_sent IS
  'TRUE after the pick-reminder cron has sent emails for this day. Prevents duplicate sends.';
