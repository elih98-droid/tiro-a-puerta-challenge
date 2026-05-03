import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/layout/logout-button'
import { DashboardPickCard, type DashboardPickCardProps } from '@/components/game/dashboard-pick-card'

/**
 * Dashboard — /dashboard
 *
 * Página principal del usuario autenticado. 4 escenarios posibles:
 *   a) VIVO · Pick urgente  — vivo + hay partidos + sin pick aún
 *   b) VIVO · Pick en vivo  — vivo + hay partidos + pick hecho
 *   c) VIVO · Sin partidos  — vivo + sin partidos hoy
 *   d) ELIMINADO            — usuario eliminado
 *
 * Server Component: todo el fetching ocurre en el servidor.
 * DashboardPickCard (Client Component) maneja el countdown e interactividad.
 */

// ── Paleta (Server Component — no puede importar de un .tsx cliente) ──
const P = {
  blue:     '#2A398D',
  blueDeep: '#1B2566',
  red:      '#E61D25',
  green:    '#3CAC3B',
  gold:     '#C9A84C',
  panel:    '#11162A',
  panelHi:  '#161C36',
  bgDeep:   '#06080F',
  bg:       '#0A0E1A',
  line:     'rgba(255,255,255,0.08)',
  goldLine: 'linear-gradient(90deg, transparent, #C9A84C88, transparent)',
  ink:      '#fff',
  sub:      'rgba(255,255,255,0.62)',
  subDim:   'rgba(255,255,255,0.42)',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // ── Fetch paralelo: perfil + estado del torneo ──
  const [{ data: profile }, { data: status }] = await Promise.all([
    supabase
      .from('users')
      .select('username, email_verified')
      .eq('id', user!.id)
      .single(),
    supabase
      .from('user_status')
      .select('is_alive, days_survived, total_goals_accumulated, elimination_reason')
      .eq('user_id', user!.id)
      .single(),
  ])

  // ── Match day de hoy (por fecha CDMX) ──
  const todayDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
  const { data: todayMatchDay } = await supabase
    .from('match_days')
    .select('id, pick_window_closes_at')
    .eq('match_date', todayDate)
    .single()

  // ── Pick de hoy (si existe match day) ──
  const { data: todayPick } = todayMatchDay
    ? await supabase
        .from('user_picks')
        .select(`
          match_id,
          player_id,
          effective_deadline,
          result,
          players ( display_name, position )
        `)
        .eq('user_id', user!.id)
        .eq('match_day_id', todayMatchDay.id)
        .single()
    : { data: null }

  // ── Datos iniciales del partido (SSR para evitar flash) ──
  // Siempre se trae si hay pick con match_id — antes estaba gateado por
  // effective_deadline <= now, pero eso causaba que el status llegara como null
  // (default 'scheduled') y el polling del cliente nunca arrancaba.
  type MatchRow = {
    status: string
    match_minute: number | null
    home_score: number | null
    away_score: number | null
    home_team: { name: string } | null
    away_team: { name: string } | null
  }
  type StatsRow = { shots_on_target: number; goals: number }

  let initialMatch: MatchRow | null = null
  let initialStats: StatsRow | null = null

  if (todayPick?.match_id && todayPick?.player_id) {
    const [{ data: m }, { data: s }] = await Promise.all([
      supabase
        .from('matches')
        .select('status, match_minute, home_score, away_score, home_team:home_team_id(name), away_team:away_team_id(name)')
        .eq('id', todayPick.match_id)
        .single(),
      supabase
        .from('player_match_stats')
        .select('shots_on_target, goals')
        .eq('match_id', todayPick.match_id)
        .eq('player_id', todayPick.player_id)
        .maybeSingle(),
    ])
    initialMatch = m as unknown as MatchRow | null
    initialStats = s as unknown as StatsRow | null
  }

  // ── Determinar pick state para DashboardPickCard ──
  const isAlive = status?.is_alive ?? false

  let pickCardProps: DashboardPickCardProps
  if (!isAlive) {
    // ELIMINADO — no se muestra pick card
    pickCardProps = { state: 'rest' } // dummy, no se usa (renderizamos EliminatedCard)
  } else if (!todayMatchDay) {
    pickCardProps = { state: 'rest' }
  } else if (!todayPick) {
    pickCardProps = {
      state: 'urgent',
      deadline: todayMatchDay.pick_window_closes_at,
    }
  } else {
    // @ts-expect-error — nested relation typing from Supabase
    const player = todayPick.players as { display_name: string; position: string } | null
    pickCardProps = {
      state: 'live',
      matchId:    todayPick.match_id   as number,
      playerId:   todayPick.player_id  as number,
      playerName: player?.display_name ?? 'Jugador',
      playerPosition: player?.position ?? null,
      pickResult: todayPick.result     as string | null,
      initialMatchStatus:  initialMatch?.status            ?? null,
      initialMatchMinute:  initialMatch?.match_minute      ?? null,
      initialHomeScore:    initialMatch?.home_score        ?? null,
      initialAwayScore:    initialMatch?.away_score        ?? null,
      initialHomeName:     initialMatch?.home_team?.name   ?? null,
      initialAwayName:     initialMatch?.away_team?.name   ?? null,
      initialShots:        initialStats?.shots_on_target   ?? 0,
      initialGoals:        initialStats?.goals             ?? 0,
    }
  }

  const username  = profile?.username  ?? 'usuario'
  const daysSurv  = status?.days_survived         ?? 0
  const goals     = status?.total_goals_accumulated ?? 0

  return (
    <div style={{
      position: 'relative',
      minHeight: '100svh',
      background: P.bg, color: P.ink,
      paddingTop: 0,
    }}>
      {/* Gradiente radial sutil en la parte superior */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse 120% 40% at 50% 0%, ${P.blue}22, transparent 60%)`,
      }} />

      {/* ── Header ── */}
      {/* Badge izquierda + saludo/logout derecha — misma fila que el brand bar */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px 12px',
      }}>
        {/* Badge "MEX · USA · CAN 2026" */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px',
          border: `1px solid ${P.gold}55`,
          borderRadius: 999, background: `${P.gold}10`,
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase',
          color: P.gold, fontWeight: 700,
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%', background: P.red,
            boxShadow: `0 0 0 2px ${P.red}33`,
            animation: 'tpPulse 1.4s ease-in-out infinite',
            display: 'inline-block',
          }} />
          MEX · USA · CAN 2026
        </div>

        {/* Saludo + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: P.subDim, lineHeight: 1, marginBottom: 2 }}>Hola,</div>
            <div style={{ fontSize: 14, color: P.ink, fontWeight: 700, lineHeight: 1 }}>{username}</div>
          </div>
          <LogoutButton />
        </div>
      </div>

      {/* ── Email sin verificar (alerta) ── */}
      {!user!.email_confirmed_at && (
        <div style={{
          margin: '8px 16px 0',
          padding: '10px 14px',
          background: `${P.gold}18`,
          border: `1px solid ${P.gold}55`,
          borderRadius: 10,
          fontSize: 12, color: P.gold, lineHeight: 1.4,
          fontFamily: 'var(--font-archivo), system-ui',
          position: 'relative', zIndex: 2,
        }}>
          ⚠️ Tu email aún no está verificado. Revisa tu bandeja de entrada.
        </div>
      )}

      {/* ── Card de supervivencia ── */}
      <SurvivalCard
        isAlive={isAlive}
        daysSurvived={daysSurv}
        eliminationReason={status?.elimination_reason ?? null}
      />

      {/* ── Card del pick (o card de eliminado) ── */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {isAlive ? (
          <DashboardPickCard {...pickCardProps} />
        ) : (
          <EliminatedCard
            daysSurvived={daysSurv}
            reason={status?.elimination_reason ?? null}
          />
        )}
      </div>

      {/* ── Stats del torneo ── */}
      <StatsRow days={daysSurv} goals={goals} />
    </div>
  )
}

// ── SurvivalCard ──────────────────────────────────────────────

function SurvivalCard({
  isAlive, daysSurvived, eliminationReason,
}: {
  isAlive: boolean
  daysSurvived: number
  eliminationReason: string | null
}) {
  const accent = isAlive ? P.green : P.red

  return (
    <div style={{
      margin: '10px 16px 0',
      padding: '16px 18px',
      background: isAlive
        ? `linear-gradient(135deg, ${P.blueDeep} 0%, ${P.panel} 100%)`
        : `linear-gradient(135deg, #1A0E10 0%, #0F0A0F 100%)`,
      border: `1px solid ${accent}55`,
      borderRadius: 14,
      position: 'relative', overflow: 'hidden',
      zIndex: 2,
    }}>
      {/* Corner accents dorados */}
      <div style={{ position: 'absolute', top: 6, left: 6, width: 14, height: 14, borderTop: `1.5px solid ${P.gold}88`, borderLeft: `1.5px solid ${P.gold}88` }} />
      <div style={{ position: 'absolute', top: 6, right: 6, width: 14, height: 14, borderTop: `1.5px solid ${P.gold}88`, borderRight: `1.5px solid ${P.gold}88` }} />
      <div style={{ position: 'absolute', bottom: 6, left: 6, width: 14, height: 14, borderBottom: `1.5px solid ${P.gold}88`, borderLeft: `1.5px solid ${P.gold}88` }} />
      <div style={{ position: 'absolute', bottom: 6, right: 6, width: 14, height: 14, borderBottom: `1.5px solid ${P.gold}88`, borderRight: `1.5px solid ${P.gold}88` }} />

      {/* Glow detrás */}
      <div style={{
        position: 'absolute', top: -40, right: -40, width: 160, height: 160,
        background: `radial-gradient(circle, ${accent}33 0%, transparent 65%)`,
        pointerEvents: 'none',
      }} />

      {/* Estado: VIVO / ELIMINADO */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: accent,
          boxShadow: `0 0 0 3px ${accent}33, 0 0 16px ${accent}99`,
          animation: isAlive ? 'tpPulse 1.6s ease-in-out infinite' : 'none',
          flexShrink: 0,
        }} />
        <div style={{
          fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
          fontSize: 32, letterSpacing: 2.5, lineHeight: 1, color: accent,
        }}>
          {isAlive ? 'ESTÁS VIVO' : 'ELIMINADO'}
        </div>
      </div>

      <div style={{
        marginTop: 10, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase',
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        fontWeight: 700, color: P.gold,
      }}>
        DÍA {daysSurvived}
      </div>

      {!isAlive && eliminationReason && (
        <div style={{
          marginTop: 8, fontSize: 12, color: P.sub, lineHeight: 1.4,
          fontFamily: 'var(--font-archivo), system-ui',
        }}>
          {formatEliminationReason(eliminationReason)}
        </div>
      )}
    </div>
  )
}

