'use client'

/**
 * components/game/pick-match-card.tsx
 *
 * Displays a single match. By default collapsed — only the header is visible.
 * The user clicks the header to expand and see both teams' players.
 *
 * Auto-expands if the user already has a pick in this match, so they can
 * see their current selection without having to open it manually.
 *
 * Player states (mutually exclusive, in priority order):
 *   current  — the player the user already submitted as today's pick
 *   selected — the player the user clicked (pending confirmation)
 *   burned   — picked on a previous day, not selectable
 *   closed   — match deadline passed, not selectable
 *   available — can be picked
 */

import { useState } from 'react'
import { DeadlineCountdown } from './deadline-countdown'

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
}

interface PickMatchCardProps {
  match: MatchData
  selectedPlayerId: number | null
  currentPickPlayerId: number | null
  burnedPlayerIds: Set<number>
  positionFilter: string        // 'ALL' | 'GK' | 'DEF' | 'MID' | 'FWD'
  // If true, the card starts expanded (e.g. user already has a pick here)
  defaultExpanded?: boolean
  onSelect: (playerId: number, matchId: number, deadline: string) => void
}

// ─── Position helpers ─────────────────────────────────────────────────────────

const POSITION_ORDER: Record<string, number> = { GK: 0, DEF: 1, MID: 2, FWD: 3 }
const POSITION_LABEL: Record<string, string> = { GK: 'POR', DEF: 'DEF', MID: 'MED', FWD: 'DEL' }

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

  const now = new Date()
  const isDeadlinePassed = new Date(match.pick_deadline) <= now
  const isClosed = isDeadlinePassed || match.status === 'live' || match.status === 'finished'

  // Format kickoff time in the user's local timezone
  const kickoffLabel = new Date(match.kickoff_time).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  })

  // Count available players for the subtitle when collapsed
  const availablePlayers = match.players.filter(
    p => !burnedPlayerIds.has(p.id) && !isClosed
  )

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="border rounded-lg overflow-hidden">

      {/* ── Clickable header ────────────────────────────────────────────── */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        onClick={() => setIsExpanded(prev => !prev)}
        aria-expanded={isExpanded}
      >
        <div>
          {/* Team names */}
          <p className="font-semibold text-gray-900">
            {match.home_team.name} vs {match.away_team.name}
          </p>

          {/* Subtitle: kickoff time + player count or status */}
          <p className="text-xs text-gray-500 mt-0.5">
            {kickoffLabel}
            {isClosed
              ? ' · Cerrado'
              : ` · ${availablePlayers.length} jugador${availablePlayers.length !== 1 ? 'es' : ''} disponible${availablePlayers.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-4">
          {/* Deadline badge or countdown */}
          {isClosed ? (
            <span className="text-xs font-semibold uppercase tracking-wide bg-gray-200 text-gray-600 px-2 py-1 rounded">
              {match.status === 'live' ? 'En juego' : 'Cerrado'}
            </span>
          ) : (
            <div className="text-sm hidden sm:block">
              <span className="text-gray-400 mr-1">Cierra en</span>
              <DeadlineCountdown deadline={match.pick_deadline} />
            </div>
          )}

          {/* Chevron */}
          <span className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </div>
      </button>

      {/* ── Players grid (only visible when expanded) ────────────────────── */}
      {isExpanded && (
        <div>
          {/* Deadline countdown visible on mobile (inside expanded area) */}
          {!isClosed && (
            <div className="px-4 py-2 border-b bg-white text-sm sm:hidden">
              <span className="text-gray-400 mr-1">Cierra en</span>
              <DeadlineCountdown deadline={match.pick_deadline} />
            </div>
          )}

          <div className="grid grid-cols-2 divide-x">
            <TeamPlayerList
              team={match.home_team}
              players={match.players
                .filter(p => p.team_id === match.home_team.id)
                .filter(p => positionFilter === 'ALL' || p.position === positionFilter)
                .sort((a, b) =>
                  POSITION_ORDER[a.position] - POSITION_ORDER[b.position] ||
                  a.display_name.localeCompare(b.display_name)
                )}
              isClosed={isClosed}
              selectedPlayerId={selectedPlayerId}
              currentPickPlayerId={currentPickPlayerId}
              burnedPlayerIds={burnedPlayerIds}
              pickDeadline={match.pick_deadline}
              matchId={match.id}
              onSelect={onSelect}
            />
            <TeamPlayerList
              team={match.away_team}
              players={match.players
                .filter(p => p.team_id === match.away_team.id)
                .filter(p => positionFilter === 'ALL' || p.position === positionFilter)
                .sort((a, b) =>
                  POSITION_ORDER[a.position] - POSITION_ORDER[b.position] ||
                  a.display_name.localeCompare(b.display_name)
                )}
              isClosed={isClosed}
              selectedPlayerId={selectedPlayerId}
              currentPickPlayerId={currentPickPlayerId}
              burnedPlayerIds={burnedPlayerIds}
              pickDeadline={match.pick_deadline}
              matchId={match.id}
              onSelect={onSelect}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── TeamPlayerList ───────────────────────────────────────────────────────────

function TeamPlayerList({
  team,
  players,
  isClosed,
  selectedPlayerId,
  currentPickPlayerId,
  burnedPlayerIds,
  pickDeadline,
  matchId,
  onSelect,
}: {
  team: Team
  players: Player[]
  isClosed: boolean
  selectedPlayerId: number | null
  currentPickPlayerId: number | null
  burnedPlayerIds: Set<number>
  pickDeadline: string
  matchId: number
  onSelect: (playerId: number, matchId: number, deadline: string) => void
}) {
  return (
    <div className="p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
        {team.name}
      </p>

      {players.length === 0 ? (
        <p className="text-xs text-gray-400 italic">Sin jugadores</p>
      ) : (
        <div className="space-y-1">
          {players.map(player => (
            <PlayerButton
              key={player.id}
              player={player}
              isClosed={isClosed}
              isSelected={selectedPlayerId === player.id}
              isCurrentPick={currentPickPlayerId === player.id}
              isBurned={burnedPlayerIds.has(player.id)}
              pickDeadline={pickDeadline}
              matchId={matchId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── PlayerButton ─────────────────────────────────────────────────────────────

function PlayerButton({
  player,
  isClosed,
  isSelected,
  isCurrentPick,
  isBurned,
  pickDeadline,
  matchId,
  onSelect,
}: {
  player: Player
  isClosed: boolean
  isSelected: boolean
  isCurrentPick: boolean
  isBurned: boolean
  pickDeadline: string
  matchId: number
  onSelect: (playerId: number, matchId: number, deadline: string) => void
}) {
  const isDisabled = isClosed || isBurned

  let buttonClass = 'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left transition-colors '

  if (isCurrentPick) {
    buttonClass += 'bg-green-100 border border-green-400 text-green-800 font-medium cursor-default'
  } else if (isSelected) {
    buttonClass += 'bg-blue-100 border border-blue-400 text-blue-800 font-medium'
  } else if (isBurned) {
    buttonClass += 'bg-gray-50 text-red-400 cursor-not-allowed'
  } else if (isClosed) {
    buttonClass += 'bg-gray-50 text-gray-400 cursor-not-allowed'
  } else {
    buttonClass += 'bg-white border border-gray-200 text-gray-800 hover:bg-blue-50 hover:border-blue-300 cursor-pointer'
  }

  return (
    <button
      className={buttonClass}
      disabled={isDisabled}
      onClick={() => onSelect(player.id, matchId, pickDeadline)}
      title={isBurned ? 'Ya elegiste este jugador en un día anterior' : undefined}
    >
      <span className="text-xs font-bold text-gray-400 w-7 shrink-0">
        {POSITION_LABEL[player.position]}
      </span>
      <span className="truncate">
        {player.display_name}
        {isBurned && <span className="ml-1 text-xs">🚫</span>}
      </span>
      {isCurrentPick && <span className="ml-auto text-green-600">✓</span>}
    </button>
  )
}
