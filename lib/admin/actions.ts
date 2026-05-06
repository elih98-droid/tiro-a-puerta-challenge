'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { sendEmail } from '@/lib/email/send'
import { accountApprovedEmailTemplate } from '@/lib/email/templates/account-approved'

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
 * Sends a confirmation email to the user after approval.
 */
export async function approveUser(userId: string): Promise<void> {
  await requireAdmin()

  // Use the admin client to bypass RLS — the regular client can only
  // update the current user's own row.
  const adminClient = createAdminClient()

  // Fetch user data before approving so we can send the notification email.
  const { data: userData, error: fetchError } = await adminClient
    .from('users')
    .select('username, email')
    .eq('id', userId)
    .single()

  if (fetchError || !userData) {
    throw new Error(`Failed to fetch user data: ${fetchError?.message}`)
  }

  const { error } = await adminClient
    .from('users')
    .update({ is_approved: true })
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to approve user: ${error.message}`)
  }

  // Send approval email — non-blocking, a failure here doesn't roll back the approval.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tiroapuerta.mx'
  const { subject, html } = accountApprovedEmailTemplate({
    username: userData.username,
    loginUrl: `${appUrl}/login`,
  })

  await sendEmail({ to: userData.email, subject, html })

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

  // Delete in FK-safe order: child tables first, then parent tables.
  // user_status.user_id → users.id doesn't have ON DELETE CASCADE,
  // so we must delete it manually before deleting the user row.

  const { error: statusError } = await adminClient
    .from('user_status')
    .delete()
    .eq('user_id', userId)

  if (statusError) {
    throw new Error(`Failed to delete user_status: ${statusError.message}`)
  }

  const { error: publicError } = await adminClient
    .from('users')
    .delete()
    .eq('id', userId)

  if (publicError) {
    throw new Error(`Failed to reject user: ${publicError.message}`)
  }

  const { error: authError } = await adminClient.auth.admin.deleteUser(userId)

  if (authError) {
    throw new Error(`Failed to delete auth user: ${authError.message}`)
  }

  revalidatePath('/admin/approvals')
}
