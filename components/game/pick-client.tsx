'use client'

/**
 * components/game/pick-client.tsx
 *
 * Client Component that manages all the interactivity on the pick page:
 *   - Tracking which player the user has clicked (pending confirmation)
 *   - Position filter chips
 *   - Calling the submitPick / removePick Server Actions
 *   - Showing loading / error / success states
 *
 * Receives all data from the Server Component (page.tsx) — no data fetching here.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { submitPick, removePick } from '@/app/(game)/pick/actions'
import { PickMatchCard, type MatchData, type Player } from './pick-match-card'
import { LiveMatchStats } from './live-match-stats'

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
  isToday: boolean
}

// ─── Position filter options ──────────────────────────────────────────────────

const POSITION_FILTERS = [
  { value: 'ALL', label: 'Todos' },
  { value: 'GK',  label: 'POR', color: '#F4B942' },
  { value: 'DEF', label: 'DEF', color: '#5B8DEE' },
  { value: 'MID', label: 'MED', color: '#3CAC3B' },
  { value: 'FWD', label: 'DEL', color: '#E61D25' },
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
  // Pending selection (clicked, not yet confirmed)
  const [selectedPlayerId, setSelectedPlayerId]   = useState<number | null>(null)
  const [selectedMatchId,  setSelectedMatchId]    = useState<number | null>(null)
  const [selectedDeadline, setSelectedDeadline]   = useState<string | null>(null)

  const [positionFilter, setPositionFilter] = useState('ALL')
  const [isPending, startTransition]        = useTransition()
  const [actionError, setActionError]       = useState<string | null>(null)

  const router    = useRouter()
  const burnedSet = new Set(burnedPlayerIds)

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleSelect(playerId: number, matchId: number, deadline: string) {
    if (selectedPlayerId === playerId) {
      // Deselect on second tap
      setSelectedPlayerId(null)
      setSelectedMatchId(null)
      setSelectedDeadline(null)
      return
    }
    setSelectedPlayerId(playerId)
    setSelectedMatchId(matchId)
    setSelectedDeadline(deadline)
    setActionError(null)
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
      const res = await removePick(matchDay.id)
      if (res.error) {
        setActionError(res.error)
      } else {
        router.refresh()
      }
    })
  }

  function handleConfirm() {
    if (!selectedPlayerId || !selectedMatchId || !selectedDeadline) return
    setActionError(null)
    startTransition(async () => {
      const res = await submitPick(
        selectedPlayerId, selectedMatchId, matchDay.id, selectedDeadline,
      )
      if (res.error) {
        setActionError(res.error)
      } else {
        setSelectedPlayerId(null)
        setSelectedMatchId(null)
        setSelectedDeadline(null)
        router.refresh()
        // Scroll to top so the user sees the confirmed pick card (green pill)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    })
  }

  // ── Derived data ──────────────────────────────────────────────────────────

  const selectedPlayer = selectedPlayerId
    ? allPlayers.find(p => p.id === selectedPlayerId) ?? null
    : null

  const selectedPlayerMatch = selectedMatchId
    ? matches.find(m => m.id === selectedMatchId) ?? null
    : null

  const selectedPlayerTeam = selectedPlayer && selectedPlayerMatch
    ? (selectedPlayer.team_id === selectedPlayerMatch.home_team.id
        ? selectedPlayerMatch.home_team
        : selectedPlayerMatch.away_team)
    : null

  const hasConfirmPanel = !!(selectedPlayer && selectedPlayerTeam && selectedDeadline)

  // Pick is locked when the deadline has passed OR the DB flag is set
  const pickIsLocked = currentPick
    ? (currentPick.is_locked || new Date(currentPick.effective_deadline) <= new Date())
    : false

  // ── Eliminated — no picker needed ─────────────────────────────────────────

  if (userStatus && !userStatus.is_alive) {
    return (
      <div style={{
        margin: '16px',
        padding: '24px',
        background: 'rgba(230,29,37,0.08)',
        border: '1px solid rgba(230,29,37,0.28)',
        borderRadius: 12,
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
          fontSize: 22, letterSpacing: 1.2, color: '#E61D25',
        }}>
          FUISTE ELIMINADO
        </div>
        <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
          {formatEliminationReason(userStatus.elimination_reason)}
        </p>
        <p style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
          Días sobrevividos: {userStatus.days_survived}
        </p>
      </div>
    )
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div style={{ paddingBottom: hasConfirmPanel ? 140 : 0 }}>

      {/* ── Confirmed pick card ─────────────────────────────────────────── */}
      {currentPick && (
        <PickConfirmedCard
          pick={currentPick}
          pickIsLocked={pickIsLocked}
          isToday={isToday}
          isPending={isPending}
          actionError={actionError}
          onRemove={handleRemovePick}
        />
      )}

      {/* ── Position filter chips ────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 8, padding: '0 16px 14px',
        overflowX: 'auto', WebkitOverflowScrolling: 'touch',
      }}>
        {POSITION_FILTERS.map(f => {
          const active = positionFilter === f.value
          return (
            <button
              key={f.value}
              onClick={() => setPositionFilter(f.value)}
              style={{
                padding: '8px 14px', borderRadius: 999, flexShrink: 0,
                border: active ? '1.5px solid #C9A84C' : '1px solid rgba(255,255,255,0.14)',
                background: active
                  ? 'linear-gradient(180deg, #2A398D 0%, #1B2566 100%)'
                  : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.62)',
                fontFamily: 'var(--font-archivo), sans-serif',
                fontSize: 12, fontWeight: 700, letterSpacing: 0.6,
                cursor: 'pointer', whiteSpace: 'nowrap',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                boxShadow: active ? '0 0 0 3px rgba(201,168,76,0.13)' : 'none',
              }}
            >
              {'color' in f && (
                <span style={{
                  width: 6, height: 6, borderRadius: 3,
                  background: f.color,
                  display: 'inline-block', flexShrink: 0,
                }}/>
              )}
              {f.label}
            </button>
          )
        })}
      </div>

      {/* ── Match cards ─────────────────────────────────────────────────── */}
      {matches.map(match => (
        <PickMatchCard
          key={match.id}
          match={match}
          selectedPlayerId={selectedPlayerId}
          currentPickPlayerId={currentPick?.player_id ?? null}
          burnedPlayerIds={burnedSet}
          positionFilter={positionFilter}
          defaultExpanded={currentPick?.match_id === match.id}
          onSelect={handleSelect}
        />
      ))}

      {/* ── Sticky confirmation panel ────────────────────────────────────── */}
      {hasConfirmPanel && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          background: 'linear-gradient(180deg, rgba(24,28,54,0.96) 0%, #0B0D18 100%)',
          borderTop: '1.5px solid rgba(201,168,76,0.35)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 12px) + 68px)', // clear bottom nav
        }}>
          <div style={{ maxWidth: 480, margin: '0 auto', padding: '14px 16px 0' }}>

            <div style={{
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 9, letterSpacing: 1.6, color: '#C9A84C', fontWeight: 700,
              marginBottom: 8,
            }}>
              ● CONFIRMAR PICK
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
                  fontSize: 20, letterSpacing: 0.5, color: '#fff', lineHeight: 1.1,
                }}>
                  {selectedPlayer!.display_name}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                  {selectedPlayerTeam!.name} · Cierra{' '}
                  {new Date(selectedDeadline!).toLocaleTimeString('es-MX', {
                    hour: '2-digit', minute: '2-digit',
                  })}
                </div>
                {actionError && (
                  <p style={{
                    marginTop: 4, fontSize: 11.5, color: '#E61D25', fontWeight: 600,
                  }}>
                    {actionError}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginTop: 2 }}>
                <button
                  onClick={handleCancelSelection}
                  disabled={isPending}
                  style={{
                    padding: '10px 14px',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 8,
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: 12, fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-archivo), sans-serif',
                    opacity: isPending ? 0.5 : 1,
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isPending}
                  style={{
                    padding: '10px 18px',
                    background: 'linear-gradient(180deg, #2A398D 0%, #1B2566 100%)',
                    border: '1.5px solid #C9A84C',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 12, fontWeight: 700,
                    cursor: isPending ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-archivo), sans-serif',
                    letterSpacing: 0.4,
                    opacity: isPending ? 0.6 : 1,
                  }}
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

