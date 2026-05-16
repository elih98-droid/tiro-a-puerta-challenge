-- Add is_substitute column to player_match_stats.
-- FALSE = starter (part of Starting XI), TRUE = came on as a substitute.
-- Used by LiveMatchStats to show match_minute for starters (accurate)
-- vs minutes_played for subs (API-reported, slight delay but correct range).
ALTER TABLE player_match_stats
  ADD COLUMN is_substitute BOOLEAN NOT NULL DEFAULT FALSE;
