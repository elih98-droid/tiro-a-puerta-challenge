'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useTransition } from 'react'

/**
 * RivalsView — "Rivales 🔥" tab content.
 *
 * Shows the distribution of picks for a given match day.
 * Only includes picks whose effective_deadline has already passed
 * (progressive reveal per match). Horizontal bar chart sorted by %.
 *
 * Client Component for day navigation with useTransition.
 */

// ── Paleta ──
const P = {
  blue:     '#2A398D',
  blueDeep: '#1B2566',
  gold:     '#C9A84C',
  green:    '#3CAC3B',
  red:      '#E61D25',
  panel:    '#181C36',
  line:     'rgba(255,255,255,0.08)',
  ink:      '#fff',
  sub:      'rgba(255,255,255,0.62)',
  subDim:   'rgba(255,255,255,0.42)',
}

const POS_LABEL: Record<string, string> = { GK: 'POR', DEF: 'DEF', MID: 'MED', FWD: 'DEL' }
const POS_COLOR: Record<string, string> = {
  GK:  '#F4B942',
  DEF: '#5B8DEE',
  MID: '#3CAC3B',
  FWD: '#E61D25',
}

// ── Types ──
export type RivalPick = {
  playerName: string
  position: string
  teamName: string
  count: number
  percentage: number
  shotsOnTarget: number
  goals: number
  matchStatus: string       // 'scheduled' | 'live' | 'finished' | 'suspended' | 'cancelled'
  matchMinute: number | null
}

export type RivalsData = {
  matchDate: string
  dayNumber: number
  isToday: boolean
  prevDate: string | null
  nextDate: string | null
  totalRevealed: number
  totalAlive: number
  picks: RivalPick[]
  pendingMatches: number // matches whose deadline hasn't passed yet
  hasLiveMatches: boolean
}

// ── Day Nav (inline, simplified from pick-day-nav) ──

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

const BTN = {
  width: 40, height: 40, borderRadius: 10,
  background: 'none',
  border: '1px solid rgba(255,255,255,0.10)',
  display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
  flexShrink: 0,
  cursor: 'pointer' as const,
}

export function RivalsView({ data }: { data: RivalsData }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Poll every 60s when matches are live — re-fetches server data
  useEffect(() => {
    if (!data.hasLiveMatches) return
    const interval = setInterval(() => {
      router.refresh()
    }, 60_000)
    return () => clearInterval(interval)
  }, [data.hasLiveMatches, router])

  const navigate = (date: string) => {
    startTransition(() => {
      router.push(`/my-picks?tab=rivals&date=${date}`)
    })
  }

  const dateLabel = new Date(data.matchDate + 'T12:00:00').toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

  return (
    <div style={{ paddingTop: 12 }}>
      {/* ── Day navigation ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px 14px',
        opacity: isPending ? 0.7 : 1,
        transition: 'opacity 0.15s ease',
      }}>
        {data.prevDate ? (
          <button
            onClick={() => navigate(data.prevDate!)}
            disabled={isPending}
            style={{ ...BTN, color: P.ink, opacity: isPending ? 0.5 : 1 }}
          >
            <ChevronLeft />
          </button>
        ) : (
          <div style={{ ...BTN, color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }}>
            <ChevronLeft />
          </div>
        )}

        <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{
            fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
            fontSize: 26, lineHeight: 1, letterSpacing: 1.2, color: P.ink,
            textTransform: 'capitalize',
          }}>
            {dateLabel}
          </div>
          <div style={{
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: 9.5, letterSpacing: 1.6, textTransform: 'uppercase',
            color: P.gold, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {isPending ? <Spinner /> : null}
            {data.dayNumber > 0 ? `● Día ${data.dayNumber}${data.isToday ? ' · Hoy' : ''}` : '● Sin partidos'}
          </div>
        </div>

        {data.nextDate ? (
          <button
            onClick={() => navigate(data.nextDate!)}
            disabled={isPending}
            style={{ ...BTN, color: P.ink, opacity: isPending ? 0.5 : 1 }}
          >
            <ChevronRight />
          </button>
        ) : (
          <div style={{ ...BTN, color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }}>
            <ChevronRight />
          </div>
        )}
      </div>

      {/* ── Summary pill ── */}
      {data.totalRevealed > 0 && (
        <div style={{
          padding: '0 16px 12px',
          display: 'flex', gap: 8, flexWrap: 'wrap',
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 6,
            background: `${P.blue}22`,
            border: `1px solid ${P.blue}44`,
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: 9.5, letterSpacing: 1, fontWeight: 700,
            color: P.sub,
          }}>
            {data.totalRevealed} pick{data.totalRevealed !== 1 ? 's' : ''} revelado{data.totalRevealed !== 1 ? 's' : ''}
          </span>
          {data.pendingMatches > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 6,
              background: `${P.gold}15`,
              border: `1px solid ${P.gold}44`,
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 9.5, letterSpacing: 1, fontWeight: 700,
              color: P.gold,
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: 3,
                background: P.gold,
                animation: 'tpPulse 1.5s ease-in-out infinite',
                display: 'inline-block',
              }} />
              {data.pendingMatches} partido{data.pendingMatches !== 1 ? 's' : ''} por revelar
            </span>
          )}
        </div>
      )}

      {/* ── Bar chart ── */}
      <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.picks.length === 0 ? (
          <EmptyState
            dayNumber={data.dayNumber}
            pendingMatches={data.pendingMatches}
          />
        ) : (
          data.picks.map((pick, i) => (
            <PickBar key={pick.playerName + pick.teamName} pick={pick} rank={i + 1} />
          ))
        )}
      </div>
    </div>
  )
}

// ── Pick bar ──

