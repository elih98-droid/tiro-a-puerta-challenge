'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { signIn } from '@/lib/auth/actions'
import { TPMark } from '@/components/brand/tp-mark'
import { OAuthButtons } from './oauth-buttons'

// ── Brand palette (dark mode only for auth pages) ──────────────
const P = {
  blue:      '#2A398D',
  blueDeep:  '#1B2566',
  red:       '#E61D25',
  gold:      '#C9A84C',
  ink:       '#0B0D18',
  inkPanel:  '#181C36',
  inkLine:   'rgba(255,255,255,0.08)',
  sub:       'rgba(255,255,255,0.55)',
  white:     '#FFFFFF',
}

// ── HUD corner bracket (de la Variación C / D) ─────────────────
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

// ── Iconos ─────────────────────────────────────────────────────

function EmailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="11" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function EyeOpen() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function EyeSlash() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function AlertCircle({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <path d="M12 7v6M12 17v.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ position: 'relative' }}>
      <path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Field (campos filled con foco dorado — estructura de Variación A) ──

interface FieldProps {
  label: string
  type: string
  name: string
  value: string
  onChange: (v: string) => void
  onBlurField: () => void
  showError: boolean
  error: string
  autoComplete?: string
  icon: React.ReactNode
  rightSlot?: React.ReactNode
}

function Field({
  label, type, name, value, onChange, onBlurField,
  showError, error, autoComplete, icon, rightSlot,
}: FieldProps) {
  const [focused, setFocused] = useState(false)

  return (
    <label style={{ display: 'block' }}>
      {/* Label */}
      <div style={{
        fontFamily: 'var(--font-archivo-narrow), system-ui, sans-serif',
        fontSize: 11,
        letterSpacing: 1.5,
        textTransform: 'uppercase' as const,
        color: showError ? P.red : P.sub,
        marginBottom: 6,
        fontWeight: 600,
      }}>
        {label}
      </div>

      {/* Input wrapper */}
      <div style={{
        position: 'relative',
        background: P.inkPanel,
        borderRadius: 10,
        height: 54,
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        border: `1px solid ${showError ? P.red : focused ? P.gold : P.inkLine}`,
        boxShadow: focused
          ? `0 0 0 3px ${P.gold}33, 0 0 24px ${P.gold}22`
          : 'none',
        transition: 'box-shadow 140ms, border-color 140ms',
      }}>
        {/* Icon */}
        <div style={{
          width: 24, height: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: focused ? P.gold : P.sub,
          marginRight: 10,
          transition: 'color 120ms',
        }}>
          {icon}
        </div>

        {/* Input */}
        <input
          type={type}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onBlurField() }}
          autoComplete={autoComplete}
          spellCheck={false}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: P.white,
            fontSize: 16,
            fontFamily: 'var(--font-archivo), system-ui',
            fontWeight: 500,
            letterSpacing: 0.2,
          }}
        />

        {rightSlot}
      </div>

      {/* Field-level error */}
      {showError && error && (
        <div style={{
          color: P.red,
          fontSize: 12,
          marginTop: 6,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'var(--font-archivo), system-ui',
        }}>
          <AlertCircle color={P.red} />
          {error}
        </div>
      )}
    </label>
  )
}

