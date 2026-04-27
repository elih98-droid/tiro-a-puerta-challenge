'use client'

/**
 * components/game/live-match-stats.tsx
 *
 * Shows live stats for a player during their match: shots on target, goals,
 * minutes played, and the match score. Polls every 60 seconds to stay in sync
 * with the backend sync worker (sync-live-matches runs at the same frequency).
 *
 * Only renders meaningful content when the match is live or finished.
 * If the match hasn't started yet (scheduled), shows a subtle "waiting" state.
 */

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface LiveMatchStatsProps {
  matchId: number
  playerId: number
}

interface MatchData {
  status: string
  kickoff_time: string
  match_minute: number | null
  home_score: number | null
  away_score: number | null
  home_team: { name: string } | null
  away_team: { name: string } | null
}

interface PlayerStats {
  shots_on_target: number
  goals: number
  minutes_played: number
  last_api_sync_at: string | null
}

const POLL_INTERVAL_MS = 60_000 // 60 seconds — matches the sync worker frequency

export function LiveMatchStats({ matchId, playerId }: LiveMatchStatsProps) {
  const [match, setMatch] = useState<MatchData | null>(null)
  // null = not yet fetched; undefined = fetched but no record (player not convoked)
  const [stats, setStats] = useState<PlayerStats | null | undefined>(undefined)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    const supabase = createClient()

    // Fetch match status, score, real match minute, and team names for display.
    const { data: matchData } = await supabase
      .from('matches')
      .select(`
        status,
        kickoff_time,
        match_minute,
        home_score,
        away_score,
        home_team:home_team_id ( name ),
        away_team:away_team_id ( name )
      `)
      .eq('id', matchId)
      .single()

    // Fetch player stats for this specific match.
    // If the player wasn't convoked, there will be no row — that's fine.
    const { data: statsData } = await supabase
      .from('player_match_stats')
      .select('shots_on_target, goals, minutes_played, last_api_sync_at')
      .eq('match_id', matchId)
      .eq('player_id', playerId)
      .maybeSingle() // use maybeSingle so missing row → null, not an error

    if (matchData) {
      setMatch(matchData as unknown as MatchData)
    }
    // statsData is null when no row exists — that's meaningful (player not convoked)
    setStats(statsData ?? null)
    setLastRefreshed(new Date())
  }, [matchId, playerId])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchData])

  if (!match) {
    return <p className="text-sm text-gray-400 mt-2">Cargando stats del partido...</p>
  }

  if (match.status === 'scheduled') {
    return (
      <p className="text-sm text-gray-500 mt-2">
        ⏳ El partido aún no comienza.
      </p>
    )
  }

  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished'

  const homeTeam = (match.home_team as unknown as { name: string } | null)?.name ?? '?'
  const awayTeam = (match.away_team as unknown as { name: string } | null)?.name ?? '?'

  // Real match minute from DB (written by sync-live-matches from fixture.status.elapsed).
  // null when match hasn't started or has finished.
  const liveMinute = isLive && match.match_minute != null ? `${match.match_minute}'` : null

  // Treat missing stats record as zero shots (player not convoked or not yet tracked)
  const shotsOnTarget = stats?.shots_on_target ?? 0
  const goals = stats?.goals ?? 0
  const minutesPlayed = stats?.minutes_played ?? 0
  const hasShotOnTarget = shotsOnTarget > 0

  return (
    <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
      {/* Match status badge + scoreline */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-800">
          {homeTeam} {match.home_score ?? '–'} – {match.away_score ?? '–'} {awayTeam}
        </div>
        <StatusBadge status={match.status} minute={liveMinute} />
      </div>

      {/* Player stats — only meaningful once the match is underway */}
      {(isLive || isFinished) && (
        <div className="flex gap-4 text-sm">
          <StatItem
            icon="🎯"
            label="Tiro(s) a puerta"
            value={shotsOnTarget}
            highlight={hasShotOnTarget}
          />
          <StatItem
            icon="⚽"
            label="Gol(es)"
            value={goals}
            highlight={goals > 0}
          />
          <StatItem
            icon="⏱"
            label="Min jugados"
            value={minutesPlayed}
          />
        </div>
      )}

      {/* Survival indicator — shown whenever the match is live, even if no stats record */}
      {isLive && (
        <p className={`text-xs font-semibold ${hasShotOnTarget ? 'text-green-600' : 'text-red-500'}`}>
          {hasShotOnTarget
            ? '✅ Con tiro a puerta — sobrevivirías si el partido termina así'
            : '⚠️ Sin tiro a puerta aún — necesitas que tu jugador dispare'}
        </p>
      )}

      {isFinished && (
        <p className={`text-xs font-semibold ${hasShotOnTarget ? 'text-green-600' : 'text-red-500'}`}>
          {hasShotOnTarget
            ? `✅ Partido terminado — ${shotsOnTarget} tiro(s) a puerta registrado(s)`
            : '❌ Partido terminado — sin tiros a puerta'}
        </p>
      )}

      {/* Last refresh timestamp */}
      {isLive && lastRefreshed && (
        <p className="text-xs text-gray-400">
          Actualizado: {lastRefreshed.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

function StatusBadge({ status, minute }: { status: string; minute: string | null }) {
  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
        <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
        EN VIVO {minute && <span className="font-normal">{minute}</span>}
      </span>
    )
  }
  if (status === 'finished') {
    return (
      <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs font-semibold rounded-full">
        FINALIZADO
      </span>
    )
  }
  if (status === 'suspended') {
    return (
      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
        SUSPENDIDO
      </span>
    )
  }
  return null
}

interface StatItemProps {
  icon: string
  label: string
  value: number
  highlight?: boolean
}

function StatItem({ icon, label, value, highlight = false }: StatItemProps) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[60px]">
      <span className={`text-lg font-bold ${highlight ? 'text-green-600' : 'text-gray-700'}`}>
        {icon} {value}
      </span>
      <span className="text-xs text-gray-500 text-center leading-tight">{label}</span>
    </div>
  )
}
