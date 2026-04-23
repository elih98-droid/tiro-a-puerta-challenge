-- ============================================================
-- Migration: 20260422000000_fix_validate_pick_timing_trigger.sql
-- Description: Fixes validate_pick_timing() so that server-side
--   system updates (locking picks, writing results) are allowed
--   even after the deadline has passed.
--
-- Problem with original trigger (20260415000002):
--   It blocked ANY update to user_picks when effective_deadline <= NOW(),
--   including legitimate system updates like setting is_locked = TRUE
--   or writing result / shots_on_target_count / goals_scored.
--
-- Fix: Only block changes to player_id or match_id (the actual pick
--   selection) after the deadline or once locked. All other columns
--   (system columns) can be updated freely by server-side crons.
--
-- Apply manually in Supabase SQL Editor.
-- Reference: game-rules.md §3.2, §3.3; database-schema.md §7.1
-- ============================================================

CREATE OR REPLACE FUNCTION validate_pick_timing()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Block new picks if the deadline has already passed.
  IF TG_OP = 'INSERT' AND NEW.effective_deadline <= NOW() THEN
    RAISE EXCEPTION 'Pick deadline has passed for this match.';
  END IF;

  -- On updates: only guard against changing the player or match selection.
  -- System columns (is_locked, result, shots_on_target_count, goals_scored,
  -- processed_at) can be updated at any time by server-side cron logic.
  IF TG_OP = 'UPDATE' THEN
    IF NEW.player_id != OLD.player_id OR NEW.match_id != OLD.match_id THEN
      -- Cannot change player/match once the pick is locked.
      IF OLD.is_locked = TRUE THEN
        RAISE EXCEPTION 'This pick is locked — player selection can no longer be changed.';
      END IF;
      -- Cannot change player/match after the deadline has passed.
      IF OLD.effective_deadline <= NOW() THEN
        RAISE EXCEPTION 'Pick deadline has passed — player selection can no longer be changed.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Note: the trigger itself (trg_validate_pick_timing) does not need to be
-- recreated — CREATE OR REPLACE on the function is sufficient.
