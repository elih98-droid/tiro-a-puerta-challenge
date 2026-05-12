'use server'

import { createClient } from '@/lib/supabase/server'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type ProfileActionState =
  | { error: string; success?: never }
  | { success: string; error?: never }
  | undefined

// ──────────────────────────────────────────────
// updateUsername
// Validates and updates the user's public username.
// Constraint: 3-20 chars, alphanumeric + underscore, unique.
// ──────────────────────────────────────────────

export async function updateUsername(
  prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const username = (formData.get('username') as string)?.trim()

  // Validation
  if (!username) return { error: 'El nombre de usuario es obligatorio.' }
  if (username.length < 3 || username.length > 20)
    return { error: 'Debe tener entre 3 y 20 caracteres.' }
  if (!/^[a-zA-Z0-9_]+$/.test(username))
    return { error: 'Solo letras, números y guion bajo (_).' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  // Check if it's the same username (no-op)
  const { data: current } = await supabase
    .from('users')
    .select('username')
    .eq('id', user.id)
    .single()
  if (current?.username === username) return { success: 'Sin cambios.' }

  // Check uniqueness (the DB has a UNIQUE constraint too, but we give a nicer error)
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle()
  if (existing) return { error: 'Ese nombre de usuario ya está en uso.' }

  // Update
  const { error } = await supabase
    .from('users')
    .update({ username })
    .eq('id', user.id)
  if (error) return { error: 'Error al actualizar. Intenta de nuevo.' }

  return { success: 'Username actualizado.' }
}

// ──────────────────────────────────────────────
// updateMarketingOptIn
// Toggles marketing_emails_opt_in for the current user.
// ──────────────────────────────────────────────

export async function updateMarketingOptIn(optIn: boolean): Promise<ProfileActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const { error } = await supabase
    .from('users')
    .update({ marketing_emails_opt_in: optIn })
    .eq('id', user.id)
  if (error) return { error: 'Error al actualizar preferencia.' }

  return { success: optIn ? 'Emails activados.' : 'Emails desactivados.' }
}
