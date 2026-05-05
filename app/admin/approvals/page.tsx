import { createClient } from '@/lib/supabase/server'
import { approveUser, rejectUser } from '@/lib/admin/actions'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export default async function ApprovalsPage() {
  const supabase = await createClient()

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
    <main style={{ minHeight: '100vh', backgroundColor: '#0B0D18', padding: '24px 16px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <p style={{
            margin: '0 0 4px',
            fontSize: 11,
            letterSpacing: 3,
            color: '#C9A84C',
            fontWeight: 700,
            textTransform: 'uppercase',
            fontFamily: 'var(--font-jetbrains-mono)',
          }}>
            Admin
          </p>
          <h1 style={{
            margin: 0,
            fontSize: 32,
            fontWeight: 400,
            color: '#ffffff',
            fontFamily: 'var(--font-bebas-neue)',
            letterSpacing: 1,
          }}>
            Aprobaciones
          </h1>
          <p style={{
            margin: '6px 0 0',
            fontSize: 13,
            color: 'rgba(255,255,255,0.45)',
          }}>
            {pendingUsers.length === 0
              ? 'No hay cuentas pendientes.'
              : `${pendingUsers.length} cuenta${pendingUsers.length !== 1 ? 's' : ''} esperando aprobación`}
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pendingUsers.map((user) => (
            <div
              key={user.id}
              style={{
                backgroundColor: '#181C36',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.08)',
                overflow: 'hidden',
              }}
            >
              {/* User info */}
              <div style={{ padding: '16px 16px 12px' }}>
                <p style={{
                  margin: '0 0 2px',
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#ffffff',
                  fontFamily: 'var(--font-bebas-neue)',
                  letterSpacing: 0.5,
                }}>
                  @{user.username}
                </p>
                <p style={{
                  margin: '0 0 8px',
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.6)',
                  wordBreak: 'break-all',
                }}>
                  {user.email}
                </p>
                <p style={{
                  margin: 0,
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.35)',
                  fontFamily: 'var(--font-jetbrains-mono)',
                }}>
                  {formatDate(user.created_at)}
                </p>
              </div>

              {/* Actions */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                borderTop: '1px solid rgba(255,255,255,0.06)',
              }}>
                <form action={approveUser.bind(null, user.id)}>
                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      padding: '14px 0',
                      background: 'linear-gradient(135deg, #1a5c1a, #3CAC3B)',
                      border: 'none',
                      borderRight: '1px solid rgba(255,255,255,0.06)',
                      color: '#ffffff',
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-archivo)',
                    }}
                  >
                    ✓ Aprobar
                  </button>
                </form>

                <form action={rejectUser.bind(null, user.id)}>
                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      padding: '14px 0',
                      background: 'rgba(230,29,37,0.12)',
                      border: 'none',
                      color: '#E61D25',
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-archivo)',
                    }}
                  >
                    ✕ Rechazar
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>

        {pendingUsers.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '48px 0',
            color: 'rgba(255,255,255,0.25)',
            fontSize: 14,
          }}>
            Todo al día 👌
          </div>
        )}

      </div>
    </main>
  )
}
