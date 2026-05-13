import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MyPicksTabs } from '@/components/game/my-picks-tabs'
import { RivalsView, type RivalsData, type RivalPick } from '@/components/game/rivals-view'

/**
 * app/(game)/my-picks/page.tsx
 *
 * Private page — /my-picks
 *
 * Two tabs:
 *   1. "Mis Picks" — chronological summary of user's own picks.
 *   2. "Rivales 🔥" — distribution of all picks for a given day,
 *      revealed progressively as each match's deadline passes.
 *
 * URL params:
 *   ?tab=rivals    — opens directly on Rivales tab
 *   ?date=YYYY-MM-DD — selects a specific day for Rivales navigation
 *
 * Server Component — fetches all data, passes to client components.
 */

// ─── Position helpers ────────────────────────────────────────────────────────

const POS_LABEL: Record<string, string> = { GK: 'POR', DEF: 'DEF', MID: 'MED', FWD: 'DEL' }
const POS_COLOR: Record<string, string> = {
  GK:  '#F4B942',
  DEF: '#5B8DEE',
  MID: '#3CAC3B',
  FWD: '#E61D25',
}

// ─── Status resolution ───────────────────────────────────────────────────────

type PickStatus = 'survived' | 'eliminated' | 'void_cancelled' | 'void_did_not_play' | 'evaluating' | 'pending'

function resolveStatus(result: string | null, isLocked: boolean): PickStatus {
  if (result === 'survived') return 'survived'
  if (result === 'eliminated') return 'eliminated'
  if (result === 'void_did_not_play') return 'void_did_not_play'
  if (result === 'void_cancelled_match') return 'void_cancelled'
  if (isLocked) return 'evaluating'
  return 'pending'
}

const STATUS_CONFIG: Record<PickStatus, { label: string; color: string; bg: string; border: string; dot?: boolean }> = {
  survived: {
    label: 'SOBREVIVISTE',
    color: '#3CAC3B',
    bg:    'rgba(60,172,59,0.12)',
    border:'rgba(60,172,59,0.4)',
  },
  eliminated: {
    label: 'ELIMINADO',
    color: '#E61D25',
    bg:    'rgba(230,29,37,0.12)',
    border:'rgba(230,29,37,0.4)',
  },
  void_did_not_play: {
    label: 'ELIMINADO',
    color: '#E61D25',
    bg:    'rgba(230,29,37,0.12)',
    border:'rgba(230,29,37,0.4)',
  },
  void_cancelled: {
    label: 'ANULADO',
    color: 'rgba(255,255,255,0.45)',
    bg:    'rgba(255,255,255,0.05)',
    border:'rgba(255,255,255,0.12)',
  },
  evaluating: {
    label: 'EN ESPERA',
    color: '#C9A84C',
    bg:    'rgba(201,168,76,0.12)',
    border:'rgba(201,168,76,0.4)',
    dot:   true,
  },
  pending: {
    label: 'PENDIENTE',
    color: '#5B8DEE',
    bg:    'rgba(91,141,238,0.12)',
    border:'rgba(91,141,238,0.4)',
  },
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function MyPicksPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; date?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { tab, date: dateParam } = await searchParams

  // ── My picks data ────────────────────────────────────────────────────────
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

  // ── Rivals data ──────────────────────────────────────────────────────────
  const todayInCdmx = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
  }).format(new Date())

  const rivalsDate = dateParam?.match(/^\d{4}-\d{2}-\d{2}$/) ? dateParam : todayInCdmx
  const isToday = rivalsDate === todayInCdmx

  const rivalsData = await fetchRivalsData(supabase, rivalsDate, isToday)

  // ── Determine initial tab ────────────────────────────────────────────────
  const initialTab = tab === 'rivals' ? 'rivals' : 'mine'

  // ── Render ───────────────────────────────────────────────────────────────
  const mineContent = picks.length === 0
    ? <MyPicksEmpty />
    : <MyPicksList picks={picks} />

  return (
    <>
      <div style={{ height: 50 }} />
      <PageHeader burnedCount={picks.length} />

      <MyPicksTabs
        key={initialTab}
        initialTab={initialTab === 'rivals' ? 'rivals' : 'mine'}
        mineContent={mineContent}
        rivalsContent={<RivalsView data={rivalsData} />}
      />
    </>
  )
}

