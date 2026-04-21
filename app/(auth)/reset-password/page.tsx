import { ResetPasswordForm } from '@/components/auth/reset-password-form'

/**
 * Reset password page — /reset-password
 * The user enters their email; we send a reset link via Supabase.
 * The link redirects to /auth/callback?next=/update-password,
 * which sets a recovery session and sends them to /update-password.
 */
export default function ResetPasswordPage() {
  return <ResetPasswordForm />
}
