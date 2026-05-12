'use client'

import { useActionState, useState, useTransition } from 'react'
import { updateUsername, updateMarketingOptIn, type ProfileActionState } from '@/lib/profile/actions'
import { signOut } from '@/lib/auth/actions'

// ── Paleta ──
const P = {
  blue:     '#2A398D',
  blueDeep: '#1B2566',
  red:      '#E61D25',
  green:    '#3CAC3B',
  gold:     '#C9A84C',
  panel:    '#181C36',
  bg:       '#0A0E1A',
  line:     'rgba(255,255,255,0.08)',
  ink:      '#fff',
  sub:      'rgba(255,255,255,0.62)',
  subDim:   'rgba(255,255,255,0.42)',
}

// ── Types ──
type ProfileData = {
  username: string
  email: string
  isAlive: boolean
  daysSurvived: number
  provider: 'email' | 'google'
  emailVerified: boolean
  marketingOptIn: boolean
}

// ── HUD corners (reused across cards) ──
function HudCorners() {
  const s = { position: 'absolute' as const, width: 12, height: 12 }
  const b = `1.5px solid ${P.gold}66`
  return (
    <>
      <div style={{ ...s, top: 6, left: 6, borderTop: b, borderLeft: b }} />
      <div style={{ ...s, top: 6, right: 6, borderTop: b, borderRight: b }} />
      <div style={{ ...s, bottom: 6, left: 6, borderBottom: b, borderLeft: b }} />
      <div style={{ ...s, bottom: 6, right: 6, borderBottom: b, borderRight: b }} />
    </>
  )
}

// ── Card wrapper ──
function Card({ children, borderColor, style }: {
  children: React.ReactNode
  borderColor?: string
  style?: React.CSSProperties
}) {
  return (
    <div style={{
      margin: '12px 16px 0',
      padding: '18px 16px',
      background: P.panel,
      border: `1px solid ${borderColor ?? P.line}`,
      borderRadius: 14,
      position: 'relative',
      overflow: 'hidden',
      ...style,
    }}>
      <HudCorners />
      {children}
    </div>
  )
}

// ── Section label ──
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: 'var(--font-jetbrains-mono), monospace',
      fontSize: 9,
      letterSpacing: 1.6,
      textTransform: 'uppercase',
      color: P.gold,
      fontWeight: 700,
      marginBottom: 14,
    }}>
      {children}
    </div>
  )
}

// ── Main component ──
export function ProfileClient({ data }: { data: ProfileData }) {
  const initials = data.username.slice(0, 2).toUpperCase()

  return (
    <div style={{ paddingTop: 0, paddingBottom: 24 }}>
      {/* ── Header: avatar + name ── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 16px 8px',
        position: 'relative',
        zIndex: 2,
      }}>
        {/* Avatar circle with initials */}
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${P.blueDeep}, ${P.blue})`,
          border: `2px solid ${P.gold}66`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 24px ${P.blue}44`,
          marginBottom: 12,
        }}>
          <span style={{
            fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
            fontSize: 28,
            letterSpacing: 2,
            color: P.ink,
          }}>
            {initials}
          </span>
        </div>

        {/* Username */}
        <div style={{
          fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
          fontSize: 28,
          letterSpacing: 2,
          color: P.ink,
          lineHeight: 1,
        }}>
          {data.username}
        </div>

        {/* Email */}
        <div style={{
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: 11,
          color: P.subDim,
          marginTop: 6,
        }}>
          {data.email}
        </div>

        {/* Status badge */}
        <div style={{
          marginTop: 10,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 12px',
          borderRadius: 999,
          border: `1px solid ${data.isAlive ? P.green : P.red}55`,
          background: `${data.isAlive ? P.green : P.red}15`,
        }}>
          <div style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: data.isAlive ? P.green : P.red,
            boxShadow: `0 0 8px ${data.isAlive ? P.green : P.red}88`,
            animation: data.isAlive ? 'tpPulse 1.6s ease-in-out infinite' : 'none',
          }} />
          <span style={{
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: 9,
            letterSpacing: 1.2,
            fontWeight: 700,
            color: data.isAlive ? P.green : P.red,
            textTransform: 'uppercase',
          }}>
            {data.isAlive ? `Vivo · Día ${data.daysSurvived}` : 'Eliminado'}
          </span>
        </div>
      </div>

      {/* ── Card: Tu cuenta ── */}
      <UsernameCard
        currentUsername={data.username}
        email={data.email}
        emailVerified={data.emailVerified}
        provider={data.provider}
      />

      {/* ── Card: Preferencias ── */}
      <PreferencesCard marketingOptIn={data.marketingOptIn} />

      {/* ── Card: Zona de peligro ── */}
      <DangerCard />
    </div>
  )
}

