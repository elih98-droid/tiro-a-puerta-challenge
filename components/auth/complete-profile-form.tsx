'use client'

import { useActionState, useState } from 'react'
import { completeProfile } from '@/lib/auth/actions'
import { TPMark } from '@/components/brand/tp-mark'

// ── Brand palette ──────────────────────────────────────────────
const P = {
  blue:     '#2A398D',
  blueDeep: '#1B2566',
  red:      '#E61D25',
  gold:     '#C9A84C',
  ink:      '#0B0D18',
  inkPanel: '#181C36',
  inkLine:  'rgba(255,255,255,0.08)',
  sub:      'rgba(255,255,255,0.55)',
  white:    '#FFFFFF',
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

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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
}

function Field({
  label, type, name, value, onChange, onBlurField,
  showError, error, autoComplete, hint, icon,
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
    <label htmlFor={id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
      <input
        id={id} name={name} type="checkbox" required={required}
        checked={checked} onChange={(e) => setChecked(e.target.checked)}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
      />
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

// ── CompleteProfileForm ────────────────────────────────────────

export function CompleteProfileForm() {
  const [state, action, pending] = useActionState(completeProfile, undefined)

  const [username, setUsername] = useState('')
  const [blurred,  setBlurred]  = useState(false)

  const usernameValid = /^[a-zA-Z0-9_]{3,20}$/.test(username)
  const usernameErr   = blurred && !usernameValid ? 'Entre 3 y 20 caracteres (letras, números, _)' : ''

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
        padding: '60px 28px 40px',
        display: 'flex', flexDirection: 'column',
        maxWidth: 460, width: '100%', margin: '0 auto',
      }}>

        {/* Balón */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ filter: `drop-shadow(0 0 16px ${P.gold}44) drop-shadow(0 6px 14px rgba(0,0,0,0.35))` }}>
            <TPMark size={72} />
          </div>
        </div>

        {/* Wordmark */}
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <div style={{
            fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
            fontSize: 34, lineHeight: 0.92, letterSpacing: 1.5, color: P.white,
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

        {/* Título de paso */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <div style={{
            fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
            fontSize: 22, letterSpacing: 2, color: P.white,
          }}>
            UN PASO MÁS
          </div>
          <div style={{
            fontFamily: 'var(--font-archivo), system-ui',
            fontSize: 13.5, color: P.sub, marginTop: 6, lineHeight: 1.5,
          }}>
            Elige tu nombre en el leaderboard y confirma tu edad para entrar al desafío.
          </div>
        </div>

        {/* ── Form ── */}
        <form action={action} noValidate
          style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <Field
            label="Nombre de usuario" type="text" name="username"
            value={username} onChange={setUsername}
            onBlurField={() => setBlurred(true)}
            showError={!!usernameErr} error={usernameErr}
            autoComplete="username"
            hint="Aparece en el leaderboard. Letras, números y _ solamente."
            icon={<UserIcon />}
          />

          {/* Checkboxes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 6 }}>
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
                <span style={{ position: 'relative' }}>GUARDANDO…</span>
              </>
            ) : (
              <>
                <span style={{ position: 'relative' }}>Continuar al desafío</span>
                <ArrowRight />
              </>
            )}
          </button>
        </form>

        <div style={{ flex: 1, minHeight: 24 }} />

        {/* Nota de cuenta ya existente */}
        <div style={{
          textAlign: 'center', fontSize: 12.5, color: 'rgba(255,255,255,0.3)',
          marginBottom: 8, lineHeight: 1.5,
          fontFamily: 'var(--font-archivo), system-ui',
        }}>
          Autenticado con Google. Si esto no eres tú,{' '}
          <a href="/login" style={{ color: P.gold, textDecoration: 'none' }}>
            cierra sesión
          </a>.
        </div>

      </div>
    </div>
  )
}
