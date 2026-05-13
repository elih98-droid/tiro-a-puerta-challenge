-- ============================================================
-- Migration: 20260513000001_handle_new_user_terms_accepted.sql
-- Description: Update handle_new_user trigger to write terms_accepted_at
--              from user metadata when creating the public.users row
--              (email+password signup flow).
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

  -- Email+password users always have username, over_18_confirmed, and
  -- terms_accepted_at in their metadata (set by the signup form).
  INSERT INTO public.users (
    id,
    email,
    username,
    email_verified,
    over_18_confirmed,
    marketing_emails_opt_in,
    terms_accepted_at,
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
    -- terms_accepted_at comes as ISO 8601 string from the signup form
    (NEW.raw_user_meta_data->>'terms_accepted_at')::timestamptz,
    v_provider
  );

  INSERT INTO public.user_status (user_id) VALUES (NEW.id);

  RETURN NEW;
END;
$$;
