'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signIn } from '@/lib/auth/actions'
import { OAuthButtons } from './oauth-buttons'

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, undefined)

  return (
    <div>
      <h1>Iniciar sesión</h1>

      {/* Show error from failed auth callback (e.g. expired link) */}
      {/* This error comes from the URL, not from the action state */}

      <form action={action} noValidate>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="tu@email.com"
          />
        </div>

        <div>
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Tu contraseña"
          />
        </div>

        {/* Server-side error message */}
        {state?.error && (
          <p role="alert" aria-live="polite">
            {state.error}
          </p>
        )}

        <button type="submit" disabled={pending}>
          {pending ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p>
        <Link href="/reset-password">¿Olvidaste tu contraseña?</Link>
      </p>

      <hr />

      <OAuthButtons />

      <p>
        ¿No tienes cuenta?{' '}
        <Link href="/signup">Regístrate aquí</Link>
      </p>
    </div>
  )
}
