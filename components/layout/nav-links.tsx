'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * NavLinks — Tab bar inferior del juego.
 * Rediseñado en tarea 8 para coincidir con el sistema visual aprobado en Claude Design.
 * 4 tabs: Inicio / Pick / Mis Picks / Ranking
 * El tab activo se resalta en dorado (#C9A84C).
 */

const GOLD = '#C9A84C'
const DIM  = 'rgba(255,255,255,0.45)'

// ── Iconos SVG ────────────────────────────────────────────────

function HomeIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 11l9-7 9 7v9a2 2 0 01-2 2h-4v-7H9v7H5a2 2 0 01-2-2v-9z"
        fill={color === GOLD ? `${color}22` : 'none'}
        stroke={color} strokeWidth="2" strokeLinejoin="round"
      />
    </svg>
  )
}

function PickIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <path d="M12 3v18M3 12h18" stroke={color} strokeWidth="1.4" opacity="0.5" />
      <circle cx="12" cy="12" r="2" fill={color} />
    </svg>
  )
}

function MyPicksIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth="2" />
      <path d="M8 8h8M8 12h8M8 16h5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function RankingIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 4h10v5a5 5 0 01-10 0V4z"
        stroke={color} strokeWidth="2" strokeLinejoin="round"
      />
      <path
        d="M7 7H4M17 7h3M10 14h4v4h3v3H7v-3h3v-4z"
        stroke={color} strokeWidth="2" strokeLinejoin="round"
      />
    </svg>
  )
}

const NAV_ITEMS = [
  { href: '/dashboard',   label: 'Inicio',    Icon: HomeIcon    },
  { href: '/pick',        label: 'Pick',      Icon: PickIcon    },
  { href: '/my-picks',    label: 'Mis Picks', Icon: MyPicksIcon },
  { href: '/leaderboard', label: 'Ranking',   Icon: RankingIcon },
] as const

export function NavLinks() {
  const pathname = usePathname()

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      paddingBottom: 'env(safe-area-inset-bottom, 12px)',
      paddingTop: 8,
      background: 'linear-gradient(180deg, transparent, #06080F 28%)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '0.5px solid rgba(255,255,255,0.08)',
      zIndex: 50,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 8px',
        maxWidth: 480,
        margin: '0 auto',
      }}>
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          // Activo si la ruta coincide exactamente (ignora query string — usePathname no la incluye)
          const active = pathname === href
          const color  = active ? GOLD : DIM

          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                padding: '6px 12px',
                borderRadius: 10,
                background: active ? `${GOLD}14` : 'transparent',
                minWidth: 56,
                textDecoration: 'none',
              }}
            >
              <Icon color={color} />
              <span style={{
                fontFamily: 'var(--font-archivo-narrow), system-ui, sans-serif',
                fontSize: 9.5,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                color,
                fontWeight: 700,
              }}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
