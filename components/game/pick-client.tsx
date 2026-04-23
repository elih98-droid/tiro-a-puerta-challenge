'use client'

/**
 * components/game/pick-client.tsx
 *
 * Client Component that manages all the interactivity on the pick page:
 *   - Tracking which player the user has clicked (pending confirmation)
 *   - Filters by position
 *   - Calling the submitPick Server Action on confirmation
 *   - Showing loading/error/success states
 *
 * Receives all data from the Server Component (page.tsx) — no data fetching here.
 *
 * Pattern: Server Component (page.tsx) fetches → passes serializable data →
 *          Client Component handles UI state and user interactions.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { submitPick, removePick } from '@/app/(game)/pick/actions'
import { PickMatchCard, type MatchData, type Player } from './pick-match-card'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MatchDay {
  id: number
  match_date: string
  day_number: number
}

interface CurrentPick {
  player_id: number
  match_id: number
  effective_deadline: string
  is_locked: boolean
  result: string | null
  players: { display_name: string; position: string } | null
}

interface UserStatus {
  is_alive: boolean
  elimination_reason: string | null
  days_survived: number
}

interface PickClientProps {
  matchDay: MatchDay
  matches: MatchData[]
  currentPick: CurrentPick | null
  burnedPlayerIds: number[]
  userStatus: UserStatus | null
  allPlayers: Player[]
  // Whether this day is today or a future day the user is planning ahead
  isToday: boolean
}

// ─── Position filter options ──────────────────────────────────────────────────

const POSITION_FILTERS = [
  { value: 'ALL', label: 'Todos' },
  { value: 'GK', label: 'POR' },
  { value: 'DEF', label: 'DEF' },
  { value: 'MID', label: 'MED' },
  { value: 'FWD', label: 'DEL' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function PickClient({
  matchDay,
  matches,
  currentPick,
  burnedPlayerIds,
  userStatus,
  allPlayers,
  isToday,
}: PickClientProps) {
  // The player the user clicked — pending confirmation (not yet saved)
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null)
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null)
  const [selectedDeadline, setSelectedDeadline] = useState<string | null>(null)

  // Position filter
  const [positionFilter, setPositionFilter] = useState('ALL')

  // Server Action state (submit + remove share the same pending/error state)
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState(false)

  const router = useRouter()
  const burnedSet = new Set(burnedPlayerIds)

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleSelect(playerId: number, matchId: number, deadline: string) {
    // If user clicks the already-selected player, deselect
    if (selectedPlayerId === playerId) {
      setSelectedPlayerId(null)
      setSelectedMatchId(null)
      setSelectedDeadline(null)
      return
    }
    setSelectedPlayerId(playerId)
    setSelectedMatchId(matchId)
    setSelectedDeadline(deadline)
    setActionError(null)
    setActionSuccess(false)
  }

  function handleCancelSelection() {
    setSelectedPlayerId(null)
    setSelectedMatchId(null)
    setSelectedDeadline(null)
    setActionError(null)
  }

  function handleRemovePick() {
    setActionError(null)
    startTransition(async () => {
      const result = await removePick(matchDay.id)
      if (result.error) {
        setActionError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  function handleConfirm() {
    if (!selectedPlayerId || !selectedMatchId || !selectedDeadline) return

    setActionError(null)
    startTransition(async () => {
      const result = await submitPick(
        selectedPlayerId,
        selectedMatchId,
        matchDay.id,
        selectedDeadline,
      )

      if (result.error) {
        setActionError(result.error)
      } else {
        setActionSuccess(true)
        setSelectedPlayerId(null)
        setSelectedMatchId(null)
        setSelectedDeadline(null)
        router.refresh()
      }
    })
  }

  // ── Derived data ──────────────────────────────────────────────────────────

  // Find the full player object for the pending selection (for the confirm panel)
  const selectedPlayer = selectedPlayerId
    ? allPlayers.find(p => p.id === selectedPlayerId) ?? null
    : null

  // Find which team the selected player belongs to (for the confirm panel)
  const selectedPlayerMatch = selectedMatchId
    ? matches.find(m => m.id === selectedMatchId) ?? null
    : null

  const selectedPlayerTeam = selectedPlayer && selectedPlayerMatch
    ? (selectedPlayer.team_id === selectedPlayerMatch.home_team.id
        ? selectedPlayerMatch.home_team
        : selectedPlayerMatch.away_team)
    : null

  // ── Render ────────────────────────────────────────────────────────────────

  // If user is eliminated, show a simple message — no need to render the picker
  if (userStatus && !userStatus.is_alive) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-lg font-semibold text-red-700">Fuiste eliminado del torneo</p>
        <p className="mt-1 text-sm text-red-600">
          {formatEliminationReason(userStatus.elimination_reason)}
        </p>
        <p className="mt-3 text-sm text-gray-500">
          Días sobrevividos: <strong>{userStatus.days_survived}</strong>
        </p>
      </div>
    )
  }

  // When a confirmation panel is visible we add bottom padding so it doesn't
  // cover the last match card on mobile.
  const hasConfirmPanel = !!(selectedPlayer && selectedPlayerTeam && selectedDeadline)

  return (
    <div className={`space-y-6 ${hasConfirmPanel ? 'pb-36' : ''}`}>

      {/* ── Current pick summary ─────────────────────────────────────────── */}
      {currentPick && (
        <div className={`rounded-lg border p-4 ${
          currentPick.is_locked
            ? 'border-gray-300 bg-gray-50'
            : 'border-green-300 bg-green-50'
        }`}>
          <p className="text-sm font-semibold text-gray-600 mb-1">Tu pick de hoy</p>
          <p className="text-lg font-bold text-gray-900">
            {currentPick.players?.display_name}
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({currentPick.players?.position})
            </span>
          </p>

          {currentPick.is_locked ? (
            <p className="mt-1 text-sm text-gray-500">🔒 Pick cerrado — deadline vencido</p>
          ) : (
            <div className="mt-2 flex items-center gap-3 flex-wrap">
              <p className="text-sm text-gray-600">
                {isToday ? 'Puedes cambiar tu pick hasta que venza el deadline.' : 'Pick planeado. Puedes quitarlo para usar este jugador otro día.'}
              </p>
              <button
                onClick={handleRemovePick}
                disabled={isPending}
                className="text-sm text-red-600 hover:text-red-800 underline disabled:opacity-50 shrink-0"
              >
                {isPending ? 'Quitando...' : 'Quitar pick'}
              </button>
            </div>
          )}

          {currentPick.result && (
            <p className="mt-2 text-sm font-semibold">
              {formatPickResult(currentPick.result)}
            </p>
          )}
        </div>
      )}

      {/* ── Success message after confirming ────────────────────────────── */}
      {actionSuccess && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-700 font-medium">
          ✅ Pick guardado correctamente.
        </div>
      )}

      {/* ── Position filter ──────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {POSITION_FILTERS.map(filter => (
          <button
            key={filter.value}
            onClick={() => setPositionFilter(filter.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
              positionFilter === filter.value
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* ── Match cards ─────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {matches.map(match => (
          <PickMatchCard
            key={match.id}
            match={match}
            selectedPlayerId={selectedPlayerId}
            currentPickPlayerId={currentPick?.player_id ?? null}
            burnedPlayerIds={burnedSet}
            positionFilter={positionFilter}
            // Auto-expand the match where the user already has a pick
            defaultExpanded={currentPick?.match_id === match.id}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {/* ── Sticky confirmation panel (fixed at bottom, appears on player click) ── */}
      {hasConfirmPanel && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-blue-400 bg-white shadow-2xl">
          <div className="mx-auto max-w-2xl px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 mb-1">
              Confirmar pick
            </p>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-base font-bold text-gray-900 truncate">
                  {selectedPlayer!.display_name}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({selectedPlayer!.position}) — {selectedPlayerTeam!.name}
                  </span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Deadline:{' '}
                  {new Date(selectedDeadline!).toLocaleTimeString('es-MX', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                {actionError && (
                  <p className="mt-1 text-sm text-red-600 font-medium">{actionError}</p>
                )}
              </div>

              <div className="flex gap-2 shrink-0 mt-0.5">
                <button
                  onClick={handleCancelSelection}
                  disabled={isPending}
                  className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isPending}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? 'Guardando...' : 'Confirmar pick'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEliminationReason(reason: string | null): string {
  const reasons: Record<string, string> = {
    no_pick: 'No hiciste pick a tiempo.',
    no_shot_on_target: 'Tu jugador no registró tiro a puerta.',
    player_did_not_play: 'Tu jugador no jugó.',
    disqualified: 'Fuiste descalificado.',
  }
  return reason ? (reasons[reason] ?? reason) : ''
}

function formatPickResult(result: string): string {
  const results: Record<string, string> = {
    survived: '✅ Sobreviviste',
    eliminated: '❌ Eliminado',
    void_cancelled_match: '⚪ Partido cancelado (pick anulado)',
    void_did_not_play: '⚪ Tu jugador no jugó (pick anulado)',
  }
  return results[result] ?? result
}
