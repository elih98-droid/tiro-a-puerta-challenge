'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { signUp } from '@/lib/auth/actions'
import { TPMark } from '@/components/brand/tp-mark'
import { OAuthButtons } from './oauth-buttons'

// ── Brand palette ──────────────────────────────────────────────
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

// ── HUD corner bracket ─────────────────────────────────────────
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

// ── Icons ──────────────────────────────────────────────────────

function EmailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Field ──────────────────────────────────────────────────────

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
  hint?: string
  icon: React.ReactNode
  rightSlot?: React.ReactNode
}

function Field({
  label, type, name, value, onChange, onBlurField,
  showError, error, autoComplete, hint, icon, rightSlot,
}: FieldProps) {
  const [focused, setFocused] = useState(false)

  return (
    <label style={{ display: 'block' }}>
      <div style={{
        fontFamily: 'var(--font-archivo-narrow), system-ui, sans-serif',
        fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' as const,
        color: showError ? P.red : P.sub, marginBottom: 6, fontWeight: 600,
      }}>
        {label}
      </div>

      <div style={{
        position: 'relative', background: P.inkPanel, borderRadius: 10, height: 54,
        display: 'flex', alignItems: 'center', padding: '0 14px',
        border: `1px solid ${showError ? P.red : focused ? P.gold : P.inkLine}`,
        boxShadow: focused ? `0 0 0 3px ${P.gold}33, 0 0 24px ${P.gold}22` : 'none',
        transition: 'box-shadow 140ms, border-color 140ms',
      }}>
        <div style={{
          width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: focused ? P.gold : P.sub, marginRight: 10, transition: 'color 120ms',
        }}>
          {icon}
        </div>
        <input
          type={type} name={name} value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onBlurField() }}
          autoComplete={autoComplete} spellCheck={false}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: P.white, fontSize: 16, fontFamily: 'var(--font-archivo), system-ui',
            fontWeight: 500, letterSpacing: 0.2,
          }}
        />
        {rightSlot}
      </div>

      {showError && error && (
        <div style={{
          color: P.red, fontSize: 12, marginTop: 6, fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: 'var(--font-archivo), system-ui',
        }}>
          <AlertCircle color={P.red} />{error}
        </div>
      )}

      {!showError && hint && (
        <div style={{
          color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 5,
          fontFamily: 'var(--font-archivo), system-ui',
        }}>
          {hint}
        </div>
      )}
    </label>
  )
}

// ── DarkCheckbox ───────────────────────────────────────────────

