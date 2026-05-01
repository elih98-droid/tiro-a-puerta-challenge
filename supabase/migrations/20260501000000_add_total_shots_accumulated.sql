-- Migration: add total_shots_accumulated to user_status
-- Tiebreaker §5.3: shots on target accumulated across all survived picks.
-- Replaces "days_survived" as the secondary tiebreaker (days survived is equal
-- for all players in the Mundial since everyone starts on the same day).

ALTER TABLE user_status
  ADD COLUMN IF NOT EXISTS total_shots_accumulated INTEGER NOT NULL DEFAULT 0;

-- Update the leaderboard index to include the new tiebreaker column.
DROP INDEX IF EXISTS idx_user_status_alive;
CREATE INDEX idx_user_status_alive
  ON user_status(is_alive, total_goals_accumulated DESC, total_shots_accumulated DESC);
