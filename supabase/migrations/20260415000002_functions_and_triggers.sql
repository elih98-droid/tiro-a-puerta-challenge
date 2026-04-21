-- ============================================================
-- Migration: 20260415000002_functions_and_triggers.sql
-- Description: Core DB functions and triggers for game logic.
-- Applied manually in Supabase SQL Editor on 2026-04-15.
-- This file is for version control only; do NOT run against a DB
-- that already has these objects.
-- Reference: docs/database-schema.md §7
-- ============================================================

-- ============================================================
-- FUNCTION: set_updated_at
-- Automatically keeps the updated_at column current on any table
-- that has this trigger attached.
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Attach to every table that has an updated_at column.
CREATE TRIGGER trg_users_updated
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_players_updated
  BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_matches_updated
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_player_match_stats_updated
  BEFORE UPDATE ON player_match_stats
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_user_picks_updated
  BEFORE UPDATE ON user_picks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- FUNCTION: validate_pick_timing
-- Prevents picks from being created or modified after their
-- effective_deadline or once they have been locked.
-- This is a DB-level safety net on top of app-layer validation.
-- Reference: game-rules.md §3.2, §3.3; database-schema.md §7.1
-- ============================================================

CREATE OR REPLACE FUNCTION validate_pick_timing()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Block any insert or update if the deadline has already passed.
  IF NEW.effective_deadline <= NOW() THEN
    RAISE EXCEPTION 'Pick deadline has passed for this match.';
  END IF;

  -- Block updates on picks that are already locked.
  IF TG_OP = 'UPDATE' AND OLD.is_locked = TRUE THEN
    RAISE EXCEPTION 'This pick is locked and can no longer be changed.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_pick_timing
  BEFORE INSERT OR UPDATE ON user_picks
  FOR EACH ROW EXECUTE FUNCTION validate_pick_timing();

-- ============================================================
-- FUNCTION: log_pick_history
-- Writes an audit record to pick_history every time a pick is
-- created or changed. The table is append-only by design.
-- Reference: database-schema.md §7.2, §3.8
-- ============================================================

CREATE OR REPLACE FUNCTION log_pick_history()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO pick_history (
    user_id,
    match_day_id,
    player_id,
    match_id,
    action
    -- ip_address and user_agent_hash are passed by the application layer
    -- via a separate call; the trigger only captures the core pick data.
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

CREATE TRIGGER trg_log_pick_history
  AFTER INSERT OR UPDATE ON user_picks
  FOR EACH ROW EXECUTE FUNCTION log_pick_history();
