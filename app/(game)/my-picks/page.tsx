import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

/**
 * app/(game)/my-picks/page.tsx
 *
 * Private page — /my-picks
 *
 * Shows a chronological summary (most recent first) of all picks the user
 * has made, including pre-picks for future days. Each row shows:
 *   - Match day number and date
 *   - Player name, position, and team
 *   - Pick status: Pendiente / Evaluando... / Sobreviviste / Eliminado / Anulado
 *   - Shots on target and goals (once the pick has been evaluated)
 *
 * All listed players are "burned" — they cannot be reused. The count at
 * the top gives the user a quick reminder of how many players are off the table.
 *
 * This is a Server Component — no client state needed.
 */
export default async function MyPicksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch all picks for this user, newest day first.
  // We join match_days (for date + day number) and players → teams
  // (for display name, position, team name).
  // shots_on_target_count and goals_scored are already on user_picks —
  // they're copied from player_match_stats when the pick is evaluated.
  const { data: rawPicks } = await supabase
    .from('user_picks')
    .select(`
      id,
      match_day_id,
      is_locked,
      result,
      shots_on_target_count,
      goals_scored,
      effective_deadline,
      match_days ( match_date, day_number ),
      players (
        display_name,
        position,
        teams ( name )
      )
    `)
    .eq('user_id', user!.id)
    .order('match_day_id', { ascending: false })

  const picks = rawPicks ?? []

  // ── Empty state ───────────────────────────────────────────────────────────
  if (picks.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Mis picks</h1>
        <p className="text-gray-500 mb-4">Aún no has hecho ningún pick.</p>
        <Link
          href="/pick"
          className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition-colors"
        >
          Elegir jugador →
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Mis picks</h1>
      <p className="text-sm text-gray-400 mb-6">
        {picks.length} jugador{picks.length !== 1 ? 'es' : ''} usado{picks.length !== 1 ? 's' : ''}{' '}
        — no puedes volver a elegirlos.
      </p>

      <ul className="space-y-3">
        {picks.map((pick) => {
          // Supabase returns relations as objects (not arrays) when using
          // a FK with a unique/single result — cast with type assertions.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const matchDay = pick.match_days as any
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const player = pick.players as any
          const teamName: string = player?.teams?.name ?? '—'

          // Format date label: "mié 23 abr" — the +T12:00:00 avoids UTC-offset
          // shifting the date to the wrong day when parsed as midnight UTC.
          const dateLabel = matchDay?.match_date
            ? new Date(matchDay.match_date + 'T12:00:00').toLocaleDateString('es-MX', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })
            : '—'

          const status = resolveStatus(pick.result, pick.is_locked)

          return (
            <li
              key={pick.id}
              className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            >
              {/* Left: day + player info */}
              <div className="flex flex-col gap-0.5">
                {/* Day label */}
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                  {matchDay ? `Día ${matchDay.day_number} · ${dateLabel}` : '—'}
                </p>

                {/* Player name + position + team */}
                <p className="text-base font-semibold text-gray-900">
                  {player?.display_name ?? '—'}
                  <span className="ml-2 text-xs font-medium text-gray-400">
                    {player?.position}
                  </span>
                </p>
                <p className="text-sm text-gray-500">{teamName}</p>

                {/* Stats — only shown once the pick has been evaluated */}
                {pick.result !== null && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    🎯 {pick.shots_on_target_count ?? 0} tiro{(pick.shots_on_target_count ?? 0) !== 1 ? 's' : ''} a puerta
                    {' · '}
                    ⚽ {pick.goals_scored ?? 0} gol{(pick.goals_scored ?? 0) !== 1 ? 'es' : ''}
                  </p>
                )}
              </div>

              {/* Right: status badge */}
              <div className="sm:text-right">
                <StatusBadge status={status} />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Status resolution
// ──────────────────────────────────────────────────────────────────────────────

type PickStatus =
  | 'survived'
  | 'eliminated'
  | 'void'
  | 'evaluating'
  | 'pending'

/**
 * Maps the DB fields (result + is_locked) to a display status.
 *
 * result !== null  → pick was evaluated: survived / eliminated / void
 * result === null + is_locked → waiting for evaluation (match finished, 24h window)
 * result === null + !is_locked → future pre-pick or today before deadline
 */
function resolveStatus(
  result: string | null,
  isLocked: boolean,
): PickStatus {
  if (result === 'survived') return 'survived'
  if (result === 'eliminated') return 'eliminated'
  if (result === 'void_cancelled_match' || result === 'void_did_not_play') return 'void'
  if (isLocked) return 'evaluating'
  return 'pending'
}

// ──────────────────────────────────────────────────────────────────────────────
// Status badge component
// ──────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PickStatus }) {
  const config: Record<PickStatus, { label: string; className: string }> = {
    survived: {
      label: '✓ Sobreviviste',
      className: 'bg-green-100 text-green-700',
    },
    eliminated: {
      label: '✗ Eliminado',
      className: 'bg-red-100 text-red-700',
    },
    void: {
      label: 'Anulado',
      className: 'bg-gray-100 text-gray-500',
    },
    evaluating: {
      label: 'Evaluando...',
      className: 'bg-yellow-100 text-yellow-700',
    },
    pending: {
      label: 'Pendiente',
      className: 'bg-blue-100 text-blue-700',
    },
  }

  const { label, className } = config[status]

  return (
    <span
      className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${className}`}
    >
      {label}
    </span>
  )
}
