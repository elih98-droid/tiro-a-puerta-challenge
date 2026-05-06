import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/auth/actions'
import { TPMark } from '@/components/brand/tp-mark'

export default async function PendingApprovalPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#0B0D18',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Grid overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      {/* Gold halo */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 320,
        height: 320,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 400 }}>

        {/* HUD corners */}
        <div style={{ position: 'absolute', top: -12, left: -12, width: 20, height: 20, borderTop: '2px solid #C9A84C', borderLeft: '2px solid #C9A84C' }} />
        <div style={{ position: 'absolute', top: -12, right: -12, width: 20, height: 20, borderTop: '2px solid #C9A84C', borderRight: '2px solid #C9A84C' }} />
        <div style={{ position: 'absolute', bottom: -12, left: -12, width: 20, height: 20, borderBottom: '2px solid #C9A84C', borderLeft: '2px solid #C9A84C' }} />
        <div style={{ position: 'absolute', bottom: -12, right: -12, width: 20, height: 20, borderBottom: '2px solid #C9A84C', borderRight: '2px solid #C9A84C' }} />

        <div style={{
          backgroundColor: '#181C36',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '40px 32px 36px',
          textAlign: 'center',
        }}>

          {/* TPMark */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <TPMark size={72} showHalo showMotionLines />
          </div>

          {/* Wordmark */}
          <p style={{
            margin: '0 0 2px',
            fontSize: 11,
            letterSpacing: 3,
            color: '#C9A84C',
            fontWeight: 700,
            textTransform: 'uppercase',
            fontFamily: 'var(--font-jetbrains-mono)',
          }}>
            TIRO A PUERTA
          </p>
          <p style={{
            margin: '0 0 28px',
            fontSize: 9,
            letterSpacing: 2,
            color: 'rgba(201,168,76,0.6)',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-jetbrains-mono)',
          }}>
            CHALLENGE · MEX · USA · CAN 2026
          </p>

          {/* Status badge */}
          <div style={{
            display: 'inline-block',
            padding: '6px 16px',
            backgroundColor: 'rgba(201,168,76,0.1)',
            border: '1px solid rgba(201,168,76,0.3)',
            borderRadius: 20,
            marginBottom: 24,
          }}>
            <span style={{
              fontSize: 11,
              letterSpacing: 2,
              color: '#C9A84C',
              fontWeight: 700,
              textTransform: 'uppercase',
              fontFamily: 'var(--font-jetbrains-mono)',
            }}>
              ⏳ EN ESPERA DE APROBACIÓN
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            margin: '0 0 16px',
            fontSize: 28,
            fontWeight: 400,
            color: '#ffffff',
            fontFamily: 'var(--font-bebas-neue)',
            letterSpacing: 1,
            lineHeight: 1.1,
          }}>
            Tu cuenta está lista
          </h1>

          {/* Body text */}
          <p style={{
            margin: '0 0 8px',
            fontSize: 14,
            color: 'rgba(255,255,255,0.65)',
            lineHeight: 1.6,
          }}>
            El administrador revisará tu solicitud y te dará acceso al torneo en breve.
          </p>
          <p style={{
            margin: '0 0 28px',
            fontSize: 14,
            color: 'rgba(255,255,255,0.65)',
            lineHeight: 1.6,
          }}>
            Recibirás un email en cuanto seas aprobado.
          </p>

          {/* Divider */}
          <div style={{
            height: 1,
            backgroundColor: 'rgba(255,255,255,0.06)',
            marginBottom: 20,
          }} />

          {/* User email */}
          {user && (
            <p style={{
              margin: '0 0 16px',
              fontSize: 12,
              color: 'rgba(255,255,255,0.35)',
              fontFamily: 'var(--font-jetbrains-mono)',
            }}>
              {user.email}
            </p>
          )}

          {/* Sign out */}
          <form action={signOut}>
            <button
              type="submit"
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: 13,
                color: 'rgba(255,255,255,0.35)',
                cursor: 'pointer',
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
            >
              Cerrar sesión
            </button>
          </form>

        </div>
      </div>
    </main>
  )
}
