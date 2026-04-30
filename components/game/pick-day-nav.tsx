import Link from 'next/link'
import type { CSSProperties } from 'react'

/**
 * components/game/pick-day-nav.tsx
 *
 * Navigation bar to move between match days on the pick page.
 * Server Component — uses Next.js <Link> for prev/next navigation.
 *
 * URL pattern: /pick (today) or /pick?date=YYYY-MM-DD (specific day)
 */

interface PickDayNavProps {
  matchDate: string   // 'YYYY-MM-DD'
  dayNumber: number
  isToday: boolean
  prevDate: string | null
  nextDate: string | null
}

const BTN: CSSProperties = {
  width: 40, height: 40, borderRadius: 10,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.10)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
}

function ChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function PickDayNav({
  matchDate,
  dayNumber,
  isToday,
  prevDate,
  nextDate,
}: PickDayNavProps) {
  // Parse at noon to avoid timezone-offset date shifts
  const dateLabel = new Date(matchDate + 'T12:00:00').toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

  const subtitle = dayNumber > 0
    ? `● Día ${dayNumber} del torneo${isToday ? ' · Hoy' : ''}`
    : '● Sin partidos'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 16px 14px',
    }}>
      {/* Prev arrow */}
      {prevDate ? (
        <Link
          href={`/pick?date=${prevDate}`}
          style={{ ...BTN, color: '#fff', textDecoration: 'none' }}
        >
          <ChevronLeft />
        </Link>
      ) : (
        <div style={{ ...BTN, color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }}>
          <ChevronLeft />
        </div>
      )}

      {/* Date label */}
      <div style={{ textAlign: 'center', flex: 1 }}>
        <div style={{
          fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
          fontSize: 28, lineHeight: 1, letterSpacing: 1.2, color: '#fff',
          textShadow: '0 0 18px rgba(201,168,76,0.2)',
          textTransform: 'capitalize',
        }}>
          {dateLabel}
        </div>
        <div style={{
          marginTop: 4,
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: 9.5, letterSpacing: 1.6, textTransform: 'uppercase',
          color: '#C9A84C', fontWeight: 700,
        }}>
          {subtitle}
        </div>
      </div>

      {/* Next arrow */}
      {nextDate ? (
        <Link
          href={`/pick?date=${nextDate}`}
          style={{ ...BTN, color: '#fff', textDecoration: 'none' }}
        >
          <ChevronRight />
        </Link>
      ) : (
        <div style={{ ...BTN, color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }}>
          <ChevronRight />
        </div>
      )}
    </div>
  )
}
