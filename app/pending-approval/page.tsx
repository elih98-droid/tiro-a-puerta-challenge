import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/auth/actions'

export default async function PendingApprovalPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm text-center">
        <div className="mb-4 text-4xl">⏳</div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Cuenta pendiente de aprobación
        </h1>
        <p className="text-gray-600 mb-1">
          Tu cuenta fue creada correctamente, pero necesitas aprobación del
          administrador para poder jugar.
        </p>
        <p className="text-gray-600 mb-6">
          Recibirás un email cuando tu cuenta sea aprobada.
        </p>

        {user && (
          <p className="text-sm text-gray-400 mb-6">
            Registrado como <span className="font-medium">{user.email}</span>
          </p>
        )}

        <form action={signOut}>
          <button
            type="submit"
            className="text-sm text-gray-500 underline hover:text-gray-700"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </main>
  )
}
