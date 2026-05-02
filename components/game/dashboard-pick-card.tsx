'use client'

/**
 * DashboardPickCard — Card interactiva del pick en el dashboard.
 *
 * 3 estados:
 *   - 'urgent' : usuario vivo, hay partidos hoy, NO ha elegido jugador → countdown + CTA
 *   - 'live'   : usuario vivo, hay partidos hoy, ha elegido jugador   → stats en vivo (polling 60s)
 *   - 'rest'   : usuario vivo, sin partidos hoy                       → mensaje de descanso
 *
 * Client Component porque:
 *   - 'urgent' usa useState/useEffect para el countdown
 *   - 'live'   usa useState/useEffect para polling a Supabase
 */

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ── Paleta ────────────────────────────────────────────────────

const P = {
  blue:     '#2A398D',
  blueDeep: '#1B2566',
  red:      '#E61D25',
  green:    '#3CAC3B',
  gold:     '#C9A84C',
  panel:    '#11162A',
  bgDeep:   '#06080F',
  line:     'rgba(255,255,255,0.08)',
  ink:      '#fff',
  sub:      'rgba(255,255,255,0.62)',
  subDim:   'rgba(255,255,255,0.42)',
}

// ── Props ─────────────────────────────────────────────────────

export interface DashboardPickCardProps {
  state: 'urgent' | 'live' | 'rest'

  // 'urgent' state
  deadline?: string | null            // ISO timestamp — pick_window_closes_at

  // 'live' state — datos del pick y datos iniciales del partido (SSR)
  matchId?: number | null
  playerId?: number | null
  playerName?: string | null
  playerPosition?: string | null       // para "TU PICK · DEL"
  pickResult?: string | null           // 'survived' | 'eliminated' | null
  initialMatchStatus?: string | null   // 'scheduled' | 'live' | 'finished'
  initialMatchMinute?: number | null
  initialHomeScore?: number | null
  initialAwayScore?: number | null
  initialHomeName?: string | null
  initialAwayName?: string | null
  initialShots?: number
  initialGoals?: number
}

const POLL_MS = 60_000

// ── Helpers ───────────────────────────────────────────────────

function getSecondsLeft(deadline: string): number {
  return Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000))
}

function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m > 0) return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `00:${String(s).padStart(2, '0')}`
}

function getPlayerInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

// ── Sub-componentes compartidos ───────────────────────────────

/** Avatar circular con iniciales */
function PlayerAvatar({ initials, size = 56 }: { initials: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2,
      background: `linear-gradient(135deg, ${P.blue} 0%, #3D52C4 100%)`,
      boxShadow: `0 0 0 2px ${P.gold}, 0 0 24px ${P.gold}66`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, position: 'relative', overflow: 'hidden',
    }}>
      <span style={{
        fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
        fontSize: size * 0.42, lineHeight: 1, color: '#fff',
        letterSpacing: 1,
      }}>
        {initials}
      </span>
      {/* shine */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.25), transparent 50%)',
        pointerEvents: 'none',
      }} />
    </div>
  )
}

/** Corner accents dorados (esquinas de card) */
function GoldCorners() {
  const corners: React.CSSProperties[] = [
    { top: 0, left: 0,   borderTop: `2px solid ${P.red}`,  borderLeft: `2px solid ${P.red}`   },
    { top: 0, right: 0,  borderTop: `2px solid ${P.red}`,  borderRight: `2px solid ${P.red}`  },
    { bottom: 0, left: 0,  borderBottom: `2px solid ${P.red}`, borderLeft: `2px solid ${P.red}`   },
    { bottom: 0, right: 0, borderBottom: `2px solid ${P.red}`, borderRight: `2px solid ${P.red}`  },
  ]
  return (
    <>
      {corners.map((s, i) => (
        <div key={i} style={{ position: 'absolute', width: 18, height: 18, ...s }} />
      ))}
    </>
  )
}

// ── Estado: URGENTE ───────────────────────────────────────────