// ── Fetch rivals data ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchRivalsData(supabase: any, targetDate: string, isToday: boolean): Promise<RivalsData> {
  // 1. Match day for target date
  const { data: matchDay } = await supabase
    .from('match_days')
    .select('id, match_date, day_number')
    .eq('match_date', targetDate)
    .maybeSingle()

  // 2. Adjacent days for navigation
  const [{ data: prevDayRow }, { data: nextDayRow }] = await Promise.all([
    supabase
      .from('match_days')
      .select('match_date')
      .lt('match_date', targetDate)
      .order('match_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('match_days')
      .select('match_date')
      .gt('match_date', targetDate)
      .order('match_date', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ])

  const base: Omit<RivalsData, 'picks' | 'totalRevealed' | 'totalAlive' | 'pendingMatches'> = {
    matchDate: targetDate,
    dayNumber: matchDay?.day_number ?? 0,
    isToday,
    prevDate: prevDayRow?.match_date ?? null,
    nextDate: nextDayRow?.match_date ?? null,
  }

  if (!matchDay) {
    return { ...base, picks: [], totalRevealed: 0, totalAlive: 0, pendingMatches: 0 }
  }

  const now = new Date().toISOString()

  // 3. Count matches whose deadline hasn't passed yet (for "pending" indicator)
  const { data: allMatches } = await supabase
    .from('matches')
    .select('id, kickoff_time')
    .eq('match_day_id', matchDay.id)

  // effective_deadline = kickoff - 5min (same logic as the DB trigger)
  const pendingMatches = (allMatches ?? []).filter((m: { kickoff_time: string }) => {
    const deadline = new Date(new Date(m.kickoff_time).getTime() - 5 * 60 * 1000)
    return deadline > new Date(now)
  }).length

  // 4. Get all picks for this day where effective_deadline has passed
  //    (only revealed picks — progressive per match)
  const { data: revealedPicks } = await supabase
    .from('user_picks')
    .select(`
      player_id,
      players (
        display_name,
        position,
        teams ( name )
      )
    `)
    .eq('match_day_id', matchDay.id)
    .lte('effective_deadline', now)

  if (!revealedPicks || revealedPicks.length === 0) {
    return { ...base, picks: [], totalRevealed: 0, totalAlive: 0, pendingMatches }
  }

  // 5. Group by player and calculate percentages
  const totalRevealed = revealedPicks.length
  const grouped = new Map<number, { player: { display_name: string; position: string; teams: { name: string } | null }; count: number }>()

  for (const pick of revealedPicks) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const player = pick.players as any
    const pid = pick.player_id as number
    const existing = grouped.get(pid)
    if (existing) {
      existing.count++
    } else {
      grouped.set(pid, { player, count: 1 })
    }
  }

  const rivalPicks: RivalPick[] = Array.from(grouped.values())
    .map(({ player, count }) => ({
      playerName: player?.display_name ?? '—',
      position: player?.position ?? '',
      teamName: player?.teams?.name ?? '—',
      count,
      percentage: Math.round((count / totalRevealed) * 100),
    }))
    .sort((a, b) => b.count - a.count)

  return {
    ...base,
    picks: rivalPicks,
    totalRevealed,
    totalAlive: 0, // not used in current UI
    pendingMatches,
  }
}

// ── My Picks Empty State ─────────────────────────────────────────────────────

function MyPicksEmpty() {
  return (
    <div style={{
      margin: '20px 16px',
      padding: '40px 24px',
      background: '#181C36',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      textAlign: 'center',
    }}>
      <div style={{
        fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
        fontSize: 18, letterSpacing: 1, color: 'rgba(255,255,255,0.4)',
        marginBottom: 12,
      }}>
        AÚN NO HAS HECHO NINGÚN PICK
      </div>
      <Link
        href="/pick"
        style={{
          display: 'inline-block',
          padding: '10px 22px',
          background: 'linear-gradient(180deg, #2A398D 0%, #1B2566 100%)',
          border: '1.5px solid #C9A84C',
          borderRadius: 8,
          color: '#fff',
          fontSize: 12, fontWeight: 700, letterSpacing: 0.6,
          fontFamily: 'var(--font-archivo), sans-serif',
          textDecoration: 'none',
        }}
      >
        Elegir jugador →
      </Link>
    </div>
  )
}

