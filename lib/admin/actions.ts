'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

/**
 * Verifies the currently authenticated user is an admin.
 * Returns their user ID if so, throws otherwise.
 */
async function requireAdmin(): Promise<string> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (error || !data?.is_admin) {
    throw new Error('Not authorized')
  }

  return user.id
}

/**
 * Approves a pending user account so they can access the game.
 */
export async function approveUser(userId: string): Promise<void> {
  await requireAdmin()

  // Use the admin client to bypass RLS — the regular client can only
  // update the current user's own row.
  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('users')
    .update({ is_approved: true })
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to approve user: ${error.message}`)
  }

  revalidatePath('/admin/approvals')
}

/**
 * Rejects and permanently deletes a pending user account.
 * We delete from public.users first (which cascades to user_status, picks, etc.)
 * and then from auth.users, to avoid FK constraint errors during the cascade.
 */
export async function rejectUser(userId: string): Promise<void> {
  await requireAdmin()

  const adminClient = createAdminClient()

  // Step 1: delete from public.users — cascades to user_status and any other
  // dependent tables in the public schema.
  const { error: publicError } = await adminClient
    .from('users')
    .delete()
    .eq('id', userId)

  if (publicError) {
    throw new Error(`Failed to reject user: ${publicError.message}`)
  }

  // Step 2: delete from auth.users — now that public refs are gone, this
  // should succeed without FK constraint errors.
  const { error: authError } = await adminClient.auth.admin.deleteUser(userId)

  if (authError) {
    throw new Error(`Failed to delete auth user: ${authError.message}`)
  }

  revalidatePath('/admin/approvals')
}
