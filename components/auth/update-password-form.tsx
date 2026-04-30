'use client'

import { useActionState, useState } from 'react'
import { updatePassword } from '@/lib/auth/actions'
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

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="11" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function EyeIcon({ off }: { off?: boolean }) {
  return off ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, undefined)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '14px 42px 14px 42px',
    background: P.inkPanel,
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, color: P.white,
    fontFamily: 'var(--font-archivo), sans-serif',
    fontSize: 14, outline: 'none',
  }

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
          NUEVA CONTRASEÑA
        </div>
        <div style={{
          fontFamily: 'var(--font-archivo), sans-serif',
          fontSize: 13, color: P.sub, textAlign: 'center',
          marginBottom: 28, lineHeight: 1.5,
        }}>
          Elige una nueva contraseña segura para tu cuenta.
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
              ✅ CONTRASEÑA ACTUALIZADA
            </div>
            <div style={{
              fontFamily: 'var(--font-archivo), sans-serif',
              fontSize: 13, color: P.sub, lineHeight: 1.5,
            }}>
              {state.success}
            </div>
          </div>
        ) : (
          <form action={action} noValidate style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* New password */}
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.35)', pointerEvents: 'none',
                display: 'flex', alignItems: 'center',
              }}>
                <LockIcon />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="Nueva contraseña (mín. 8 caracteres)"
                style={inputStyle}
                onFocus={e => {
                  e.target.style.border = `1px solid ${P.gold}88`
                  e.target.style.boxShadow = `0 0 0 3px ${P.gold}18`
                }}
                onBlur={e => {
                  e.target.style.border = '1px solid rgba(255,255,255,0.1)'
                  e.target.style.boxShadow = 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.4)', padding: 0,
                  display: 'flex', alignItems: 'center',
                }}
              >
                <EyeIcon off={showPassword} />
              </button>
            </div>

            {/* Confirm password */}
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.35)', pointerEvents: 'none',
                display: 'flex', alignItems: 'center',
              }}>
                <LockIcon />
              </div>
              <input
                id="confirm_password"
                name="confirm_password"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="Confirmar contraseña"
                style={inputStyle}
                onFocus={e => {
                  e.target.style.border = `1px solid ${P.gold}88`
                  e.target.style.boxShadow = `0 0 0 3px ${P.gold}18`
                }}
                onBlur={e => {
                  e.target.style.border = '1px solid rgba(255,255,255,0.1)'
                  e.target.style.boxShadow = 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.4)', padding: 0,
                  display: 'flex', alignItems: 'center',
                }}
              >
                <EyeIcon off={showConfirm} />
              </button>
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
              }}
            >
              {pending ? 'Guardando...' : 'Guardar contraseña'}
            </button>

          </form>
        )}
      </div>
    </div>
  )
}
