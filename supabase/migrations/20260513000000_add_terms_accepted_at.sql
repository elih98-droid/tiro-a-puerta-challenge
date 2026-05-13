-- Add terms_accepted_at column to users table.
-- Records the exact timestamp when the user accepted the Terms & Conditions.
-- Nullable because existing users accepted before this column existed.
ALTER TABLE public.users
  ADD COLUMN terms_accepted_at TIMESTAMPTZ;

-- Backfill existing users: they implicitly accepted by signing up.
-- We set their terms_accepted_at to their registration date.
UPDATE public.users
  SET terms_accepted_at = created_at
  WHERE terms_accepted_at IS NULL;
