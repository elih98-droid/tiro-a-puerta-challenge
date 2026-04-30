'use client'

/**
 * components/game/pick-match-card.tsx
 *
 * Collapsible card for a single match. Shows teams in the header; expands
 * into a 2-column player grid when tapped.
 *
 * Player states (mutually exclusive, priority order):
 *   selected — the confirmed DB pick OR the current client-side selection
 *   burned   — used on a different day (not selectable)
 *   locked   — deadline passed / match live or finished (not selectable)
 *   normal   — available to pick
 */

import { useState, useEffect } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Player {
  id: number
  display_name: string
  position: 'GK' | 'DEF' | 'MID' | 'FWD'
  team_id: number
}

export interface Team {
  id: number
  name: string
  code: string
}

export interface MatchData {
  id: number
  kickoff_time: string
  pick_deadline: string
  status: string
  home_team: Team
  away_team: Team
  players: Player[]
  match_minute: number | null
  home_score: number | null
  away_score: number | null
}

interface PickMatchCardProps {
  match: MatchData
  selectedPlayerId: number | null
  currentPickPlayerId: number | null
  burnedPlayerIds: Set<number>
  positionFilter: string        // 'ALL' | 'GK' | 'DEF' | 'MID' | 'FWD'
  defaultExpanded?: boolean
  onSelect: (playerId: number, matchId: number, deadline: string) => void
}

// ─── Position helpers ─────────────────────────────────────────────────────────

const POS_LABEL: Record<string, string> = { GK: 'POR', DEF: 'DEF', MID: 'MED', FWD: 'DEL' }
const POS_COLOR: Record<string, string> = {
  GK:  '#F4B942',
  DEF: '#5B8DEE',
  MID: '#3CAC3B',
  FWD: '#E61D25',
}
const POS_ORDER: Record<string, number> = { GK: 0, DEF: 1, MID: 2, FWD: 3 }

// ─── Inline countdown hook ────────────────────────────────────────────────────
// DeadlineCountdown uses Tailwind classes; here we need full style control,
// so we compute the countdown inline.

function useCountdown(deadline: string) {
  const calc = () =>
    Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000))
  const [secs, setSecs] = useState(calc)
  useEffect(() => {
    const id = setInterval(() => setSecs(calc()), 1000)
    return () => clearInterval(id)
  }, [deadline]) // eslint-disable-line react-hooks/exhaustive-deps
  return secs
}

