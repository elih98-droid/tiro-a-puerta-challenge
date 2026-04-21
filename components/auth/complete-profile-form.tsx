'use client'

import { useActionState } from 'react'
import { completeProfile } from '@/lib/auth/actions'

export function CompleteProfileForm() {
  const [state, action, pending] = useActionState(completeProfile, undefined)

  return (
    <div>
      <h1>Completa tu perfil</h1>
      <p>
        Para terminar de crear tu cuenta, elige un nombre de usuario y
        confirma que eres mayor de 18 años.
      </p>

      <form action={action} noValidate>
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
          <input
            id="marketing_emails_opt_in"
            name="marketing_emails_opt_in"
            type="checkbox"
          />
          <label htmlFor="marketing_emails_opt_in">
            Quiero recibir resúmenes y novedades del torneo por email (opcional)
          </label>
        </div>

        {state?.error && (
          <p role="alert" aria-live="polite">
            {state.error}
          </p>
        )}

        <button type="submit" disabled={pending}>
          {pending ? 'Guardando...' : 'Continuar'}
        </button>
      </form>
    </div>
  )
}
