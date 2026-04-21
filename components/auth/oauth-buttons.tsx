'use client'

import { signInWithOAuth } from '@/lib/auth/actions'

// Bind the provider argument so each button submits to the correct action.
// .bind(null, 'google') creates a new server action pre-filled with 'google'.
const signInWithGoogle = signInWithOAuth.bind(null, 'google')
const signInWithApple = signInWithOAuth.bind(null, 'apple')

/**
 * OAuth sign-in buttons for Google and Apple.
 * These are plain HTML forms — no JS required to submit them.
 * The server action handles the OAuth redirect.
 *
 * PREREQUISITE: Google and Apple OAuth must be configured in the
 * Supabase dashboard under Authentication → Providers before these work.
 */
export function OAuthButtons() {
  return (
    <div>
      <form action={signInWithGoogle}>
        <button type="submit">Continuar con Google</button>
      </form>

      <form action={signInWithApple}>
        <button type="submit">Continuar con Apple</button>
      </form>
    </div>
  )
}
