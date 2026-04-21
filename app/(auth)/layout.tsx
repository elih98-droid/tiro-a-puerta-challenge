/**
 * Layout for all authentication pages (/login, /signup, /reset-password, etc).
 * The (auth) route group keeps these pages together without affecting the URL —
 * /login stays /login, not /(auth)/login.
 *
 * For now this is a minimal wrapper. The design pass will style this properly.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main>
      {children}
    </main>
  )
}
