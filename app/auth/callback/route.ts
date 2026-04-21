import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'

/**
 * Auth callback route handler.
 *
 * Supabase redirects users here in two scenarios:
 *
 * 1. Email confirmation (after signup):
 *    Supabase emails a link → user clicks → lands here with ?code=xxx
 *    We exchange the code for a session → redirect to /dashboard.
 *
 * 2. Password reset:
 *    Supabase emails a link → user clicks → lands here with ?code=xxx&next=/update-password
 *    We exchange the code → redirect to /update-password so the user can set a new password.
 *
 * 3. OAuth (Google / Apple):
 *    After the provider authenticates the user → lands here with ?code=xxx
 *    We exchange the code → redirect to /dashboard.
 *
 * IMPORTANT: The redirect URL for this route must be added to the
 * "Redirect URLs" list in Supabase dashboard → Authentication → URL Configuration.
 * For local dev: http://localhost:3000/auth/callback
 * For production: https://yourdomain.com/auth/callback
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // 'next' is used by the password reset flow to redirect to /update-password.
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          },
        },
      },
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Redirect to the intended destination (dashboard or update-password).
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  // If we reach here, something went wrong (no code, or exchange failed).
  // Redirect to login with an error flag so the UI can show a message.
  return NextResponse.redirect(
    new URL('/login?error=auth_callback_failed', origin),
  )
}
