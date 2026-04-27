import { createClient } from '@/lib/supabase/server'
import { LiveMatchStats } from '@/components/game/live-match-stats'

/**
 * Dashboard — /dashboard
 * Main page for an authenticated user. Shows:
 *   - Their tournament status (alive, days survived, goals accumulated)
 *   - Their pick for today (or a message if no match day is active yet)
 *
 * This is a Server Component: all data fetching happens on the server,
 * no loading states needed on the client.
 */
export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch the user's profile and tournament status in parallel.
  const [{ data: profile }, { data: status }] = await Promise.all([
    supabase
      .from('users')
      .select('username, email_verified')
      .eq('id', user!.id)
      .single(),
    supabase
      .from('user_status')
      .select('is_alive, days_survived, total_goals_accumulated, elimination_reason, eliminated_on_match_day_id')
      .eq('user_id', user!.id)
      .single(),
  ])

  // Find today's match day by calendar date (CDMX timezone).
  // We intentionally do NOT filter by pick window here — the window controls
  // when picks can be made, but we always want to show the user's pick and
  // the live tracker even after the window has closed (i.e. during the match).
  const todayDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' }) // 'YYYY-MM-DD'
  const { data: todayMatchDay } = await supabase
    .from('match_days')
    .select('id, match_date, day_number, pick_window_opens_at, pick_window_closes_at')
    .eq('match_date', todayDate)
    .single()

  // If there is an active match day, fetch the user's pick for it.
  const { data: todayPick } = todayMatchDay
    ? await supabase
        .from('user_picks')
        .select(`
          match_id,
          player_id,
          is_locked,
          effective_deadline,
          result,
          players ( display_name, position ),
          teams:players ( team_id, teams ( name ) )
        `)
        .eq('user_id', user!.id)
        .eq('match_day_id', todayMatchDay.id)
        .single()
    : { data: null }

  return (
    <div>
      <h1>Hola, {profile?.username}</h1>

      {/* Email verification warning.
          We check user.email_confirmed_at (from Supabase Auth) rather than
          profile.email_verified (from public.users) because the auth value
          is always up to date, whereas the DB field requires a separate trigger
          to stay in sync. */}
      {!user!.email_confirmed_at && (
        <p>
          ⚠️ Tu email aún no está verificado. Revisa tu bandeja de entrada y
          confirma tu cuenta para poder hacer picks.
        </p>
      )}

      {/* Tournament status */}
      <section>
        <h2>Tu estado en el torneo</h2>
        {status ? (
          <div>
            <p>
              Estado:{' '}
              <strong>{status.is_alive ? '🟢 Vivo' : '🔴 Eliminado'}</strong>
            </p>
            <p>Días sobrevividos: <strong>{status.days_survived}</strong></p>
            <p>
              Goles acumulados (desempate):{' '}
              <strong>{status.total_goals_accumulated}</strong>
            </p>
            {!status.is_alive && status.elimination_reason && (
              <p>
                Razón de eliminación:{' '}
                <strong>{formatEliminationReason(status.elimination_reason)}</strong>
              </p>
            )}
          </div>
        ) : (
          <p>No se pudo cargar tu estado. Intenta recargar la página.</p>
        )}
      </section>

      {/* Today's pick */}
      <section>
        <h2>Pick de hoy</h2>
        {!todayMatchDay ? (
          <p>
            No hay partidos programados hoy. El torneo comienza el{' '}
            <strong>11 de junio de 2026</strong>.
          </p>
        ) : todayPick ? (
          <div>
            <p>
              Tu pick:{' '}
              {/* @ts-expect-error — nested relation typing */}
              <strong>{todayPick.players?.display_name}</strong>
              {/* @ts-expect-error — nested relation typing */}
              {' '}({todayPick.players?.position})
            </p>
            <p>
              Deadline:{' '}
              <strong>
                {new Date(todayPick.effective_deadline).toLocaleTimeString(
                  'es-MX',
                  { hour: '2-digit', minute: '2-digit' },
                )}
              </strong>
            </p>
            {todayPick.is_locked && <p>🔒 Pick cerrado</p>}

            {/* Live stats tracker — shows once the pick deadline has passed, regardless
                of whether the cron has run yet to set is_locked = TRUE.
                We use effective_deadline directly so this works in local dev too. */}
            {todayPick.effective_deadline &&
             new Date(todayPick.effective_deadline) <= new Date() &&
             todayPick.match_id &&
             todayPick.player_id && (
              <LiveMatchStats
                matchId={todayPick.match_id as number}
                playerId={todayPick.player_id as number}
              />
            )}

            {todayPick.result && (
              <p>Resultado: <strong>{formatPickResult(todayPick.result)}</strong></p>
            )}
          </div>
        ) : (
          <div>
            <p>Aún no has hecho tu pick de hoy.</p>
            <a href="/pick" className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700">
              Elegir jugador →
            </a>
          </div>
        )}
      </section>
    </div>
  )
}

// ──────────────────────────────────────────────
// Helpers to translate DB values to Spanish
// ──────────────────────────────────────────────

function formatEliminationReason(reason: string): string {
  const reasons: Record<string, string> = {
    no_pick: 'No hiciste pick a tiempo',
    no_shot_on_target: 'Tu jugador no registró tiro a puerta',
    player_did_not_play: 'Tu jugador no jugó',
    disqualified: 'Descalificado',
  }
  return reasons[reason] ?? reason
}

function formatPickResult(result: string): string {
  const results: Record<string, string> = {
    survived: '✅ Sobreviviste',
    eliminated: '❌ Eliminado',
    void_cancelled_match: '⚪ Partido cancelado (pick anulado)',
    void_did_not_play: '⚪ Jugador no jugó (pick anulado)',
  }
  return results[result] ?? result
}
