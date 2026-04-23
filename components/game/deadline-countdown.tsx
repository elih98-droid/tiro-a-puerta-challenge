'use client'

/**
 * components/game/deadline-countdown.tsx
 *
 * Shows a live countdown to a pick deadline, updating every second.
 * Turns red when under 5 minutes. Shows "Cerrado" when time is up.
 *
 * Must be a Client Component because it uses setInterval to update state.
 */

import { useState, useEffect } from 'react'

interface DeadlineCountdownProps {
  deadline: string // ISO timestamp
}

export function DeadlineCountdown({ deadline }: DeadlineCountdownProps) {
  const [secondsLeft, setSecondsLeft] = useState(() => getSecondsLeft(deadline))

  useEffect(() => {
    // Update every second
    const interval = setInterval(() => {
      setSecondsLeft(getSecondsLeft(deadline))
    }, 1000)
    return () => clearInterval(interval)
  }, [deadline])

  if (secondsLeft <= 0) {
    return <span className="font-semibold text-red-600">Cerrado</span>
  }

  const hours = Math.floor(secondsLeft / 3600)
  const minutes = Math.floor((secondsLeft % 3600) / 60)
  const seconds = secondsLeft % 60

  // Show hours if there are any, otherwise show MM:SS
  const formatted =
    hours > 0
      ? `${hours}h ${String(minutes).padStart(2, '0')}m`
      : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  const isUrgent = secondsLeft < 5 * 60 // under 5 minutes

  return (
    <span className={isUrgent ? 'font-bold text-red-600' : 'text-gray-700'}>
      {formatted}
    </span>
  )
}

function getSecondsLeft(deadline: string): number {
  return Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000))
}
