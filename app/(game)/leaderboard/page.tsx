import { createClient } from '@/lib/supabase/server'

/**
 * app/(game)/leaderboard/page.tsx
 *
 * Public ranking of all participants.
 *
 * Ordering (game-rules.md §5.1):
 *   1. Alive users first (is_alive DESC)
 *   2. Then by total goals accumulated DESC (tiebreaker)
 *   3. Then by days survived DESC (secondary tiebreaker)
 *
 * Pick visibility (game-rules.md §10.1):
 *   Picks are private until their deadline passes. RLS enforces this at the
 *   DB level — user_picks rows with is_locked = FALSE from other users are
 *   not returned. No extra filtering needed here.
 *
 * This is a Server Component — the ranking is the same for everyone,
 * no client state needed. We do highlight the current user's row.
 */
export default async function LeaderboardPage() {
  const supabase = await createClient()
  // user may be null — leaderboard is publicly accessible without auth.
  const { data: { user } } = await supabase.auth.getUser()

  // ── 1. Fetch all participants ranked ───────────────────────────────────────
  // We join user_status → users to get the username.
  // Multiple .order() calls stack as ORDER BY clauses.
  const { data: rows, error } = await supabase
    .from('user_status')
    .select(`
      user_id,
      is_alive,
      days_survived,
      total_goals_accumulated,
      elimination_reason,
      users ( username )
    `)
    .order('is_alive', { ascending: false })
    .order('total_goals_accumulated', { ascending: false })
    .order('days_survived', { ascending: false })

  if (error || !rows) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Leaderboard</h1>
        <p className="text-gray-500">No se pudo cargar el leaderboard. Intenta de nuevo.</p>
      </div>
    )
  }

  // ── 2. Compute summary counts ──────────────────────────────────────────────
  const totalParticipants = rows.length
  const aliveCount = rows.filter(r => r.is_alive).length

  // ── 3. Assign rank — only alive users get a numeric rank.
  //    Eliminated users are shown below but their rank is shown as '—'.
  let aliveRank = 0
  const ranked = rows.map(row => {
    if (row.is_alive) aliveRank++
    return { ...row, rank: row.is_alive ? aliveRank : null }
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Leaderboard</h1>
      <p className="text-sm text-gray-400 mb-6">
        {totalParticipants} participante{totalParticipants !== 1 ? 's' : ''}
        {' · '}
        <span className="text-green-600 font-medium">{aliveCount} vivo{aliveCount !== 1 ? 's' : ''}</span>
        {aliveCount < totalParticipants && (
          <>
            {' · '}
            <span className="text-red-500 font-medium">
              {totalParticipants - aliveCount} eliminado{(totalParticipants - aliveCount) !== 1 ? 's' : ''}
            </span>
          </>
        )}
      </p>

      {/* Empty state */}
      {rows.length === 0 && (
        <p className="text-gray-500">Aún no hay participantes registrados.</p>
      )}

      {/* Ranking table */}
      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-10">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Jugador
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Días
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Goles
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ranked.map((row) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const username = (row.users as any)?.username ?? '—'
                const isCurrentUser = !!user && row.user_id === user.id

                return (
                  <tr
                    key={row.user_id}
                    className={[
                      'transition-colors',
                      isCurrentUser
                        ? 'bg-blue-50'
                        : row.is_alive
                          ? 'bg-white hover:bg-gray-50'
                          : 'bg-gray-50 opacity-60',
                    ].join(' ')}
                  >
                    {/* Rank */}
                    <td className="px-4 py-3 text-gray-400 font-medium">
                      {row.rank ?? '—'}
                    </td>

                    {/* Username */}
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {username}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs text-blue-500 font-normal">tú</span>
                      )}
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3 text-center">
                      {row.is_alive ? (
                        <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          Vivo
                        </span>
                      ) : (
                        <span
                          className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600"
                          title={formatEliminationReason(row.elimination_reason)}
                        >
                          Eliminado
                        </span>
                      )}
                    </td>

                    {/* Days survived */}
                    <td className="px-4 py-3 text-right text-gray-600 tabular-nums">
                      {row.days_survived}
                    </td>

                    {/* Goals accumulated */}
                    <td className="px-4 py-3 text-right text-gray-600 tabular-nums">
                      {row.total_goals_accumulated}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <p className="text-xs text-gray-400 mt-4">
        Ordenado por: vivos primero → goles acumulados → días sobrevividos.
        Goles acumulados se usan como desempate final (regla §5.1).
      </p>

    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function formatEliminationReason(reason: string | null): string {
  if (!reason) return 'Eliminado'
  const reasons: Record<string, string> = {
    no_pick:              'No hizo pick a tiempo',
    no_shot_on_target:    'Su jugador no registró tiro a puerta',
    player_did_not_play:  'Su jugador no jugó',
    disqualified:         'Descalificado',
  }
  return reasons[reason] ?? reason
}