// ── EliminatedCard (pick card para eliminados) ────────────────

function EliminatedCard({
  daysSurvived, reason,
}: {
  daysSurvived: number
  reason: string | null
}) {
  return (
    <div style={{
      margin: '12px 16px 0',
      padding: '20px 18px',
      background: `linear-gradient(180deg, #1A0E10 0%, ${P.bgDeep} 100%)`,
      border: `1px solid ${P.red}44`,
      borderRadius: 14,
      textAlign: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 26,
        background: `${P.red}22`, border: `2px solid ${P.red}66`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 12px',
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke={P.red} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>

      <div style={{
        fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
        fontSize: 22, letterSpacing: 1.5, color: P.red, lineHeight: 1,
      }}>
        CAÍSTE EN EL DÍA {daysSurvived}
      </div>

      <div style={{
        marginTop: 8, fontSize: 12, color: P.sub, lineHeight: 1.5,
        fontFamily: 'var(--font-archivo), system-ui',
      }}>
        {reason ? formatEliminationReason(reason) : 'Tu jugador no registró tiro a puerta.'}
        {' '}Espera al próximo torneo.
      </div>
    </div>
  )
}

// ── StatsRow ──────────────────────────────────────────────────

function StatsRow({ days, goals }: { days: number; goals: number }) {
  return (
    <div style={{
      margin: '12px 16px 0',
      padding: '14px 8px',
      background: P.panel,
      border: `1px solid ${P.gold}22`,
      borderRadius: 12,
      display: 'flex', alignItems: 'stretch',
      position: 'relative', overflow: 'hidden',
      zIndex: 2,
    }}>
      {/* Línea decorativa superior con gradiente tricolor */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${P.green} 0%, ${P.gold} 50%, ${P.blue} 100%)`,
        opacity: 0.6,
      }} />

      <StatCell value={String(days)} label="Días vivo"  accent={P.green} />
      <div style={{ width: 1, background: P.line, margin: '4px 0' }} />
      <StatCell value={String(goals)} label="Goles acumulados" accent={P.gold} />
    </div>
  )
}

function StatCell({ value, label, accent }: { value: string; label: string; accent: string }) {
  return (
    <div style={{ flex: 1, textAlign: 'center', padding: '4px' }}>
      <div style={{
        fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
        fontSize: 30, lineHeight: 1, color: accent, letterSpacing: 0.5,
      }}>
        {value}
      </div>
      <div style={{
        marginTop: 4,
        fontFamily: 'var(--font-archivo-narrow), system-ui, sans-serif',
        fontSize: 9.5, letterSpacing: 1.2, textTransform: 'uppercase',
        color: P.subDim, fontWeight: 600,
      }}>
        {label}
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────

function formatEliminationReason(reason: string): string {
  const map: Record<string, string> = {
    no_pick:            'No hiciste pick a tiempo.',
    no_shot_on_target:  'Tu jugador no registró tiro a puerta.',
    player_did_not_play:'Tu jugador no jugó.',
    disqualified:       'Cuenta descalificada.',
  }
  return map[reason] ?? reason
}
