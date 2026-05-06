'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { sendEmail } from '@/lib/email/send'
import { newSignupEmailTemplate } from '@/lib/email/templates/new-signup'

// ─── Email helper ──────────────────────────────────────────────────────────────

async function notifyAdminOfNewSignup(username: string, email: string): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) return // Skip silently if not configured

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tiroapuerta.mx'
  const { subject, html } = newSignupEmailTemplate({
    username,
    email,
    registeredAt: new Date().toISOString(),
    approvalsUrl: `${appUrl}/admin/approvals`,
  })

  const result = await sendEmail({ to: adminEmail, subject, html })
  if (!result.ok) {
    // Non-critical — log and continue
    console.error('[notifyAdminOfNewSignup] Failed:', result.error)
  }
}

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

// State returned by Server Actions that use useActionState.
// undefined = action hasn't run yet.
export type AuthActionState =
  | { error: string; success?: never }
  | { success: string; error?: never }
  | undefined

// ──────────────────────────────────────────────
// Validation helpers (server-side only)
// ──────────────────────────────────────────────

function validateEmail(email: string): string | null {
  if (!email) return 'El email es obligatorio.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email no válido.'
  return null
}

function validatePassword(password: string): string | null {
  if (!password) return 'La contraseña es obligatoria.'
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
  return null
}

function validateUsername(username: string): string | null {
  if (!username) return 'El nombre de usuario es obligatorio.'
  if (username.length < 3 || username.length > 20)
    return 'El nombre de usuario debe tener entre 3 y 20 caracteres.'
  if (!/^[a-zA-Z0-9_]+$/.test(username))
    return 'Solo se permiten letras, números y guion bajo (_).'
  return null
}

// ──────────────────────────────────────────────
// signUp
// Creates a new account with email + password.
// Passes username and age confirmation as user metadata,
// which the handle_new_user DB trigger reads to create
// the public.users record.
// On success: redirects to /verify-email.
// Reference: game-rules.md §9.1, §9.2, §9.3
// ──────────────────────────────────────────────

export async function signUp(
  prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string
  const username = (formData.get('username') as string)?.trim()
  const over18 = formData.get('over_18_confirmed') === 'on'
  const marketingOptIn = formData.get('marketing_emails_opt_in') === 'on'

  const emailError = validateEmail(email)
  if (emailError) return { error: emailError }

  const passwordError = validatePassword(password)
  if (passwordError) return { error: passwordError }

  const usernameError = validateUsername(username)
  if (usernameError) return { error: usernameError }

  if (!over18) return { error: 'Debes confirmar que eres mayor de 18 años.' }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // These fields land in auth.users.raw_user_meta_data.
      // The handle_new_user trigger reads them to populate public.users.
      data: {
        username,
        over_18_confirmed: true,
        marketing_emails_opt_in: marketingOptIn,
      },
    },
  })

  if (error) {
    // Supabase returns this message when the email is already in use.
    if (error.message.toLowerCase().includes('already registered')) {
      return { error: 'Ya existe una cuenta con ese email.' }
    }
    return { error: 'Error al crear la cuenta. Inténtalo de nuevo.' }
  }

  // Notify admin of new signup pending approval (await before redirect —
  // fire-and-forget doesn't work here because redirect() throws internally)
  await notifyAdminOfNewSignup(username, email)

  // Supabase sent a confirmation email. Direct the user to check their inbox.
  redirect('/verify-email')
}

// ──────────────────────────────────────────────
// signIn
// Signs in with email + password.
// On success: redirects to /dashboard.
// ──────────────────────────────────────────────

export async function signIn(
  prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string

  const emailError = validateEmail(email)
  if (emailError) return { error: emailError }

  if (!password) return { error: 'La contraseña es obligatoria.' }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Email o contraseña incorrectos.' }
    }
    if (error.message.includes('Email not confirmed')) {
      return {
        error:
          'Primero debes verificar tu email. Revisa tu bandeja de entrada.',
      }
    }
    return { error: 'Error al iniciar sesión. Inténtalo de nuevo.' }
  }

  redirect('/dashboard')
}

