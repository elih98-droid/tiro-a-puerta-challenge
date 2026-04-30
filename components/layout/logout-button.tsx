'use client'

import { signOut } from '@/lib/auth/actions'

// Logout needs to be a Client Component because it's a button
// that triggers a Server Action inside a layout (Server Component).
export function LogoutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        style={{
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 6,
          padding: '4px 10px',
          fontSize: 11,
          color: 'rgba(255,255,255,0.45)',
          cursor: 'pointer',
          fontFamily: 'var(--font-archivo-narrow), system-ui, sans-serif',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          fontWeight: 600,
        }}
      >
        Salir
      </button>
    </form>
  )
}
