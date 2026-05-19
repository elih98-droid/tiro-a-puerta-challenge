'use client'

import { useEffect, useState } from 'react'

/**
 * WorldCupCountdown — Client Component
 *
 * Displays a live countdown to the World Cup opening match.
 * Kicks off: June 11, 2026 at 1:00 PM CDMX (19:00 UTC).
 *
 * Shows days, hours, minutes, and seconds with the brand design system.
 * Once the tournament starts, this component hides itself.
 */

// World Cup kickoff: June 11, 2026 at 19:00 UTC (1:00 PM CDMX)
const KICKOFF_UTC = new Date('2026-06-11T19:00:00Z').getTime()

// Palette (matches dashboard)
const P = {
  gold:     '#C9A84C',
  blue:     '#2A398D',
  blueDeep: '#1B2566',
  panel:    '#11162A',
  green:    '#3CAC3B',
  sub:      'rgba(255,255,255,0.62)',
  subDim:   'rgba(255,255,255,0.42)',
  line:     'rgba(255,255,255,0.08)',
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function getTimeLeft(): TimeLeft | null {
  const diff = KICKOFF_UTC - Date.now()
  if (diff <= 0) return null
  return {
    days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

export function WorldCupCountdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(getTimeLeft)

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Tournament already started — don't show countdown
  if (!timeLeft) return null

  return (
    <div style={{
      margin: '12px 16px 0',
      padding: '20px 18px 22px',
      background: `linear-gradient(135deg, ${P.blueDeep} 0%, ${P.panel} 100%)`,
      border: `1px solid ${P.gold}44`,
      borderRadius: 14,
      position: 'relative',
      overflow: 'hidden',
      zIndex: 2,
    }}>
      {/* Corner accents */}
      <div style={{ position: 'absolute', top: 6, left: 6, width: 14, height: 14, borderTop: `1.5px solid ${P.gold}88`, borderLeft: `1.5px solid ${P.gold}88` }} />
      <div style={{ position: 'absolute', top: 6, right: 6, width: 14, height: 14, borderTop: `1.5px solid ${P.gold}88`, borderRight: `1.5px solid ${P.gold}88` }} />
      <div style={{ position: 'absolute', bottom: 6, left: 6, width: 14, height: 14, borderBottom: `1.5px solid ${P.gold}88`, borderLeft: `1.5px solid ${P.gold}88` }} />
      <div style={{ position: 'absolute', bottom: 6, right: 6, width: 14, height: 14, borderBottom: `1.5px solid ${P.gold}88`, borderRight: `1.5px solid ${P.gold}88` }} />

      {/* Glow */}
      <div style={{
        position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)',
        width: 200, height: 120,
        background: `radial-gradient(ellipse, ${P.gold}20 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <div style={{
          fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
          fontSize: 22, letterSpacing: 2, lineHeight: 1,
          color: '#fff',
        }}>
          EL DESAFÍO COMIENZA EN
        </div>
      </div>

      {/* Countdown grid */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 10,
      }}>
        <CountdownUnit value={timeLeft.days} label="DÍAS" />
        <Separator />
        <CountdownUnit value={timeLeft.hours} label="HRS" />
        <Separator />
        <CountdownUnit value={timeLeft.minutes} label="MIN" />
        <Separator />
        <CountdownUnit value={timeLeft.seconds} label="SEG" />
      </div>

      {/* Date line */}
      <div style={{
        textAlign: 'center',
        marginTop: 16,
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        fontSize: 10, letterSpacing: 1.2,
        color: P.subDim,
      }}>
        11 DE JUNIO, 2026 · 1:00 PM CDMX
      </div>
    </div>
  )
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 56 }}>
      <div style={{
        fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
        fontSize: 42, lineHeight: 1,
        color: P.gold,
        letterSpacing: 1,
        textShadow: `0 0 20px ${P.gold}44`,
      }}>
        {String(value).padStart(2, '0')}
      </div>
      <div style={{
        marginTop: 4,
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        fontSize: 9, letterSpacing: 1.4, fontWeight: 700,
        color: P.sub,
      }}>
        {label}
      </div>
    </div>
  )
}

function Separator() {
  return (
    <div style={{
      fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
      fontSize: 36, lineHeight: 1, color: P.gold,
      opacity: 0.4, alignSelf: 'flex-start', paddingTop: 2,
    }}>
      :
    </div>
  )
}
