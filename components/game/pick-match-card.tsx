'use client'

/**
 * components/game/pick-match-card.tsx
 *
 * Displays a single match with both teams' players.
 * The user clicks a player to "preview" their selection — the pick
 * is not saved until they confirm in the PickClient.
 *
 * Player states (mutually exclusive, in priority order):
 *   current  — the player the user already submitted as today's pick
 *   selected — the player the user clicked (pending confirmation)
 *   burned   — picked on a previous day, not selectable
 *   closed   — match deadline passed, not selectable
 *   available — can be picked
 */

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
  onSelect,
}: PickMatchCardProps) {
  const now = new Date()
  const isDeadlinePassed = new Date(match.pick_deadline) <= now
  const isClosed = isDeadlinePassed || match.status === 'live' || match.status === 'finished'

  // Format kickoff time for display (user's local timezone)
  const kickoffLabel = new Date(match.kickoff_time).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  // Players split by team, sorted by position then name, filtered by positionFilter
  const homePlayers = match.players
    .filter(p => p.team_id === match.home_team.id)
    .filter(p => positionFilter === 'ALL' || p.position === positionFilter)
    .sort((a, b) => POSITION_ORDER[a.position] - POSITION_ORDER[b.position] || a.display_name.localeCompare(b.display_name))

  const awayPlayers = match.players
    .filter(p => p.team_id === match.away_team.id)
    .filter(p => positionFilter === 'ALL' || p.position === positionFilter)
    .sort((a, b) => POSITION_ORDER[a.position] - POSITION_ORDER[b.position] || a.display_name.localeCompare(b.display_name))

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Match header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
        <div>
          <span className="font-semibold text-gray-900">
            {match.home_team.name} vs {match.away_team.name}
          </span>
          <span className="ml-3 text-sm text-gray-500">{kickoffLabel}</span>
        </div>

        <div className="flex items-center gap-3">
          {isClosed ? (
            <span className="text-xs font-semibold uppercase tracking-wide bg-gray-200 text-gray-600 px-2 py-1 rounded">
              {match.status === 'live' ? 'En juego' : 'Cerrado'}
            </span>
          ) : (
            <div className="text-sm">
              <span className="text-gray-500 mr-1">Cierra en</span>
              <DeadlineCountdown deadline={match.pick_deadline} />
            </div>
          )}
        </div>
      </div>

      {/* Players grid — both teams side by side */}
      <div className="grid grid-cols-2 divide-x">
        <TeamPlayerList
          team={match.home_team}
          players={homePlayers}
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
          players={awayPlayers}
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
  // Determine visual state and interactivity
  const isDisabled = isClosed || isBurned

  let buttonClass = 'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left transition-colors '

  if (isCurrentPick) {
    // Already submitted as today's pick
    buttonClass += 'bg-green-100 border border-green-400 text-green-800 font-medium cursor-default'
  } else if (isSelected) {
    // Clicked but not yet confirmed
    buttonClass += 'bg-blue-100 border border-blue-400 text-blue-800 font-medium'
  } else if (isBurned) {
    buttonClass += 'bg-gray-50 text-gray-400 cursor-not-allowed line-through'
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
      {/* Position badge */}
      <span className="text-xs font-bold text-gray-400 w-7 shrink-0">
        {POSITION_LABEL[player.position]}
      </span>

      {/* Player name */}
      <span className="truncate">{player.display_name}</span>

      {/* State indicators */}
      {isCurrentPick && <span className="ml-auto text-green-600">✓</span>}
      {isBurned && <span className="ml-auto text-xs text-gray-400">🔥</span>}
    </button>
  )
}
