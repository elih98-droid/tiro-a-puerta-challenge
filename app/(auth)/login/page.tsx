import { LoginForm } from '@/components/auth/login-form'

/**
 * Login page — /login
 * The page itself is a Server Component. The form is a Client Component
 * because it uses useActionState to show errors while submitting.
 */
export default function LoginPage() {
  return <LoginForm />
}
