-- ============================================================
-- Migration: 20260422000001_fix_log_pick_history_security.sql
-- Description: Adds SECURITY DEFINER to log_pick_history() so the
--   trigger can INSERT into pick_history regardless of RLS.
--
-- Problem:
--   pick_history has RLS enabled (migration 20260415000001) but only
--   has a SELECT policy — no INSERT policy for authenticated users.
--   The log_pick_history trigger runs as the calling user (no SECURITY
--   DEFINER), so when a user submits a pick via the app (not service
--   role), the trigger's INSERT into pick_history is blocked by RLS,
--   causing the entire user_picks upsert to fail.
--
-- Fix:
--   Recreate log_pick_history() with SECURITY DEFINER so it always
--   runs with the privileges of the function owner (postgres), which
--   bypasses RLS on pick_history. The trigger definition stays the same.
--
-- Apply manually in Supabase SQL Editor.
-- Reference: database-schema.md §7.2
-- ============================================================

CREATE OR REPLACE FUNCTION log_pick_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO pick_history (
    user_id,
    match_day_id,
    player_id,
    match_id,
    action
  )
  VALUES (
    NEW.user_id,
    NEW.match_day_id,
    NEW.player_id,
    NEW.match_id,
    CASE WHEN TG_OP = 'INSERT' THEN 'initial_pick' ELSE 'change_pick' END
  );

  RETURN NEW;
END;
$$;

-- Note: the trigger (trg_log_pick_history) does not need to be recreated.
-- CREATE OR REPLACE on the function is sufficient.
