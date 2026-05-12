import { createClient } from '@/lib/supabase/server'
import { ProfileClient } from '@/components/game/profile-client'

/**
 * Profile — /profile
 *
 * Server Component that fetches user data and passes it to ProfileClient.
 * Shows: username (editable), email, provider, marketing opt-in toggle,
 * change password link, logout, and delete account (placeholder).
 */

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: status }] = await Promise.all([
    supabase
      .from('users')
      .select('username, email_verified, marketing_emails_opt_in')
      .eq('id', user!.id)
      .single(),
    supabase
      .from('user_status')
      .select('is_alive, days_survived')
      .eq('user_id', user!.id)
      .single(),
  ])

  // Determine auth provider (email or google)
  const provider = user!.app_metadata?.provider === 'google' ? 'google' : 'email'

  return (
    <div style={{
      position: 'relative',
      minHeight: '100svh',
      background: '#0A0E1A',
      color: '#fff',
    }}>
      {/* Radial glow at top */}
      <div aria-hidden style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: 'radial-gradient(ellipse 120% 40% at 50% 0%, rgba(42,57,141,0.14), transparent 60%)',
      }} />

      <ProfileClient
        data={{
          username:      profile?.username ?? 'usuario',
          email:         user!.email ?? '',
          isAlive:       status?.is_alive ?? false,
          daysSurvived:  status?.days_survived ?? 0,
          provider:      provider as 'email' | 'google',
          emailVerified: profile?.email_verified ?? false,
          marketingOptIn: profile?.marketing_emails_opt_in ?? false,
        }}
      />
    </div>
  )
}
