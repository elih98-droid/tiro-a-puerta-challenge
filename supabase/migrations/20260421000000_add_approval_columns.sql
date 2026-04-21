-- ============================================================
-- Migration: 20260421000000_add_approval_columns.sql
-- Description: Add is_approved and is_admin columns to public.users
--              to support manual account approval by the admin.
-- Status: PENDING — apply this in the Supabase SQL Editor.
-- ============================================================
--
-- CONTEXT
-- The game is a closed environment. Anyone can sign up via the URL,
-- but users cannot access the game until the admin manually approves
-- their account. is_admin marks the single admin user (you), who
-- can approve or reject pending accounts from /admin/approvals.
--
-- AFTER APPLYING THIS MIGRATION
-- Run the following to approve your own account and grant admin access
-- (replace 'your-email@example.com' with your actual email):
--
--   UPDATE public.users
--   SET is_approved = TRUE, is_admin = TRUE
--   WHERE email = 'your-email@example.com';
-- ============================================================

ALTER TABLE public.users
  ADD COLUMN is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN is_admin    BOOLEAN NOT NULL DEFAULT FALSE;

-- Index to speed up the admin approvals page query (pending users list).
CREATE INDEX idx_users_pending_approval
  ON public.users (created_at DESC)
  WHERE is_approved = FALSE AND is_deleted = FALSE;
