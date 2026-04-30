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
  // Auth pages handle their own background (dark, full-bleed).
  // The <main> wrapper is minimal — no padding, no centering imposed here.
  return <main className="flex-1">{children}</main>
}
