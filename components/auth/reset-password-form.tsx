'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { resetPassword } from '@/lib/auth/actions'
import { TPMark } from '@/components/brand/tp-mark'

const P = {
  blue:     '#2A398D',
  blueDeep: '#1B2566',
  gold:     '#C9A84C',
  ink:      '#0B0D18',
  inkPanel: '#181C36',
  red:      '#E61D25',
  green:    '#3CAC3B',
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
    <div style={{ position: 'absolute', ...placement, transform: `rotate(${rotation}deg)`, zIndex: 3, pointerEvents: 'none' }}>
      <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
        <path d="M2 8 L2 2 L8 2" stroke={P.gold} strokeWidth="1.6" strokeLinecap="square" />
      </svg>
    </div>
  )
}

function EmailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(resetPassword, undefined)

  return (
    <div style={{
      position: 'relative', minHeight: '100svh',
      background: P.ink, color: P.white,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px',
      overflow: 'hidden',
    }}>

      {/* Background */}
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
          backgroundSize: '32px 32px',
        }} />
        {/* Gold halo */}
        <div style={{
          position: 'absolute', top: '30%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 320, height: 320, borderRadius: '50%',
          background: `radial-gradient(circle, ${P.gold}18 0%, transparent 65%)`,
          pointerEvents: 'none',
        }} />
      </div>

      {/* HUD corners */}
      <HUDCorner pos="tl" /><HUDCorner pos="tr" />
      <HUDCorner pos="bl" /><HUDCorner pos="br" />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        maxWidth: 420, width: '100%',
      }}>

        {/* Mark */}
        <div style={{ marginBottom: 20 }}>
          <TPMark size={72} showGoalLine={false} showHalo />
        </div>

        {/* Title */}
        <div style={{
          fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
          fontSize: 30, letterSpacing: 2, color: P.white, lineHeight: 1,
          textAlign: 'center', marginBottom: 8,
        }}>
          RECUPERAR CONTRASEÑA
        </div>
        <div style={{
          fontFamily: 'var(--font-archivo), sans-serif',
          fontSize: 13, color: P.sub, textAlign: 'center',
          marginBottom: 28, lineHeight: 1.5,
        }}>
          Ingresa tu email y te enviamos un enlace para restablecer tu contraseña.
        </div>

        {/* Success state */}
        {state?.success ? (
          <div style={{
            width: '100%',
            padding: '20px 18px',
            background: `linear-gradient(135deg, rgba(60,172,59,0.1) 0%, #0A1410 100%)`,
            border: `1.5px solid ${P.green}`,
            borderRadius: 12,
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
              fontSize: 20, letterSpacing: 1.5, color: P.green, marginBottom: 8,
            }}>
              ✅ ENLACE ENVIADO
            </div>
            <div style={{
              fontFamily: 'var(--font-archivo), sans-serif',
              fontSize: 13, color: P.sub, lineHeight: 1.5,
            }}>
              {state.success}
            </div>
            <Link href="/login" style={{
              display: 'inline-block', marginTop: 16,
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 10, letterSpacing: 1.2, fontWeight: 700,
              color: P.gold, textDecoration: 'none',
            }}>
              ← Volver al login
            </Link>
          </div>
        ) : (
          <form action={action} noValidate style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Email field */}
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.35)', pointerEvents: 'none',
                display: 'flex', alignItems: 'center',
              }}>
                <EmailIcon />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="tu@email.com"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '14px 14px 14px 42px',
                  background: P.inkPanel,
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, color: P.white,
                  fontFamily: 'var(--font-archivo), sans-serif',
                  fontSize: 14, outline: 'none',
                }}
                onFocus={e => {
                  e.target.style.border = `1px solid ${P.gold}88`
                  e.target.style.boxShadow = `0 0 0 3px ${P.gold}18`
                }}
                onBlur={e => {
                  e.target.style.border = '1px solid rgba(255,255,255,0.1)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            {/* Error */}
            {state?.error && (
              <p role="alert" style={{
                margin: 0, padding: '10px 12px',
                background: `${P.red}18`, border: `1px solid ${P.red}55`,
                borderRadius: 8, color: P.red,
                fontFamily: 'var(--font-archivo), sans-serif',
                fontSize: 12, lineHeight: 1.4,
              }}>
                {state.error}
              </p>
            )}

            {/* CTA */}
            <button
              type="submit"
              disabled={pending}
              style={{
                width: '100%', marginTop: 4,
                padding: '15px',
                background: `linear-gradient(135deg, ${P.blue} 0%, ${P.blueDeep} 100%)`,
                border: `1.5px solid ${P.gold}`,
                borderRadius: 10, color: P.white,
                fontFamily: 'var(--font-archivo), sans-serif',
                fontSize: 14, fontWeight: 700, letterSpacing: 0.5,
                cursor: pending ? 'not-allowed' : 'pointer',
                opacity: pending ? 0.7 : 1,
                position: 'relative', overflow: 'hidden',
              }}
            >
              {pending ? 'Enviando...' : 'Enviar enlace'}
            </button>

          </form>
        )}

        {/* Back to login */}
        {!state?.success && (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Link href="/login" style={{
              fontFamily: 'var(--font-archivo), sans-serif',
              fontSize: 13, color: P.gold, textDecoration: 'none',
            }}>
              ← Volver al login
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
