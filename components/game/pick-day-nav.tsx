import Link from 'next/link'

/**
 * components/game/pick-day-nav.tsx
 *
 * Navigation bar to move between match days on the pick page.
 * Renders previous/next arrows as <Link> elements (Server Component —
 * no interactivity needed here, just links).
 *
 * URL pattern: /pick (today) or /pick?date=YYYY-MM-DD (specific day)
 */

interface PickDayNavProps {
  matchDate: string   // 'YYYY-MM-DD'
  dayNumber: number
  isToday: boolean
  prevDate: string | null  // null if no previous match day exists
  nextDate: string | null  // null if no next match day exists
}

export function PickDayNav({
  matchDate,
  dayNumber,
  isToday,
  prevDate,
  nextDate,
}: PickDayNavProps) {
  // Format date for display: "mié 24 abr"
  const dateLabel = new Date(matchDate + 'T12:00:00').toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b mb-6">

      {/* Previous day */}
      {prevDate ? (
        <Link
          href={`/pick?date=${prevDate}`}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Anterior
        </Link>
      ) : (
        <span className="text-sm text-gray-300">← Anterior</span>
      )}

      {/* Current day */}
      <div className="text-center">
        <p className="font-semibold text-gray-900 capitalize">{dateLabel}</p>
        <p className="text-xs text-gray-400">
          {dayNumber > 0 && `Día ${dayNumber}`}
          {isToday && (
            <span className="ml-2 bg-blue-100 text-blue-700 text-xs font-semibold px-1.5 py-0.5 rounded">
              Hoy
            </span>
          )}
        </p>
      </div>

      {/* Next day */}
      {nextDate ? (
        <Link
          href={`/pick?date=${nextDate}`}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          Siguiente →
        </Link>
      ) : (
        <span className="text-sm text-gray-300">Siguiente →</span>
      )}

    </div>
  )
}
