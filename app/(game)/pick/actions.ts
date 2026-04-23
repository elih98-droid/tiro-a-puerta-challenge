'use server'

/**
 * app/(game)/pick/actions.ts
 *
 * Server Actions for the pick page.
 * These run on the server, so they can safely access the DB and validate
 * all the game rules before saving anything.
 *
 * The DB trigger (validate_pick_timing) and the UNIQUE constraints are the
 * last line of defense — but we validate here first to give the user a
 * clear error message instead of a raw DB error.
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Creates or updates the user's pick for today.
 *
 * Called when the user clicks "Confirmar pick" on the pick page.
 * If they already have a pick for today, this replaces it (as long as
 * the current pick's deadline hasn't passed — game-rules.md §3.3).
 *
 * Validations (in order):
 *   1. User must be authenticated.
 *   2. User must be alive in the tournament.
 *   3. The new player's match deadline must not have passed (§3.2).
 *   4. The player must not be burned from a previous day (§3.4).
 *
 * The DB trigger handles the case where the OLD pick's deadline passed
 * (blocks changing to a different player after lock — §3.3).
 */
export async function submitPick(
  playerId: number,
  matchId: number,
  matchDayId: number,
  effectiveDeadline: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()

  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No estás autenticado.' }

  // 2. User must be alive
  const { data: userStatus } = await supabase
    .from('user_status')
    .select('is_alive')
    .eq('user_id', user.id)
    .single()

  if (!userStatus?.is_alive) {
    return { error: 'Ya estás eliminado del torneo y no puedes hacer picks.' }
  }

  // 3. Deadline of the new player's match must not have passed
  if (new Date(effectiveDeadline) <= new Date()) {
    return { error: 'El deadline de este partido ya venció. Elige un jugador de un partido que aún no haya iniciado.' }
  }

  // 4. Player must not be burned from a previous day (game-rules.md §3.4).
  //    We check user_picks (not pick_history) for simplicity in the MVP.
  //    This correctly catches cross-day repeats for the final submitted pick.
  const { data: previousPicks } = await supabase
    .from('user_picks')
    .select('player_id')
    .eq('user_id', user.id)
    .neq('match_day_id', matchDayId)

  const burnedPlayerIds = new Set((previousPicks ?? []).map(p => p.player_id))
  if (burnedPlayerIds.has(playerId)) {
    return { error: 'Ya elegiste a este jugador en un día anterior. Está quemado.' }
  }

  // Save the pick. Since there's a UNIQUE constraint on (user_id, match_day_id),
  // this upsert will INSERT on the first pick of the day, and UPDATE if the user
  // is changing their pick (before deadline).
  const { error: upsertError } = await supabase
    .from('user_picks')
    .upsert(
      {
        user_id: user.id,
        match_day_id: matchDayId,
        player_id: playerId,
        match_id: matchId,
        effective_deadline: effectiveDeadline,
        picked_at: new Date().toISOString(),
        // Always reset these on a new/changed pick
        is_locked: false,
        result: null,
        shots_on_target_count: null,
        goals_scored: null,
        processed_at: null,
      },
      { onConflict: 'user_id,match_day_id' },
    )

  if (upsertError) {
    // The (user_id, player_id) UNIQUE constraint catches cross-day repeats
    // that slipped past our app-layer check above.
    if (upsertError.message.includes('user_picks_user_id_player_id_key')) {
      return { error: 'Ya elegiste a este jugador en un día anterior. Está quemado.' }
    }
    // The validate_pick_timing trigger fires if the OLD deadline already passed.
    if (upsertError.message.includes('deadline')) {
      return { error: 'Tu pick actual ya está cerrado y no puede cambiarse.' }
    }
    console.error('submitPick upsert error:', upsertError.message)
    return { error: 'Error al guardar el pick. Intenta de nuevo.' }
  }

  // Refresh both pages so the UI reflects the new pick immediately
  revalidatePath('/pick')
  revalidatePath('/dashboard')
  return {}
}

/**
 * Removes the user's pick for a given match day.
 *
 * Only allowed when:
 *   - The pick exists and belongs to this user.
 *   - The pick is NOT locked (deadline hasn't passed yet).
 *
 * Removing a pre-pick frees the player for use on another day.
 * If the user doesn't re-pick before the deadline, the evaluate-picks
 * cron will eliminate them for that day (E1 — no_pick).
 */
export async function removePick(matchDayId: number): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No estás autenticado.' }

  // Fetch the pick to validate it before deleting
  const { data: pick } = await supabase
    .from('user_picks')
    .select('id, is_locked, effective_deadline')
    .eq('user_id', user.id)
    .eq('match_day_id', matchDayId)
    .single()

  if (!pick) return { error: 'No tienes pick para este día.' }

  if (pick.is_locked) {
    return { error: 'Tu pick ya está bloqueado y no puede quitarse.' }
  }

  if (new Date(pick.effective_deadline) <= new Date()) {
    return { error: 'El deadline ya pasó — este pick no puede quitarse.' }
  }

  const { error: deleteError } = await supabase
    .from('user_picks')
    .delete()
    .eq('user_id', user.id)
    .eq('match_day_id', matchDayId)

  if (deleteError) {
    console.error('removePick error:', deleteError.message)
    return { error: 'Error al quitar el pick. Intenta de nuevo.' }
  }

  revalidatePath('/pick')
  return {}
}
