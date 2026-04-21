import Link from 'next/link'

/**
 * Verify email page — /verify-email
 * Shown after a successful email+password signup.
 * The user must click the confirmation link in their inbox before
 * they can log in and make picks (game-rules.md §9.2).
 *
 * This is a static informational page — no form or JS needed.
 * When the user clicks the email link, Supabase redirects them to
 * /auth/callback which creates their session and sends them to /dashboard.
 */
export default function VerifyEmailPage() {
  return (
    <div>
      <h1>Revisa tu correo</h1>
      <p>
        Te enviamos un enlace de confirmación a tu email. Haz click en él para
        activar tu cuenta y empezar a jugar.
      </p>
      <p>
        El enlace tiene validez de <strong>24 horas</strong>. Si no lo ves,
        revisa tu carpeta de spam.
      </p>
      <p>
        <Link href="/login">Volver al login</Link>
      </p>
    </div>
  )
}
