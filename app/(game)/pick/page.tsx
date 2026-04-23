import { createClient } from '@/lib/supabase/server'
import { PickClient } from '@/components/game/pick-client'
import type { MatchData, Player, Team } from '@/components/game/pick-match-card'

/**
 * app/(game)/pick/page.tsx
 *
 * Pick page — /pick
 * Where the user chooses their player for the day.
 *
 * This is a Server Component: all data fetching happens here, on the server.
 * The interactive parts (selection, confirmation, filters) live in PickClient.
 *
 * Data fetched:
 *   1. User's tournament status (alive / eliminated)
 *   2. Today's match_day (by CDMX date — UTC-6, no DST)
 *   3. All matches today with kickoff time, deadline, and status
 *   4. All players from the teams playing today
 *   5. User's current pick for today (if any)
 *   6. User's burned player IDs (picks from previous days)
 *
 * The proxy (proxy.ts) guarantees the user is authenticated before reaching here.
 */
export default async function PickPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // ── 1. User tournament status ──────────────────────────────────────────────
  const { data: userStatus } = await supabase
    .from('user_status')
    .select('is_alive, elimination_reason, days_survived, total_goals_accumulated')
    .eq('user_id', user!.id)
    .single()

  // ── 2. Today's match_day in CDMX time (UTC-6, no DST) ────────────────────
  // Intl.DateTimeFormat with 'en-CA' locale gives 'YYYY-MM-DD' format.
  // America/Mexico_City is permanently UTC-6 since Mexico abolished DST in 2023.
  const todayInCdmx = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
  }).format(new Date())

  const { data: matchDay } = await supabase
    .from('match_days')
    .select('id, match_date, day_number')
    .eq('match_date', todayInCdmx)
    .maybeSingle()

  // No matches today → show a simple message
  if (!matchDay) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pick del día</h1>
        <p className="text-gray-500">No hay partidos programados para hoy ({todayInCdmx}).</p>
      </div>
    )
  }

  // ── 3. Matches for today ───────────────────────────────────────────────────
  const { data: rawMatches } = await supabase
    .from('matches')
    .select('id, kickoff_time, pick_deadline, status, home_team_id, away_team_id')
    .eq('match_day_id', matchDay.id)
    .order('kickoff_time', { ascending: true })

  // ── 4. Teams and players for today ────────────────────────────────────────
  // Collect all unique team IDs from today's matches
  const teamIds = [
    ...new Set(
      (rawMatches ?? []).flatMap(m => [m.home_team_id, m.away_team_id]).filter(Boolean)
    ),
  ]

  // Fetch teams and players in parallel
  const [{ data: rawTeams }, { data: rawPlayers }] = await Promise.all([
    teamIds.length > 0
      ? supabase
          .from('teams')
          .select('id, name, code')
          .in('id', teamIds)
      : Promise.resolve({ data: [] }),

    teamIds.length > 0
      ? supabase
          .from('players')
          .select('id, display_name, position, team_id')
          .in('team_id', teamIds)
          .eq('is_active', true)
      : Promise.resolve({ data: [] }),
  ])

  // Build a lookup map for teams
  const teamById = new Map<number, Team>(
    (rawTeams ?? []).map(t => [t.id, t as Team])
  )

  const allPlayers = (rawPlayers ?? []) as Player[]

  // Assemble MatchData objects (the shape PickMatchCard expects)
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

  // ── 5. User's current pick for today ──────────────────────────────────────
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

  // Normalize the Supabase nested relation to a plain object
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

  // ── 6. Burned player IDs (picks from previous days) ───────────────────────
  // A player is "burned" if the user picked them on any day other than today.
  // We use user_picks (final submitted picks) as the source of truth here.
  // This correctly catches cross-day repeats for the final committed pick per day.
  const { data: previousPicks } = await supabase
    .from('user_picks')
    .select('player_id')
    .eq('user_id', user!.id)
    .neq('match_day_id', matchDay.id)

  const burnedPlayerIds = (previousPicks ?? []).map(p => p.player_id)

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pick del día</h1>
        <p className="text-sm text-gray-500 mt-1">
          {matchDay.match_date} · Día {matchDay.day_number} del torneo
        </p>
      </div>

      <PickClient
        matchDay={matchDay}
        matches={matches}
        currentPick={currentPick}
        burnedPlayerIds={burnedPlayerIds}
        userStatus={userStatus}
        allPlayers={allPlayers}
      />
    </div>
  )
}
