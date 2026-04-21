import { createClient } from '@supabase/supabase-js'

/**
 * Supabase client with the service role key.
 *
 * IMPORTANT: This client bypasses Row Level Security. Only use it in
 * Server Actions or Route Handlers that have already verified the caller
 * is an admin. Never expose this client to the browser.
 *
 * Required env var: SUPABASE_SERVICE_ROLE_KEY (never prefix with NEXT_PUBLIC_)
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        // Disable automatic session persistence — this client is server-only.
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