function UrgentCard({ deadline }: { deadline: string }) {
  const [secondsLeft, setSecondsLeft] = useState(() => getSecondsLeft(deadline))

  useEffect(() => {
    const id = setInterval(() => setSecondsLeft(getSecondsLeft(deadline)), 1000)
    return () => clearInterval(id)
  }, [deadline])

  const expired = secondsLeft <= 0
  const countdownText = expired ? 'CERRADO' : formatCountdown(secondsLeft)
  const isUrgent = secondsLeft < 5 * 60

  return (
    <div style={{
      margin: '12px 16px 0',
      padding: '18px 18px 16px',
      background: P.panel,
      border: `1.5px solid ${P.red}99`,
      borderRadius: 14,
      position: 'relative', overflow: 'hidden',
      boxShadow: `0 0 0 4px ${P.red}11`,
      animation: 'tpUrgentPulse 2s ease-in-out infinite',
    }}>
      <GoldCorners />

      <div style={{
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        fontSize: 9, letterSpacing: 2, color: P.red, fontWeight: 700,
        marginBottom: 4,
      }}>
        ● PICK DE HOY ·
      </div>

      <div style={{
        fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
        fontSize: 50, lineHeight: 1, letterSpacing: 1,
        color: expired ? P.red : isUrgent ? P.red : P.ink,
        textShadow: `0 0 20px ${P.red}55`,
      }}>
        {countdownText}
      </div>

      {!expired && (
        <>
          <div style={{
            marginTop: 10, fontSize: 13, letterSpacing: 0.5,
            color: P.ink, fontWeight: 700,
            fontFamily: 'var(--font-archivo), system-ui',
          }}>
            HAZ TU PICK, HUEVÓN !!
          </div>
          <div style={{
            marginTop: 4, fontSize: 12, color: P.sub, lineHeight: 1.4,
            fontFamily: 'var(--font-archivo), system-ui',
          }}>
            Si no eliges antes del último kickoff, quedas eliminado del torneo.
          </div>

          <Link
            href="/pick"
            style={{
              marginTop: 14, width: '100%',
              padding: '14px 18px', borderRadius: 10,
              border: `1px solid ${P.gold}`,
              background: `linear-gradient(180deg, ${P.blue} 0%, ${P.blueDeep} 100%)`,
              color: P.ink,
              fontFamily: 'var(--font-archivo), system-ui',
              fontSize: 14, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              textDecoration: 'none',
              boxShadow: `0 4px 16px ${P.blue}55, inset 0 1px 0 rgba(255,255,255,0.15)`,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke={P.gold} strokeWidth="1.8" />
              <path d="M12 3v18M3 12h18" stroke={P.gold} strokeWidth="1.2" opacity="0.5" />
              <circle cx="12" cy="12" r="2" fill={P.gold} />
            </svg>
            ELEGIR JUGADOR
            <span style={{ marginLeft: 4 }}>→</span>
          </Link>
        </>
      )}

      {expired && (
        <div style={{
          marginTop: 8, fontSize: 12, color: P.sub, lineHeight: 1.4,
          fontFamily: 'var(--font-archivo), system-ui',
        }}>
          La ventana de picks cerró. Espera los resultados.
        </div>
      )}
    </div>
  )
}

// ── Estado: EN VIVO / CON PICK ────────────────────────────────

interface LiveData {
  status: string
  matchMinute: number | null
  homeScore: number | null
  awayScore: number | null
  homeName: string | null
  awayName: string | null
  shots: number
  goals: number
}

function LiveCard({
  matchId, playerId,
  playerName, playerPosition,
  pickResult,
  initial,
}: {
  matchId: number
  playerId: number
  playerName: string
  playerPosition: string | null
  pickResult: string | null
  initial: LiveData
}) {
  const [data, setData] = useState<LiveData>(initial)

  const fetchLive = useCallback(async () => {
    const supabase = createClient()
    const [{ data: m }, { data: s }] = await Promise.all([
      supabase
        .from('matches')
        .select('status, match_minute, home_score, away_score, home_team:home_team_id(name), away_team:away_team_id(name)')
        .eq('id', matchId)
        .single(),
      supabase
        .from('player_match_stats')
        .select('shots_on_target, goals')
        .eq('match_id', matchId)
        .eq('player_id', playerId)
        .maybeSingle(),
    ])
    if (m) {
      setData({
        status: m.status,
        matchMinute: (m as unknown as { match_minute: number | null }).match_minute ?? null,
        homeScore: m.home_score,
        awayScore: m.away_score,
        homeName: (m as unknown as { home_team: { name: string } | null }).home_team?.name ?? null,
        awayName: (m as unknown as { away_team: { name: string } | null }).away_team?.name ?? null,
        shots: (s?.shots_on_target ?? 0) as number,
        goals: (s?.goals ?? 0) as number,
      })
    }
  }, [matchId, playerId])

  // Solo polling cuando el partido está en curso
  useEffect(() => {
    if (data.status === 'live') {
      const id = setInterval(fetchLive, POLL_MS)
      return () => clearInterval(id)
    }
  }, [data.status, fetchLive])

  const isLive       = data.status === 'live'
  const isFinished   = data.status === 'finished'
  const isScheduled  = data.status === 'scheduled'
  const hasSot       = data.shots > 0

  // Indicador de supervivencia — 4 estados:
  //   ok      → partido terminado con tiro, o en vivo con tiro
  //   bad     → partido terminado sin tiro, o eliminado
  //   warning → partido en vivo, aún sin tiro (está en riesgo)
  //   waiting → partido no ha empezado (pick guardado, esperando)
  const survivalOk      = pickResult === 'survived' || (isFinished && hasSot) || (isLive && hasSot)
  const survivalBad     = pickResult === 'eliminated' || (isFinished && !hasSot)
  const survivalWarning = isLive && !hasSot && !survivalBad
  const survivalWaiting = isScheduled

  const initials = getPlayerInitials(playerName)
  const posLabel = playerPosition?.toUpperCase() ?? '---'

  // Truncate team names for score display
  const homeAbbr = data.homeName ? data.homeName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3) : '---'
  const awayAbbr = data.awayName ? data.awayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3) : '---'

  return (
    <div style={{
      margin: '12px 16px 0',
      padding: '14px 16px 16px',
      background: `linear-gradient(160deg, ${P.panel} 0%, ${P.bgDeep} 100%)`,
      border: `1px solid ${P.gold}44`,
      borderRadius: 14, position: 'relative', overflow: 'hidden',
    }}>
      {/* Header row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <div style={{
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: 9, letterSpacing: 1.8, color: P.gold, fontWeight: 700,
        }}>
          ● PICK DE HOY
        </div>

        {/* Badge de estado del partido */}
        {isLive && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 8px', borderRadius: 4,
            background: `${P.red}22`, border: `1px solid ${P.red}66`,
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%', background: P.red,
              animation: 'tpPulse 1s ease-in-out infinite',
              display: 'inline-block',
            }} />
            <span style={{
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 9, letterSpacing: 1.4, color: P.red, fontWeight: 700,
            }}>
              EN VIVO{data.matchMinute ? ` ${data.matchMinute}'` : ''}
            </span>
          </div>
        )}
        {isFinished && (
          <span style={{
            padding: '3px 8px', borderRadius: 4,
            background: 'rgba(255,255,255,0.08)',
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: 9, letterSpacing: 1.4, color: P.subDim, fontWeight: 700,
          }}>
            FINALIZADO
          </span>
        )}
        {isScheduled && (
          <span style={{
            padding: '3px 8px', borderRadius: 4,
            background: `${P.blue}22`, border: `1px solid ${P.blue}66`,
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: 9, letterSpacing: 1.4, color: P.blue, fontWeight: 700,
          }}>
            POR INICIAR
          </span>
        )}
      </div>

      {/* Jugador + survival indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <PlayerAvatar initials={initials} size={56} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
            fontSize: 22, letterSpacing: 0.8, color: P.ink, lineHeight: 1,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {playerName}
          </div>
          <div style={{
            marginTop: 4, fontSize: 11, color: P.sub,
            fontFamily: 'var(--font-archivo-narrow), system-ui, sans-serif',
            letterSpacing: 0.6, fontWeight: 600, textTransform: 'uppercase',
          }}>
            TU PICK · {posLabel}
          </div>
        </div>

        {/* Indicador de supervivencia */}
        <div style={{
          width: 44, height: 44, borderRadius: 22,
          background: survivalOk      ? `${P.green}22`
                    : survivalBad     ? `${P.red}22`
                    : survivalWarning ? `${P.gold}22`
                    : `${P.blue}22`,
          border: `2px solid ${
            survivalOk      ? P.green
            : survivalBad   ? P.red
            : survivalWarning ? P.gold
            : P.blue
          }`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 16px ${
            survivalOk      ? P.green
            : survivalBad   ? P.red
            : survivalWarning ? P.gold
            : P.blue
          }55`,
          flexShrink: 0,
        }}>
          {survivalOk && (
            // Checkmark verde — tiro a puerta confirmado
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M5 12.5l4.5 4.5L19 7" stroke={P.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {survivalBad && (
            // X roja — eliminado
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke={P.red} strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          )}
          {survivalWarning && (
            // Triángulo de advertencia dorado — en vivo, aún sin tiro
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 4L2 20h20L12 4z" stroke={P.gold} strokeWidth="2" strokeLinejoin="round" />
              <path d="M12 10v5M12 17v.01" stroke={P.gold} strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
          {survivalWaiting && (
            // Reloj azul — partido no ha empezado
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="8" stroke={P.blue} strokeWidth="2" />
              <path d="M12 8v4l2.5 2.5" stroke={P.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>

      {/* Score — solo si el partido empezó */}
      {(isLive || isFinished) && (
        <>
          <div style={{
            marginTop: 14, padding: '10px 12px',
            background: P.bgDeep, border: `1px solid ${P.line}`,
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: P.ink, letterSpacing: 1 }}>
              {homeAbbr}
            </span>
            <div style={{
              fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
              fontSize: 26, letterSpacing: 2, color: P.ink, lineHeight: 1,
            }}>
              {data.homeScore ?? 0} — {data.awayScore ?? 0}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: P.ink, letterSpacing: 1 }}>
              {awayAbbr}
            </span>
          </div>

          {/* Tracker de tiros */}
          <div style={{
            marginTop: 10,
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 12px',
            background: survivalBad ? `${P.red}11` : `${P.green}11`,
            border: `1px solid ${survivalBad ? P.red : P.green}44`,
            borderRadius: 10,
          }}>
            {hasSot ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" fill={P.green} />
                <path d="M7 12.5l3.5 3.5L17 9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke={P.red} strokeWidth="1.8" />
                <path d="M12 7v6M12 17v.01" stroke={P.red} strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 13, color: P.ink, fontWeight: 700, lineHeight: 1.2,
                fontFamily: 'var(--font-archivo), system-ui',
              }}>
                {data.shots} {data.shots === 1 ? 'tiro a puerta' : 'tiros a puerta'}
                {data.goals > 0 && ` · ${data.goals} ${data.goals === 1 ? 'gol' : 'goles'}`}
              </div>
              <div style={{
                fontSize: 10.5, color: P.sub, marginTop: 2,
                fontFamily: 'var(--font-archivo), system-ui',
              }}>
                {survivalOk && 'Pick asegurado · sigues vivo hoy'}
                {survivalBad && 'Sin tiros a puerta · eliminado'}
                {!survivalOk && !survivalBad && isLive && 'Necesitas que tu jugador dispare'}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Partido por iniciar */}
      {isScheduled && (
        <div style={{
          marginTop: 12, padding: '10px 12px',
          background: `${P.blue}11`, border: `1px solid ${P.blue}33`,
          borderRadius: 10,
          fontSize: 12, color: P.sub,
          fontFamily: 'var(--font-archivo), system-ui',
          lineHeight: 1.4,
        }}>
          Pick guardado. El partido aún no comienza — los stats aparecen en cuanto inicie.
        </div>
      )}
    </div>
  )
}

// ── Estado: SIN PARTIDOS ──────────────────────────────────────

function RestCard() {
  return (
    <div style={{
      margin: '12px 16px 0',
      padding: '24px 18px 22px',
      background: `linear-gradient(180deg, ${P.panel} 0%, ${P.bgDeep} 100%)`,
      border: `1px solid ${P.line}`,
      borderRadius: 14,
      textAlign: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Luna */}
      <div style={{
        width: 56, height: 56, borderRadius: 28,
        background: `radial-gradient(circle at 35% 35%, ${P.gold}22, transparent 65%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 12px',
      }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path
            d="M21 12.8A8 8 0 0111.2 3a7 7 0 109.8 9.8z"
            fill={`${P.gold}33`} stroke={P.gold} strokeWidth="1.6" strokeLinejoin="round"
          />
          <circle cx="14.5" cy="8.5" r="0.6" fill={P.gold} />
          <circle cx="17"   cy="11"  r="0.5" fill={P.gold} opacity="0.7" />
        </svg>
      </div>

      <div style={{
        fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
        fontSize: 26, letterSpacing: 1.8, color: P.ink, lineHeight: 1,
      }}>
        HOY NO HAY PARTIDOS
      </div>

      <div style={{
        marginTop: 8, fontSize: 13, color: P.sub, lineHeight: 1.5,
        fontFamily: 'var(--font-archivo), system-ui',
      }}>
        Descansa — tu racha sigue intacta.
      </div>

      <div style={{
        marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '5px 12px', borderRadius: 999,
        background: `${P.green}18`, border: `1px solid ${P.green}55`,
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        fontSize: 9.5, letterSpacing: 1.6, color: P.green, fontWeight: 700,
      }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: P.green, display: 'inline-block' }} />
        RACHA PROTEGIDA
      </div>
    </div>
  )
}

// ── Export principal ──────────────────────────────────────────

export function DashboardPickCard(props: DashboardPickCardProps) {
  if (props.state === 'rest') {
    return <RestCard />
  }

  if (props.state === 'urgent') {
    if (!props.deadline) return null
    return <UrgentCard deadline={props.deadline} />
  }

  // state === 'live'
  if (!props.matchId || !props.playerId || !props.playerName) return null

  const initial: LiveData = {
    status:      props.initialMatchStatus ?? 'scheduled',
    matchMinute: props.initialMatchMinute ?? null,
    homeScore:   props.initialHomeScore   ?? null,
    awayScore:   props.initialAwayScore   ?? null,
    homeName:    props.initialHomeName    ?? null,
    awayName:    props.initialAwayName    ?? null,
    shots:       props.initialShots       ?? 0,
    goals:       props.initialGoals       ?? 0,
  }

  return (
    <LiveCard
      matchId={props.matchId}
      playerId={props.playerId}
      playerName={props.playerName}
      playerPosition={props.playerPosition ?? null}
      pickResult={props.pickResult ?? null}
      initial={initial}
    />
  )
}