// ─── PickConfirmedCard ────────────────────────────────────────────────────────

function PickConfirmedCard({
  pick,
  pickIsLocked,
  isToday,
  isPending,
  actionError,
  onRemove,
}: {
  pick: CurrentPick
  pickIsLocked: boolean
  isToday: boolean
  isPending: boolean
  actionError: string | null
  onRemove: () => void
}) {
  return (
    <div style={{
      margin: '0 16px 14px',
      padding: 14,
      background: 'linear-gradient(135deg, rgba(60,172,59,0.1) 0%, #0A1410 100%)',
      border: '1.5px solid #3CAC3B',
      borderRadius: 12,
      position: 'relative', overflow: 'hidden',
      boxShadow: pickIsLocked
        ? '0 0 0 3px rgba(60,172,59,0.13), 0 0 24px rgba(60,172,59,0.27)'
        : '0 0 16px rgba(60,172,59,0.13)',
      animation: pickIsLocked ? 'pickLivePulse 2s ease-in-out infinite' : 'none',
    }}>
      {/* Decorative glow blob */}
      <div style={{
        position: 'absolute', top: -30, right: -30, width: 120, height: 120,
        background: 'radial-gradient(circle, rgba(60,172,59,0.2), transparent 65%)',
        pointerEvents: 'none',
      }}/>

      {/* Header row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <div style={{
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: 9.5, letterSpacing: 1.6, color: '#C9A84C', fontWeight: 700,
        }}>
          ● TU PICK DE HOY
        </div>
        {pick.result && (
          <div style={{
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: 9, letterSpacing: 1, fontWeight: 700,
            color: pick.result === 'survived' ? '#3CAC3B' : '#E61D25',
          }}>
            {formatPickResult(pick.result)}
          </div>
        )}
      </div>

      {/* Player name */}
      <div style={{
        fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
        fontSize: 22, letterSpacing: 0.6, color: '#fff', lineHeight: 1, marginBottom: 6,
      }}>
        {pick.players?.display_name ?? '—'}
      </div>

      {/* Planned state: info + remove button */}
      {!pickIsLocked && (
        <>
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>
            {isToday
              ? 'Pick planeado. Puedes cambiarlo antes del kickoff.'
              : 'Pick planeado. Puedes quitarlo para usar este jugador otro día.'}
          </div>
          {actionError && (
            <p style={{ marginTop: 6, fontSize: 11.5, color: '#E61D25', fontWeight: 600 }}>
              {actionError}
            </p>
          )}
          <button
            onClick={onRemove}
            disabled={isPending}
            style={{
              marginTop: 10,
              background: 'transparent', border: 'none', padding: 0,
              color: 'rgba(230,29,37,0.8)',
              fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
              textTransform: 'uppercase',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              cursor: isPending ? 'not-allowed' : 'pointer',
              textDecoration: 'underline', textUnderlineOffset: 3,
              opacity: isPending ? 0.5 : 1,
            }}
          >
            {isPending ? 'Quitando...' : 'Quitar pick'}
          </button>
        </>
      )}

      {/* Locked state: live stats block */}
      {pickIsLocked && (
        <div style={{
          marginTop: 10,
          padding: '10px 12px',
          background: 'rgba(0,0,0,0.32)',
          border: '1px solid rgba(60,172,59,0.27)',
          borderRadius: 10,
        }}>
          <LiveMatchStats
            matchId={pick.match_id}
            playerId={pick.player_id}
          />
        </div>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEliminationReason(reason: string | null): string {
  const reasons: Record<string, string> = {
    no_pick:              'No hiciste pick a tiempo.',
    no_shot_on_target:    'Tu jugador no registró tiro a puerta.',
    player_did_not_play:  'Tu jugador no jugó.',
    disqualified:         'Fuiste descalificado.',
  }
  return reason ? (reasons[reason] ?? reason) : ''
}

function formatPickResult(result: string): string {
  const results: Record<string, string> = {
    survived:            '✅ SOBREVIVISTE',
    eliminated:          '❌ ELIMINADO',
    void_cancelled_match: '⚪ ANULADO',
    void_did_not_play:   '⚪ ANULADO',
  }
  return results[result] ?? result
}
