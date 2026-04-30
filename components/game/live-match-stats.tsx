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
 *
 * Visually integrated with the brand design system (Dirección 3):
 *   - Dark semi-transparent panel inside PickConfirmedCard
 *   - Bebas Neue for stat numbers, JetBrains Mono for labels/badges
 *   - Brand colors: green #3CAC3B (shots), gold #C9A84C (goals), red #E61D25 (EN VIVO)
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

    const { data: statsData } = await supabase
      .from('player_match_stats')
      .select('shots_on_target, goals, minutes_played, last_api_sync_at')
      .eq('match_id', matchId)
      .eq('player_id', playerId)
      .maybeSingle()

    if (matchData) {
      setMatch(matchData as unknown as MatchData)
    }
    setStats(statsData ?? null)
    setLastRefreshed(new Date())
  }, [matchId, playerId])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchData])

  // Loading
  if (!match) {
    return (
      <p style={{
        marginTop: 8,
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        fontSize: 11, color: 'rgba(255,255,255,0.3)',
      }}>
        Cargando stats...
      </p>
    )
  }

  // Not started yet
  if (match.status === 'scheduled') {
    return (
      <p style={{
        marginTop: 8,
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        fontSize: 11, color: 'rgba(255,255,255,0.3)',
      }}>
        ⏳ El partido aún no comienza
      </p>
    )
  }

  const isLive     = match.status === 'live'
  const isFinished = match.status === 'finished'

  const homeTeam = (match.home_team as unknown as { name: string } | null)?.name ?? '?'
  const awayTeam = (match.away_team as unknown as { name: string } | null)?.name ?? '?'

  const liveMinute    = isLive && match.match_minute != null ? `${match.match_minute}'` : null
  const shotsOnTarget = stats?.shots_on_target ?? 0
  const goals         = stats?.goals ?? 0
  const minutesPlayed = stats?.minutes_played ?? 0
  const hasShotOnTarget = shotsOnTarget > 0

  return (
    <div style={{
      marginTop: 10,
      padding: '10px 12px',
      background: 'rgba(0,0,0,0.3)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8,
    }}>

      {/* ── Match header: scoreline + status badge ──────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: (isLive || isFinished) ? 10 : 0,
      }}>
        {/* Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontFamily: 'var(--font-archivo), sans-serif',
            fontSize: 11, fontWeight: 500,
            color: 'rgba(255,255,255,0.55)',
            maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {homeTeam}
          </span>
          <span style={{
            fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
            fontSize: 20, letterSpacing: 1,
            color: '#fff', lineHeight: 1,
            padding: '0 4px',
          }}>
            {match.home_score ?? '–'} – {match.away_score ?? '–'}
          </span>
          <span style={{
            fontFamily: 'var(--font-archivo), sans-serif',
            fontSize: 11, fontWeight: 500,
            color: 'rgba(255,255,255,0.55)',
            maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {awayTeam}
          </span>
        </div>

        {/* Status badge */}
        <StatusBadge status={match.status} minute={liveMinute} />
      </div>

      {/* ── Player stats row ─────────────────────────────────────────────── */}
      {(isLive || isFinished) && (
        <div style={{ display: 'flex', gap: 20 }}>
          <StatItem
            label="TIROS A PUERTA"
            value={shotsOnTarget}
            highlight={hasShotOnTarget}
            highlightColor="#3CAC3B"
          />
          <StatItem
            label="GOL(ES)"
            value={goals}
            highlight={goals > 0}
            highlightColor="#C9A84C"
          />
          <StatItem
            label="MIN JUGADOS"
            value={minutesPlayed}
          />
        </div>
      )}

      {/* ── Survival indicator ───────────────────────────────────────────── */}
      {isLive && (
        <div style={{ marginTop: 8 }}>
          <span style={{
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
            color: hasShotOnTarget ? '#3CAC3B' : '#F59E0B',
          }}>
            {hasShotOnTarget
              ? '✅ CON TIRO A PUERTA — SOBREVIVIRÍAS'
              : '⚠️ SIN TIRO AÚN — NECESITA DISPARAR'}
          </span>
        </div>
      )}

      {isFinished && (
        <div style={{ marginTop: 8 }}>
          <span style={{
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
            color: hasShotOnTarget ? '#3CAC3B' : '#E61D25',
          }}>
            {hasShotOnTarget
              ? `✅ ${shotsOnTarget} TIRO(S) A PUERTA — SOBREVIVISTE`
              : '✕ SIN TIROS A PUERTA — PARTIDO TERMINADO'}
          </span>
        </div>
      )}

      {/* ── Last sync timestamp (live only) ─────────────────────────────── */}
      {isLive && lastRefreshed && (
        <div style={{
          marginTop: 6,
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: 9, color: 'rgba(255,255,255,0.2)',
        }}>
          sync {lastRefreshed.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      )}
    </div>
  )
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status, minute }: { status: string; minute: string | null }) {
  if (status === 'live') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 8px', borderRadius: 999,
        background: 'rgba(230,29,37,0.15)',
        border: '1px solid rgba(230,29,37,0.4)',
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        fontSize: 8.5, fontWeight: 700, letterSpacing: 1,
        color: '#E61D25',
        flexShrink: 0,
      }}>
        <span style={{
          width: 5, height: 5, borderRadius: 3,
          background: '#E61D25', display: 'inline-block',
          animation: 'tpPulse 1.2s ease-in-out infinite',
        }} />
        EN VIVO{minute && <span style={{ fontWeight: 400, marginLeft: 2 }}>{minute}</span>}
      </span>
    )
  }
  if (status === 'finished') {
    return (
      <span style={{
        padding: '3px 8px', borderRadius: 999,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.12)',
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        fontSize: 8.5, fontWeight: 700, letterSpacing: 1,
        color: 'rgba(255,255,255,0.4)',
        flexShrink: 0,
      }}>
        FINALIZADO
      </span>
    )
  }
  if (status === 'suspended') {
    return (
      <span style={{
        padding: '3px 8px', borderRadius: 999,
        background: 'rgba(245,158,11,0.1)',
        border: '1px solid rgba(245,158,11,0.35)',
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        fontSize: 8.5, fontWeight: 700, letterSpacing: 1,
        color: '#F59E0B',
        flexShrink: 0,
      }}>
        SUSPENDIDO
      </span>
    )
  }
  return null
}

// ─── StatItem ─────────────────────────────────────────────────────────────────

function StatItem({
  label,
  value,
  highlight = false,
  highlightColor = 'rgba(255,255,255,0.6)',
}: {
  label: string
  value: number
  highlight?: boolean
  highlightColor?: string
}) {
  const valueColor = highlight ? highlightColor : 'rgba(255,255,255,0.35)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, minWidth: 40 }}>
      <span style={{
        fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
        fontSize: 28, lineHeight: 1, letterSpacing: 0.5,
        color: valueColor,
        textShadow: highlight ? `0 0 10px ${highlightColor}55` : 'none',
      }}>
        {value}
      </span>
      <span style={{
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        fontSize: 8, fontWeight: 700, letterSpacing: 0.8,
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)',
        textAlign: 'center', lineHeight: 1.2,
      }}>
        {label}
      </span>
    </div>
  )
}
