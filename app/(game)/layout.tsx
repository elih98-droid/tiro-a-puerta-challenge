import Link from 'next/link'
import { NavLinks } from '@/components/layout/nav-links'
import { TPMark } from '@/components/brand/tp-mark'

/**
 * Layout del juego — shell oscuro compartido por todas las páginas del juego
 * (/dashboard, /pick, /my-picks, /leaderboard).
 *
 * Responsividad:
 *   - Mobile: contenido ocupa el ancho completo.
 *   - Desktop: contenido centrado a max-width 480px, fondo oscuro de borde a borde.
 *
 * El brand bar tiene fondo/borde full-width pero el contenido (logo + wordmark)
 * se centra dentro del mismo max-width que el resto.
 *
 * paddingBottom: 88px en el contenido para que no quede tapado por el nav fijo.
 */

const MAX_WIDTH = 480

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
    }}>

      {/* ── Barra de marca superior — fondo full-width, contenido centrado ─ */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'linear-gradient(180deg, rgba(42,57,141,0.18) 0%, transparent 100%)',
      }}>
        <div style={{ maxWidth: MAX_WIDTH, margin: '0 auto' }}>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
              padding: '14px 16px',
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
        </div>
      </div>

      {/* ── Contenido centrado ─────────────────────────────────────────────── */}
      <div style={{ maxWidth: MAX_WIDTH, margin: '0 auto', paddingBottom: 88 }}>
        {children}
      </div>

      <NavLinks />
    </div>
  )
}
