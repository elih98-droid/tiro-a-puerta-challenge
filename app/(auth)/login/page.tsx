import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/login-form'

/**
 * Login page — /login
 * The page itself is a Server Component. The form is a Client Component
 * because it uses useActionState to show errors while submitting.
 * Suspense is required because LoginForm uses useSearchParams() to
 * surface OAuth error messages from ?error= query params.
 */
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
