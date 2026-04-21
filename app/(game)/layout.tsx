import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/layout/logout-button'

/**
 * Layout for all game pages (/dashboard, /pick, /leaderboard, /profile).
 * Shows a minimal nav bar with the user's username and a logout button.
 * The proxy (proxy.ts) already guarantees the user is authenticated here.
 */
export default async function GameLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch the public username from public.users.
  // We select only what we need for the nav.
  const { data: profile } = await supabase
    .from('users')
    .select('username')
    .eq('id', user!.id)
    .single()

  return (
    <div>
      <nav>
        <span>Tiro a Puerta 2026</span>
        <span>{profile?.username ?? user!.email}</span>
        <LogoutButton />
      </nav>
      <main>{children}</main>
    </div>
  )
}