// ── LoginForm ──────────────────────────────────────────────────

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, undefined)

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [blurred, setBlurred]   = useState({ email: false, password: false })

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const pwValid    = password.length >= 6

  const emailErr    = blurred.email    && !emailValid ? 'Ingresa un correo válido'  : ''
  const passwordErr = blurred.password && !pwValid    ? 'Mínimo 6 caracteres'       : ''

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
        {/* Gradiente radial desde el azul en la parte superior */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(120% 55% at 50% 0%, ${P.blue}30 0%, ${P.ink} 55%, #06080F 100%)`,
        }} />
        {/* Grid sutil */}
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
        padding: '70px 28px 32px',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 460,
        width: '100%',
        margin: '0 auto',
      }}>

        {/* Badge "MEX-USA-CAN 2026" */}
        <div style={{
          alignSelf: 'center',
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '5px 12px',
          border: `1px solid ${P.gold}55`,
          borderRadius: 999,
          background: `${P.gold}10`,
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: 9.5, letterSpacing: 2.5, textTransform: 'uppercase',
          color: P.gold, fontWeight: 700,
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%',
            background: P.red,
            boxShadow: `0 0 0 3px ${P.red}33`,
            animation: 'tpPulse 1.4s ease-in-out infinite',
            display: 'inline-block',
          }} />
          MEX-USA-CAN 2026
        </div>

        {/* Balón con halo dorado */}
        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center' }}>
          <div style={{
            filter: `drop-shadow(0 0 20px ${P.gold}44) drop-shadow(0 8px 18px rgba(0,0,0,0.35))`,
          }}>
            <TPMark size={92} />
          </div>
        </div>

        {/* Wordmark */}
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <div style={{
            fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
            fontSize: 38, lineHeight: 0.92, letterSpacing: 1.5,
            color: P.white,
          }}>
            TIRO A PUERTA
          </div>
          <div style={{
            fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
            fontSize: 18, lineHeight: 1, letterSpacing: 7,
            color: P.gold, marginTop: 4, paddingLeft: 7,
          }}>
            CHALLENGE
          </div>
        </div>

        {/* Tagline editorial */}
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <div style={{
            color: P.white,
            fontWeight: 700, letterSpacing: 0.3, fontSize: 13.5,
            fontFamily: 'var(--font-archivo), system-ui',
          }}>
            Un tiro. Un día. Sobrevive.
          </div>
        </div>

        {/* ── Formulario ── */}
        <form
          action={action}
          style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <Field
            label="Correo electrónico"
            type="email"
            name="email"
            value={email}
            onChange={setEmail}
            onBlurField={() => setBlurred((b) => ({ ...b, email: true }))}
            showError={!!emailErr}
            error={emailErr}
            autoComplete="email"
            icon={<EmailIcon />}
          />

          <Field
            label="Contraseña"
            type={showPw ? 'text' : 'password'}
            name="password"
            value={password}
            onChange={setPassword}
            onBlurField={() => setBlurred((b) => ({ ...b, password: true }))}
            showError={!!passwordErr}
            error={passwordErr}
            autoComplete="current-password"
            icon={<LockIcon />}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                style={{
                  background: 'transparent', border: 'none',
                  padding: 4, cursor: 'pointer',
                  color: P.sub, display: 'flex', alignItems: 'center',
                }}
              >
                {showPw ? <EyeSlash /> : <EyeOpen />}
              </button>
            }
          />

          {/* ¿Olvidaste tu contraseña? */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -2 }}>
            <Link
              href="/reset-password"
              style={{
                fontSize: 12.5, color: P.white, fontWeight: 600,
                textDecoration: 'none', letterSpacing: 0.1,
                fontFamily: 'var(--font-archivo), system-ui',
              }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* Banner de error del servidor */}
          {state?.error && (
            <div role="alert" aria-live="polite" style={{
              background: `${P.red}1F`,
              border: `1px solid ${P.red}66`,
              borderRadius: 10,
              padding: '10px 12px',
              display: 'flex', alignItems: 'center', gap: 10,
              color: P.red, fontSize: 13, fontWeight: 500,
              fontFamily: 'var(--font-archivo), system-ui',
            }}>
              <AlertCircle color={P.red} />
              {state.error}
            </div>
          )}

          {/* CTA — azul con borde dorado (firma del diseño D) */}
          <button
            type="submit"
            disabled={pending}
            style={{
              marginTop: 6,
              position: 'relative', overflow: 'hidden',
              height: 56, borderRadius: 12,
              cursor: pending ? 'wait' : 'pointer',
              background: `linear-gradient(180deg, ${P.blue} 0%, ${P.blueDeep} 100%)`,
              border: `1.5px solid ${P.gold}`,
              color: P.white,
              fontFamily: 'var(--font-archivo), system-ui',
              fontSize: 15, fontWeight: 800,
              letterSpacing: 1.5, textTransform: 'uppercase',
              boxShadow: `0 0 0 1px ${P.gold}44, 0 8px 28px ${P.blue}66, 0 0 32px ${P.gold}22, inset 0 1px 0 rgba(255,255,255,0.25)`,
              opacity: pending ? 0.85 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            }}
          >
            {/* Sheen superior */}
            <span style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.18), transparent 50%)',
              pointerEvents: 'none',
            }} />

            {pending ? (
              <>
                <span style={{
                  width: 16, height: 16, borderRadius: 8,
                  border: '2px solid rgba(255,255,255,0.35)',
                  borderTopColor: P.white,
                  animation: 'spin 0.8s linear infinite',
                  display: 'inline-block',
                }} />
                <span style={{ position: 'relative' }}>AUTENTICANDO…</span>
              </>
            ) : (
              <>
                <span style={{ position: 'relative' }}>Iniciar sesión</span>
                <ArrowRight />
              </>
            )}
          </button>

        </form>

        {/* Divisor "O" — fuera del <form> para evitar form anidado con OAuthButtons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0 0' }}>
          <div style={{ flex: 1, height: 1, background: P.inkLine }} />
          <div style={{
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: 10, color: P.sub, letterSpacing: 2, fontWeight: 700,
          }}>O</div>
          <div style={{ flex: 1, height: 1, background: P.inkLine }} />
        </div>

        {/* Botón Google — tiene su propio <form>, NO puede estar dentro del form principal */}
        <OAuthButtons />

        <div style={{ flex: 1, minHeight: 8 }} />

        {/* Crear cuenta */}
        <div style={{
          textAlign: 'center',
          fontSize: 15, color: P.sub,
          marginTop: 18, marginBottom: 14,
          lineHeight: 1.4,
          fontFamily: 'var(--font-archivo), system-ui',
        }}>
          ¿Aún no tienes cuenta?{' '}
          <Link
            href="/signup"
            style={{
              color: P.gold, fontWeight: 800, textDecoration: 'none',
              letterSpacing: 0.3, fontSize: 16,
              borderBottom: `2px solid ${P.gold}`,
              paddingBottom: 1,
            }}
          >
            Crear cuenta →
          </Link>
        </div>
      </div>
    </div>
  )
}