function PickBar({ pick, rank }: { pick: RivalPick; rank: number }) {
  const isTop = rank <= 3
  const posColor = POS_COLOR[pick.position] || P.sub
  const posLabel = POS_LABEL[pick.position] || pick.position

  // Bar color based on rank
  const barColor = rank === 1 ? P.gold : rank === 2 ? P.blue : rank === 3 ? P.green : 'rgba(255,255,255,0.15)'
  const barBg = rank === 1 ? `${P.gold}20` : 'transparent'

  const isLive = pick.matchStatus === 'live'
  const isFinished = pick.matchStatus === 'finished'
  const isStarted = isLive || isFinished
  const hasShotOnTarget = pick.shotsOnTarget > 0

  return (
    <div style={{
      background: barBg || P.panel,
      border: `1px solid ${rank === 1 ? `${P.gold}44` : P.line}`,
      borderRadius: 10,
      padding: '10px 12px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background bar (the percentage fill) */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, bottom: 0,
        width: `${pick.percentage}%`,
        background: `${barColor}18`,
        borderRadius: 10,
        transition: 'width 0.4s ease',
      }} />

      {/* Content row */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        {/* Rank number */}
        <div style={{
          fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
          fontSize: isTop ? 22 : 16,
          color: rank === 1 ? P.gold : P.sub,
          width: 24,
          textAlign: 'center',
          flexShrink: 0,
          lineHeight: 1,
          ...(rank === 1 ? { textShadow: `0 0 12px ${P.gold}44` } : {}),
        }}>
          {rank}
        </div>

        {/* Player info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <span style={{
              fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
              fontSize: isTop ? 18 : 15,
              letterSpacing: 0.5,
              color: rank === 1 ? P.gold : P.ink,
              lineHeight: 1,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {pick.playerName}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 26, height: 15, padding: '0 4px', borderRadius: 3,
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 7.5, fontWeight: 700, letterSpacing: 0.6,
              color: posColor,
              background: `${posColor}1f`,
              border: `1px solid ${posColor}44`,
              flexShrink: 0,
            }}>
              {posLabel}
            </span>
          </div>
          <div style={{
            fontSize: 10, color: P.subDim,
            fontFamily: 'var(--font-archivo), system-ui',
            marginTop: 2,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {pick.teamName}
            </span>
            {/* Match status badge */}
            {isLive && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: 8, fontWeight: 700, letterSpacing: 0.8,
                color: P.red,
                flexShrink: 0,
              }}>
                <span style={{
                  width: 4, height: 4, borderRadius: 2,
                  background: P.red,
                  animation: 'tpPulse 1.4s ease-in-out infinite',
                  display: 'inline-block',
                }} />
                {pick.matchMinute ? `${pick.matchMinute}'` : 'VIVO'}
              </span>
            )}
            {isFinished && (
              <span style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: 8, fontWeight: 700, letterSpacing: 0.8,
                color: P.subDim,
                flexShrink: 0,
              }}>
                FT
              </span>
            )}
          </div>
        </div>

        {/* Stats + Percentage */}
        <div style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          {/* Live stats (only shown once the match has started) */}
          {isStarted && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {/* Shots on target */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 3,
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: 11, fontWeight: 700,
                color: hasShotOnTarget ? P.green : (isFinished ? P.red : P.subDim),
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="4" fill="currentColor"/>
                </svg>
                {pick.shotsOnTarget}
              </div>
              {/* Goals */}
              {pick.goals > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontSize: 11, fontWeight: 700,
                  color: P.gold,
                  textShadow: `0 0 8px ${P.gold}44`,
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 2l2.5 7.5H22l-6 4.5 2.5 7.5L12 17l-6.5 4.5L8 14 2 9.5h7.5z" fill="currentColor" opacity="0.6"/>
                  </svg>
                  {pick.goals}
                </div>
              )}
            </div>
          )}

          {/* Percentage */}
          <div style={{ textAlign: 'right', minWidth: 36 }}>
            <span style={{
              fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
              fontSize: isTop ? 24 : 18,
              color: rank === 1 ? P.gold : P.ink,
              lineHeight: 1,
              ...(rank === 1 ? { textShadow: `0 0 12px ${P.gold}44` } : {}),
            }}>
              {pick.percentage}
            </span>
            <span style={{
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 9,
              color: P.subDim,
              marginLeft: 1,
            }}>
              %
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Empty state ──

function EmptyState({ dayNumber, pendingMatches }: { dayNumber: number; pendingMatches: number }) {
  if (dayNumber === 0) {
    return (
      <div style={{
        padding: '40px 24px',
        background: P.panel,
        border: `1px solid ${P.line}`,
        borderRadius: 16,
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
          fontSize: 18, letterSpacing: 1, color: P.subDim,
        }}>
          SIN PARTIDOS ESTE DÍA
        </div>
      </div>
    )
  }

  if (pendingMatches > 0) {
    return (
      <div style={{
        padding: '40px 24px',
        background: P.panel,
        border: `1px solid ${P.gold}33`,
        borderRadius: 16,
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
          fontSize: 18, letterSpacing: 1, color: P.gold,
          marginBottom: 8,
        }}>
          PICKS AÚN NO REVELADOS
        </div>
        <div style={{
          fontSize: 12, color: P.sub, lineHeight: 1.5,
          fontFamily: 'var(--font-archivo), system-ui',
        }}>
          Los picks se revelan 5 minutos antes de cada partido.
        </div>
      </div>
    )
  }

  return (
    <div style={{
      padding: '40px 24px',
      background: P.panel,
      border: `1px solid ${P.line}`,
      borderRadius: 16,
      textAlign: 'center',
    }}>
      <div style={{
        fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
        fontSize: 18, letterSpacing: 1, color: P.subDim,
      }}>
        NADIE HIZO PICK ESTE DÍA
      </div>
    </div>
  )
}
