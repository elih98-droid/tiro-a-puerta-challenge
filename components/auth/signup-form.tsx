'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signUp } from '@/lib/auth/actions'
import { OAuthButtons } from './oauth-buttons'

export function SignupForm() {
  const [state, action, pending] = useActionState(signUp, undefined)

  return (
    <div>
      <h1>Crear cuenta</h1>

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
          <label htmlFor="username">Nombre de usuario</label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            minLength={3}
            maxLength={20}
            placeholder="Entre 3 y 20 caracteres"
          />
          <small>
            Este nombre aparecerá en el leaderboard. Solo letras, números y _ .
          </small>
        </div>

        <div>
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Mínimo 8 caracteres"
          />
        </div>

        <div>
          {/* Checkbox: user confirms they are 18+ (game-rules.md §9.3) */}
          <input
            id="over_18_confirmed"
            name="over_18_confirmed"
            type="checkbox"
            required
          />
          <label htmlFor="over_18_confirmed">
            Confirmo que soy mayor de 18 años
          </label>
        </div>

        <div>
          {/* Optional marketing opt-in (game-rules.md §12.2) */}
          <input
            id="marketing_emails_opt_in"
            name="marketing_emails_opt_in"
            type="checkbox"
          />
          <label htmlFor="marketing_emails_opt_in">
            Quiero recibir resúmenes y novedades del torneo por email (opcional)
          </label>
        </div>

        {/* Server-side error message */}
        {state?.error && (
          <p role="alert" aria-live="polite">
            {state.error}
          </p>
        )}

        <button type="submit" disabled={pending}>
          {pending ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>

      <hr />

      <OAuthButtons />

      <p>
        ¿Ya tienes cuenta?{' '}
        <Link href="/login">Inicia sesión</Link>
      </p>
    </div>
  )
}
