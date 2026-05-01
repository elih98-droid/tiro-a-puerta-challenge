import { createClient } from '@/lib/supabase/server'

/**
 * app/(game)/leaderboard/page.tsx
 *
 * Public ranking of all participants.
 *
 * Ordering (game-rules.md §5.1 + §5.3):
 *   1. Alive users first (is_alive DESC)
 *   2. Then by total goals accumulated DESC (primary tiebreaker §5.1)
 *   3. Then by total shots accumulated DESC (secondary tiebreaker §5.3)
 *
 * This is a Server Component — ranking is the same for everyone.
 * We highlight the current user's row.
 */

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: rows, error } = await supabase
    .from('user_status')
    .select(`
      user_id,
      is_alive,
      days_survived,
      total_goals_accumulated,
      total_shots_accumulated,
      elimination_reason,
      users ( username )
    `)
    .order('is_alive',                  { ascending: false })
    .order('total_goals_accumulated',   { ascending: false })
    .order('total_shots_accumulated',   { ascending: false })

  if (error || !rows) {
    return (
      <div style={{ margin: '24px 16px' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
          No se pudo cargar el leaderboard. Intenta de nuevo.
        </p>
      </div>
    )
  }

  const totalParticipants = rows.length
  const aliveCount        = rows.filter(r => r.is_alive).length
  const eliminatedCount   = totalParticipants - aliveCount

  // Assign numeric rank only to alive users
  let aliveRank = 0
  const ranked = rows.map(row => {
    if (row.is_alive) aliveRank++
    return { ...row, rank: row.is_alive ? aliveRank : null }
  })

  const aliveRows     = ranked.filter(r => r.is_alive)
  const eliminatedRows = ranked.filter(r => !r.is_alive)

  return (
    <>
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div style={{ padding: '16px 16px 4px' }}>
        <div style={{
          fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
          fontSize: 32, letterSpacing: 1.5, color: '#fff', lineHeight: 1,
          marginBottom: 8,
        }}>
          Ranking
        </div>

        {/* Stats pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Pill label={`${totalParticipants} participante${totalParticipants !== 1 ? 's' : ''}`} color="rgba(255,255,255,0.45)" />
          <Pill label={`${aliveCount} vivo${aliveCount !== 1 ? 's' : ''}`} color="#3CAC3B" />
          {eliminatedCount > 0 && (
            <Pill label={`${eliminatedCount} eliminado${eliminatedCount !== 1 ? 's' : ''}`} color="#E61D25" />
          )}
        </div>
      </div>

      {/* ── Column headers ───────────────────────────────────────────────── */}
      {rows.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '12px 16px 6px',
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: 8.5, letterSpacing: 1.4, textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.3)', fontWeight: 700,
        }}>
          <div style={{ width: 36 }}>#</div>
          <div style={{ flex: 1 }}>Jugador</div>
          <div style={{ width: 44, textAlign: 'right' }}>Goles</div>
          <div style={{ width: 40, textAlign: 'right' }}>Tiros</div>
          <div style={{ width: 76, textAlign: 'right' }}>Estado</div>
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {rows.length === 0 && (
        <div style={{
          margin: '24px 16px', padding: '32px 24px',
          background: '#181C36', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12, textAlign: 'center',
        }}>
          <div style={{
            fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
            fontSize: 18, letterSpacing: 1, color: 'rgba(255,255,255,0.35)',
          }}>
            AÚN NO HAY PARTICIPANTES
          </div>
        </div>
      )}

      {/* ── Alive rows ───────────────────────────────────────────────────── */}
      {aliveRows.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 16px' }}>
          {aliveRows.map(row => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const username      = (row.users as any)?.username ?? '—'
            const isCurrentUser = !!user && row.user_id === user.id
            const isLeader      = row.rank === 1

            return (
              <RankRow
                key={row.user_id}
                rank={row.rank}
                username={username}
                shots={row.total_shots_accumulated}
                goals={row.total_goals_accumulated}
                isAlive={true}
                isCurrentUser={isCurrentUser}
                isLeader={isLeader}
              />
            )
          })}
        </div>
      )}

      {/* ── Eliminated divider ───────────────────────────────────────────── */}
      {eliminatedRows.length > 0 && (
        <>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '18px 16px 10px',
          }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }}/>
            <div style={{
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 8.5, letterSpacing: 1.6, color: 'rgba(230,29,37,0.5)',
              fontWeight: 700, textTransform: 'uppercase',
            }}>
              Eliminados
            </div>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }}/>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 16px 24px' }}>
            {eliminatedRows.map(row => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const username      = (row.users as any)?.username ?? '—'
              const isCurrentUser = !!user && row.user_id === user.id

              return (
                <RankRow
                  key={row.user_id}
                  rank={null}
                  username={username}
                  shots={row.total_shots_accumulated}
                  goals={row.total_goals_accumulated}
                  isAlive={false}
                  isCurrentUser={isCurrentUser}
                  isLeader={false}
                />
              )
            })}
          </div>
        </>
      )}

      {/* ── Legend ───────────────────────────────────────────────────────── */}
      {rows.length > 0 && (
        <div style={{
          padding: '0 16px 24px',
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: 9, letterSpacing: 0.8,
          color: 'rgba(255,255,255,0.2)',
        }}>
          Orden: vivos primero → goles acumulados → tiros totales (§5.1 + §5.3)
        </div>
      )}
    </>
  )
}

