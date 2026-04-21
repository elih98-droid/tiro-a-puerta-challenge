import { UpdatePasswordForm } from '@/components/auth/update-password-form'

/**
 * Update password page — /update-password
 * The user arrives here after clicking the reset link in their email.
 * By this point, /auth/callback has already exchanged the reset code
 * for a temporary session, so supabase.auth.updateUser() will work.
 *
 * If the user visits this page without a valid session (e.g. link expired),
 * the proxy (middleware) will redirect them to /login.
 */
export default function UpdatePasswordPage() {
  return <UpdatePasswordForm />
}
