'use client'

import { signInWithOAuth } from '@/lib/auth/actions'

// Bind the provider argument so each button submits to the correct action.
const signInWithGoogle = signInWithOAuth.bind(null, 'google')

/**
 * OAuth sign-in button for Google.
 * Plain HTML form — no JS required to submit.
 * The server action handles the OAuth redirect.
 *
 * PREREQUISITE: Google OAuth must be configured in the Supabase dashboard
 * under Authentication → Providers → Google before this works.
 */
export function OAuthButtons() {
  return (
    <div>
      <form action={signInWithGoogle}>
        <button type="submit">Continuar con Google</button>
      </form>
    </div>
  )
}
