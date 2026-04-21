import { CompleteProfileForm } from '@/components/auth/complete-profile-form'

/**
 * Complete profile page — /complete-profile
 * Shown to OAuth users (e.g. Google) on their first sign-in.
 * They authenticated successfully but haven't set a username or
 * confirmed their age yet (those aren't provided by Google).
 * Submitting this form creates their public.users row and redirects
 * them to /pending-approval to await admin approval.
 */
export default function CompleteProfilePage() {
  return <CompleteProfileForm />
}
