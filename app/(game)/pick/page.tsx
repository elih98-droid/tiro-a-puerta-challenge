import { createClient } from '@/lib/supabase/server'
import { PickClient } from '@/components/game/pick-client'
import { PickDayNav } from '@/components/game/pick-day-nav'
import type { MatchData, Player, Team } from '@/components/game/pick-match-card'

/**
 * app/(game)/pick/page.tsx
 *
 * Pick page — /pick or /pick?date=YYYY-MM-DD
 *
 * Without a date param: shows today's match day (in CDMX timezone).
 * With a date param:    shows that specific match day — used for day
 *                       navigation so users can plan picks in advance.
 *
 * Pre-picks for future days are real picks: they burn the player just
 * like a same-day pick. To free a player, the user must go to that
 * future day and remove the pick before the deadline passes.
 *
 * searchParams is a Promise in Next.js 15 — must be awaited.
 */
export default async function PickPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // ── Determine the target date ──────────────────────────────────────────────
  // CDMX is permanently UTC-6 (no DST since 2023). 'en-CA' gives YYYY-MM-DD.
  const todayInCdmx = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
  }).format(new Date())

  const { date: dateParam } = await searchParams
  // Only accept YYYY-MM-DD format; fall back to today if malformed
  const targetDate = dateParam?.match(/^\d{4}-\d{2}-\d{2}$/) ? dateParam : todayInCdmx
  const isToday = targetDate === todayInCdmx

  // ── 1. User tournament status ──────────────────────────────────────────────
  const { data: userStatus } = await supabase
    .from('user_status')
    .select('is_alive, elimination_reason, days_survived, total_goals_accumulated')
    .eq('user_id', user!.id)
    .single()

  // ── 2. Match day for the target date ──────────────────────────────────────
  const { data: matchDay } = await supabase
    .from('match_days')
    .select('id, match_date, day_number')
    .eq('match_date', targetDate)
    .maybeSingle()

  // ── 3. Adjacent match days for navigation arrows ───────────────────────────
  // Always query by date so navigation works even when the current day has
  // no matches (e.g. today is a rest day between match days).
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

  // ── No match day for this date ─────────────────────────────────────────────
  // Still render the nav so the user can navigate to the nearest match day.
  if (!matchDay) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Pick del día</h1>
        <PickDayNav
          matchDate={targetDate}
          dayNumber={0}
          isToday={isToday}
          prevDate={prevDayRow?.match_date ?? null}
          nextDate={nextDayRow?.match_date ?? null}
        />
        <p className="text-gray-500 mt-4">
          No hay partidos programados para el {targetDate}.
        </p>
      </div>
    )
  }

  // ── 4. Matches for this day ────────────────────────────────────────────────
  const { data: rawMatches } = await supabase
    .from('matches')
    .select('id, kickoff_time, pick_deadline, status, home_team_id, away_team_id')
    .eq('match_day_id', matchDay.id)
    .order('kickoff_time', { ascending: true })

  // ── 5. Teams and players ───────────────────────────────────────────────────
  const teamIds = [
    ...new Set(
      (rawMatches ?? [])
        .flatMap(m => [m.home_team_id, m.away_team_id])
        .filter(Boolean)
    ),
  ]

  const [{ data: rawTeams }, { data: rawPlayers }] = await Promise.all([
    teamIds.length > 0
      ? supabase.from('teams').select('id, name, code').in('id', teamIds)
      : Promise.resolve({ data: [] }),
    teamIds.length > 0
      ? supabase
          .from('players')
          .select('id, display_name, position, team_id')
          .in('team_id', teamIds)
          .eq('is_active', true)
      : Promise.resolve({ data: [] }),
  ])

  const teamById = new Map<number, Team>(
    (rawTeams ?? []).map(t => [t.id, t as Team])
  )
  const allPlayers = (rawPlayers ?? []) as Player[]

  const matches: MatchData[] = (rawMatches ?? [])
    .filter(m => teamById.has(m.home_team_id) && teamById.has(m.away_team_id))
    .map(m => ({
      id: m.id,
      kickoff_time: m.kickoff_time,
      pick_deadline: m.pick_deadline,
      status: m.status,
      home_team: teamById.get(m.home_team_id)!,
      away_team: teamById.get(m.away_team_id)!,
      players: allPlayers.filter(
        p => p.team_id === m.home_team_id || p.team_id === m.away_team_id
      ),
    }))

  // ── 6. Current pick for this day ───────────────────────────────────────────
  const { data: currentPickRaw } = await supabase
    .from('user_picks')
    .select(`
      player_id,
      match_id,
      effective_deadline,
      is_locked,
      result,
      players ( display_name, position )
    `)
    .eq('user_id', user!.id)
    .eq('match_day_id', matchDay.id)
    .maybeSingle()

  const currentPick = currentPickRaw
    ? {
        player_id: currentPickRaw.player_id,
        match_id: currentPickRaw.match_id,
        effective_deadline: currentPickRaw.effective_deadline,
        is_locked: currentPickRaw.is_locked,
        result: currentPickRaw.result,
        players: Array.isArray(currentPickRaw.players)
          ? currentPickRaw.players[0] ?? null
          : currentPickRaw.players,
      }
    : null

  // ── 7. Burned player IDs (picks from ALL other days) ──────────────────────
  // This includes both past picks and pre-picks on other future days.
  // A player picked on any other day cannot be picked on this day.
  const { data: otherPicks } = await supabase
    .from('user_picks')
    .select('player_id')
    .eq('user_id', user!.id)
    .neq('match_day_id', matchDay.id)

  const burnedPlayerIds = (otherPicks ?? []).map(p => p.player_id)

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      <h1 className="text-2xl font-bold text-gray-900 mb-4">Pick del día</h1>

      <PickDayNav
        matchDate={matchDay.match_date}
        dayNumber={matchDay.day_number}
        isToday={isToday}
        prevDate={prevDayRow?.match_date ?? null}
        nextDate={nextDayRow?.match_date ?? null}
      />

      <PickClient
        key={matchDay.id}
        matchDay={matchDay}
        matches={matches}
        currentPick={currentPick}
        burnedPlayerIds={burnedPlayerIds}
        userStatus={userStatus}
        allPlayers={allPlayers}
        isToday={isToday}
      />
    </div>
  )
}
