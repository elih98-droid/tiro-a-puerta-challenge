'use client'

import { signOut } from '@/lib/auth/actions'

// Logout needs to be a Client Component because it's a button
// that triggers a Server Action inside a layout (Server Component).
export function LogoutButton() {
  return (
    <form action={signOut}>
      <button type="submit">Cerrar sesión</button>
    </form>
  )
}