function fmtCountdown(s: number): string {
  if (s <= 0) return 'Cerrado'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0
    ? `${h}h ${String(m).padStart(2, '0')}m`
    : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PickMatchCard({
  match,
  selectedPlayerId,
  currentPickPlayerId,
  burnedPlayerIds,
  positionFilter,
  defaultExpanded = false,
  onSelect,
}: PickMatchCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const secsLeft = useCountdown(match.pick_deadline)

  const isLive     = match.status === 'live'
  const isFinished = match.status === 'finished' || match.status === 'suspended'
  const isClosed   = secsLeft <= 0 || isLive || isFinished

  const kickoffLabel = new Date(match.kickoff_time).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const filterFn = (p: Player) => positionFilter === 'ALL' || p.position === positionFilter
  const sortFn   = (a: Player, b: Player) =>
    POS_ORDER[a.position] - POS_ORDER[b.position] ||
    a.display_name.localeCompare(b.display_name)

  const homePlayers = match.players
    .filter(p => p.team_id === match.home_team.id)
    .filter(filterFn).sort(sortFn)
  const awayPlayers = match.players
    .filter(p => p.team_id === match.away_team.id)
    .filter(filterFn).sort(sortFn)

  return (
    <div style={{
      margin: '0 16px 12px',
      background: isLive
        ? 'linear-gradient(180deg, rgba(230,29,37,0.05) 0%, #0F0F1F 100%)'
        : '#11162A',
      border: `1px solid ${isLive ? 'rgba(230,29,37,0.33)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 12,
      overflow: 'hidden',
    }}>

      {/* ── Clickable header ──────────────────────────────────────────────── */}
      <button
        onClick={() => setIsExpanded(p => !p)}
        aria-expanded={isExpanded}
        style={{
          width: '100%', padding: '12px 14px',
          background: 'transparent', border: 'none',
          display: 'flex', alignItems: 'center', gap: 10,
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Team names + live badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            marginBottom: 4, flexWrap: 'wrap',
          }}>
            <TeamCode code={match.home_team.code} />
            <span style={{ fontSize: 13.5, color: '#fff', fontWeight: 700 }}>
              {match.home_team.name}
            </span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>vs</span>
            <span style={{ fontSize: 13.5, color: '#fff', fontWeight: 700 }}>
              {match.away_team.name}
            </span>
            <TeamCode code={match.away_team.code} />

            {isLive && (
              <span style={{
                marginLeft: 2,
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '2px 6px', borderRadius: 3,
                background: 'rgba(230,29,37,0.13)',
                border: '1px solid rgba(230,29,37,0.53)',
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: 8.5, letterSpacing: 1, color: '#E61D25', fontWeight: 700,
              }}>
                <span style={{
                  width: 4, height: 4, borderRadius: 2,
                  background: '#E61D25',
                  animation: 'tpPulse 1s ease-in-out infinite',
                  display: 'inline-block',
                }}/>
                EN VIVO{match.match_minute != null ? ` ${match.match_minute}'` : ''}
              </span>
            )}
          </div>

          {/* Subtitle: score or kickoff + countdown */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            fontSize: 10.5, color: 'rgba(255,255,255,0.5)',
          }}>
            {isLive ? (
              <span style={{ color: '#C9A84C', fontWeight: 700 }}>
                {match.home_score ?? 0}–{match.away_score ?? 0}
              </span>
            ) : (
              <>
                <span style={{ color: '#C9A84C', fontWeight: 700 }}>{kickoffLabel}</span>
                {!isClosed && (
                  <span style={{
                    fontFamily: 'var(--font-jetbrains-mono), monospace',
                    fontSize: 9.5,
                    color: secsLeft < 300 ? '#E61D25' : '#3CAC3B',
                  }}>
                    Cierra en {fmtCountdown(secsLeft)}
                  </span>
                )}
                {isClosed && !isLive && (
                  <span style={{
                    fontFamily: 'var(--font-jetbrains-mono), monospace',
                    fontSize: 9.5, color: 'rgba(255,255,255,0.35)',
                  }}>
                    {isFinished ? 'Finalizado' : 'Cerrado'}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Chevron */}
        <svg
          width="20" height="20" viewBox="0 0 24 24" fill="none"
          style={{
            transform: isExpanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 200ms',
            flexShrink: 0,
          }}
        >
          <path d="M6 9l6 6 6-6" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* ── Players grid (visible when expanded) ─────────────────────────── */}
      {isExpanded && (
        <div style={{ padding: '4px 10px 12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {([
              { team: match.home_team, players: homePlayers },
              { team: match.away_team, players: awayPlayers },
            ] as const).map((col, i) => (
              <div key={i}>
                {/* Team code header */}
                <div style={{
                  padding: '6px 4px 8px',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontSize: 9, letterSpacing: 1.4,
                  color: '#C9A84C', fontWeight: 700,
                }}>
                  {col.team.code}
                </div>

                {/* Players */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {col.players.length === 0 ? (
                    <div style={{
                      fontSize: 11, color: 'rgba(255,255,255,0.3)',
                      padding: 8, textAlign: 'center',
                    }}>—</div>
                  ) : (
                    col.players.map(p => {
                      const isBurned    = burnedPlayerIds.has(p.id)
                      const isCurrentPick = currentPickPlayerId === p.id
                      const isSelected  = selectedPlayerId === p.id

                      let state: 'selected' | 'burned' | 'locked' | 'normal' = 'normal'
                      if (isCurrentPick || isSelected) state = 'selected'
                      else if (isBurned)               state = 'burned'
                      else if (isClosed)               state = 'locked'

                      return (
                        <PlayerRow
                          key={p.id}
                          player={p}
                          state={state}
                          onClick={() => {
                            if (state !== 'burned' && state !== 'locked') {
                              onSelect(p.id, match.id, match.pick_deadline)
                            }
                          }}
                        />
                      )
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── TeamCode ─────────────────────────────────────────────────────────────────

function TeamCode({ code }: { code: string }) {
  return (
    <span style={{
      fontFamily: 'var(--font-jetbrains-mono), monospace',
      fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.55)',
      background: 'rgba(255,255,255,0.06)',
      borderRadius: 3, padding: '1px 5px',
      flexShrink: 0,
    }}>
      {code}
    </span>
  )
}

// ─── PlayerRow ────────────────────────────────────────────────────────────────

function PlayerRow({
  player,
  state,
  onClick,
}: {
  player: Player
  state: 'normal' | 'selected' | 'burned' | 'locked'
  onClick: () => void
}) {
  const selected = state === 'selected'
  const burned   = state === 'burned'
  const locked   = state === 'locked'
  const disabled = burned || locked

  const posColor = POS_COLOR[player.position] || '#fff'
  const posLabel = POS_LABEL[player.position] || player.position

  let bg        = 'transparent'
  let border    = '1px solid rgba(255,255,255,0.06)'
  let textColor = '#fff'
  let nameDeco: 'none' | 'line-through' = 'none'

  if (selected) {
    bg        = 'linear-gradient(180deg, rgba(60,172,59,0.13) 0%, rgba(60,172,59,0.06) 100%)'
    border    = '1.5px solid #3CAC3B'
    textColor = '#A4F0A2'
  } else if (burned) {
    bg        = 'rgba(255,255,255,0.02)'
    border    = '1px solid rgba(255,255,255,0.04)'
    textColor = 'rgba(255,255,255,0.32)'
    nameDeco  = 'line-through'
  } else if (locked) {
    bg        = 'rgba(255,255,255,0.02)'
    border    = '1px solid rgba(255,255,255,0.06)'
    textColor = 'rgba(255,255,255,0.42)'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={
        burned ? 'Ya usaste este jugador en otro día' :
        locked ? 'Partido en curso · no puedes cambiar' : undefined
      }
      style={{
        width: '100%', minHeight: 44, padding: '8px 10px',
        background: bg, border, borderRadius: 8,
        display: 'flex', alignItems: 'center', gap: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        boxShadow: selected ? '0 0 16px rgba(60,172,59,0.2)' : 'none',
        opacity: burned ? 0.7 : 1,
        fontFamily: 'var(--font-archivo), sans-serif',
      }}
    >
      {/* Position badge */}
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        minWidth: 30, height: 17, padding: '0 5px', borderRadius: 4,
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        fontSize: 8.5, fontWeight: 700, letterSpacing: 0.8, flexShrink: 0,
        color:       disabled ? 'rgba(255,255,255,0.35)' : posColor,
        background:  disabled ? 'rgba(255,255,255,0.04)' : `${posColor}1f`,
        border:      `1px solid ${disabled ? 'rgba(255,255,255,0.08)' : posColor + '55'}`,
      }}>
        {posLabel}
      </span>

      {/* Name */}
      <span style={{
        flex: 1, minWidth: 0,
        fontSize: 12.5, fontWeight: 600,
        color: textColor,
        textDecoration: nameDeco,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        letterSpacing: 0.1,
      }}>
        {player.display_name}
      </span>

      {/* State icon */}
      {selected && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" fill="#3CAC3B"/>
          <path d="M7 12.5l3 3 7-7" stroke="#0A0E1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      {burned && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.55 }}>
          <circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="1.8"/>
          <path d="M5.6 5.6L18.4 18.4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      )}
      {locked && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.55 }}>
          <rect x="5" y="11" width="14" height="10" rx="2" stroke="#fff" strokeWidth="2"/>
          <path d="M8 11V8a4 4 0 018 0v3" stroke="#fff" strokeWidth="2"/>
        </svg>
      )}
    </button>
  )
}
