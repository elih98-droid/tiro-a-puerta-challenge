import Link from 'next/link'
import { NavLinks } from '@/components/layout/nav-links'
import { TPMark } from '@/components/brand/tp-mark'

/**
 * Layout del juego — shell oscuro compartido por todas las páginas del juego
 * (/dashboard, /pick, /my-picks, /leaderboard).
 *
 * Incluye:
 *   - Barra de marca superior fija (TPMark + wordmark) — identidad visual en todas las pestañas
 *   - Nav inferior fijo (NavLinks)
 *
 * El nav inferior es un Client Component (necesita usePathname).
 * El layout en sí es un Server Component.
 *
 * paddingBottom: 88px en el contenido para que no quede tapado por el nav fijo.
 */
export default function GameLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{
      minHeight: '100svh',
      background: '#0A0E1A',
      color: '#fff',
      paddingBottom: 88,
    }}>
      {/* ── Barra de marca superior ───────────────────────────────────────── */}
      <Link href="/dashboard" style={{ textDecoration: 'none' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
          padding: '14px 16px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: 'linear-gradient(180deg, rgba(42,57,141,0.18) 0%, transparent 100%)',
        }}>
          <TPMark size={44} showGoalLine={false} />
          <div>
            <div style={{
              fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
              fontSize: 22, letterSpacing: 2.2, color: '#fff', lineHeight: 1,
            }}>
              TIRO A PUERTA
            </div>
            <div style={{
              fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
              fontSize: 12, letterSpacing: 3.5, color: '#C9A84C', lineHeight: 1,
              marginTop: 3,
            }}>
              CHALLENGE
            </div>
          </div>
        </div>
      </Link>

      {children}
      <NavLinks />
    </div>
  )
}
