-- ============================================================
-- Migration: 20260415000001_rls_policies.sql
-- Description: Enable Row Level Security and define access policies.
-- Applied manually in Supabase SQL Editor on 2026-04-15.
-- This file is for version control only; do NOT run against a DB
-- that already has these policies.
-- Reference: docs/database-schema.md §6
-- ============================================================

-- ============================================================
-- ENABLE RLS
-- Tables with user data must have RLS enabled.
-- Public reference tables (teams, players, matches, match_days,
-- player_match_stats) are read-only for everyone — no RLS needed,
-- but INSERT/UPDATE will be restricted to service role via Supabase
-- dashboard / server-side clients using the service key.
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE pick_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_appeals ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES: users
-- ============================================================

-- Each user can read their own full record.
CREATE POLICY users_self_read ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Any authenticated user can read id + username of others (for leaderboard).
-- Column-level filtering (only expose id/username) is enforced in the app layer.
CREATE POLICY users_public_username_read ON users
  FOR SELECT
  USING (TRUE);

-- A user can only update their own record.
-- Field-level restrictions (only username, marketing_emails_opt_in) are
-- enforced in the app layer and via Server Actions.
CREATE POLICY users_self_update ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================
-- POLICIES: user_picks
-- ============================================================

-- A user can always read their own picks.
CREATE POLICY user_picks_own_read ON user_picks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Other users can only see picks that are already locked (post-deadline).
-- This enforces the privacy rule in game-rules.md §10.1.
CREATE POLICY user_picks_public_after_deadline ON user_picks
  FOR SELECT
  USING (is_locked = TRUE);

-- Only the pick owner can insert or update their own picks.
-- The validate_pick_timing trigger (migration 20260415000002) enforces
-- the deadline and is_locked checks.
CREATE POLICY user_picks_write_own ON user_picks
  FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- POLICIES: pick_history
-- ============================================================

-- Each user can read their own history.
CREATE POLICY pick_history_own_read ON pick_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Other users' history is not visible (anti-fraud data stays private).
-- Admins access history via the service role key (bypasses RLS).

-- ============================================================
-- POLICIES: user_status
-- ============================================================

-- user_status is fully public — it powers the leaderboard.
CREATE POLICY user_status_public_read ON user_status
  FOR SELECT
  USING (TRUE);

-- INSERT and UPDATE on user_status are done exclusively by the system
-- (cron jobs, server-side functions) using the service role key,
-- which bypasses RLS. No user-facing write policy needed.

-- ============================================================
-- POLICIES: admin_appeals
-- ============================================================

-- A user can submit their own appeal.
CREATE POLICY admin_appeals_own_insert ON admin_appeals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- A user can read their own appeals to track status.
CREATE POLICY admin_appeals_own_read ON admin_appeals
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins resolve appeals using the service role key (bypasses RLS).
