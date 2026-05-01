import Link from 'next/link'
import { TPMark } from '@/components/brand/tp-mark'

/**
 * Verify email page — /verify-email
 * Shown after a successful email+password signup.
 * The user must click the confirmation link in their inbox before
 * they can log in and make picks (game-rules.md §9.2).
 *
 * Static informational page — no form or JS needed.
 * When the user clicks the email link, Supabase redirects them to
 * /auth/callback which creates their session and sends them to /dashboard.
 */

const P = {
  blue:     '#2A398D',
  blueDeep: '#1B2566',
  gold:     '#C9A84C',
  green:    '#3CAC3B',
  ink:      '#0B0D18',
  inkPanel: '#181C36',
  inkLine:  'rgba(255,255,255,0.08)',
  sub:      'rgba(255,255,255,0.55)',
  white:    '#FFFFFF',
}

function HUDCorner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const rotation = { tl: 0, tr: 90, bl: -90, br: 180 }[pos]
  const placement: React.CSSProperties =
    pos === 'tl' ? { top: 16, left: 16 } :
    pos === 'tr' ? { top: 16, right: 16 } :
    pos === 'bl' ? { bottom: 16, left: 16 } :
                   { bottom: 16, right: 16 }

  return (
    <div style={{
      position: 'absolute',
      ...placement,
      transform: `rotate(${rotation}deg)`,
      zIndex: 3,
      pointerEvents: 'none',
    }}>
      <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
        <path d="M2 8 L2 2 L8 2" stroke={P.gold} strokeWidth="1.6" strokeLinecap="square" />
      </svg>
    </div>
  )
}

function EnvelopeIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="16" rx="2.5" stroke={P.gold} strokeWidth="1.6" />
      <path d="M2 7l10 7 10-7" stroke={P.gold} strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}

export default function VerifyEmailPage() {
  return (
    <div style={{
      position: 'relative',
      minHeight: '100svh',
      background: P.ink,
      color: P.white,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>

      {/* ── Fondo ── */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(120% 55% at 50% 0%, ${P.blue}30 0%, ${P.ink} 55%, #06080F 100%)`,
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse 70% 50% at 50% 30%, black, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 50% at 50% 30%, black, transparent 85%)',
        }} />
        {/* Halo dorado detrás del logo */}
        <div style={{
          position: 'absolute',
          top: 110, left: '50%',
          transform: 'translateX(-50%)',
          width: 280, height: 280,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${P.gold}33 0%, transparent 65%)`,
          filter: 'blur(28px)',
        }} />
      </div>

      {/* ── HUD Corners ── */}
      <HUDCorner pos="tl" />
      <HUDCorner pos="tr" />
      <HUDCorner pos="bl" />
      <HUDCorner pos="br" />

      {/* ── Contenido ── */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        flex: 1,
        padding: '70px 28px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: 460,
        width: '100%',
        margin: '0 auto',
      }}>

        {/* Logo */}
        <div style={{
          filter: `drop-shadow(0 0 20px ${P.gold}44) drop-shadow(0 8px 18px rgba(0,0,0,0.35))`,
        }}>
          <TPMark size={72} />
        </div>

        {/* Wordmark */}
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <div style={{
            fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
            fontSize: 32, lineHeight: 0.92, letterSpacing: 1.5,
            color: P.white,
          }}>
            TIRO A PUERTA
          </div>
          <div style={{
            fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
            fontSize: 16, lineHeight: 1, letterSpacing: 7,
            color: P.gold, marginTop: 4, paddingLeft: 7,
          }}>
            CHALLENGE
          </div>
        </div>

        {/* Card principal */}
        <div style={{
          marginTop: 40,
          width: '100%',
          background: P.inkPanel,
          borderRadius: 16,
          border: `1px solid ${P.gold}33`,
          padding: '32px 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          boxShadow: `0 0 40px ${P.gold}11`,
        }}>

          {/* Icono de sobre */}
          <div style={{
            width: 72, height: 72,
            borderRadius: '50%',
            background: `${P.gold}15`,
            border: `1.5px solid ${P.gold}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <EnvelopeIcon />
          </div>

          {/* Título */}
          <div style={{
            fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
            fontSize: 28, letterSpacing: 1.5,
            color: P.white, textAlign: 'center',
          }}>
            REVISA TU CORREO
          </div>

          {/* Descripción */}
          <div style={{
            fontFamily: 'var(--font-archivo), system-ui',
            fontSize: 15, color: P.sub,
            textAlign: 'center', lineHeight: 1.6,
          }}>
            Te enviamos un enlace de confirmación. Haz click en él para activar tu cuenta y empezar a jugar.
          </div>

          {/* Separador */}
          <div style={{ width: '100%', height: 1, background: P.inkLine }} />

          {/* Hint de spam */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: `${P.gold}0D`,
            border: `1px solid ${P.gold}22`,
            borderRadius: 10,
            padding: '12px 14px',
            width: '100%',
          }}>
            <div style={{
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 11, letterSpacing: 1.5,
              color: P.gold, fontWeight: 700,
              flexShrink: 0, paddingTop: 1,
            }}>
              ⚠
            </div>
            <div style={{
              fontFamily: 'var(--font-archivo), system-ui',
              fontSize: 13, color: P.sub, lineHeight: 1.5,
            }}>
              El enlace tiene validez de <span style={{ color: P.white, fontWeight: 700 }}>24 horas</span>. Si no lo ves en tu bandeja de entrada, revisa la carpeta de <span style={{ color: P.white, fontWeight: 700 }}>spam o no deseados</span>.
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 24 }} />

        {/* Link de vuelta al login */}
        <Link
          href="/login"
          style={{
            fontFamily: 'var(--font-archivo), system-ui',
            fontSize: 14, color: P.sub,
            textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 6,
            marginBottom: 8,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Volver al login
        </Link>

      </div>
    </div>
  )
}
