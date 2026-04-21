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

  const supabase = await createClient()

  const { error } = await supabase
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
 * Deleting from auth.users cascades to public.users automatically.
 */
export async function rejectUser(userId: string): Promise<void> {
  await requireAdmin()

  const adminClient = createAdminClient()

  const { error } = await adminClient.auth.admin.deleteUser(userId)

  if (error) {
    throw new Error(`Failed to reject user: ${error.message}`)
  }

  revalidatePath('/admin/approvals')
}
