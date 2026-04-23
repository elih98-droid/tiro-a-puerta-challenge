-- ============================================================
-- Migration: 20260422000002_fix_user_picks_delete_policy.sql
-- Description: Adds an explicit FOR DELETE policy on user_picks.
--
-- Problem:
--   The existing policy user_picks_write_own uses FOR ALL, which
--   should cover DELETE. However, PostgREST/Supabase does not always
--   apply FOR ALL policies to DELETE operations correctly. The result
--   is that authenticated users cannot delete their own picks even
--   though the policy appears to allow it (delete runs but affects 0 rows).
--
-- Fix:
--   Add an explicit FOR DELETE policy. PostgreSQL combines permissive
--   policies with OR, so this does not conflict with the existing
--   FOR ALL policy — it only adds an explicit path for DELETE.
--
-- Apply manually in Supabase SQL Editor.
-- ============================================================

CREATE POLICY user_picks_delete_own ON user_picks
  FOR DELETE
  USING (auth.uid() = user_id);
