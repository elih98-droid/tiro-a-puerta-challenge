import { createClient } from '@/lib/supabase/server'

/**
 * Temporary health check page to verify Supabase connection.
 * TODO: Remove this page before going to production.
 */
export default async function HealthCheckPage() {
  const supabase = await createClient()

  // Attempt a minimal query to verify the connection works.
  // We query the auth schema which always exists, even with no tables yet.
  const { error } = await supabase.auth.getSession()

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">
          ❌ Connection failed
        </h1>
        <pre className="mt-4 p-4 bg-gray-100 rounded text-sm">
          {JSON.stringify(error, null, 2)}
        </pre>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-green-600">
        ✅ Supabase connection successful
      </h1>
      <p className="mt-2 text-gray-600">
        The app successfully connected to Supabase. You&apos;re ready to build features.
      </p>
    </div>
  )
}