'use client'

import { useActionState } from 'react'
import { updatePassword } from '@/lib/auth/actions'

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, undefined)

  return (
    <div>
      <h1>Nueva contraseña</h1>
      <p>Elige una nueva contraseña para tu cuenta.</p>

      <form action={action} noValidate>
        <div>
          <label htmlFor="password">Nueva contraseña</label>
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
          <label htmlFor="confirm_password">Confirmar contraseña</label>
          <input
            id="confirm_password"
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Repite la contraseña"
          />
        </div>

        {state?.error && (
          <p role="alert" aria-live="polite">
            {state.error}
          </p>
        )}

        <button type="submit" disabled={pending}>
          {pending ? 'Guardando...' : 'Guardar contraseña'}
        </button>
      </form>
    </div>
  )
}
