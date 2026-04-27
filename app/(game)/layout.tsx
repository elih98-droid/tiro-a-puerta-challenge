import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/layout/logout-button'
import { NavLinks } from '@/components/layout/nav-links'
import Link from 'next/link'

/**
 * Layout for all game pages (/dashboard, /pick, /my-picks, /leaderboard).
 *
 * Structure:
 *   - Top bar: brand name, username (or "Iniciar sesión"), logout button
 *   - Tab bar: section links with active highlight (NavLinks — Client Component)
 *   - Page content
 *
 * This layout handles both authenticated AND unauthenticated users.
 * Most pages here are protected (proxy redirects to /login before reaching
 * this layout). The exception is /leaderboard, which is publicly accessible.
 * For unauthenticated visitors the top bar shows a login link instead of
 * the username and logout button.
 *
 * Visual design here is intentionally functional, not final.
 * A full redesign (branding, colors, typography) is planned in tarea 8.
 */
export default async function GameLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch username only when there is a logged-in user.
  let username: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('username')
      .eq('id', user.id)
      .single()
    username = profile?.username ?? user.email ?? null
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top bar — brand + user info */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-gray-900 text-sm tracking-tight">
            Tiro a Puerta 2026
          </span>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-gray-500">{username}</span>
                <LogoutButton />
              </>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Tab bar — section navigation */}
      <div className="max-w-3xl mx-auto px-0 sm:px-4">
        <NavLinks />
      </div>

      {/* Page content */}
      <main className="max-w-3xl mx-auto">
        {children}
      </main>

    </div>
  )
}
