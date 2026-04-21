-- ============================================================
-- Migration: 20260420000000_handle_new_user_trigger.sql
-- Description: Trigger that syncs auth.users → public.users on signup.
-- Status: PENDING — apply this in the Supabase SQL Editor.
-- ============================================================
--
-- CONTEXT
-- Supabase Auth manages credentials in auth.users (not accessible to
-- the app directly). Our app data lives in public.users. Every time a
-- new user signs up (via email+password or OAuth), this trigger fires
-- and creates the matching row in public.users, plus initializes the
-- user's tournament status in public.user_status.
--
-- HOW DATA IS PASSED FROM THE APP
-- The signup flow must pass extra fields via the "options.data" object
-- in the Supabase JS client. Supabase stores that object in
-- auth.users.raw_user_meta_data. This trigger reads from there:
--
--   Required fields in raw_user_meta_data:
--     - username            (TEXT, 3-20 chars)
--     - over_18_confirmed   (BOOLEAN, must be true)
--
--   Optional fields in raw_user_meta_data:
--     - marketing_emails_opt_in  (BOOLEAN, defaults to false)
--
--   Auth provider is derived automatically from raw_app_meta_data,
--   which Supabase populates itself.
--
-- ERROR HANDLING
-- If username is missing or over_18_confirmed is not true, the DB
-- constraints on public.users will raise an exception, which rolls
-- back the auth.users insert and surfaces as an error to the client.
-- This is intentional: no public.users row = no access to the game.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
-- Restrict search path to avoid search-path injection attacks.
SET search_path = public
AS $$
DECLARE
  v_provider TEXT;
BEGIN
  -- Derive auth provider from Supabase's own metadata.
  -- raw_app_meta_data looks like: {"provider": "google", "providers": ["google"]}
  v_provider := COALESCE(
    NEW.raw_app_meta_data->>'provider',
    'email'
  );

  -- Insert the user profile row.
  INSERT INTO public.users (
    id,
    email,
    username,
    email_verified,
    over_18_confirmed,
    marketing_emails_opt_in,
    auth_provider
  )
  VALUES (
    NEW.id,
    NEW.email,

    -- Username must be supplied by the signup form via options.data.
    -- If missing, the NOT NULL constraint will raise a clear error.
    NEW.raw_user_meta_data->>'username',

    -- OAuth users (Google, Apple) are auto-verified by the provider.
    -- Email+password users start unverified and must click the
    -- confirmation link (game-rules.md §9.2).
    CASE
      WHEN NEW.email_confirmed_at IS NOT NULL THEN TRUE
      ELSE FALSE
    END,

    -- Must be TRUE; enforced by the age_confirmed CHECK constraint.
    -- If the user didn't check the box, this will be FALSE and the
    -- INSERT will fail, blocking account creation.
    COALESCE(
      (NEW.raw_user_meta_data->>'over_18_confirmed')::boolean,
      FALSE
    ),

    -- Marketing opt-in defaults to false if not explicitly set.
    COALESCE(
      (NEW.raw_user_meta_data->>'marketing_emails_opt_in')::boolean,
      FALSE
    ),

    v_provider
  );

  -- Initialize the user's tournament status.
  -- Every new user starts alive with zero goals and zero days survived.
  INSERT INTO public.user_status (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$;

-- Attach the function to auth.users.
-- Fires once per new user, after the auth row is committed.
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
