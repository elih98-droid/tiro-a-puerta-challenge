import { SignupForm } from '@/components/auth/signup-form'

/**
 * Signup page — /signup
 * Registration closes 5 minutes before the opening match kickoff
 * (11 June 2026, 12:55 pm CDMX). That deadline enforcement is handled
 * server-side in the signUp action, not here.
 * Reference: game-rules.md §9.5
 */
export default function SignupPage() {
  return <SignupForm />
}