// ── My Picks List ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MyPicksList({ picks }: { picks: any[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 16px 24px' }}>
      {picks.map((pick) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const matchDay = pick.match_days as any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const player   = pick.players as any
        const teamName: string = player?.teams?.name ?? '—'
        const position: string = player?.position ?? ''

        const dateLabel = matchDay?.match_date
          ? new Date(matchDay.match_date + 'T12:00:00').toLocaleDateString('es-MX', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })
          : '—'

        const status = resolveStatus(pick.result, pick.is_locked)
        const statusCfg = STATUS_CONFIG[status]
        const evaluated = pick.result !== null

        const posColor = POS_COLOR[position] || 'rgba(255,255,255,0.4)'
        const posLabel = POS_LABEL[position] || position
        const accentColor = statusCfg.color

        return (
          <div
            key={pick.id}
            style={{
              background: '#181C36',
              border: '1px solid rgba(255,255,255,0.07)',
              borderLeft: `3px solid ${accentColor}`,
              borderRadius: 12,
              padding: '14px 14px 12px',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            {/* Left: day + player info */}
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* Day label */}
              <div style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase',
                color: '#C9A84C', fontWeight: 700, marginBottom: 6,
              }}>
                {matchDay ? `Día ${matchDay.day_number} · ${dateLabel}` : '—'}
              </div>

              {/* Player name */}
              <div style={{
                fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
                fontSize: 21, letterSpacing: 0.5, color: '#fff', lineHeight: 1,
                marginBottom: 5,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {player?.display_name ?? '—'}
              </div>

              {/* Team + position badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: 30, height: 17, padding: '0 5px', borderRadius: 4,
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontSize: 8.5, fontWeight: 700, letterSpacing: 0.8,
                  color:      posColor,
                  background: `${posColor}1f`,
                  border:     `1px solid ${posColor}55`,
                  flexShrink: 0,
                }}>
                  {posLabel}
                </span>
                <span style={{
                  fontSize: 11.5, color: 'rgba(255,255,255,0.5)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  fontFamily: 'var(--font-archivo), sans-serif',
                }}>
                  {teamName}
                </span>
              </div>

              {/* Stats row — only after evaluation */}
              {evaluated && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  marginTop: 8,
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontSize: 10, color: 'rgba(255,255,255,0.45)',
                }}>
                  <span style={{
                    color: (pick.shots_on_target_count ?? 0) > 0
                      ? '#3CAC3B'
                      : 'rgba(255,255,255,0.35)',
                  }}>
                    ● {pick.shots_on_target_count ?? 0} tiro{(pick.shots_on_target_count ?? 0) !== 1 ? 's' : ''} a puerta
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                  <span style={{
                    color: (pick.goals_scored ?? 0) > 0
                      ? '#C9A84C'
                      : 'rgba(255,255,255,0.35)',
                  }}>
                    ⚽ {pick.goals_scored ?? 0} gol{(pick.goals_scored ?? 0) !== 1 ? 'es' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Right: status badge */}
            <div style={{ flexShrink: 0, paddingTop: 2 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 9px', borderRadius: 6,
                background: statusCfg.bg,
                border: `1px solid ${statusCfg.border}`,
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: 8.5, letterSpacing: 1.1, fontWeight: 700,
                color: statusCfg.color,
                whiteSpace: 'nowrap',
              }}>
                {statusCfg.dot && (
                  <span style={{
                    width: 5, height: 5, borderRadius: 3,
                    background: statusCfg.color,
                    animation: 'tpPulse 1.5s ease-in-out infinite',
                    display: 'inline-block', flexShrink: 0,
                  }}/>
                )}
                {statusCfg.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── PageHeader ──────────────────────────────────────────────────────────────

function PageHeader({ burnedCount }: { burnedCount: number }) {
  return (
    <div style={{ padding: '4px 16px 14px' }}>
      <div style={{
        fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
        fontSize: 32, letterSpacing: 1.5, color: '#fff', lineHeight: 1,
        marginBottom: 6,
      }}>
        Mis Picks
      </div>
      {burnedCount > 0 && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 6,
          background: 'rgba(230,29,37,0.08)',
          border: '1px solid rgba(230,29,37,0.25)',
          marginBottom: 10,
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: 3,
            background: '#E61D25', display: 'inline-block', flexShrink: 0,
          }}/>
          <span style={{
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: 9.5, letterSpacing: 1.2, fontWeight: 700,
            color: 'rgba(230,29,37,0.8)',
          }}>
            {burnedCount} jugador{burnedCount !== 1 ? 'es' : ''} quemado{burnedCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  )
}
