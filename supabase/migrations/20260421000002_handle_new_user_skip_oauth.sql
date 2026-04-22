-- ============================================================
-- Migration: 20260421000002_handle_new_user_skip_oauth.sql
-- Description: Update handle_new_user trigger to skip creating the
--              public.users row for OAuth users who haven't completed
--              their profile yet (no username in metadata).
--              Those users are redirected to /complete-profile after
--              their first sign-in, where they submit the missing data.
-- Status: PENDING — apply this in the Supabase SQL Editor.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_provider TEXT;
  v_username TEXT;
BEGIN
  v_provider := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');
  v_username := NEW.raw_user_meta_data->>'username';

  -- OAuth users (e.g. Google) don't pass a username or age confirmation
  -- at sign-in time. We skip creating the public.users row here and let
  -- them complete their profile at /complete-profile on first visit.
  -- The proxy detects the missing row and redirects them there.
  IF v_username IS NULL THEN
    RETURN NEW;
  END IF;

  -- Email+password users always have username and over_18_confirmed
  -- in their metadata (set by the signup form). Create both rows now.
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
    v_username,
    CASE
      WHEN NEW.email_confirmed_at IS NOT NULL THEN TRUE
      ELSE FALSE
    END,
    COALESCE(
      (NEW.raw_user_meta_data->>'over_18_confirmed')::boolean,
      FALSE
    ),
    COALESCE(
      (NEW.raw_user_meta_data->>'marketing_emails_opt_in')::boolean,
      FALSE
    ),
    v_provider
  );

  INSERT INTO public.user_status (user_id) VALUES (NEW.id);

  RETURN NEW;
END;
$$;