// ── Username Card ──
function UsernameCard({ currentUsername, email, emailVerified, provider }: {
  currentUsername: string
  email: string
  emailVerified: boolean
  provider: 'email' | 'google'
}) {
  const [editing, setEditing] = useState(false)
  const [state, formAction, isPending] = useActionState<ProfileActionState, FormData>(
    updateUsername,
    undefined,
  )

  // Close edit mode on success
  if (state?.success && editing) {
    setEditing(false)
  }

  return (
    <Card>
      <SectionLabel>Tu cuenta</SectionLabel>

      {/* Username row */}
      <div style={{ marginBottom: 14 }}>
        <div style={{
          fontFamily: 'var(--font-archivo-narrow), system-ui',
          fontSize: 10,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: P.subDim,
          fontWeight: 600,
          marginBottom: 6,
        }}>
          Nombre de usuario
        </div>

        {editing ? (
          <form action={formAction} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              name="username"
              defaultValue={currentUsername}
              maxLength={20}
              autoFocus
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${P.gold}44`,
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 14,
                color: P.ink,
                fontFamily: 'var(--font-archivo), system-ui',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={isPending}
              style={{
                padding: '8px 14px',
                background: `linear-gradient(180deg, ${P.blue}, ${P.blueDeep})`,
                border: `1px solid ${P.gold}66`,
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 700,
                color: P.ink,
                cursor: isPending ? 'wait' : 'pointer',
                fontFamily: 'var(--font-archivo-narrow), system-ui',
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                opacity: isPending ? 0.6 : 1,
              }}
            >
              {isPending ? '...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              style={{
                padding: '8px 10px',
                background: 'transparent',
                border: `1px solid ${P.line}`,
                borderRadius: 8,
                fontSize: 11,
                color: P.subDim,
                cursor: 'pointer',
                fontFamily: 'var(--font-archivo-narrow), system-ui',
              }}
            >
              ✕
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              fontSize: 16,
              fontWeight: 700,
              color: P.ink,
              fontFamily: 'var(--font-archivo), system-ui',
            }}>
              {currentUsername}
            </span>
            <button
              onClick={() => setEditing(true)}
              style={{
                padding: '5px 12px',
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${P.line}`,
                borderRadius: 8,
                fontSize: 10,
                color: P.sub,
                cursor: 'pointer',
                fontFamily: 'var(--font-archivo-narrow), system-ui',
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              Editar
            </button>
          </div>
        )}

        {/* Error/success feedback */}
        {state?.error && (
          <div style={{ marginTop: 6, fontSize: 11, color: P.red, fontFamily: 'var(--font-archivo), system-ui' }}>
            {state.error}
          </div>
        )}
        {state?.success && state.success !== 'Sin cambios.' && (
          <div style={{ marginTop: 6, fontSize: 11, color: P.green, fontFamily: 'var(--font-archivo), system-ui' }}>
            {state.success}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: P.line, margin: '0 -16px', marginBottom: 14 }} />

      {/* Email row */}
      <div style={{ marginBottom: 14 }}>
        <div style={{
          fontFamily: 'var(--font-archivo-narrow), system-ui',
          fontSize: 10,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: P.subDim,
          fontWeight: 600,
          marginBottom: 6,
        }}>
          Email
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 14,
            color: P.sub,
            fontFamily: 'var(--font-archivo), system-ui',
          }}>
            {email}
          </span>
          {!emailVerified && (
            <span style={{
              fontSize: 9,
              padding: '2px 8px',
              borderRadius: 999,
              background: `${P.gold}22`,
              border: `1px solid ${P.gold}44`,
              color: P.gold,
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontWeight: 700,
              letterSpacing: 0.5,
            }}>
              NO VERIFICADO
            </span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: P.line, margin: '0 -16px', marginBottom: 14 }} />

      {/* Provider row */}
      <div>
        <div style={{
          fontFamily: 'var(--font-archivo-narrow), system-ui',
          fontSize: 10,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: P.subDim,
          fontWeight: 600,
          marginBottom: 6,
        }}>
          Método de acceso
        </div>
        <span style={{
          display: 'inline-block',
          fontSize: 11,
          padding: '4px 10px',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.06)',
          border: `1px solid ${P.line}`,
          color: P.sub,
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontWeight: 500,
        }}>
          {provider === 'google' ? 'Google' : 'Email + Contraseña'}
        </span>
      </div>
    </Card>
  )
}