function DarkCheckbox({
  id, name, label, hint, required = false,
}: {
  id: string
  name: string
  label: string
  hint?: string
  required?: boolean
}) {
  const [checked, setChecked] = useState(false)

  return (
    <label
      htmlFor={id}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer',
      }}
    >
      {/* Hidden native checkbox for form submission */}
      <input
        id={id} name={name} type="checkbox" required={required}
        checked={checked} onChange={(e) => setChecked(e.target.checked)}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
      />

      {/* Custom checkbox visual */}
      <div style={{
        width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 1,
        background: checked ? P.gold : 'transparent',
        border: `1.5px solid ${checked ? P.gold : 'rgba(255,255,255,0.2)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 120ms, border-color 120ms',
        boxShadow: checked ? `0 0 0 3px ${P.gold}22` : 'none',
      }}>
        {checked && (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke={P.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      <div>
        <div style={{
          fontSize: 13, color: checked ? P.white : P.sub,
          fontFamily: 'var(--font-archivo), system-ui', lineHeight: 1.4,
          transition: 'color 120ms',
        }}>
          {label}
        </div>
        {hint && (
          <div style={{
            fontSize: 11, color: 'rgba(255,255,255,0.3)',
            fontFamily: 'var(--font-archivo), system-ui', marginTop: 2,
          }}>
            {hint}
          </div>
        )}
      </div>
    </label>
  )
}

// ── SignupForm ─────────────────────────────────────────────────

export function SignupForm() {
  const [state, action, pending] = useActionState(signUp, undefined)

  const [email,    setEmail]    = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [blurred,  setBlurred]  = useState({ email: false, username: false, password: false })

  const emailValid    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const usernameValid = /^[a-zA-Z0-9_]{3,20}$/.test(username)
  const pwValid       = password.length >= 8

  const emailErr    = blurred.email    && !emailValid    ? 'Ingresa un correo válido'              : ''
  const usernameErr = blurred.username && !usernameValid ? 'Entre 3 y 20 caracteres (letras, números, _)' : ''
  const passwordErr = blurred.password && !pwValid       ? 'Mínimo 8 caracteres'                  : ''

  return (
    <div style={{
      position: 'relative', minHeight: '100svh',
      background: P.ink, color: P.white,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>

      {/* ── Background ── */}
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
        <div style={{
          position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)',
          width: 240, height: 240, borderRadius: '50%',
          background: `radial-gradient(circle, ${P.gold}2A 0%, transparent 65%)`,
          filter: 'blur(24px)',
        }} />
      </div>

      {/* ── HUD Corners ── */}
      <HUDCorner pos="tl" /><HUDCorner pos="tr" />
      <HUDCorner pos="bl" /><HUDCorner pos="br" />

      {/* ── Content ── */}
      <div style={{
        position: 'relative', zIndex: 2, flex: 1,
        padding: '48px 28px 32px',
        display: 'flex', flexDirection: 'column',
        maxWidth: 460, width: '100%', margin: '0 auto',
      }}>

        {/* Badge */}
        <div style={{
          alignSelf: 'center', display: 'flex', alignItems: 'center', gap: 8,
          padding: '5px 12px', border: `1px solid ${P.gold}55`,
          borderRadius: 999, background: `${P.gold}10`,
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: 9.5, letterSpacing: 2.5, textTransform: 'uppercase',
          color: P.gold, fontWeight: 700,
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%', background: P.red,
            boxShadow: `0 0 0 3px ${P.red}33`,
            animation: 'tpPulse 1.4s ease-in-out infinite', display: 'inline-block',
          }} />
          MEX-USA-CAN 2026
        </div>

        {/* Balón */}
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
          <div style={{ filter: `drop-shadow(0 0 16px ${P.gold}44) drop-shadow(0 6px 14px rgba(0,0,0,0.35))` }}>
            <TPMark size={72} />
          </div>
        </div>

        {/* Wordmark */}
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <div style={{
            fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
            fontSize: 34, lineHeight: 0.92, letterSpacing: 1.5, color: P.white,
          }}>
            TIRO A PUERTA
          </div>
          <div style={{
            fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
            fontSize: 16, lineHeight: 1, letterSpacing: 7, color: P.gold, marginTop: 4, paddingLeft: 7,
          }}>
            CHALLENGE
          </div>
        </div>

        {/* Title */}
        <div style={{
          textAlign: 'center', marginTop: 14,
          fontFamily: 'var(--font-archivo), system-ui',
          fontSize: 13.5, fontWeight: 700, letterSpacing: 0.3, color: P.white,
        }}>
          Crea tu cuenta y entra al desafío.
        </div>

        {/* ── Form ── */}
        <form action={action} noValidate
          style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <Field
            label="Correo electrónico" type="email" name="email"
            value={email} onChange={setEmail}
            onBlurField={() => setBlurred(b => ({ ...b, email: true }))}
            showError={!!emailErr} error={emailErr}
            autoComplete="email" icon={<EmailIcon />}
          />

          <Field
            label="Nombre de usuario" type="text" name="username"
            value={username} onChange={setUsername}
            onBlurField={() => setBlurred(b => ({ ...b, username: true }))}
            showError={!!usernameErr} error={usernameErr}
            autoComplete="username"
            hint="Aparece en el leaderboard. Letras, números y _ solamente."
            icon={<UserIcon />}
          />

          <Field
            label="Contraseña" type={showPw ? 'text' : 'password'} name="password"
            value={password} onChange={setPassword}
            onBlurField={() => setBlurred(b => ({ ...b, password: true }))}
            showError={!!passwordErr} error={passwordErr}
            autoComplete="new-password" icon={<LockIcon />}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPw(s => !s)}
                aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                style={{
                  background: 'transparent', border: 'none', padding: 4,
                  cursor: 'pointer', color: P.sub, display: 'flex', alignItems: 'center',
                }}
              >
                {showPw ? <EyeSlash /> : <EyeOpen />}
              </button>
            }
          />

          {/* Checkboxes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 2 }}>
            <DarkCheckbox
              id="over_18_confirmed" name="over_18_confirmed" required
              label="Confirmo que soy mayor de 18 años"
            />
            <DarkCheckbox
              id="marketing_emails_opt_in" name="marketing_emails_opt_in"
              label="Quiero recibir resúmenes y novedades del torneo"
              hint="Opcional — puedes cancelarlo en cualquier momento"
            />
          </div>

          {/* Server error */}
          {state?.error && (
            <div role="alert" aria-live="polite" style={{
              background: `${P.red}1F`, border: `1px solid ${P.red}66`,
              borderRadius: 10, padding: '10px 12px',
              display: 'flex', alignItems: 'center', gap: 10,
              color: P.red, fontSize: 13, fontWeight: 500,
              fontFamily: 'var(--font-archivo), system-ui',
            }}>
              <AlertCircle color={P.red} />{state.error}
            </div>
          )}

          {/* CTA */}
          <button
            type="submit" disabled={pending}
            style={{
              marginTop: 6, position: 'relative', overflow: 'hidden',
              height: 56, borderRadius: 12,
              cursor: pending ? 'wait' : 'pointer',
              background: `linear-gradient(180deg, ${P.blue} 0%, ${P.blueDeep} 100%)`,
              border: `1.5px solid ${P.gold}`, color: P.white,
              fontFamily: 'var(--font-archivo), system-ui',
              fontSize: 15, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase',
              boxShadow: `0 0 0 1px ${P.gold}44, 0 8px 28px ${P.blue}66, 0 0 32px ${P.gold}22, inset 0 1px 0 rgba(255,255,255,0.25)`,
              opacity: pending ? 0.85 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            }}
          >
            <span style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.18), transparent 50%)',
              pointerEvents: 'none',
            }} />
            {pending ? (
              <>
                <span style={{
                  width: 16, height: 16, borderRadius: 8,
                  border: '2px solid rgba(255,255,255,0.35)', borderTopColor: P.white,
                  animation: 'spin 0.8s linear infinite', display: 'inline-block',
                }} />
                <span style={{ position: 'relative' }}>CREANDO CUENTA…</span>
              </>
            ) : (
              <>
                <span style={{ position: 'relative' }}>Crear cuenta</span>
                <ArrowRight />
              </>
            )}
          </button>
        </form>

        {/* Divider — outside <form> to avoid nested form with OAuthButtons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0 0' }}>
          <div style={{ flex: 1, height: 1, background: P.inkLine }} />
          <div style={{
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: 10, color: P.sub, letterSpacing: 2, fontWeight: 700,
          }}>O</div>
          <div style={{ flex: 1, height: 1, background: P.inkLine }} />
        </div>

        <OAuthButtons />

        <div style={{ flex: 1, minHeight: 8 }} />

        {/* Login link */}
        <div style={{
          textAlign: 'center', fontSize: 15, color: P.sub,
          marginTop: 18, marginBottom: 14, lineHeight: 1.4,
          fontFamily: 'var(--font-archivo), system-ui',
        }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" style={{
            color: P.gold, fontWeight: 800, textDecoration: 'none',
            letterSpacing: 0.3, fontSize: 16,
            borderBottom: `2px solid ${P.gold}`, paddingBottom: 1,
          }}>
            Inicia sesión →
          </Link>
        </div>

      </div>
    </div>
  )
}
