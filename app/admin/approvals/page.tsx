import { createClient } from '@/lib/supabase/server'
import { approveUser, rejectUser } from '@/lib/admin/actions'

// Format a UTC timestamp to a readable date in CDMX timezone.
function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export default async function ApprovalsPage() {
  const supabase = await createClient()

  // Fetch users that are pending approval (not yet approved, not deleted).
  const { data: pendingUsers, error } = await supabase
    .from('users')
    .select('id, username, email, created_at')
    .eq('is_approved', false)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to load pending users: ${error.message}`)
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          Aprobaciones pendientes
        </h1>
        <p className="text-gray-500 mb-8 text-sm">
          {pendingUsers.length === 0
            ? 'No hay cuentas pendientes.'
            : `${pendingUsers.length} cuenta${pendingUsers.length !== 1 ? 's' : ''} esperando aprobación.`}
        </p>

        {pendingUsers.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Registro</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {user.username}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {/* Approve */}
                      <form action={approveUser.bind(null, user.id)} className="inline">
                        <button
                          type="submit"
                          className="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                        >
                          Aprobar
                        </button>
                      </form>

                      {/* Reject — permanently deletes the account */}
                      <form action={rejectUser.bind(null, user.id)} className="inline">
                        <button
                          type="submit"
                          className="rounded bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200"
                        >
                          Rechazar
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
