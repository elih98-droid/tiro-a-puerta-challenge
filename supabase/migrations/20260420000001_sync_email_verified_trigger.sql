-- ============================================================
-- Migration: 20260420000001_sync_email_verified_trigger.sql
-- Description: Trigger that syncs public.users.email_verified when
--              a user confirms their email via the Supabase Auth link.
-- Status: PENDING — apply this in the Supabase SQL Editor.
-- ============================================================
--
-- CONTEXT
-- When a user signs up with email+password, public.users.email_verified
-- is set to FALSE by the handle_new_user trigger (migration 20260420000000).
-- When the user later clicks the confirmation link, Supabase updates
-- auth.users.email_confirmed_at — but nothing updates public.users.
-- This trigger closes that gap.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only act when email_confirmed_at changes from NULL to a real timestamp.
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.users
    SET
      email_verified = TRUE,
      updated_at = NOW()
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_email_confirmed();