// ─── RankRow ──────────────────────────────────────────────────────────────────

function RankRow({
  rank,
  username,
  shots,
  goals,
  isAlive,
  isCurrentUser,
  isLeader,
}: {
  rank: number | null
  username: string
  shots: number
  goals: number
  isAlive: boolean
  isCurrentUser: boolean
  isLeader: boolean
}) {
  // Visual style varies by state, priority: leader > currentUser > alive > eliminated
  let bg      = '#181C36'
  let border  = '1px solid rgba(255,255,255,0.06)'
  let opacity = 1

  if (isLeader) {
    bg     = 'linear-gradient(135deg, rgba(201,168,76,0.12) 0%, #11162A 100%)'
    border = '1px solid rgba(201,168,76,0.35)'
  } else if (isCurrentUser) {
    bg     = 'linear-gradient(135deg, rgba(42,57,141,0.35) 0%, #11162A 100%)'
    border = '1px solid rgba(201,168,76,0.4)'
  } else if (!isAlive) {
    bg      = 'rgba(255,255,255,0.02)'
    border  = '1px solid rgba(255,255,255,0.04)'
    opacity = 0.55
  }

  const rankColor   = isLeader ? '#C9A84C' : isCurrentUser ? '#7B93E8' : 'rgba(255,255,255,0.3)'
  const nameColor   = isAlive ? '#fff' : 'rgba(255,255,255,0.55)'
  const statsColor  = isAlive ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)'
  const rankFontSize = isLeader ? 24 : 16

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '11px 12px',
      background: bg, border, borderRadius: 10,
      opacity,
    }}>
      {/* Rank number */}
      <div style={{
        width: 36, flexShrink: 0,
        fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
        fontSize: rankFontSize, letterSpacing: 0.5,
        color: rankColor, lineHeight: 1,
        textShadow: isLeader ? '0 0 12px rgba(201,168,76,0.4)' : 'none',
      }}>
        {rank ?? '—'}
      </div>

      {/* Username + "tú" badge */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{
            fontFamily: 'var(--font-archivo), sans-serif',
            fontSize: isLeader ? 15 : 13.5,
            fontWeight: isLeader ? 800 : 600,
            color: isLeader ? '#E8C766' : nameColor,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {username}
          </span>
          {isCurrentUser && (
            <span style={{
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 8, letterSpacing: 1, fontWeight: 700,
              color: '#C9A84C',
              background: 'rgba(201,168,76,0.12)',
              border: '1px solid rgba(201,168,76,0.3)',
              borderRadius: 3, padding: '1px 5px',
              flexShrink: 0,
            }}>
              TÚ
            </span>
          )}
        </div>
      </div>

      {/* Goals */}
      <div style={{
        width: 44, textAlign: 'right', flexShrink: 0,
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        fontSize: 12, fontWeight: 700,
        color: goals > 0 ? '#C9A84C' : statsColor,
      }}>
        {goals}
      </div>

      {/* Shots */}
      <div style={{
        width: 40, textAlign: 'right', flexShrink: 0,
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        fontSize: 12, fontWeight: 700,
        color: shots > 0 ? '#3CAC3B' : statsColor,
      }}>
        {shots}
      </div>

      {/* Status badge */}
      <div style={{ width: 76, textAlign: 'right', flexShrink: 0 }}>
        {isAlive ? (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: 8.5, letterSpacing: 1, fontWeight: 700,
            color: '#3CAC3B',
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: 3, background: '#3CAC3B',
              display: 'inline-block', flexShrink: 0,
            }}/>
            VIVO
          </span>
        ) : (
          <span style={{
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: 8.5, letterSpacing: 1, fontWeight: 700,
            color: 'rgba(230,29,37,0.55)',
          }}>
            ✕ ELIM.
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Pill ─────────────────────────────────────────────────────────────────────

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 999,
      background: `${color}14`,
      border: `1px solid ${color}44`,
      fontFamily: 'var(--font-jetbrains-mono), monospace',
      fontSize: 9.5, letterSpacing: 1, fontWeight: 700,
      color,
    }}>
      {label}
    </span>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function formatEliminationReason(reason: string | null): string {
  if (!reason) return 'Eliminado'
  const reasons: Record<string, string> = {
    no_pick:             'No hizo pick a tiempo',
    no_shot_on_target:   'Su jugador no registró tiro a puerta',
    player_did_not_play: 'Su jugador no jugó',
    disqualified:        'Descalificado',
  }
  return reasons[reason] ?? reason
}