// ── Preferences Card ──
function PreferencesCard({ marketingOptIn }: { marketingOptIn: boolean }) {
  const [optIn, setOptIn] = useState(marketingOptIn)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    const newValue = !optIn
    setOptIn(newValue) // optimistic update
    startTransition(async () => {
      const result = await updateMarketingOptIn(newValue)
      if (result?.error) {
        setOptIn(!newValue) // revert on error
      }
    })
  }

  return (
    <Card>
      <SectionLabel>Preferencias</SectionLabel>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        <div>
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: P.ink,
            fontFamily: 'var(--font-archivo), system-ui',
            marginBottom: 3,
          }}>
            Emails de marketing
          </div>
          <div style={{
            fontSize: 11,
            color: P.subDim,
            fontFamily: 'var(--font-archivo), system-ui',
            lineHeight: 1.4,
          }}>
            Novedades y promociones. Los emails del juego siempre llegan.
          </div>
        </div>

        {/* Toggle switch */}
        <button
          onClick={handleToggle}
          disabled={isPending}
          role="switch"
          aria-checked={optIn}
          style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            border: 'none',
            background: optIn ? P.green : 'rgba(255,255,255,0.15)',
            cursor: isPending ? 'wait' : 'pointer',
            position: 'relative',
            flexShrink: 0,
            transition: 'background 0.2s',
            opacity: isPending ? 0.5 : 1,
          }}
        >
          <div style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: P.ink,
            position: 'absolute',
            top: 3,
            left: optIn ? 23 : 3,
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }} />
        </button>
      </div>
    </Card>
  )
}

// ── Danger Zone Card ──
function DangerCard() {
  return (
    <Card borderColor={`${P.red}33`} style={{ marginTop: 20 }}>
      <SectionLabel>Zona de peligro</SectionLabel>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Logout */}
        <form action={signOut}>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '10px 14px',
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${P.line}`,
              borderRadius: 10,
              textAlign: 'left',
              fontSize: 13,
              color: P.sub,
              fontFamily: 'var(--font-archivo), system-ui',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Cerrar sesión
          </button>
        </form>

        {/* Delete account — disabled placeholder */}
        <button
          disabled
          style={{
            width: '100%',
            padding: '10px 14px',
            background: 'rgba(255,255,255,0.02)',
            border: `1px solid ${P.red}22`,
            borderRadius: 10,
            textAlign: 'left',
            fontSize: 13,
            color: `${P.red}55`,
            fontFamily: 'var(--font-archivo), system-ui',
            fontWeight: 500,
            cursor: 'not-allowed',
            opacity: 0.5,
          }}
        >
          Eliminar cuenta · Próximamente
        </button>
      </div>
    </Card>
  )
}
