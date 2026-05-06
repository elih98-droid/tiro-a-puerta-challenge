'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import type { CSSProperties } from 'react'

/**
 * components/game/pick-day-nav.tsx
 *
 * Navigation bar to move between match days on the pick page.
 * Client Component — uses useTransition to show loading feedback
 * while the server fetches the new day's data.
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
  cursor: 'pointer',
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

function Spinner() {
  return (
    <div style={{
      width: 14, height: 14,
      borderRadius: '50%',
      border: '2px solid rgba(201,168,76,0.2)',
      borderTopColor: '#C9A84C',
      animation: 'spin 0.7s linear infinite',
      flexShrink: 0,
    }} />
  )
}

export function PickDayNav({
  matchDate,
  dayNumber,
  isToday,
  prevDate,
  nextDate,
}: PickDayNavProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const navigate = (date: string) => {
    startTransition(() => {
      router.push(`/pick?date=${date}`)
    })
  }

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
      opacity: isPending ? 0.7 : 1,
      transition: 'opacity 0.15s ease',
    }}>

      {/* Prev arrow */}
      {prevDate ? (
        <button
          onClick={() => navigate(prevDate)}
          disabled={isPending}
          style={{ ...BTN, color: '#fff', background: 'none', border: '1px solid rgba(255,255,255,0.10)', opacity: isPending ? 0.5 : 1 }}
        >
          <ChevronLeft />
        </button>
      ) : (
        <div style={{ ...BTN, color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }}>
          <ChevronLeft />
        </div>
      )}

      {/* Date label */}
      <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div style={{
          fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
          fontSize: 28, lineHeight: 1, letterSpacing: 1.2, color: '#fff',
          textShadow: '0 0 18px rgba(201,168,76,0.2)',
          textTransform: 'capitalize',
        }}>
          {dateLabel}
        </div>
        <div style={{
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: 9.5, letterSpacing: 1.6, textTransform: 'uppercase',
          color: '#C9A84C', fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {isPending ? <Spinner /> : null}
          {subtitle}
        </div>
      </div>

      {/* Next arrow */}
      {nextDate ? (
        <button
          onClick={() => navigate(nextDate)}
          disabled={isPending}
          style={{ ...BTN, color: '#fff', background: 'none', border: '1px solid rgba(255,255,255,0.10)', opacity: isPending ? 0.5 : 1 }}
        >
          <ChevronRight />
        </button>
      ) : (
        <div style={{ ...BTN, color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }}>
          <ChevronRight />
        </div>
      )}
    </div>
  )
}