// ──────────────────────────────────────────────
// signInWithOAuth
// Initiates a Google or Apple OAuth flow.
// Supabase returns a URL to redirect the user to.
// After the provider authenticates the user, they
// land on /auth/callback which exchanges the code
// for a session and redirects to /dashboard.
//
// Usage in a Client Component (via .bind):
//   const signInWithGoogle = signInWithOAuth.bind(null, 'google')
//   <form action={signInWithGoogle}><button>...</button></form>
// ──────────────────────────────────────────────

export async function signInWithOAuth(provider: 'google' | 'apple') {
  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') ?? 'http://localhost:3000'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error || !data.url) {
    redirect('/login?error=oauth_failed')
  }

  redirect(data.url)
}

// ──────────────────────────────────────────────
// completeProfile
// Called after an OAuth sign-in when public.users doesn't exist yet.
// Collects username and age confirmation, then creates the rows in
// public.users and public.user_status.
// On success: redirects to /pending-approval (admin must approve first).
// ──────────────────────────────────────────────

export async function completeProfile(
  prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const username = (formData.get('username') as string)?.trim()
  const over18 = formData.get('over_18_confirmed') === 'on'
  const marketingOptIn = formData.get('marketing_emails_opt_in') === 'on'

  const usernameError = validateUsername(username)
  if (usernameError) return { error: usernameError }

  if (!over18) return { error: 'Debes confirmar que eres mayor de 18 años.' }

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const provider = user.app_metadata?.provider ?? 'email'

  // Insert the profile row. If the username is already taken the unique
  // constraint on public.users.username will raise an error.
  const { error: insertError } = await supabase.from('users').insert({
    id: user.id,
    email: user.email!,
    username,
    email_verified: !!user.email_confirmed_at,
    over_18_confirmed: true,
    marketing_emails_opt_in: marketingOptIn,
    auth_provider: provider,
  })

  if (insertError) {
    if (insertError.message.includes('unique') || insertError.code === '23505') {
      return { error: 'Ese nombre de usuario ya está en uso. Elige otro.' }
    }
    return { error: 'Error al guardar el perfil. Inténtalo de nuevo.' }
  }

  // Initialize tournament status using the admin client — RLS on user_status
  // only allows inserts from the service role (system operations).
  const adminClient = createAdminClient()
  await adminClient.from('user_status').insert({ user_id: user.id })

  // Notify admin of new signup pending approval
  await notifyAdminOfNewSignup(username, user.email!)

  redirect('/pending-approval')
}

// ──────────────────────────────────────────────
// signOut
// Ends the user's session and redirects to /login.
// ──────────────────────────────────────────────

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// ──────────────────────────────────────────────
// resetPassword
// Sends a password reset email to the user.
// The email link goes to /auth/callback?next=/update-password,
// which sets a temporary session and redirects to the
// update-password page.
// ──────────────────────────────────────────────

export async function resetPassword(
  prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = (formData.get('email') as string)?.trim().toLowerCase()

  const emailError = validateEmail(email)
  if (emailError) return { error: emailError }

  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') ?? 'http://localhost:3000'

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/update-password`,
  })

  if (error) {
    return {
      error: 'Error al enviar el correo. Verifica el email e inténtalo de nuevo.',
    }
  }

  // Don't reveal whether the email exists or not (security best practice).
  return {
    success:
      'Si ese email está registrado, recibirás un correo con instrucciones en unos minutos.',
  }
}

// ──────────────────────────────────────────────
// updatePassword
// Sets a new password for the authenticated user.
// Only works if the user has a valid recovery session
// (arrived via the reset password link in their email).
// On success: redirects to /dashboard.
// ──────────────────────────────────────────────

export async function updatePassword(
  prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm_password') as string

  const passwordError = validatePassword(password)
  if (passwordError) return { error: passwordError }

  if (password !== confirmPassword) {
    return { error: 'Las contraseñas no coinciden.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return {
      error: 'Error al actualizar la contraseña. El enlace puede haber expirado.',
    }
  }

  redirect('/dashboard')
}
