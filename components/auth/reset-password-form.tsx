'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { resetPassword } from '@/lib/auth/actions'

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(resetPassword, undefined)

  return (
    <div>
      <h1>Recuperar contraseña</h1>
      <p>
        Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
      </p>

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

        {state?.error && (
          <p role="alert" aria-live="polite">
            {state.error}
          </p>
        )}

        {state?.success && (
          <p role="status" aria-live="polite">
            {state.success}
          </p>
        )}

        <button type="submit" disabled={pending}>
          {pending ? 'Enviando...' : 'Enviar enlace'}
        </button>
      </form>

      <p>
        <Link href="/login">Volver al login</Link>
      </p>
    </div>
  )
}
