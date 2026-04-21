-- ============================================================
-- Migration: 20260421000001_remove_apple_provider.sql
-- Description: Remove 'apple' from the auth_provider constraint.
--              Apple Sign-In was descoped — only email and Google are supported.
-- Status: PENDING — apply this in the Supabase SQL Editor.
-- ============================================================

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_auth_provider_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_auth_provider_check
  CHECK (auth_provider IN ('email', 'google'));
